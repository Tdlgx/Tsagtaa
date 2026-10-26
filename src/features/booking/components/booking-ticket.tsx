"use client";

import { MapPin, Rotate3d, UserRound } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { getEndsAt, type Booking } from "@/features/booking/booking";
import { getBusinessCategory } from "@/features/business/categories";
import { useSpin } from "@/hooks/use-spin";
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
  /** Бараан хэсгийн баруун дээд талд, жишээ нь тоолуур. */
  stubAside?: ReactNode;
  /** Цаасан хэсгийн баруун доод талд, жишээ нь төлөвийн badge. */
  footer?: ReactNode;
  /** Тасалбарын ард байх өнгө, ингэснээр цоолсон ховилууд хайчилсан мэт харагдана. */
  notchClassName?: string;
  /** Тасалбарыг бүдгэрүүлнэ (цуцлагдсан эсвэл өнгөрсөн). */
  muted?: boolean;
  className?: string;
};

/**
 * Цаасан тасалбар хэлбэрээр зурсан захиалга: цагийг шар-ногоноор бичсэн бэхэн
 * хэсэг (логоны өнгө), цоолсон таслах шугам, доор нь дэлгэрэнгүй. Хуруу эсвэл
 * хулганаар 3D-ээр эргүүлж болно (`useSpin`-ийг үз); ар талд нь ресепшний кодыг
 * томоор, barcode туузтайгаар харуулна.
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
  const { flip, ...spin } = useSpin<HTMLElement>();

  return (
    <div className={cn("spin-3d-scene", muted && "opacity-60 saturate-50", className)}>
      <article
        {...spin}
        tabIndex={0}
        aria-roledescription={t.ticket.role}
        aria-label={t.ticket.label(booking.code)}
        aria-describedby={`ticket-howto-${booking.code}`}
        className="group/spin spin-3d rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <span id={`ticket-howto-${booking.code}`} className="sr-only">
          {t.ticket.howTo}
        </span>

        {/* Урд тал ------------------------------------------------------- */}
        <div data-face="front" className="relative overflow-hidden rounded-xl shadow-md spin-face">
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
            <FlipButton label={t.ticket.flip} onFlip={() => flip(1)} />
          </div>

          {/* Таслах шугам: хоёр ховил + зураас ------------------------------ */}
          <div aria-hidden className="relative h-0">
            <span className={cn("absolute -top-3 -left-3 size-6 rounded-full", notchClassName)} />
            <span className={cn("absolute -top-3 -right-3 size-6 rounded-full", notchClassName)} />
            <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-border" />
          </div>

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
          <Glare />
        </div>

        {/* Ар тал: ресепшинд юу асуудаг вэ --------------------------- */}
        <div
          data-face="back"
          inert
          className="spin-face-back flex flex-col justify-between overflow-hidden rounded-xl bg-brand-ink p-6 text-brand-ink-foreground shadow-md spin-face"
        >
          <BrandMark
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-10 size-56 text-primary opacity-[0.06]"
          />
          <p className="relative flex items-center gap-2 text-xs font-medium tracking-wide text-brand-ink-muted uppercase">
            <BrandMark className="size-3.5 text-primary" />
            {t.brand}
          </p>

          <div className="relative">
            <p className="text-xs tracking-wide text-brand-ink-muted uppercase">
              {t.ticket.codeLabel}
            </p>
            <p className="tracking-wider mt-1 font-heading text-4xl leading-none font-medium text-primary tabular-nums">
              {booking.code}
            </p>
            <Barcode value={booking.code} className="mt-5 h-16 w-full" />
          </div>

          <div className="relative">
            <p className="font-medium">{booking.businessName}</p>
            <p className="text-sm text-brand-ink-muted tabular-nums">
              {dayLabel}, {start}–{end}
            </p>
            <p className="mt-3 max-w-[16rem] text-xs text-brand-ink-muted">{t.ticket.backHint}</p>
          </div>
          <FlipButton label={t.ticket.flipBack} onFlip={() => flip(-1)} />
          <Glare />
        </div>
      </article>
    </div>
  );
}

/** Чирэхгүйгээр тасалбарыг эргүүлнэ (гар, эсвэл товшихыг илүүд үздэг хүнд). */
function FlipButton({ label, onFlip }: { label: string; onFlip: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={label}
      title={label}
      className="absolute right-4 bottom-4 z-20 flex size-9 items-center justify-center rounded-full bg-brand-ink-foreground/10 text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-brand-ink-foreground/20"
    >
      <Rotate3d className="size-4" />
    </button>
  );
}

/** Эргэх үед картын дээгүүр гүйх эсвэл хулганыг дагах гэрэл. */
function Glare(): JSX.Element {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-data-[hover]/spin:opacity-100 group-data-[spinning]/spin:opacity-100"
      style={{
        background:
          "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgb(255 255 255 / 0.26), transparent 45%), linear-gradient(115deg, transparent calc(var(--glare-x, 50%) - 25%), color-mix(in oklab, var(--primary) 16%, transparent) var(--glare-x, 50%), transparent calc(var(--glare-x, 50%) + 25%))",
      }}
    />
  );
}

/**
 * Кодоос зурсан barcode маягийн тууз, үргэлж ижил зураасууд. Энэ бол чимэглэл:
 * ресепшин дээр нь хэвлэсэн кодыг уншина.
 */
function Barcode({ value, className }: { value: string; className?: string }): JSX.Element {
  const widths: number[] = [];
  for (const char of value) {
    let bits = Math.imul(char.charCodeAt(0), 2654435761) >>> 0;
    for (let i = 0; i < 6; i += 1) {
      widths.push(1 + (bits & 3));
      bits >>>= 2;
    }
  }
  let x = 4;
  const bars = widths.map((width, index) => {
    const bar = { x, width, ink: index % 2 === 0 };
    x += width;
    return bar;
  });

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${x + 4} 40`}
      preserveAspectRatio="none"
      className={cn("rounded-md bg-brand-ink-foreground", className)}
    >
      {bars
        .filter((bar) => bar.ink)
        .map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={4}
            width={bar.width}
            height={32}
            className="fill-brand-ink"
          />
        ))}
    </svg>
  );
}
