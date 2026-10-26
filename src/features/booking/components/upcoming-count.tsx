"use client";

import type { JSX } from "react";

import { getBookingPhase } from "@/features/booking/booking";
import { useBookings } from "@/features/booking/booking-store";
import { useNow } from "@/hooks/use-now";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Өмнө байгаа (эсвэл яг одоо болж буй) захиалгын тоо. */
export function useUpcomingCount(): number {
  const bookings = useBookings();
  const now = useNow(60_000);
  if (!bookings || now === null) return 0;
  return bookings.filter((booking) => {
    const phase = getBookingPhase(booking, now);
    return phase === "upcoming" || phase === "now";
  }).length;
}

/** "Захиалга" цэсний шар-ногоон тоон тэмдэг; тэг үед юу ч харуулахгүй. */
export function UpcomingCount({ className }: { className?: string }): JSX.Element | null {
  const t = useT();
  const count = useUpcomingCount();
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "flex h-4.5 min-w-4.5 animate-in items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] leading-none font-semibold text-primary-foreground tabular-nums duration-250 zoom-in-50",
        className,
      )}
    >
      {count}
      <span className="sr-only"> {t.nav.upcomingSr}</span>
    </span>
  );
}
