import {
  ArrowRight,
  Ban,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Coins,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import {
  AuditList,
  Empty,
  PageHeader,
  PlaceSummary,
  StatCard,
} from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { ImportSamplesButton } from "@/features/admin/components/admin-controls";
import {
  getPlatformStats,
  getRecentBookings,
  listAudit,
  listBusinesses,
} from "@/features/admin/admin-db";
import { getBookableWindow } from "@/features/booking/availability";
import { formatPoints } from "@/features/points/points";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatMNT } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.metaTitle, robots: { index: false } };
}

/** Цагтаагийн багийн нүүр хуудас. Бусдад "олдсонгүй" гэж харагдана. */
export default async function AdminPage(): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin");
  const { t } = await getI18n();
  const dayStart = getBookableWindow(new Date()).from;
  const [stats, pending, recent, activity] = await Promise.all([
    getPlatformStats(dayStart),
    listBusinesses("pending"),
    getRecentBookings(8),
    listAudit({ limit: 6 }),
  ]);
  const words = t.admin;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead} />

      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label={words.stats.pending}
          value={String(stats.pending)}
          hint={stats.overdue > 0 ? words.stats.overdue(stats.overdue) : undefined}
          highlight={stats.pending > 0}
          href="/admin/review"
        />
        <StatCard
          icon={Store}
          label={words.stats.active}
          value={String(stats.active)}
          href="/admin/places?status=active"
        />
        <StatCard
          icon={Ban}
          label={words.stats.suspended}
          value={String(stats.suspended)}
          href="/admin/places?status=suspended"
        />
        <StatCard
          icon={CalendarCheck}
          label={words.stats.bookingsToday}
          value={String(stats.bookingsToday)}
          href="/admin/bookings"
        />
        <StatCard
          icon={CalendarPlus}
          label={words.stats.bookings7}
          value={String(stats.bookings7)}
          href="/admin/bookings"
        />
        <StatCard
          icon={UserRound}
          label={words.stats.customers}
          value={String(stats.customers)}
          href="/admin/accounts?filter=customers"
        />
        <StatCard
          icon={UsersRound}
          label={words.stats.staff}
          value={String(stats.staff)}
          href="/admin/accounts?filter=staff"
        />
        <StatCard
          icon={Coins}
          label={words.stats.points}
          value={formatPoints(stats.pointsOutstanding)}
          href="/admin/points"
        />
      </ul>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="queue-title">
          <SectionTitle id="queue-title" title={words.queueTitle} href="/admin/review" t={t} />
          {pending.length === 0 ? (
            <Empty>{words.queueEmpty}</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.slice(0, 4).map((place) => (
                <li
                  key={place.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <PlaceSummary place={place} t={t} link />
                  <Link
                    href={`/admin/places/${place.slug}`}
                    className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none focus-visible:ring-3 focus-visible:ring-ring sm:self-auto is-hover:opacity-90"
                  >
                    {words.reviewOpen}
                    <ArrowRight className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <SectionTitle
              id="recent-title"
              title={words.recentTitle}
              href="/admin/bookings"
              t={t}
            />
            {recent.length === 0 ? (
              <Empty>{words.noRecent}</Empty>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface text-sm">
                {recent.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">{booking.businessSlug}</span>
                      <span className="text-muted-foreground"> · {booking.serviceName}</span>
                    </span>
                    <span className="flex items-center gap-3 text-muted-foreground tabular-nums">
                      {formatDateTime(booking.startsAt)}
                      <span
                        className={
                          booking.status === "cancelled" ? "line-through" : "text-foreground"
                        }
                      >
                        {formatMNT(booking.price)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="activity-title">
            <SectionTitle
              id="activity-title"
              title={words.activity.title}
              href="/admin/activity"
              t={t}
            />
            <AuditList entries={activity} t={t} />
          </section>
          <section
            aria-labelledby="import-title"
            className="rounded-xl border border-dashed border-border bg-surface p-5"
          >
            <h2 id="import-title" className="font-medium text-foreground">
              {words.importTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{words.importText}</p>
            <div className="mt-4">
              <ImportSamplesButton />
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}

function SectionTitle({
  id,
  title,
  href,
  t,
}: {
  id: string;
  title: string;
  href: string;
  t: Awaited<ReturnType<typeof getI18n>>["t"];
}): JSX.Element {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-heading text-xl font-medium text-foreground">
        {title}
      </h2>
      <Link
        href={href}
        className="rounded-sm text-sm font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
      >
        {t.admin.seeAll}
      </Link>
    </div>
  );
}
