import { cva } from "class-variance-authority";
import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TimeSlotStatus = "available" | "booked" | "past";

/**
 * Цагийн товчны харагдах төлөвүүд. Export хийсэн тул статик урьдчилсан харагдац
 * (жишээ нь нүүр хуудсан дээрх утасны загвар) input-гүйгээр яг ижил харагдацыг гаргана.
 */
export const timeSlotVariants = cva(
  [
    "flex min-h-11 w-full items-center justify-center rounded-full border text-sm font-medium tabular-nums select-none",
    "transition-transform duration-150 ease-soft",
  ],
  {
    variants: {
      state: {
        available:
          "cursor-pointer border-border bg-surface text-foreground is-hover:border-primary-strong is-active:scale-96",
        selected: "border-primary bg-primary text-primary-foreground shadow-sm",
        booked:
          "cursor-not-allowed border-border bg-hatch text-muted-foreground line-through decoration-1",
        past: "cursor-not-allowed border-transparent bg-surface-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "available",
    },
  },
);

const STATUS_LABEL: Record<Exclude<TimeSlotStatus, "available">, string> = {
  booked: "дүүрсэн",
  past: "өнгөрсөн",
};

type TimeSlotProps = Omit<ComponentProps<"input">, "type" | "value" | "children"> & {
  /** Харуулах цаг, жишээ нь "10:30". Radio-гийн утга болж ч хэрэглэгдэнэ. */
  time: string;
  status?: TimeSlotStatus;
  /** Сонгох боломжгүй цагийн screen reader-ийн үг; анхдагч нь Монгол. */
  unavailableLabel?: string;
};

/**
 * Захиалж болох нэг цаг. Label-д ороосон жинхэнэ radio товч (нүдэнд нуугдсан) тул
 * сумтай товч, маягт, screen reader JavaScript огт хэрэггүйгээр ажиллана.
 * Хүрэх талбай хамгийн багадаа 44×44px.
 */
export function TimeSlot({
  time,
  status = "available",
  unavailableLabel,
  className,
  disabled,
  ...inputProps
}: TimeSlotProps): JSX.Element {
  const unavailable = status !== "available";

  return (
    <label className={cn("relative block", className)}>
      <input
        type="radio"
        value={time}
        disabled={disabled || unavailable}
        className="peer sr-only"
        {...inputProps}
      />
      <span
        className={cn(
          timeSlotVariants({ state: status }),
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-sm",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
        )}
      >
        {time}
      </span>
      {unavailable ? (
        <span className="sr-only">{unavailableLabel ?? STATUS_LABEL[status]}</span>
      ) : null}
    </label>
  );
}

type TimeSlotGroupProps = {
  /** Харагдах бүлгийн гарчиг, жишээ нь "Өглөө". */
  legend: string;
  children: ReactNode;
  className?: string;
};

/** Цагуудын тор: утсан дээр мөрөнд 4 (тус бүр ≥ 72px өргөн), 640px-ээс 6. */
export function TimeSlotGroup({ legend, children, className }: TimeSlotGroupProps): JSX.Element {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-3 text-sm font-medium text-muted-foreground">{legend}</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{children}</div>
    </fieldset>
  );
}
