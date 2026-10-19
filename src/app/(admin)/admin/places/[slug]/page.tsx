import { ArrowLeft, ExternalLink, LayoutDashboard, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX, ReactNode } from "react";

import { AuditList } from "@/app/(admin)/admin/_components/admin-ui";
import { CheckList, ScoreBadge } from "@/app/(admin)/admin/_components/review-report";
import { Container } from "@/components/layout/container";
import { BusinessMap } from "@/components/shared/map/business-map";
import { listImages } from "@/features/business/media-db";
import { listAudit } from "@/features/admin/admin-db";
import { AssignMemberForm, ReviewActions } from "@/features/admin/components/admin-controls";
import { getReviewReport } from "@/features/admin/review-checks";
import { getBookableWindow } from "@/features/booking/availability";
import { formatPhone } from "@/features/booking/booking";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import { StatusBadge } from "@/features/manage/components/status-badge";
import { getBusinessStats, getManagedBusiness, getMembers } from "@/features/manage/manage-db";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatMNT } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/admin/places/[slug]">,
): Promise<Metadata> {
  const { t } = await getI18n();
  const business = await getManagedBusiness((await props.params).slug).catch(() => null);
  return { title: business?.name ?? t.admin.nav.places, robots: { index: false } };
}

/** Everything a registration says, the automatic checks, and the decision. */
export default async function PlaceReviewPage(
  props: PageProps<"/admin/places/[slug]">,
): Promise<JSX.Element> {
  const { slug } = await props.params;
  await requirePlatformAdmin(`/admin/places/${slug}`);
  const business = await getManagedBusiness(slug);
  if (!business) notFound();

  const { t } = await getI18n();
  const members = await getMembers(business.id);
  const [report, stats, history, images] = await Promise.all([
    getReviewReport(business, members),
    getBusinessStats(slug, getBookableWindow(new Date()).from),
    listAudit({ limit: 20, targetId: business.id }),
    listImages(business.id),
  ]);
  const logo = images.find((image) => image.kind === "logo") ?? null;
  const photos = images.filter((image) => image.kind === "photo");
  const words = t.admin.place;
  const Icon = getBusinessCategory(business.category as BusinessCategorySlug)?.icon ?? Store;

  return (
    <Container className="py-8 md:py-12">
      <Link
        href={business.status === "pending" ? "/admin/review" : "/admin/places"}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {business.status === "pending" ? t.admin.nav.review : t.admin.nav.places}
      </Link>

      <header className="mt-6 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-ink text-primary">
            <Icon className="size-7" />
          </span>
          <div className="min-w-0">
            <StatusBadge status={business.status} t={t} />
            <h1 className="mt-1 font-heading text-heading font-medium text-foreground">
              {business.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.categories[business.category as BusinessCategorySlug]?.label ?? business.category}{" "}
              · {t.districts[business.district as DistrictSlug] ?? business.district},{" "}
              {business.address}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ScoreBadge report={report} t={t} size="lg" />
          <ReviewActions businessId={business.id} status={business.status} />
        </div>
      </header>

      {business.reviewNote && business.status !== "active" ? (
        <p className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
          <span className="text-muted-foreground">{words.lastNote}</span> {business.reviewNote}
        </p>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="checks-title">
            <h2 id="checks-title" className="font-heading text-xl font-medium text-foreground">
              {words.checksTitle}
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">{words.checksLead}</p>
            <CheckList report={report} t={t} />
          </section>

          <section aria-labelledby="details-title">
            <h2 id="details-title" className="font-heading text-xl font-medium text-foreground">
              {words.detailsTitle}
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-xl border border-border bg-surface p-5 text-sm sm:grid-cols-2">
              <Detail label={words.phone}>{formatPhone(business.phone)}</Detail>
              <Detail label={words.email}>{business.email ?? "—"}</Detail>
              <Detail label={words.register}>{business.registerNumber ?? "—"}</Detail>
              <Detail label={words.address}>{`/book/${business.slug}`}</Detail>
              <Detail label={words.slot}>{t.common.minutes(business.slotMinutes)}</Detail>
              <Detail label={words.submitted}>{formatDateTime(business.createdAt)}</Detail>
              {business.reviewedAt ? (
                <Detail label={words.reviewed}>{formatDateTime(business.reviewedAt)}</Detail>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">{words.description}</dt>
                <dd className="mt-0.5 whitespace-pre-line text-foreground">
                  {business.description || "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card title={t.dashboard.hours}>
                <ul className="flex flex-col gap-1 text-sm tabular-nums">
                  {t.register.weekdays.map((name, index) => {
                    const hours = business.hours.find((item) => item.weekday === index + 1);
                    return (
                      <li key={name} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className={hours ? "text-foreground" : "text-muted-foreground"}>
                          {hours ? `${hours.opens}–${hours.closes}` : t.dashboard.closed}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
              <div className="flex flex-col gap-4">
                <Card title={`${t.dashboard.services} · ${business.services.length}`}>
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
                </Card>
                <Card title={`${t.dashboard.staff} · ${business.staff.length}`}>
                  <p className="text-sm text-foreground">
                    {business.staff.map((member) => member.name).join(", ") || "—"}
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="look-title">
            <h2 id="look-title" className="font-heading text-xl font-medium text-foreground">
              {t.media.title}
            </h2>
            {logo || photos.length > 0 ? (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {[...(logo ? [logo] : []), ...photos].map((image, index) => (
                  <li
                    key={image.id}
                    className="aspect-square overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <a href={`/api/business-images/${image.id}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- our own small, cached images */}
                      <img
                        src={`/api/business-images/${image.id}`}
                        alt={image.kind === "logo" ? t.media.logoAlt : t.media.photoAlt(index)}
                        className={cn(
                          "size-full",
                          image.kind === "logo" ? "object-contain p-2" : "object-cover",
                        )}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t.admin.review.found.noImages}</p>
            )}
            {business.latitude !== null && business.longitude !== null ? (
              <BusinessMap
                places={[
                  {
                    slug: business.slug,
                    name: business.name,
                    lat: business.latitude,
                    lng: business.longitude,
                    logoUrl: logo ? `/api/business-images/${logo.id}` : null,
                  },
                ]}
                label={t.location.label}
                className="mt-3 h-52"
              />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.admin.review.found.noLocation}
              </p>
            )}
          </section>

          <section aria-labelledby="team-title">
            <h2 id="team-title" className="font-heading text-xl font-medium text-foreground">
              {t.dashboard.teamTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {members.length === 0 ? (
                <li className="rounded-lg border border-dashed border-danger/40 bg-danger-soft px-3 py-2.5 text-sm text-danger-foreground">
                  {t.admin.noOwner}
                </li>
              ) : (
                members.map((member) => (
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
                      </span>
                      <Link
                        href={`/admin/accounts?q=${member.phone}`}
                        className="block text-xs text-muted-foreground tabular-nums underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:underline"
                      >
                        {t.manage.roles[member.role]} · {formatPhone(member.phone)}
                      </Link>
                    </span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-3">
              <AssignMemberForm slug={business.slug} />
            </div>
          </section>

          <section aria-labelledby="numbers-title">
            <h2 id="numbers-title" className="font-heading text-xl font-medium text-foreground">
              {words.numbersTitle}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Figure label={t.dashboard.stats.today} value={String(stats.today)} />
              <Figure label={t.dashboard.stats.next7} value={String(stats.next7)} />
              <Figure label={words.bookings30} value={String(stats.total30)} />
              <Figure label={words.cancelled30} value={String(stats.cancelled30)} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/${business.slug}`}
                className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
              >
                <LayoutDashboard className="size-4" />
                {t.admin.openDashboard}
              </Link>
              {business.status === "active" ? (
                <Link
                  href={`/book/${business.slug}`}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                >
                  <ExternalLink className="size-4" />
                  {t.dashboard.viewPublic}
                </Link>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="history-title">
            <h2 id="history-title" className="font-heading text-xl font-medium text-foreground">
              {words.historyTitle}
            </h2>
            <div className="mt-4">
              <AuditList entries={history} t={t} />
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
