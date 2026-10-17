"use client";

import { CalendarPlus, Check, Coins, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type JSX, type RefObject } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhone, formatRelativeDay, type Booking } from "@/features/booking/booking";
import { downloadIcs } from "@/features/booking/calendar-file";
import { BookingTicket } from "@/features/booking/components/booking-ticket";
import { localizeBooking } from "@/features/business/localize";
import { formatPoints } from "@/features/points/points";
import { useLocale, useT } from "@/i18n/client";

const PARTICLES = 18;

/** A one-off burst of lime and saffron dots from the check mark. Skipped for "reduce motion". */
function useBurst(origin: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const host = origin.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dots = Array.from({ length: PARTICLES }, (_, index) => {
      const dot = document.createElement("span");
      const size = 4 + (index % 3) * 2;
      dot.className = `pointer-events-none absolute top-1/2 left-1/2 rounded-full ${
        index % 3 === 0 ? "bg-sun" : "bg-primary"
      }`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      host.append(dot);

      const angle = (index / PARTICLES) * Math.PI * 2 + (index % 2) * 0.2;
      const distance = 56 + (index % 4) * 14;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      dot
        .animate(
          [
            { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`,
              opacity: 0,
            },
          ],
          { duration: 900, delay: 150, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
        )
        .finished.finally(() => dot.remove());
      return dot;
    });

    return () => dots.forEach((dot) => dot.remove());
  }, [origin]);
}

/** Shown in place of the form once a booking is saved. */
export function BookingSuccess({ booking: stored }: { booking: Booking }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const booking = localizeBooking(stored, locale);
  const burstRef = useRef<HTMLDivElement>(null);
  useBurst(burstRef);

  return (
    <section
      aria-labelledby="booking-done-title"
      className="mx-auto mt-10 flex max-w-md flex-col items-center text-center"
    >
      <div ref={burstRef} className="relative">
        <span className="flex size-16 animate-in items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md duration-500 ease-soft zoom-in-50 fade-in">
          <Check className="size-8 [stroke-width:2.5]" />
        </span>
      </div>
      <h2
        id="booking-done-title"
        className="mt-6 font-heading text-heading font-medium text-foreground"
      >
        {t.success.title}
      </h2>
      <p role="status" className="mt-2 text-base text-muted-foreground">
        {t.success.lead(booking.customerName, formatPhone(booking.phone))}
      </p>

      <BookingTicket
        booking={booking}
        dayLabel={formatRelativeDay(booking.startsAt, new Date(), locale)}
        footer={
          <Badge tone="success" dot>
            {t.success.confirmed}
          </Badge>
        }
        className="mt-8 w-full animate-in text-left duration-500 ease-soft fade-in slide-in-from-bottom-6"
      />

      {booking.pointsUsed || booking.pointsToEarn ? (
        <p className="mt-4 flex w-full animate-in items-start gap-2.5 rounded-lg bg-brand-ink px-4 py-3 text-left text-sm text-brand-ink-foreground duration-500 ease-soft fade-in">
          <Coins className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="tabular-nums">
            {[
              booking.pointsUsed ? t.points.book.used(formatPoints(booking.pointsUsed)) : null,
              booking.pointsToEarn
                ? t.points.book.earnAfter(formatPoints(booking.pointsToEarn))
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
          </span>
        </p>
      ) : null}

      <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/bookings">{t.success.myBookings}</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => downloadIcs(stored, locale)}
        >
          <CalendarPlus data-icon="start" />
          {t.common.addToCalendar}
        </Button>
      </div>
      <Button asChild variant="ghost" className="mt-2">
        <Link href="/search">
          <Search data-icon="start" />
          {t.success.findMore}
        </Link>
      </Button>
      <p className="mt-6 text-xs text-muted-foreground">{t.common.demoDevice}</p>
    </section>
  );
}
