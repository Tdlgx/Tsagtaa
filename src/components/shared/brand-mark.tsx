import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Цагтаа brand mark: an hourglass split into two offset triangles. The lower
 * half is the upper half turned 180°, so the gap between them runs on a
 * diagonal like falling sand. Drawn on a 48×48 grid; the round-joined stroke
 * in the same color gives the soft corners. Colored by currentColor.
 *
 * The halves are separate paths (`data-part="top" | "bottom"`) so the logo
 * animation can move each one on its own.
 */
const TOP_PATH = "M4 2 H44.5 L16.8 22.5 Z";
const BOTTOM_PATH = "M44 46 H3.5 L31.2 25.5 Z";

type BrandMarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox">;

export function BrandMark({ className, ...props }: BrandMarkProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    >
      <path data-part="top" d={TOP_PATH} />
      <path data-part="bottom" d={BOTTOM_PATH} />
    </svg>
  );
}
