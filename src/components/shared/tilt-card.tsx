"use client";

import type { JSX, ReactNode } from "react";

import { useTilt } from "@/hooks/use-tilt";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Strongest tilt at a corner, in degrees. Smaller for cards that are also controls. */
  maxDegrees?: number;
};

/**
 * Card that leans toward the cursor or finger, with a light that follows it
 * (see `useTilt` and the `tilt-3d` utility). Give it the card's own rounding,
 * background and padding through `className`.
 */
export function TiltCard({ children, className, maxDegrees = 8 }: TiltCardProps): JSX.Element {
  const tilt = useTilt<HTMLDivElement>(maxDegrees);
  return (
    <div
      {...tilt}
      className={cn("tilt-3d relative overflow-hidden data-tilt:shadow-lg", className)}
    >
      {children}
    </div>
  );
}
