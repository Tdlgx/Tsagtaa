import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { SlotButton } from "@/app/(public)/search/_components/slot-button";
import { getBusinessCategory } from "@/features/business/categories";
import { getDistrictLabel } from "@/features/business/districts";
import {
  DAY_END,
  DAY_START,
  TIMES_OF_DAY,
  toSearchHref,
  type SearchFilters,
  type SearchResult,
} from "@/features/business/search";
import { formatMNT } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** How many times are shown as buttons before "бас N цаг". */
const VISIBLE_SLOTS = 6;
const RULER = ["09:00", "12:00", "15:00", "18:00", "21:00"] as const;

function toPercent(minutes: number): number {
  return ((minutes - DAY_START) / (DAY_END - DAY_START)) * 100;
}

type DayStripProps = {
  result: SearchResult;
  filters: SearchFilters;
  nowMinutes: number | null;
};

/**
 * The whole working day as one thin bar: blue marks are open times, faded ones
 * fall outside the chosen part of the day, grey ones are already gone. A
 * saffron tick marks "now". Purely visual; the buttons below carry the data.
 */
function DayStrip({ result, filters, nowMinutes }: DayStripProps): JSX.Element {
  const range = TIMES_OF_DAY.find((item) => item.value === filters.time);
  const width = (result.shortestService / (DAY_END - DAY_START)) * 100;

  return (
    <div aria-hidden className="pt-1">
      <div className="relative h-3 rounded-full bg-surface-muted">
        {range ? (
          <span
            className="absolute inset-y-0 rounded-full bg-primary-soft"
            style={{
              left: `${toPercent(range.from)}%`,
              width: `${toPercent(range.to) - toPercent(range.from)}%`,
            }}
          />
        ) : null}
        {result.slots.map((slot) => (
          <span
            key={slot.time}
            className={cn(
              "absolute inset-y-0.5 rounded-full",
              slot.state === "open" && "bg-primary",
              slot.state === "outside" && "bg-primary/30",
              slot.state === "past" && "bg-muted-foreground/30",
            )}
            style={{ left: `${toPercent(slot.start)}%`, width: `max(${width}%, 0.375rem)` }}
          />
        ))}
        {nowMinutes !== null && nowMinutes > DAY_START && nowMinutes < DAY_END ? (
          <span
            className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-sun"
            style={{ left: `${toPercent(nowMinutes)}%` }}
          />
        ) : null}
      </div>
      <div className="relative mt-1.5 h-4 text-xs text-muted-foreground tabular-nums">
        {RULER.map((label, index) => (
          <span
            key={label}
            className={cn(
              "absolute top-0",
              index === 0 && "left-0",
              index === RULER.length - 1 && "right-0",
              index > 0 && index < RULER.length - 1 && "-translate-x-1/2",
            )}
            style={index > 0 && index < RULER.length - 1 ? { left: `${index * 25}%` } : undefined}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

type EmptyDayNoteProps = { filters: SearchFilters; hasOutside: boolean };

/** Why a place shows no times, plus the one change that would show some. */
function EmptyDayNote({ filters, hasOutside }: EmptyDayNoteProps): JSX.Element {
  const linkClass =
    "font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring";

  if (hasOutside) {
    return (
      <p className="mt-4 text-sm">
        Сонгосон хугацаанд сул цаг алга.{" "}
        <Link href={toSearchHref({ ...filters, time: "" })} scroll={false} className={linkClass}>
          Бүх цагийг харах
        </Link>
      </p>
    );
  }

  if (filters.day === "today") {
    return (
      <p className="mt-4 text-sm">
        Өнөөдрийн сул цаг дууссан.{" "}
        <Link
          href={toSearchHref({ ...filters, day: "tomorrow" })}
          scroll={false}
          className={linkClass}
        >
          Маргаашийн цагийг харах
        </Link>
      </p>
    );
  }

  return <p className="mt-4 text-sm">Маргаашийн сул цаг дууссан.</p>;
}

type ResultRowProps = { result: SearchResult; filters: SearchFilters; nowMinutes: number | null };

export function ResultRow({ result, filters, nowMinutes }: ResultRowProps): JSX.Element {
  const { business, slots, openCount, priceFrom } = result;
  const { label: categoryLabel, icon: CategoryIcon } = getBusinessCategory(business.category);
  const open = slots.filter((slot) => slot.state === "open");
  const hasOutside = slots.some((slot) => slot.state === "outside");
  const dayWord = filters.day === "today" ? "Өнөөдөр" : "Маргааш";

  return (
    <li
      className={cn(
        "grid gap-x-12 gap-y-5 border-b border-border py-7 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]",
        openCount === 0 && "text-muted-foreground",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
            {business.name}
          </h2>
          <p className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground tabular-nums">
            <span className="sr-only">Үнэлгээ:</span>
            <Star className="size-4 fill-sun text-sun" />
            {business.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({business.reviewCount}
              <span className="sr-only"> сэтгэгдэл</span>)
            </span>
          </p>
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CategoryIcon className="size-4 shrink-0" />
            {categoryLabel}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {getDistrictLabel(business.district)}, {business.area}
            </span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          {business.services.map((service) => service.name).join(", ")}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
          {formatMNT(priceFrom)}-өөс
        </p>
      </div>

      <div className="min-w-0">
        <DayStrip result={result} filters={filters} nowMinutes={nowMinutes} />

        {openCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ul
              aria-label={`${business.name}, ${dayWord.toLowerCase()} сул цагууд`}
              className="contents"
            >
              {open.slice(0, VISIBLE_SLOTS).map((slot) => (
                <li key={slot.time}>
                  <SlotButton time={slot.time} businessName={business.name} />
                </li>
              ))}
            </ul>
            {openCount > VISIBLE_SLOTS ? (
              <span className="px-1 text-sm text-muted-foreground tabular-nums">
                бас {openCount - VISIBLE_SLOTS} цаг
              </span>
            ) : null}
          </div>
        ) : (
          <EmptyDayNote filters={filters} hasOutside={hasOutside} />
        )}
      </div>
    </li>
  );
}
