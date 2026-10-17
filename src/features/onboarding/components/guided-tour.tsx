"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markOnboardingSeen, TOUR_PARAM } from "@/features/onboarding/onboarding";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type TourStep = {
  /** CSS selector of the element to highlight; the first visible match wins. */
  target: string;
  title: string;
  text: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // breathing room around the highlighted element
const GAP = 14; // between the highlight and the card
const EDGE = 16; // minimum distance from the viewport edge
const CARD_WIDTH = 352;

function findTarget(selector: string): HTMLElement | null {
  const matches = [...document.querySelectorAll<HTMLElement>(selector)];
  return matches.find((el) => el.getClientRects().length > 0) ?? null;
}

function sameRect(a: Rect | null, b: Rect): boolean {
  return (
    a !== null &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Step-by-step tour over the real page: everything dims except one element,
 * a card explains it, and the spotlight glides to the next element. Starts
 * when the URL has `?tour=1`; steps whose element is missing are skipped.
 * Keyboard: ← → to move, Esc to leave.
 */
type GuidedTourProps = {
  steps: readonly TourStep[];
  /** Toast after the last step; the search page's own words when left out. */
  done?: { title: string; text: string };
};

export function GuidedTour({ steps, done }: GuidedTourProps): JSX.Element | null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = searchParams.get(TOUR_PARAM) === "1";
  const t = useT();

  const [active, setActive] = useState(requested);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [lastRequested, setLastRequested] = useState(requested);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // "?tour=1" can arrive again while this page is open (the header's "Заавар" link).
  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (requested) {
      setActive(true);
      setIndex(0);
    }
  }

  // Take the flag out of the URL so a refresh or a shared link doesn't restart the tour.
  useEffect(() => {
    if (!requested) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(TOUR_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [requested, searchParams, pathname, router]);

  const step = steps[index];

  const finish = (completed: boolean): void => {
    markOnboardingSeen();
    setActive(false);
    setRect(null);
    setIndex(0);
    if (completed) {
      toast.success(done?.title ?? t.tour.doneTitle, {
        description: done?.text ?? t.tour.doneText,
      });
    }
  };

  const go = (delta: number): void => {
    const next = index + delta;
    if (next >= steps.length) finish(true);
    else if (next >= 0) setIndex(next);
  };

  // Bring the step's element into view, then follow it every frame (scrolling,
  // resizing, layout shifts) and update the spotlight only when it moved.
  useEffect(() => {
    if (!active || !step) return;
    const target = findTarget(step.target);
    if (!target) {
      // Nothing to point at (e.g. no search results): move on by itself.
      const skip = window.setTimeout(() => {
        if (index < steps.length - 1) setIndex(index + 1);
        else setActive(false);
      }, 0);
      return () => window.clearTimeout(skip);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });

    let frame = 0;
    const follow = (): void => {
      const box = target.getBoundingClientRect();
      const next = { top: box.top, left: box.left, width: box.width, height: box.height };
      setRect((current) => (sameRect(current, next) ? current : next));
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [active, step, index, steps.length]);

  // Each new step moves focus to its main button, so Enter/Space continue the tour.
  useEffect(() => {
    if (active) nextRef.current?.focus({ preventScroll: true });
  }, [active, index]);

  // The page behind stays still while the tour is open.
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [active]);

  // Keys work wherever focus is (it may still be on the link that started the tour).
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") finish(false);
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "Tab") {
        // Keep focus inside the card.
        const focusable = [...(cardRef.current?.querySelectorAll<HTMLElement>("button") ?? [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        const inside = cardRef.current?.contains(document.activeElement) ?? false;
        if (!inside || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!active || !step || !rect) return null;

  const isLast = index === steps.length - 1;

  // Spotlight box, then the card below it, or above when there is no room.
  const spot = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, viewportW - EDGE * 2);
  const below = spot.top + spot.height + GAP + 220 < viewportH || spot.top < viewportH / 2;
  const centerX = spot.left + spot.width / 2;
  const cardLeft = Math.min(Math.max(centerX - cardWidth / 2, EDGE), viewportW - cardWidth - EDGE);
  const arrowLeft = Math.min(Math.max(centerX - cardLeft, 24), cardWidth - 24);

  const cardStyle: CSSProperties = below
    ? {
        top: Math.min(spot.top + spot.height + GAP, viewportH - 200),
        left: cardLeft,
        width: cardWidth,
      }
    : { bottom: Math.max(viewportH - spot.top + GAP, EDGE), left: cardLeft, width: cardWidth };

  return createPortal(
    <div className="fixed inset-0 z-60">
      {/* Click-catcher: the page underneath can't be used mid-tour. */}
      <div className="absolute inset-0" aria-hidden />

      {/* The hole: a box whose giant shadow dims everything else. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-xl transition-[top,left,width,height] duration-400 ease-soft"
        style={{ ...spot, boxShadow: "0 0 0 200vmax rgb(11 12 15 / 0.72)" }}
      >
        <span className="absolute inset-0 animate-beacon rounded-xl ring-2 ring-primary" />
      </div>

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className="absolute rounded-xl border border-border bg-surface p-5 shadow-lg transition-[top,bottom,left] duration-400 ease-soft"
        style={cardStyle}
      >
        <span
          aria-hidden
          className={cn(
            "absolute size-3 rotate-45 border-border bg-surface",
            below ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b",
          )}
          style={{ left: arrowLeft - 6 }}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((item, dot) => (
              <span
                key={item.target}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-250 ease-soft",
                  dot === index ? "w-5 bg-primary-strong" : "w-1.5",
                  dot < index ? "bg-primary-strong/50" : dot > index ? "bg-border" : "",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {index + 1} / {steps.length}
          </span>
        </div>

        {/* Re-keyed so the text fades in with each step. */}
        <div key={index} className="mt-4 animate-in duration-250 ease-soft fade-in">
          <h2 id="tour-title" className="font-heading text-lg font-medium text-foreground">
            {step.title}
          </h2>
          <p id="tour-text" className="mt-1.5 text-sm text-muted-foreground">
            {step.text}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => finish(false)}
            className="mr-auto inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
          >
            <X className="size-4" />
            {t.tour.skip}
          </button>
          {index > 0 ? (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => go(-1)}
              aria-label={t.tour.previous}
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <Button ref={nextRef} size="sm" onClick={() => go(1)}>
            {isLast ? t.tour.finish : t.tour.next}
            {isLast ? null : <ArrowRight data-icon="end" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
