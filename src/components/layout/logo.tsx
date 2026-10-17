import Link from "next/link";
import type { JSX } from "react";

import { UlziiKnot } from "@/components/shared/ulzii";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Brand mark (өлзий knot in an ultramarine dial) + Unbounded wordmark. */
export function Logo({ className }: { className?: string }): JSX.Element {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <UlziiKnot className="size-6" strokeWidth={2} />
      </span>
      <span className="font-heading text-lg font-medium tracking-tight text-foreground">
        {APP_NAME}
      </span>
    </Link>
  );
}
