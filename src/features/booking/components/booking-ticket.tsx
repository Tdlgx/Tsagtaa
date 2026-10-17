"use client";

import { MapPin, UserRound } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { getEndsAt, type Booking } from "@/features/booking/booking";
import { getBusinessCategory } from "@/features/business/categories";
import { useTilt } from "@/hooks/use-tilt";
import { useT } from "@/i18n/client";
import { formatMNT } from "@/lib/currency";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";

type TicketData = Pick<
  Booking,
  | "code"
  | "businessName"
  | "category"
  | "district"
  | "area"
  | "serviceName"
  | "duration"
  | "price"
  | "staffName"
  | "staffRole"
  | "startsAt"
>;

type BookingTicketProps = {
  booking: TicketData;
  /** "Өнөөдөр", "Маргааш", … */
  dayLabel: string;
  /** Top-right of the dark stub, e.g. a countdown. */
  stubAside?: ReactNode;
  /** Bottom-right of the paper part, e.g. a status badge. */
  footer?: ReactNode;
  /** Color behind the ticket, so the perforation notches look cut out. */
  notchClassName?: string;
  /** Dims the ticket (cancelled or past). */
  muted?: boolean;
  className?: string;
};

/**
 * A booking drawn as a paper ticket: an ink stub with the time in lime (the
 * logo's colors), a perforated tear line, and the details underneath.
 */
export function BookingTicket({
  booking,
  dayLabel,
  stubAside,
  footer,
  notchClassName = "bg-background",
  muted = false,
  className,
}: BookingTicketProps): JSX.Element {
  const t = useT();
  const { icon: CategoryIcon } = getBusinessCategory(booking.category);
  const categoryLabel = t.categories[booking.category].label;
  const start = formatTime(booking.startsAt);
  const end = formatTime(getEndsAt(booking));
  const tilt = useTilt<HTMLElement>();

  return (
    <article
      {...tilt}
      className={cn(
        "tilt-3d relative overflow-hidden rounded-xl shadow-md data-tilt:shadow-lg",
        muted && "opacity-60 saturate-50",
        className,
      )}
    >
      {/* Stub ---------------------------------------------------------- */}
      <div className="relative bg-brand-ink px-6 pt-5 pb-7 text-brand-ink-foreground">
        <BrandMark
          aria-hidden
          className="pointer-events-none absolute -right-6 -bottom-10 size-40 text-primary opacity-[0.07]"
        />
        <div className="flex items-start justify-between gap-4">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-brand-ink-muted uppercase">
            <BrandMark className="size-3.5 text-primary" />
            <span className="tabular-nums">{booking.code}</span>
          </p>
          {stubAside}
        </div>
        <p className="mt-5 text-sm text-brand-ink-muted">{dayLabel}</p>
        <p className="font-heading text-4xl leading-none font-medium tracking-tight text-primary tabular-nums">
          {start}
          <span className="text-2xl text-brand-ink-muted">–{end}</span>
        </p>
        <p className="mt-3 text-base font-medium">{booking.serviceName}</p>
        <p className="text-sm text-brand-ink-muted tabular-nums">
          {t.common.minutes(booking.duration)}
        </p>
      </div>

      {/* Tear line: two notches + dashes ---------------------------------- */}
      <div aria-hidden className="relative h-0">
        <span className={cn("absolute -top-3 -left-3 size-6 rounded-full", notchClassName)} />
        <span className={cn("absolute -top-3 -right-3 size-6 rounded-full", notchClassName)} />
        <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-border" />
      </div>

      {/* Paper --------------------------------------------------------- */}
      <div className="flex flex-col gap-3 bg-surface px-6 pt-6 pb-5 text-foreground">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
            <CategoryIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-lg leading-snug font-medium tracking-tight">
              {booking.businessName}
            </p>
            <p className="text-sm text-muted-foreground">{categoryLabel}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <UserRound className="size-4 shrink-0" />
            <span>
              <span className="text-foreground">{booking.staffName}</span> · {booking.staffRole}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {t.districts[booking.district]}, {booking.area}
            </span>
          </li>
        </ul>
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-4">
          <p className="text-base font-semibold tabular-nums">{formatMNT(booking.price)}</p>
          {footer}
        </div>
      </div>
    </article>
  );
}
