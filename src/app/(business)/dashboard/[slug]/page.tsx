import {
  CalendarCheck,
  CalendarRange,
  ExternalLink,
  Coins,
  Phone,
  Store,
  Undo2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX, ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { TiltCard } from "@/components/shared/tilt-card";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/features/booking/booking";
import { getBookableWindow } from "@/features/booking/availability";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import {
  AddManagerForm,
  AttendanceButtons,
  CancelBookingButton,
  RemoveManagerButton,
} from "@/features/manage/components/manage-controls";
import { listImages, MAX_PHOTOS } from "@/features/business/media-db";
import { LocationEditor, MediaManager } from "@/features/manage/components/media-controls";
import { StatusBadge } from "@/features/manage/components/status-badge";
import {
  ATTENDANCE_WINDOW_HOURS,
  getBusinessBookings,
  getBusinessStats,
  getManagedBusiness,
  getMembers,
  staffNameFor,
  type ManagedBooking,
} from "@/features/manage/manage-db";
import type { DistrictSlug } from "@/features/business/districts";
import { getI18n } from "@/i18n/server";
import { requireBusinessAccess } from "@/lib/auth/session";
import { formatMNT } from "@/lib/currency";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

export async function generateMetadata(props: PageProps<"/dashboard/[slug]">): Promise<Metadata> {
  const { t } = await getI18n();
  const business = await getManagedBusiness((await props.params).slug).catch(() => null);
  return {
    title: business ? `${business.name} · ${t.dashboard.metaTitle}` : t.dashboard.metaTitle,
    robots: { index: false },
  };
}

type Phase = "confirmed" | "cancelled" | "done" | "now";

function phaseOf(booking: ManagedBooking, now: number): Phase {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.endsAt.getTime() <= now) return "done";
  if (booking.startsAt.getTime() <= now) return "now";
  return "confirmed";
}

const PHASE_TONE = {
  confirmed: "primary",
  now: "sun",
  done: "neutral",
  cancelled: "danger",
} as const;

