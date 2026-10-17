"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

/** Degrees the card turns per pixel dragged. */
const DEG_PER_PX = 0.45;
/** Up/down drag leans the card forward or back, never past this. */
const MAX_LEAN = 28;
/** Movement before a press counts as a drag (so taps on buttons stay taps). */
const DRAG_START_PX = 6;
/** Fraction of the spin kept every 16 ms after letting go. */
const FRICTION = 0.95;
/** Below this speed (degrees per ms) the glide ends and the card settles. */
const STOP_SPEED = 0.05;
/** A release this long after the last move has no throw left in it. */
const STILL_MS = 80;
/** Mouse hover lean, as on the other cards. */
const HOVER_DEG = 7;

type SpinProps<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  onPointerDown: (event: PointerEvent<T>) => void;
  onPointerMove: (event: PointerEvent<T>) => void;
  onPointerUp: (event: PointerEvent<T>) => void;
  onPointerCancel: () => void;
  onPointerLeave: (event: PointerEvent<T>) => void;
  onDoubleClick: (event: MouseEvent<T>) => void;
  onKeyDown: (event: KeyboardEvent<T>) => void;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Drives the `spin-3d` utility: drag a card sideways to turn it all the way
 * round, up/down to lean it, and let go to throw it; it glides, slows and
 * settles on whichever face is nearer. The element needs a front and a back
 * face (`data-face="front" | "back"`); the hidden one is made `inert`.
 *
 * Touch: the element has `touch-action: pan-y`, so an up/down swipe still
 * scrolls the page and only a sideways swipe spins. Everything is written as
 * CSS variables, at most once a frame, so spinning never re-renders React.
 */
export function useSpin<T extends HTMLElement>(): SpinProps<T> & { flip: (dir?: 1 | -1) => void } {
  const ref = useRef<T>(null);
  const s = useRef({
    lean: 0, // rotateX, degrees
    turn: 0, // rotateY, degrees (unbounded: several full turns are fine)
    speed: 0, // degrees per ms, while gliding
    pointer: null as number | null,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    frame: 0,
    back: false,
  });

  useEffect(() => {
    const state = s.current;
    return () => cancelAnimationFrame(state.frame);
  }, []);

  const reducedMotion = (): boolean =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Writes the angles, moves the light with the turn, and marks the visible face. */
  const paint = (): void => {
    const node = ref.current;
    if (!node) return;
    const { lean, turn } = s.current;
    node.style.setProperty("--spin-x", `${lean.toFixed(2)}deg`);
    node.style.setProperty("--spin-y", `${turn.toFixed(2)}deg`);
    const radians = (turn * Math.PI) / 180;
    node.style.setProperty("--glare-x", `${(50 + Math.sin(radians) * 55).toFixed(1)}%`);
    node.style.setProperty("--glare-y", `${(50 - lean * 1.6).toFixed(1)}%`);

    const facing = (((turn % 360) + 360) % 360) as number;
    const back = facing > 90 && facing < 270;
    if (back !== s.current.back) {
      s.current.back = back;
      node.dataset.side = back ? "back" : "front";
      // The side turned away can be neither read nor tabbed into.
      node.querySelector('[data-face="front"]')?.toggleAttribute("inert", back);
      node.querySelector('[data-face="back"]')?.toggleAttribute("inert", !back);
    }
  };

  /** Ends on the nearer face, upright, with the CSS spring doing the last bit. */
  const settle = (): void => {
    const node = ref.current;
    cancelAnimationFrame(s.current.frame);
    s.current.turn = Math.round(s.current.turn / 180) * 180;
    s.current.lean = 0;
    s.current.speed = 0;
    if (node) delete node.dataset.spinning;
    paint();
  };

  const glide = (): void => {
    let last = performance.now();
    const step = (now: number): void => {
      const dt = Math.min(now - last, 48);
      last = now;
      const state = s.current;
      state.turn += state.speed * dt;
      state.speed *= FRICTION ** (dt / 16);
      state.lean *= 0.9 ** (dt / 16);
      paint();
      if (Math.abs(state.speed) > STOP_SPEED) state.frame = requestAnimationFrame(step);
      else settle();
    };
    s.current.frame = requestAnimationFrame(step);
  };

  const flip = (dir: 1 | -1 = 1): void => {
    s.current.turn = Math.round(s.current.turn / 180) * 180 + 180 * dir;
    settle();
  };

  const clearHover = (): void => {
    const node = ref.current;
    if (!node) return;
    delete node.dataset.hover;
    node.style.removeProperty("--hover-x");
    node.style.removeProperty("--hover-y");
  };

  return {
    ref,
    flip,
    onPointerDown: (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const state = s.current;
      cancelAnimationFrame(state.frame);
      state.pointer = event.pointerId;
      state.dragging = false;
      state.startX = state.lastX = event.clientX;
      state.startY = state.lastY = event.clientY;
      state.lastT = event.timeStamp;
    },
    onPointerMove: (event) => {
      const node = ref.current;
      const state = s.current;
      if (!node) return;

      // Mouse just passing over: a gentle lean toward the cursor, as on other cards.
      if (state.pointer === null) {
        if (event.pointerType !== "mouse") return;
        const box = node.getBoundingClientRect();
        const x = clamp((event.clientX - box.left) / box.width, 0, 1);
        const y = clamp((event.clientY - box.top) / box.height, 0, 1);
        node.dataset.hover = "";
        node.style.setProperty("--hover-x", `${((0.5 - y) * 2 * HOVER_DEG).toFixed(2)}deg`);
        node.style.setProperty("--hover-y", `${((x - 0.5) * 2 * HOVER_DEG).toFixed(2)}deg`);
        node.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
        node.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
        return;
      }
      if (event.pointerId !== state.pointer) return;

      if (!state.dragging) {
        const moved = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
        if (moved < DRAG_START_PX) return;
        state.dragging = true;
        node.setPointerCapture(event.pointerId);
        node.dataset.spinning = "";
        clearHover();
      }

      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      const dt = Math.max(event.timeStamp - state.lastT, 1);
      state.turn += dx * DEG_PER_PX;
      state.lean = clamp(state.lean - dy * DEG_PER_PX * 0.6, -MAX_LEAN, MAX_LEAN);
      // Smoothed, so one jittery frame does not decide the throw.
      state.speed = 0.75 * ((dx * DEG_PER_PX) / dt) + 0.25 * state.speed;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastT = event.timeStamp;
      cancelAnimationFrame(state.frame);
      state.frame = requestAnimationFrame(paint);
    },
    onPointerUp: (event) => {
      const node = ref.current;
      const state = s.current;
      state.pointer = null;
      if (!state.dragging) return;
      state.dragging = false;
      if (node?.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      if (event.timeStamp - state.lastT > STILL_MS) state.speed = 0;
      if (reducedMotion() || Math.abs(state.speed) <= STOP_SPEED) settle();
      else glide();
    },
    // The browser took the gesture (an up/down scroll): put the card back.
    onPointerCancel: () => {
      s.current.pointer = null;
      if (s.current.dragging) {
        s.current.dragging = false;
        settle();
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === "mouse" && s.current.pointer === null) clearHover();
    },
    // Double tap or double click turns it over.
    onDoubleClick: (event) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      flip(1);
    },
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        flip(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        flip(-1);
      }
    },
  };
}
