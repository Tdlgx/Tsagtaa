import { Check } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";

export const BOOKING_STEPS = ["Үйлчилгээ", "Ажилтан", "Цаг", "Баталгаажуулах"] as const;

type StepState = "complete" | "current" | "upcoming";

const STATE_SR_TEXT: Record<StepState, string> = {
  complete: "(дууссан)",
  current: "(одоогийн алхам)",
  upcoming: "",
};

type BookingStepperProps = {
  /** Zero-based index of the step the user is on. */
  currentStep: number;
  className?: string;
};

/**
 * Progress through the 4 booking steps. On phones only the circles are shown
 * plus one line naming the current step; labels appear from 640px.
 */
export function BookingStepper({ currentStep, className }: BookingStepperProps): JSX.Element {
  const total = BOOKING_STEPS.length;
  const current = Math.min(Math.max(currentStep, 0), total - 1);

  return (
    <nav aria-label="Захиалгын явц" className={className}>
      <p aria-hidden className="mb-4 text-sm text-muted-foreground sm:hidden">
        Алхам{" "}
        <span className="tabular-nums">
          {current + 1}/{total}
        </span>{" "}
        · <span className="font-medium text-foreground">{BOOKING_STEPS[current]}</span>
      </p>
      <ol className="flex items-center">
        {BOOKING_STEPS.map((label, index) => {
          const state: StepState =
            index < current ? "complete" : index === current ? "current" : "upcoming";
          const isLast = index === total - 1;

          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                    state === "complete" && "bg-primary text-primary-foreground",
                    state === "current" &&
                      "bg-primary-soft text-primary ring-1 ring-primary ring-offset-2 ring-offset-background",
                    state === "upcoming" && "border border-border bg-surface text-muted-foreground",
                  )}
                >
                  {state === "complete" ? <Check className="size-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "sr-only text-sm sm:not-sr-only",
                    state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground",
                  )}
                >
                  {label}
                </span>
                {state !== "upcoming" ? (
                  <span className="sr-only">{STATE_SR_TEXT[state]}</span>
                ) : null}
              </span>
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 h-px flex-1 sm:mx-4",
                    index < current ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
