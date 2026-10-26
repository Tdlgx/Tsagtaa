"use client";

import { useEffect, useRef, useSyncExternalStore, type JSX } from "react";

/** Цэгэн талбайн торын алхам, px. */
const GAP = 22;
/** Курсороос хэр хол хүртэл цэгүүд гэрэлтэх вэ, px. */
const RADIUS = 280;
/** Ийм ойрхон цэгүүд курсор руу нарийн шугам татна, px. */
const LINK = 74;
/** Линзийн төвд гадагш түлхэх хэмжээ, px. */
const PUSH = 9;
/** Кадр тутмын гүйцэлт (0–1), цэгэн линз болон түүний ард байх гэрэлтэлтийнх. */
const EASE = 0.16;
const GLOW_EASE = 0.08;
const GLOW_SIZE = 560;
/** Дарахад гарах цагираг: хурд (px/ms), хүрээ (px), зузаан (px). */
const RING_SPEED = 0.55;
const RING_REACH = 460;
const RING_BAND = 28;

type Point = { x: number; y: number };
type Ring = Point & { start: number };

/** Хулгана эсвэл trackpad, мөн хүн бага хөдөлгөөн хүсээгүй. */
const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribeToQuery(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readQuery(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** Theme-ийн тодотгол өнгө "r, g, b" хэлбэрээр (light-д чидун, dark-д шар-ногоон). */
function readAccent(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-strong")
    .trim()
    .replace("#", "");
  const hex = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const n = Number.parseInt(hex, 16);
  return Number.isNaN(n) ? "74, 97, 0" : `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const smooth = (x: number): number => x * x * (3 - 2 * x);

/**
 * Хулганад хариу үйлдэл үзүүлдэг чимэглэлийн дэвсгэр. Курсорын доор цэгэн тор
 * линз шиг томорно: цэгүүд гарч ирж, төв рүү томорч, гадагш хазайна, хамгийн ойрын
 * хэдэн цэг курсортой нарийн шугамаар холбогдож, ард нь зөөлөн шар-ногоон гэрэлтэлт
 * хөвнө. Дарахад цэгүүдээр цагираг тархана.
 *
 * Нэг canvas дээр зөвхөн ямар нэг зүйл хөдлөх үед зурна (курсор зогсоход давталт
 * унтана), мэдрэгчтэй дэлгэц болон "reduce motion" үед алгасна.
 */
export function CursorBackdrop(): JSX.Element | null {
  // Сервер (болон hydration) үргэлж юу ч render хийхгүй; дараа нь browser шийднэ.
  const enabled = useSyncExternalStore(subscribeToQuery, readQuery, () => false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    const ctx = canvas?.getContext("2d");
    if (!enabled || !canvas || !glow || !ctx) return;

    let width = 0;
    let height = 0;
    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let accent = readAccent();
    // Theme <html> дээрх классаар солигддог: шинэ тодотгол өнгийг авна.
    const themeWatch = new MutationObserver(() => {
      accent = readAccent();
      wake();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const target: Point = { x: width / 2, y: height / 3 };
    const lens: Point = { ...target };
    const glowAt: Point = { ...target };
    let strength = 0; // 0 = нуугдсан, 1 = курсор хуудсан дээр
    let present = false;
    const rings: Ring[] = [];
    let frame = 0;

    const drawDot = (x: number, y: number, radius: number, alpha: number): void => {
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now: number): void => {
      lens.x += (target.x - lens.x) * EASE;
      lens.y += (target.y - lens.y) * EASE;
      glowAt.x += (target.x - glowAt.x) * GLOW_EASE;
      glowAt.y += (target.y - glowAt.y) * GLOW_EASE;
      strength += ((present ? 1 : 0) - strength) * 0.08;

      glow.style.transform = `translate3d(${glowAt.x - GLOW_SIZE / 2}px, ${glowAt.y - GLOW_SIZE / 2}px, 0)`;
      glow.style.opacity = String(strength);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgb(${accent})`;
      ctx.strokeStyle = `rgb(${accent})`;
      ctx.lineWidth = 0.6;

      // Линз: курсорын эргэн тойрны цэгүүд.
      if (strength > 0.01) {
        const minX = Math.max(0, Math.floor((lens.x - RADIUS) / GAP));
        const maxX = Math.ceil((lens.x + RADIUS) / GAP);
        const minY = Math.max(0, Math.floor((lens.y - RADIUS) / GAP));
        const maxY = Math.ceil((lens.y + RADIUS) / GAP);
        for (let gx = minX; gx <= maxX; gx += 1) {
          for (let gy = minY; gy <= maxY; gy += 1) {
            const x = gx * GAP + GAP / 2;
            const y = gy * GAP + GAP / 2;
            const dx = x - lens.x;
            const dy = y - lens.y;
            const d = Math.hypot(dx, dy);
            if (d >= RADIUS) continue;
            const f = smooth(1 - d / RADIUS);
            const push = d > 0.001 ? (f * f * PUSH) / d : 0;
            const px = x + dx * push;
            const py = y + dy * push;
            if (d < LINK) {
              ctx.globalAlpha = (1 - d / LINK) * 0.28 * strength;
              ctx.beginPath();
              ctx.moveTo(lens.x, lens.y);
              ctx.lineTo(px, py);
              ctx.stroke();
            }
            drawDot(px, py, 0.7 + 2.1 * f * f, f ** 1.3 * 0.7 * strength);
          }
        }
      }

      // Дарахад гарах цагираг: цагираг дээгүүр өнгөрөхөд цэгүүд тодорно.
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const ring = rings[i]!;
        const r = (now - ring.start) * RING_SPEED;
        if (r > RING_REACH) {
          rings.splice(i, 1);
          continue;
        }
        const fade = 1 - r / RING_REACH;
        const reach = r + RING_BAND;
        const minX = Math.max(0, Math.floor((ring.x - reach) / GAP));
        const maxX = Math.ceil((ring.x + reach) / GAP);
        const minY = Math.max(0, Math.floor((ring.y - reach) / GAP));
        const maxY = Math.ceil((ring.y + reach) / GAP);
        for (let gx = minX; gx <= maxX; gx += 1) {
          for (let gy = minY; gy <= maxY; gy += 1) {
            const x = gx * GAP + GAP / 2;
            const y = gy * GAP + GAP / 2;
            const off = Math.abs(Math.hypot(x - ring.x, y - ring.y) - r);
            if (off >= RING_BAND) continue;
            const b = smooth(1 - off / RING_BAND) * fade;
            drawDot(x, y, 0.8 + 2.4 * b, b * 0.85);
          }
        }
      }
      ctx.globalAlpha = 1;

      const settled =
        rings.length === 0 &&
        Math.abs(target.x - glowAt.x) < 0.5 &&
        Math.abs(target.y - glowAt.y) < 0.5 &&
        Math.abs((present ? 1 : 0) - strength) < 0.01;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    function wake(): void {
      if (frame === 0) frame = requestAnimationFrame(tick);
    }

    const onMove = (event: PointerEvent): void => {
      if (!present && strength < 0.05) {
        // Хуудас руу буцаж орж ирэх: курсор байгаа газраас эхэлнэ.
        lens.x = glowAt.x = event.clientX;
        lens.y = glowAt.y = event.clientY;
      }
      target.x = event.clientX;
      target.y = event.clientY;
      present = true;
      wake();
    };
    const onLeave = (): void => {
      present = false;
      wake();
    };
    const onDown = (event: PointerEvent): void => {
      rings.push({ x: event.clientX, y: event.clientY, start: performance.now() });
      wake();
    };
    const onResize = (): void => {
      resize();
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", onResize);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        ref={glowRef}
        style={{ width: GLOW_SIZE, height: GLOW_SIZE, opacity: 0 }}
        className="absolute top-0 left-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_26%,transparent),transparent)] blur-3xl will-change-transform dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_13%,transparent),transparent)]"
      />
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
