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
  /** Тодруулах элементийн CSS selector; эхний харагдаж буй тохирол сонгогдоно. */
  target: string;
  title: string;
  text: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // тодруулсан элементийн эргэн тойрны зай
const GAP = 14; // тодруулга ба картын хооронд
const EDGE = 16; // харагдах хүрээний ирмэгээс хамгийн бага зай
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
 * Жинхэнэ хуудас дээрх алхам алхмаар аялал: нэг элементээс бусад бүх зүйл бүдгэрч,
 * карт түүнийг тайлбарлан, гэрэлтүүлэг дараагийн элемент рүү гулсана. URL-д
 * `?tour=1` байхад эхэлнэ; элемент нь байхгүй алхмуудыг алгасна.
 * Гар: ← → шилжих, Esc гарах.
 */
type GuidedTourProps = {
  steps: readonly TourStep[];
  /** Сүүлийн алхмын дараах toast; өгөөгүй бол хайлтын хуудасны өөрийн үгс. */
  done?: { title: string; text: string };
};

/**
 * Заавартай аялал: URL-д `?tour=1` байхад эхэлж, алхам бүрийн элементийг гэрэлтүүлэн
 * тайлбарын картыг хажууд нь байрлуулна.
 */
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

  // Энэ хуудас нээлттэй байхад "?tour=1" дахин ирж болно (header-ийн "Заавар" холбоос).
  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (requested) {
      setActive(true);
      setIndex(0);
    }
  }

  // URL-аас тугийг авна, ингэснээр дахин ачаалах эсвэл хуваалцсан холбоос аяллыг дахин эхлүүлэхгүй.
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

  // Алхмын элементийг харагдах хүрээнд оруулаад кадр бүрт дагана (гүйлгэлт, хэмжээ
  // өөрчлөгдөх, layout шилжих) бөгөөд зөвхөн хөдөлсөн үед гэрэлтүүлгийг шинэчилнэ.
  useEffect(() => {
    if (!active || !step) return;
    const target = findTarget(step.target);
    if (!target) {
      // Заах юм алга (жишээ нь хайлтын үр дүн байхгүй): өөрөө дараагийнх руу шилжинэ.
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

  // Шинэ алхам бүр focus-ийг үндсэн товч руу нь шилжүүлдэг тул Enter/Space аяллыг үргэлжлүүлнэ.
  useEffect(() => {
    if (active) nextRef.current?.focus({ preventScroll: true });
  }, [active, index]);

  // Аялал нээлттэй байх хооронд ард байгаа хуудас хөдлөхгүй.
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [active]);

  // Товчнууд focus хаана ч байсан ажиллана (аяллыг эхлүүлсэн холбоос дээр байж магадгүй).
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") finish(false);
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "Tab") {
        // Focus-ийг карт дотор байлгана.
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

  // Гэрэлтүүлгийн хайрцаг, дараа нь карт доор нь, зай байхгүй бол дээр нь.
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
      {/* Дарахыг барих давхарга: аяллын дундуур доорх хуудсыг ашиглах боломжгүй. */}
      <div className="absolute inset-0" aria-hidden />

      {/* Нүх: аварга сүүдэр нь бусад бүхнийг бүдгэрүүлдэг хайрцаг. */}
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

        {/* Алхам бүрт текст аажуухан гарч ирэхийн тулд дахин key өгнө. */}
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
