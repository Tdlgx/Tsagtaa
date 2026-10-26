import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/** Зөөлөн гэрлийн шилжилттэй ачааллын орлуулагч (зөвхөн transform анимэйшн). */
function Skeleton({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-surface/60 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
