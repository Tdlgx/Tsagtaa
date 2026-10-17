"use client";

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";

type TiltProps<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  onPointerMove: (event: PointerEvent<T>) => void;
  onPointerDown: (event: PointerEvent<T>) => void;
  onPointerUp: (event: PointerEvent<T>) => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Drives the `tilt-3d` utility: the point under the cursor or finger sinks
 * back (so each corner can be pressed in) and a light follows it. Spread the
 * result on the element. Writes CSS variables directly, at most once a frame,
 * so moving never re-renders React. A touch drag that turns into a scroll
 * fires `pointercancel`, which lets the card settle back.
 */
export function useTilt<T extends HTMLElement>(maxDegrees = 8): TiltProps<T> {
  const ref = useRef<T>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const tiltTo = ({ clientX, clientY }: PointerEvent<T>): void => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const node = ref.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      const x = clamp01((clientX - box.left) / box.width);
      const y = clamp01((clientY - box.top) / box.height);
      node.dataset.tilt = "";
      node.style.setProperty("--tilt-rx", `${((0.5 - y) * 2 * maxDegrees).toFixed(2)}deg`);
      node.style.setProperty("--tilt-ry", `${((x - 0.5) * 2 * maxDegrees).toFixed(2)}deg`);
      node.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      node.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
    });
  };

  const settle = (): void => {
    cancelAnimationFrame(frame.current);
    const node = ref.current;
    if (!node) return;
    delete node.dataset.tilt;
    // The light keeps its last position so it fades out where it was.
    for (const name of ["--tilt-rx", "--tilt-ry", "--tilt-scale"]) {
      node.style.removeProperty(name);
    }
  };

  return {
    ref,
    onPointerMove: tiltTo,
    onPointerDown: (event) => {
      ref.current?.style.setProperty("--tilt-scale", "0.97");
      tiltTo(event);
    },
    onPointerUp: (event) => {
      if (event.pointerType === "mouse") ref.current?.style.removeProperty("--tilt-scale");
      else settle();
    },
    onPointerLeave: settle,
    onPointerCancel: settle,
  };
}