/** One place's dashboard, for its owner and managers (and the Цагтаа team). */
export default async function BusinessDashboard(
  props: PageProps<"/dashboard/[slug]">,
): Promise<JSX.Element> {
  const { slug } = await props.params;
  const { account, membership } = await requireBusinessAccess(slug, `/dashboard/${slug}`);
  const business = await getManagedBusiness(slug);
  if (!business) notFound();

  const { t } = await getI18n();
  const params = await props.searchParams;
  const day = params.day === "tomorrow" ? "tomorrow" : "today";
  const now = new Date();
  const todayStart = getBookableWindow(now).from;
  const dayStart = day === "today" ? todayStart : new Date(todayStart.getTime() + DAY);

  const [bookings, stats, members, images] = await Promise.all([
    getBusinessBookings(slug, dayStart, new Date(dayStart.getTime() + DAY)),
    getBusinessStats(slug, todayStart),
    getMembers(business.id),
    listImages(business.id),
  ]);
  const logo = images.find((image) => image.kind === "logo") ?? null;
  const photos = images.filter((image) => image.kind === "photo");
  const isOwner = membership?.role === "owner";
  const Icon = getBusinessCategory(business.category as BusinessCategorySlug)?.icon ?? Store;
  const cancelRate = stats.total30 ? Math.round((stats.cancelled30 / stats.total30) * 100) : 0;
  const words = t.dashboard;

  return (
    <Container className="py-8 md:py-12">
      {/* Who and what --------------------------------------------------------- */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-ink text-primary">
            <Icon className="size-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={business.status} t={t} />
              {membership ? <Badge tone="outline">{t.manage.roles[membership.role]}</Badge> : null}
            </div>
            <h1 className="mt-1 font-heading text-heading font-medium text-foreground">
              {business.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.districts[business.district as DistrictSlug] ?? business.district},{" "}
              {business.address}
            </p>
          </div>
        </div>
        {business.status === "active" ? (
          <Link
            href={`/book/${business.slug}`}
            className="flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring md:self-auto is-hover:text-foreground"
          >
            {words.viewPublic}
            <ExternalLink className="size-4" />
          </Link>
        ) : null}
      </header>

      {!membership ? (
        <p className="mt-4 rounded-md bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
          {words.viewAs}
        </p>
      ) : null}
      {business.status === "pending" ? (
        <p className="mt-4 rounded-md bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
          {words.pendingNote}
        </p>
      ) : business.status === "rejected" ? (
        <p className="mt-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
          {words.rejectedNote(business.reviewNote ?? "—")}
        </p>
      ) : business.status === "suspended" ? (
        <p className="mt-4 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
          {words.suspendedNote(business.reviewNote ?? "—")}
        </p>
      ) : null}

      {/* Numbers --------------------------------------------------------------- */}
      <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CalendarCheck} label={words.stats.today} value={String(stats.today)} />
        <Stat icon={Wallet} label={words.stats.revenue} value={formatMNT(stats.todayRevenue)} />
        <Stat icon={CalendarRange} label={words.stats.next7} value={String(stats.next7)} />
        <Stat icon={Undo2} label={words.stats.cancelRate} value={`${cancelRate}%`} />
      </ul>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Schedule ------------------------------------------------------------ */}
        <section aria-labelledby="schedule-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="schedule-title" className="font-heading text-xl font-medium text-foreground">
              {words.scheduleTitle}
            </h2>
            <nav className="flex rounded-full border border-border bg-surface p-0.5">
              {(["today", "tomorrow"] as const).map((option) => (
                <Link
                  key={option}
                  href={
                    option === "today" ? `/dashboard/${slug}` : `/dashboard/${slug}?day=tomorrow`
                  }
                  aria-current={day === option ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-full px-3.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring",
                    day === option
                      ? "bg-foreground text-background"
                      : "text-muted-foreground is-hover:text-foreground",
                  )}
                >
                  {option === "today" ? t.common.today : t.common.tomorrow}
                </Link>
              ))}
            </nav>
          </div>

          {bookings.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted-foreground">
              {words.noBookings}
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {bookings.map((booking) => {
                const phase = phaseOf(booking, now.getTime());
                return (
                  <li
                    key={booking.id}
                    className={cn(
                      "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center",
                      (phase === "done" || phase === "cancelled") && "opacity-60",
                    )}
                  >
                    <div className="w-24 shrink-0">
                      <p className="font-heading text-lg leading-none font-medium text-foreground tabular-nums">
                        {formatTime(booking.startsAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        –{formatTime(booking.endsAt)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{booking.customerName}</span>
                        <Badge tone={PHASE_TONE[phase]}>{words.bookingStatus[phase]}</Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.serviceName} ·{" "}
                        {staffNameFor(booking.staffId, slug, business.staff)} ·{" "}
                        <span className="tabular-nums">{formatMNT(booking.price)}</span>
                      </p>
                      {booking.pointsUsed > 0 ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                          <Coins className="size-3.5 text-primary-strong" />
                          {words.paidInPoints(
                            formatMNT(booking.pointsUsed),
                            formatMNT(booking.price - booking.pointsUsed),
                          )}
                        </p>
                      ) : null}
                      {booking.note ? (
                        <p className="mt-1 text-sm text-foreground italic">“{booking.note}”</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={`tel:${booking.phone}`}
                        title={words.call(formatPhone(booking.phone))}
                        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                      >
                        <Phone className="size-4" />
                        {formatPhone(booking.phone)}
                      </a>
                      {phase === "confirmed" ? (
                        <CancelBookingButton slug={slug} bookingId={booking.id} />
                      ) : booking.attendance ? (
                        <Badge tone={booking.attendance === "attended" ? "success" : "warning"}>
                          {words.attendance[booking.attendance]}
                        </Badge>
                      ) : phase !== "cancelled" &&
                        booking.endsAt.getTime() >
                          now.getTime() - ATTENDANCE_WINDOW_HOURS * 3_600_000 ? (
                        <AttendanceButtons slug={slug} bookingId={booking.id} />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-8">
          {/* Team -------------------------------------------------------------- */}
          <section aria-labelledby="team-title">
            <h2 id="team-title" className="font-heading text-xl font-medium text-foreground">
              {words.teamTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{words.teamLead}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {members.map((member) => (
                <li
                  key={member.accountId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {member.name}
                      {member.accountId === account.id ? (
                        <span className="text-muted-foreground"> · {words.you}</span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {t.manage.roles[member.role]} · {formatPhone(member.phone)}
                    </span>
                  </span>
                  {isOwner && member.role === "manager" ? (
                    <RemoveManagerButton slug={slug} accountId={member.accountId} />
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              {isOwner ? (
                <AddManagerForm slug={slug} />
              ) : (
                <p className="text-xs text-muted-foreground">{words.onlyOwner}</p>
              )}
            </div>
          </section>

          {/* How the place looks, and where it is -------------------------- */}
          <section aria-labelledby="media-title">
            <h2 id="media-title" className="font-heading text-xl font-medium text-foreground">
              {t.media.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.media.lead}</p>
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <MediaManager slug={slug} logo={logo} photos={photos} maxPhotos={MAX_PHOTOS} />
            </div>
          </section>

          <section aria-labelledby="location-title">
            <h2 id="location-title" className="font-heading text-xl font-medium text-foreground">
              {t.location.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.location.lead}</p>
            <div className="mt-4">
              <LocationEditor
                slug={slug}
                initial={
                  business.latitude !== null && business.longitude !== null
                    ? { lat: business.latitude, lng: business.longitude }
                    : null
                }
              />
            </div>
          </section>

          {/* About -------------------------------------------------------------- */}
          <section aria-labelledby="info-title">
            <h2 id="info-title" className="font-heading text-xl font-medium text-foreground">
              {words.infoTitle}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <InfoCard title={words.hours}>
                <ul className="flex flex-col gap-1 text-sm tabular-nums">
                  {t.register.weekdays.map((name, index) => {
                    const hours = business.hours.find((item) => item.weekday === index + 1);
                    return (
                      <li key={name} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className={hours ? "text-foreground" : "text-muted-foreground"}>
                          {hours ? `${hours.opens}–${hours.closes}` : words.closed}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </InfoCard>
              <InfoCard title={`${words.services} · ${business.services.length}`}>
                <ul className="flex flex-col gap-1 text-sm">
                  {business.services.map((service) => (
                    <li key={service.name} className="flex justify-between gap-4">
                      <span className="text-foreground">{service.name}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {service.duration} {t.register.minutesShort} · {formatMNT(service.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard title={`${words.staff} · ${business.staff.length}`}>
                <p className="text-sm text-foreground">
                  {business.staff.map((member) => member.name).join(", ")}
                </p>
              </InfoCard>
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}): JSX.Element {
  return (
    <li>
      <TiltCard className="h-full rounded-xl border border-border bg-surface p-4 sm:p-5">
        <Icon className="size-5 text-primary-strong" />
        <p className="mt-3 font-heading text-2xl font-medium text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </TiltCard>
    </li>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
