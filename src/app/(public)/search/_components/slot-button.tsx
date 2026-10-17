import Link from "next/link";
import type { JSX } from "react";

import type { SearchDay } from "@/features/business/search";

type SlotButtonProps = {
  time: string;
  day: SearchDay;
  businessSlug: string;
  /** Screen-reader text after the time, e.g. "book at Ongo Salon". */
  bookLabel: string;
};

/** One open start time in a search result: opens the booking with this time already chosen. */
export function SlotButton({ time, day, businessSlug, bookLabel }: SlotButtonProps): JSX.Element {
  const params = new URLSearchParams({ day, time });

  return (
    <Link
      href={`/book/${businessSlug}?${params.toString()}`}
      className="flex h-10 min-w-16 items-center justify-center rounded-full border border-primary-strong/35 bg-primary-soft px-3 text-sm font-medium text-primary-strong tabular-nums transition-colors duration-150 ease-soft outline-none select-none is-hover:border-primary-strong is-hover:bg-primary is-hover:text-primary-foreground is-focus:ring-3 is-focus:ring-ring"
    >
      {time}
      <span className="sr-only">, {bookLabel}</span>
    </Link>
  );
}
