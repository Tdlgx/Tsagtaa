import Link from "next/link";
import type { JSX } from "react";

import type { SearchDay } from "@/features/business/search";

type SlotButtonProps = {
  time: string;
  day: SearchDay;
  businessSlug: string;
  /** Цагийн дараах screen reader-ийн текст, жишээ нь "Өнгө салонд захиалах". */
  bookLabel: string;
};

/** Хайлтын үр дүн дэх нэг сул эхлэх цаг: энэ цагийг сонгосон байдлаар захиалгыг нээнэ. */
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
