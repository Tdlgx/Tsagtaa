import { ArrowRight, Hourglass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Empty, PageHeader, PlaceSummary } from "@/app/(admin)/admin/_components/admin-ui";
import { ScoreBadge } from "@/app/(admin)/admin/_components/review-report";
import { Container } from "@/components/layout/container";
import { TiltCard } from "@/components/shared/tilt-card";
import { listBusinesses } from "@/features/admin/admin-db";
import { getReviewReport } from "@/features/admin/review-checks";
import { getManagedBusiness, getMembers } from "@/features/manage/manage-db";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.review, robots: { index: false } };
}

/** Шинэ бүртгэлүүд, хуучин нь эхэндээ (хамгийн удаан хүлээсэн), шалгалтын оноотойгоо. */
export default async function ReviewQueuePage(): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin/review");
  const { t } = await getI18n();
  const pending = [...(await listBusinesses("pending"))].reverse();
  const reports = await Promise.all(
    pending.map(async (place) => {
      const business = await getManagedBusiness(place.slug);
      if (!business) return null;
      return getReviewReport(business, await getMembers(business.id));
    }),
  );
  const now = new Date().getTime();
  const words = t.admin.review;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead} />
      <div className="mt-8">
        {pending.length === 0 ? (
          <Empty>{t.admin.queueEmpty}</Empty>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {pending.map((place, index) => {
              const report = reports[index];
              const hours = Math.floor((now - place.createdAt.getTime()) / 3_600_000);
              return (
                <li key={place.id}>
                  <TiltCard
                    maxDegrees={3}
                    className="flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-5"
                  >
                    <PlaceSummary place={place} t={t} link />
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      {report ? <ScoreBadge report={report} t={t} /> : <span />}
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-xs tabular-nums",
                          hours > 48 ? "font-medium text-sun-strong" : "text-muted-foreground",
                        )}
                      >
                        <Hourglass className="size-3.5" />
                        {words.waitingShort(hours)}
                      </span>
                      <Link
                        href={`/admin/places/${place.slug}`}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:opacity-90"
                      >
                        {t.admin.reviewOpen}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </TiltCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
