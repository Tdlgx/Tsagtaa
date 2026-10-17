import { useId, type ComponentProps, type JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Simplified "өлзий" (endless knot): a woven diamond lattice with a loop at
 * each corner. Drawn on a 48×48 grid so it can be reused as an icon-sized mark,
 * an illustration or a repeating pattern. Stroke only, colored by currentColor.
 */
const ULZII_PATH = [
  // Outer ring: diamond edges joined by four corner loops.
  "M21 9 A4.25 4.25 0 1 1 27 9 L39 21 A4.25 4.25 0 1 1 39 27",
  "L27 39 A4.25 4.25 0 1 1 21 39 L9 27 A4.25 4.25 0 1 1 9 21 Z",
  // Inner lattice: two strands in each diagonal direction.
  "M12 18 L30 36 M18 12 L36 30 M12 30 L30 12 M18 36 L36 18",
].join(" ");

type UlziiKnotProps = Omit<ComponentProps<"svg">, "children" | "viewBox">;

export function UlziiKnot({
  className,
  strokeWidth = 1.25,
  ...props
}: UlziiKnotProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={ULZII_PATH} />
    </svg>
  );
}

type UlziiPatternProps = {
  className?: string;
  /** Tile size in px; the knot sits in the middle of each tile. */
  tile?: number;
};

/**
 * Repeating өлзий texture. Keep it barely visible (opacity 4–6%) and use it
 * only in the hero and empty-state art, never as a general background.
 */
export function UlziiPattern({ className, tile = 72 }: UlziiPatternProps): JSX.Element {
  const id = useId();
  const offset = (tile - 48) / 2;

  return (
    <svg aria-hidden className={cn("pointer-events-none", className)}>
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <path
            d={ULZII_PATH}
            transform={`translate(${offset} ${offset})`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
