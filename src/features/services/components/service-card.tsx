import { Check, Clock } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { formatMNT } from "@/lib/currency";
import { formatDuration } from "@/lib/date";
import { cn } from "@/lib/utils";

type ServiceCardProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  title: string;
  description?: string;
  durationMinutes: number;
  /** Price in tögrög. */
  price: number;
  /** "radio" when one service can be picked, "checkbox" for several. */
  selection?: "radio" | "checkbox";
};

/**
 * A selectable service. Like TimeSlot it wraps a native radio/checkbox, so the
 * whole card is one large, keyboard-friendly tap target.
 * Only phrasing elements (<span>) are used inside <label>, as HTML requires.
 */
export function ServiceCard({
  title,
  description,
  durationMinutes,
  price,
  selection = "radio",
  className,
  ...inputProps
}: ServiceCardProps): JSX.Element {
  return (
    <label className={cn("group/service relative block", className)}>
      <input type={selection} className="sr-only" {...inputProps} />
      <span
        className={cn(
          "flex cursor-pointer items-start gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5",
          "transition-transform duration-150 ease-soft is-active:scale-99",
          "is-hover:border-muted-foreground",
          "group-has-checked/service:border-primary group-has-checked/service:ring-1 group-has-checked/service:ring-primary-strong",
          "group-has-focus-visible/service:ring-3 group-has-focus-visible/service:ring-ring",
          "group-has-disabled/service:cursor-not-allowed group-has-disabled/service:opacity-60",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium text-foreground">{title}</span>
          {description ? (
            <span className="line-clamp-2 text-sm text-muted-foreground">{description}</span>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
            <Clock className="size-4" />
            {formatDuration(durationMinutes)}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-3">
          <span className="font-semibold text-foreground tabular-nums">{formatMNT(price)}</span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
            <span className="group-has-checked/service:hidden">Сонгох</span>
            <span className="hidden group-has-checked/service:inline">Сонгосон</span>
            <span
              aria-hidden
              className={cn(
                "flex size-6 items-center justify-center rounded-full border border-input text-transparent",
                "group-has-checked/service:border-primary group-has-checked/service:bg-primary group-has-checked/service:text-primary-foreground",
              )}
            >
              <Check className="size-4" />
            </span>
          </span>
        </span>
      </span>
    </label>
  );
}
