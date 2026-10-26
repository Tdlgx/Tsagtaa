import { Check } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";

export const BOOKING_STEPS = ["Үйлчилгээ", "Ажилтан", "Цаг", "Баталгаажуулах"] as const;

type StepState = "complete" | "current" | "upcoming";

export type StepperLabels = {
  progress: string;
  stepOf: (step: number, total: number) => string;
  done: string;
  current: string;
};

const DEFAULT_LABELS: StepperLabels = {
  progress: "Захиалгын явц",
  stepOf: (step, total) => `Алхам ${step}/${total}`,
  done: "(дууссан)",
  current: "(одоогийн алхам)",
};

type BookingStepperProps = {
  /** Хэрэглэгчийн байгаа алхмын индекс (0-ээс эхэлнэ). */
  currentStep: number;
  /** Алхмын нэрс; анхдагч нь BOOKING_STEPS. Эмнэлэг "Ажилтан"-ы оронд "Эмч" гэнэ. */
  steps?: readonly string[];
  /** Алхмуудын эргэн тойрны үгс, зочны хэлээр; анхдагч нь Монгол. */
  labels?: StepperLabels;
  /** Өгвөл дууссан алхмууд тэр алхам руу буцдаг товч болно. */
  onStepSelect?: (index: number) => void;
  className?: string;
};

/**
 * Захиалгын 4 алхмын явц. Утсан дээр зөвхөн дугуйнууд болон одоогийн алхмын
 * нэрийг нэг мөрөөр харуулна; шошгууд 640px-ээс гарна.
 */
export function BookingStepper({
  currentStep,
  steps = BOOKING_STEPS,
  labels = DEFAULT_LABELS,
  onStepSelect,
  className,
}: BookingStepperProps): JSX.Element {
  const total = steps.length;
  const current = Math.min(Math.max(currentStep, 0), total - 1);

  return (
    <nav aria-label={labels.progress} className={className}>
      <p aria-hidden className="mb-4 text-sm text-muted-foreground sm:hidden">
        <span className="tabular-nums">{labels.stepOf(current + 1, total)}</span> ·{" "}
        <span className="font-medium text-foreground">{steps[current]}</span>
      </p>
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const state: StepState =
            index < current ? "complete" : index === current ? "current" : "upcoming";
          const isLast = index === total - 1;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                  state === "complete" &&
                    "bg-primary text-primary-foreground group-hover/step:ring-2 group-hover/step:ring-primary-strong",
                  state === "current" &&
                    "bg-primary-soft text-primary-strong ring-1 ring-primary-strong ring-offset-2 ring-offset-background",
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
                <span className="sr-only">
                  {state === "complete" ? labels.done : labels.current}
                </span>
              ) : null}
            </>
          );

          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              {state === "complete" && onStepSelect ? (
                <button
                  type="button"
                  onClick={() => onStepSelect(index)}
                  className="group/step flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2">{content}</span>
              )}
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
