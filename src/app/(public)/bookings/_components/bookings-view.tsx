"use client";

import {
  CalendarPlus,
  CalendarX2,
  History,
  Lightbulb,
  Navigation,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Tabs } from "radix-ui";
import type { JSX } from "react";

import { BookingsGuide } from "@/app/(public)/bookings/_components/bookings-guide";
import { CancelDialog } from "@/app/(public)/bookings/_components/cancel-dialog";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCountdown,
  formatRelativeDay,
  getBookingPhase,
  getEndsAt,
  type Booking,
  type BookingPhase,
} from "@/features/booking/booking";
import { removeBooking, useBookings } from "@/features/booking/booking-store";
import { downloadIcs } from "@/features/booking/calendar-file";
import { BookingTicket } from "@/features/booking/components/booking-ticket";
import { getBusinessCategory } from "@/features/business/categories";
import { localizeBooking } from "@/features/business/localize";
import { useNow } from "@/hooks/use-now";
import { useLocale, useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { formatTime, toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

type Entry = { booking: Booking; phase: BookingPhase };

const PHASE_TONE: Record<BookingPhase, { tone: BadgeTone; dot: boolean }> = {
  upcoming: { tone: "success", dot: true },
  now: { tone: "sun", dot: true },
  completed: { tone: "neutral", dot: false },
  cancelled: { tone: "danger", dot: true },
};

function PhaseBadge({ phase, t }: { phase: BookingPhase; t: Dictionary }): JSX.Element {
  const { tone, dot } = PHASE_TONE[phase];
  return (
    <Badge tone={tone} dot={dot}>
      {t.bookings.status[phase]}
    </Badge>
  );
}

function mapsUrl(booking: Booking): string {
  const query = encodeURIComponent(`${booking.businessName} ${booking.area} Ulaanbaatar`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** "Миний захиалгууд": ирэх захиалгыг тасалбараар, бусдыг өдрөөр бүлэглэн харуулна. */
export function BookingsView(): JSX.Element {
  const bookings = useBookings();
  const now = useNow(30_000);
  const locale = useLocale();
  const t = useT();

  if (bookings === null || now === null) return <BookingsSkeleton />;

  const entries: Entry[] = bookings.map((stored) => ({
    booking: localizeBooking(stored, locale),
    phase: getBookingPhase(stored, now),
  }));
  const byStart = (a: Entry, b: Entry): number =>
    new Date(a.booking.startsAt).getTime() - new Date(b.booking.startsAt).getTime();

  const upcoming = entries
    .filter((entry) => entry.phase === "upcoming" || entry.phase === "now")
    .sort(byStart);
  const past = entries.filter((entry) => entry.phase === "completed").sort((a, b) => byStart(b, a));
  const cancelled = entries
    .filter((entry) => entry.phase === "cancelled")
    .sort((a, b) => byStart(b, a));
  const [next, ...later] = upcoming;
  const nowDate = new Date(now);

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-strong">{t.bookings.eyebrow}</p>
          <h1 className="mt-1 font-heading text-heading font-medium text-foreground">
            {t.bookings.title}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {next
              ? next.phase === "now"
                ? t.bookings.happeningNow
                : t.bookings.untilNext(
                    formatCountdown(new Date(next.booking.startsAt), now, locale),
                  )
              : bookings.length > 0
                ? t.bookings.nothingScheduled
                : t.bookings.intro}
          </p>
        </div>
        {bookings.length > 0 ? (
          <Button asChild>
            <Link href="/search">
              <Plus data-icon="start" />
              {t.bookings.newBooking}
            </Link>
          </Button>
        ) : null}
      </header>

      {bookings.length === 0 ? <BookingsGuide /> : null}

      {next ? <NextUp entry={next} now={now} /> : null}

      {bookings.length > 0 ? (
        <Tabs.Root defaultValue={later.length > 0 || !next ? "upcoming" : "past"} className="mt-12">
          <Tabs.List
            aria-label={t.bookings.tabsLabel}
            className="inline-flex gap-0.5 rounded-full border border-border bg-surface p-1"
          >
            {(
              [
                ["upcoming", t.bookings.tabs.upcoming, later.length],
                ["past", t.bookings.tabs.past, past.length],
                ["cancelled", t.bookings.tabs.cancelled, cancelled.length],
              ] as const
            ).map(([value, label, count]) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring data-[state=active]:bg-foreground data-[state=active]:text-background is-hover:text-foreground data-[state=active]:is-hover:text-background"
              >
                {label}
                <span className="text-xs tabular-nums opacity-70">{count}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="upcoming" className="mt-6 outline-none">
            <Timeline
              entries={later}
              now={nowDate}
              empty={next ? t.bookings.empty.upcomingWithNext : t.bookings.empty.upcoming}
            />
          </Tabs.Content>
          <Tabs.Content value="past" className="mt-6 outline-none">
            <Timeline entries={past} now={nowDate} empty={t.bookings.empty.past} />
          </Tabs.Content>
          <Tabs.Content value="cancelled" className="mt-6 outline-none">
            <Timeline entries={cancelled} now={nowDate} empty={t.bookings.empty.cancelled} />
          </Tabs.Content>
        </Tabs.Root>
      ) : null}

      <p className="mt-10 text-xs text-muted-foreground">{t.common.demoDevice}</p>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** Дараагийн захиалгыг тасалбар хэлбэрээр, амьд тоолуур, бэлтгэлийн зөвлөгөө, үйлдлүүдтэй харуулна. */
function NextUp({ entry, now }: { entry: Entry; now: number }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const { booking, phase } = entry;
  const start = new Date(booking.startsAt).getTime();
  const created = new Date(booking.createdAt).getTime();
  // Хүлээлтийн (захиалснаас эхлэх хүртэл) хэр хэсэг өнгөрсөн бэ: зурвасыг дүүргэнэ.
  const progress =
    phase === "now" ? 1 : Math.min(1, Math.max(0.03, (now - created) / (start - created || 1)));
  const dayLabel = formatRelativeDay(booking.startsAt, new Date(now), locale);
  const { group } = getBusinessCategory(booking.category);

  return (
    <section aria-labelledby="next-up-title" className="mt-10">
      <h2
        id="next-up-title"
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {t.bookings.nextTitle}
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-start">
        <BookingTicket
          booking={booking}
          dayLabel={dayLabel}
          stubAside={
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground tabular-nums">
              {phase === "now" ? t.bookings.now : formatCountdown(new Date(start), now, locale)}
            </span>
          }
          footer={<PhaseBadge phase={phase} t={t} />}
        />

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm text-muted-foreground">{t.bookings.timeLeft}</p>
              <p className="font-heading text-xl font-medium text-foreground tabular-nums">
                {phase === "now"
                  ? t.bookings.until(formatTime(getEndsAt(booking)))
                  : formatCountdown(new Date(start), now, locale)}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label={t.bookings.waitProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
            >
              <div
                className="h-full origin-left rounded-full bg-primary transition-transform duration-400 ease-soft"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <p className="mt-4 flex items-start gap-2.5 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-sun-strong" />
              {t.bookings.tips[group]}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            <Button variant="outline" onClick={() => downloadIcs(booking, locale)}>
              <CalendarPlus data-icon="start" />
              {t.common.addToCalendar}
            </Button>
            <Button asChild variant="outline">
              <a href={mapsUrl(booking)} target="_blank" rel="noreferrer">
                <Navigation data-icon="start" />
                {t.bookings.directions}
              </a>
            </Button>
            {phase === "upcoming" ? (
              <CancelDialog booking={booking} dayLabel={dayLabel}>
                <Button variant="ghost" className="text-danger-foreground">
                  <CalendarX2 data-icon="start" />
                  {t.bookings.cancel}
                </Button>
              </CancelDialog>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type TimelineProps = { entries: readonly Entry[]; now: Date; empty: string };

/** Өдрөөр бүлэглэсэн захиалгууд, тус бүр босоо цагийн шугам дээр. */
function Timeline({ entries, now, empty }: TimelineProps): JSX.Element {
  const locale = useLocale();
  if (entries.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
        <History className="size-5 shrink-0" />
        {empty}
      </p>
    );
  }

  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = toDateKey(entry.booking.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...groups.values()].map((group) => {
        const first = group[0];
        if (!first) return null;
        return (
          <section key={first.booking.startsAt}>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {formatRelativeDay(first.booking.startsAt, now, locale)}
            </h3>
            <ol className="flex flex-col">
              {group.map((entry) => (
                <TimelineItem key={entry.booking.id} entry={entry} now={now} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function TimelineItem({ entry, now }: { entry: Entry; now: Date }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const { booking, phase } = entry;
  const { icon: CategoryIcon } = getBusinessCategory(booking.category);
  const inactive = phase === "completed" || phase === "cancelled";

  return (
    <li className="group/item grid grid-cols-[3.5rem_1.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[4rem_2rem_minmax(0,1fr)]">
      <div className="pt-4 text-right tabular-nums">
        <p
          className={cn(
            "text-sm font-semibold text-foreground",
            phase === "cancelled" && "text-muted-foreground line-through",
          )}
        >
          {formatTime(booking.startsAt)}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(getEndsAt(booking))}</p>
      </div>

      {/* Төмөр зам: бүх зүйлийг дайрсан шугам, захиалга бүр дээр цэгтэй. */}
      <div aria-hidden className="relative flex justify-center">
        <span className="absolute inset-y-0 w-px bg-border group-first/item:top-5 group-last/item:bottom-auto group-last/item:h-5" />
        <span
          className={cn(
            "relative mt-5 size-3 rounded-full ring-4 ring-background",
            phase === "cancelled" ? "bg-danger" : inactive ? "bg-muted-foreground" : "bg-primary",
          )}
        />
      </div>

      <div className="pb-3">
        <div
          className={cn(
            "rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors duration-150 ease-soft is-hover:border-muted-foreground",
            inactive && "bg-transparent shadow-none",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground">
                <CategoryIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{booking.businessName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {booking.serviceName} · {booking.staffName}
                </p>
              </div>
            </div>
            <PhaseBadge phase={phase} t={t} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{formatMNT(booking.price)}</span> ·{" "}
              {booking.code}
            </p>
            <div className="flex items-center gap-1">
              {phase === "upcoming" ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadIcs(booking, locale)}
                    aria-label={t.common.addToCalendar}
                  >
                    <CalendarPlus />
                  </Button>
                  <CancelDialog
                    booking={booking}
                    dayLabel={formatRelativeDay(booking.startsAt, now, locale)}
                  >
                    <Button variant="ghost" size="sm" className="text-danger-foreground">
                      <X data-icon="start" />
                      {t.bookings.cancel}
                    </Button>
                  </CancelDialog>
                </>
              ) : null}
              {inactive ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/book/${booking.businessSlug}`}>
                    <RotateCcw data-icon="start" />
                    {t.bookings.rebook}
                  </Link>
                </Button>
              ) : null}
              {phase === "cancelled" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBooking(booking.id)}
                  aria-label={t.bookings.remove}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function BookingsSkeleton(): JSX.Element {
  const t = useT();
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {t.bookings.loading}
      </span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-12 grid gap-6 md:grid-cols-[24rem_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
