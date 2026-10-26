import { ChevronLeft, Clock, Star } from "lucide-react";
import type { JSX } from "react";

import { buttonVariants } from "@/components/ui/button";
import { timeSlotVariants, type TimeSlotStatus } from "@/features/booking/components/time-slot";
import { formatMNT } from "@/lib/currency";
import { cn } from "@/lib/utils";

type MockSlot = { time: string; state: TimeSlotStatus | "selected" };

const DAYS = [
  { weekday: "Да", day: 6, selected: true },
  { weekday: "Мя", day: 7, selected: false },
  { weekday: "Лх", day: 8, selected: false },
  { weekday: "Пү", day: 9, selected: false },
  { weekday: "Ба", day: 10, selected: false },
] as const;

const SLOTS: readonly MockSlot[] = [
  { time: "10:00", state: "past" },
  { time: "10:30", state: "booked" },
  { time: "11:00", state: "available" },
  { time: "11:30", state: "selected" },
  { time: "12:00", state: "available" },
  { time: "13:30", state: "booked" },
  { time: "14:00", state: "available" },
  { time: "14:30", state: "available" },
  { time: "15:00", state: "available" },
];

/**
 * Захиалгын дэлгэцийг харуулсан чимэглэлийн утас, жинхэнэ design token болон
 * компонентын стилээр бүтээсэн (зураг биш). `inert` нь Tab дарааллаас хасна;
 * figcaption нь screen reader-т тайлбарлана.
 */
export function BookingPhoneMockup({ className }: { className?: string }): JSX.Element {
  return (
    <figure className={cn("w-full max-w-72", className)}>
      <div
        inert
        aria-hidden
        className="rounded-device border border-border bg-surface p-2 shadow-lg select-none"
      >
        {/* Дэлгэцийн радиус = хүрээний радиус − 8px зай: төвлөрсөн булангууд. */}
        <div className="flex flex-col gap-4 overflow-hidden rounded-device-inner bg-background px-4 pt-3 pb-5">
          <div className="flex items-center justify-between text-xs font-medium tabular-nums">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-foreground" />
            <span className="text-muted-foreground">5G</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-surface">
              <ChevronLeft className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg leading-snug font-medium">Өнгө салон</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                Сүхбаатар дүүрэг ·
                <Star className="size-4 fill-sun text-sun" />
                <span className="tabular-nums">4.9</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Алхам <span className="tabular-nums">3/4</span> ·{" "}
              <span className="font-medium text-foreground">Цаг сонгох</span>
            </p>
            <div className="h-1 rounded-full bg-primary-soft">
              <div className="h-1 w-3/4 rounded-full bg-primary" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Эмэгтэй үс засалт</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-4" />
                45 мин
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{formatMNT(35000)}</p>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {DAYS.map(({ weekday, day, selected }) => (
              <div
                key={day}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-md border",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface",
                )}
              >
                <span className={cn("text-xs", !selected && "text-muted-foreground")}>
                  {weekday}
                </span>
                <span className="text-sm font-semibold tabular-nums">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {SLOTS.map(({ time, state }) => (
              <span key={time} className={cn(timeSlotVariants({ state }), "min-h-10 text-xs")}>
                {time}
              </span>
            ))}
          </div>

          <span className={cn(buttonVariants({ size: "md" }), "w-full")}>
            Баталгаажуулах · <span className="tabular-nums">11:30</span>
          </span>
        </div>
      </div>
      <figcaption className="sr-only">
        Жишээ: Өнгө салонд эмэгтэй үс засалтыг 11:30-д захиалж буй утасны дэлгэц.
      </figcaption>
    </figure>
  );
}
