"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type JSX } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { useLocale, useT } from "@/i18n/client";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* Timeline (ms) ------------------------------------------------------------ */
const STROKES_MS = 700; // 0.0–0.7  halves slip out, then slide back in and snap
const FLIP_AT = 600; // 0.6–1.25 hourglass turns over
const FLIP_MS = 650;
const LETTERS_AT = 1000; // 1.0–1.8 letters rise in, 60ms apart
const LETTER_STAGGER = 60;
const LETTER_MS = 400;
const GLOW_AT = 1800; // 1.8–2.4 lime glow pulse + shine across the wordmark
const GLOW_MS = 600;
const SHINE_AT = 1750;
const SHINE_MS = 700;
const IDLE_AT = 2200; // then breathe while the cursor stays
const BREATHE_MS = 2000;

/** How far a half travels off the tile, in SVG units (the mark is a 48-unit grid). */
const SLIDE = 64;
const SOFT = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // the app's --ease-soft
const LIME = "rgb(194 244 30"; // --primary, as rgb() so it can fade in keyframes

/** A half: leave towards `exit`, come back from the opposite side, overshoot a little, settle. */
function slideKeyframes(exit: 1 | -1): Keyframe[] {
  const x = (units: number): string => `translateX(${units}px)`;
  return [
    { transform: x(0), opacity: 1 },
    { transform: x(exit * SLIDE), opacity: 0, offset: 0.15 },
    { transform: x(-exit * SLIDE), opacity: 0, offset: 0.16, easing: SOFT },
    { transform: x(exit * 3), opacity: 1, offset: 0.78, easing: "ease-in-out" },
    { transform: x(0), opacity: 1 },
  ];
}

/**
 * Brand mark (lime hourglass on an ink app tile) + Unbounded wordmark.
 *
 * Pointing at it (or focusing it) plays a short sequence: the two halves slide
 * in from opposite sides and snap together, the hourglass flips over, the
 * letters rise in one by one, a lime glow pulses and a shine sweeps the name.
 * While the pointer stays, the tile breathes. Skipped for "reduce motion".
 */
export function Logo({ className }: { className?: string }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  // The env name labels staging/demo builds; in English the brand is spelled in Latin.
  const brand = locale === "mn" ? APP_NAME : t.brand;
  const letters = Array.from(brand);
  const tileRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<SVGSVGElement>(null);
  const lettersRef = useRef<HTMLSpanElement>(null);
  const shineRef = useRef<HTMLSpanElement>(null);
  const hovered = useRef(false);
  const running = useRef<Animation[]>([]);
  const breathe = useRef<Animation | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(idleTimer.current);
      running.current.forEach((animation) => animation.cancel());
      breathe.current?.cancel();
    },
    [],
  );

  const play = (): void => {
    hovered.current = true;
    const tile = tileRef.current;
    const mark = markRef.current;
    const word = lettersRef.current;
    const shine = shineRef.current;
    if (!tile || !mark || !word || !shine) return;
    // Let a running sequence finish; never stack a second one on top.
    if (running.current.length > 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    breathe.current?.cancel();
    const top = mark.querySelector<SVGPathElement>('[data-part="top"]');
    const bottom = mark.querySelector<SVGPathElement>('[data-part="bottom"]');
    const animations: Animation[] = [];

    // 1. Halves: top leaves right and returns from the left, bottom the other way.
    if (top) animations.push(top.animate(slideKeyframes(1), STROKES_MS));
    if (bottom) animations.push(bottom.animate(slideKeyframes(-1), STROKES_MS));

    // 2. Flip 180°, swing a touch past, settle. 180° looks identical to 0°,
    //    so the animation can end without holding its final frame.
    animations.push(
      mark.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(198deg)", offset: 0.68 },
          { transform: "rotate(175deg)", offset: 0.86 },
          { transform: "rotate(180deg)" },
        ],
        { duration: FLIP_MS, delay: FLIP_AT, easing: SOFT },
      ),
    );

    // 3. Letters: fade out quickly, wait their turn, rise 8px into place.
    [...word.children].forEach((letter, index) => {
      const start = LETTERS_AT + index * LETTER_STAGGER;
      const total = start + LETTER_MS;
      animations.push(
        letter.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-4px)", offset: 160 / total },
            { opacity: 0, transform: "translateY(8px)", offset: start / total, easing: SOFT },
            { opacity: 1, transform: "translateY(0)" },
          ],
          total,
        ),
      );
    });

    // 4. Glow through the tile and the mark, and a shine across the name.
    animations.push(
      tile.animate(
        [
          { boxShadow: `0 0 0 0 ${LIME} / 0)` },
          { boxShadow: `0 0 18px 3px ${LIME} / 0.55)`, offset: 0.4 },
          { boxShadow: `0 0 0 0 ${LIME} / 0)` },
        ],
        { duration: GLOW_MS, delay: GLOW_AT, easing: SOFT },
      ),
      mark.animate(
        [
          { filter: `drop-shadow(0 0 0 ${LIME} / 0))` },
          { filter: `drop-shadow(0 0 4px ${LIME} / 0.9))`, offset: 0.4 },
          { filter: `drop-shadow(0 0 0 ${LIME} / 0))` },
        ],
        { duration: GLOW_MS, delay: GLOW_AT, easing: SOFT },
      ),
      shine.animate(
        [
          { maskPosition: "100% 0", opacity: 1 },
          { maskPosition: "0% 0", opacity: 1 },
        ],
        { duration: SHINE_MS, delay: SHINE_AT, easing: "ease-in-out" },
      ),
    );
    running.current = animations;

    // 5. Idle: breathe for as long as the pointer stays on the logo.
    idleTimer.current = window.setTimeout(() => {
      running.current = [];
      if (!hovered.current) return;
      breathe.current = tile.animate([{ scale: "1" }, { scale: "1.03" }, { scale: "1" }], {
        duration: BREATHE_MS,
        iterations: Infinity,
        easing: "ease-in-out",
      });
    }, IDLE_AT);
  };

  const rest = (): void => {
    hovered.current = false;
    breathe.current?.cancel();
    breathe.current = null;
  };

  return (
    <Link
      href="/"
      onPointerEnter={play}
      onPointerLeave={rest}
      onFocus={play}
      onBlur={rest}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
    >
      {/* overflow-hidden: the halves slide in from beyond the tile's edges. */}
      <span
        ref={tileRef}
        className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-brand-ink text-primary"
      >
        <BrandMark ref={markRef} className="size-5" />
      </span>
      <span className="relative font-heading text-lg font-semibold tracking-tight text-foreground">
        <span className="sr-only">{brand}</span>
        <span ref={lettersRef} aria-hidden>
          {letters.map((letter, index) => (
            <span key={index} className="inline-block">
              {letter}
            </span>
          ))}
        </span>
        {/* Shine: the same word in a lime tint, shown only through a narrow
            moving band. Hidden (opacity 0) except while the sweep plays. */}
        <span
          ref={shineRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 mask-[linear-gradient(110deg,transparent_42%,black_50%,transparent_58%)] mask-size-[250%_100%] mask-position-[100%_0] mask-no-repeat text-(--shine) opacity-0"
          style={
            {
              "--shine": "color-mix(in srgb, var(--primary) 78%, var(--foreground))",
            } as CSSProperties
          }
        >
          {brand}
        </span>
      </span>
    </Link>
  );
}
