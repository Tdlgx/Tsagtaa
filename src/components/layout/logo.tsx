"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type JSX } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { useLocale, useT } from "@/i18n/client";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* Цагийн хуваарь (ms) ------------------------------------------------------------ */
const STROKES_MS = 700; // 0.0–0.7  хагаснууд гулсаж гараад буцаж орж ирээд нийлнэ
const FLIP_AT = 600; // 0.6–1.25 элсэн цаг эргэнэ
const FLIP_MS = 650;
const LETTERS_AT = 1000; // 1.0–1.8 үсгүүд 60ms зайтай дээш гарч ирнэ
const LETTER_STAGGER = 60;
const LETTER_MS = 400;
const GLOW_AT = 1800; // 1.8–2.4 шар-ногоон гэрэлтэлт + нэрийн дээгүүр гялбаа
const GLOW_MS = 600;
const SHINE_AT = 1750;
const SHINE_MS = 700;
const IDLE_AT = 2200; // дараа нь курсор байх хооронд амьсгална
const BREATHE_MS = 2000;

/** Хагас нь хавтангаас хэр хол явах вэ, SVG нэгжээр (тэмдэг нь 48 нэгжийн тор). */
const SLIDE = 64;
const SOFT = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // аппын --ease-soft
const LIME = "rgb(194 244 30"; // --primary, keyframe дотор бүдгэрэхийн тулд rgb() хэлбэрээр

/** Хагас: `exit` тийш явж, эсрэг талаас буцаж ирээд бага зэрэг хэтэрч тогтоно. */
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
 * Брэндийн тэмдэг (бэхэн хавтан дээрх шар-ногоон элсэн цаг) + Unbounded үсгэн тэмдэг.
 *
 * Дээр нь заагч аваачих (эсвэл focus хийх) үед богино дараалал тоглоно: хоёр хагас
 * эсрэг талаас гулсаж ирээд нийлж, элсэн цаг эргэж, үсгүүд нэг нэгээрээ дээш гарч,
 * шар-ногоон гэрэлтэлт лугшиж, нэрийн дээгүүр гялбаа гүйнэ. Заагч байх хооронд
 * хавтан амьсгална. "Reduce motion" үед алгасна.
 */
export function Logo({ className }: { className?: string }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  // Env-ийн нэр staging/demo build-ийг ялгана; англи хэл дээр брэндийг латинаар бичнэ.
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
    // Явж буй дарааллыг дуусгана; хоёр дахийг хэзээ ч давхарлахгүй.
    if (running.current.length > 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    breathe.current?.cancel();
    const top = mark.querySelector<SVGPathElement>('[data-part="top"]');
    const bottom = mark.querySelector<SVGPathElement>('[data-part="bottom"]');
    const animations: Animation[] = [];

    // 1. Хагаснууд: дээд нь баруун тийш явж зүүнээс буцна, доод нь эсрэгээрээ.
    if (top) animations.push(top.animate(slideKeyframes(1), STROKES_MS));
    if (bottom) animations.push(bottom.animate(slideKeyframes(-1), STROKES_MS));

    // 2. 180° эргэж, бага зэрэг хэтрээд тогтоно. 180° нь 0°-тэй яг адилхан харагддаг
    //    тул анимэйшн сүүлийн кадраа барихгүйгээр дуусч болно.
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

    // 3. Үсгүүд: хурдан бүдгэрч, ээлжээ хүлээгээд 8px дээш байрандаа гарна.
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

    // 4. Хавтан болон тэмдгээр гэрэлтэлт, нэрийн дээгүүр гялбаа.
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

    // 5. Сул үе: заагч логон дээр байх хооронд амьсгална.
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
      {/* overflow-hidden: хагаснууд хавтангийн ирмэгийн цаанаас гулсаж орж ирнэ. */}
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
        {/* Гялбаа: ижил үг шар-ногоон өнгөөр, зөвхөн хөдлөх нарийн туузаар харагдана.
            Гялбаа гүйх үеэс бусад үед нуугдана (opacity 0). */}
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
