import type { Metadata } from "next";
import type { JSX } from "react";

import { AuditList, FilterLinks, PageHeader } from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { listAudit } from "@/features/admin/admin-db";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.activity, robots: { index: false } };
}

const AREAS = ["all", "business", "member", "account", "points", "booking"] as const;
type Area = (typeof AREAS)[number];

/** Who on the team did what, newest first. Written with each change, never edited. */
export default async function ActivityPage(
  props: PageProps<"/admin/activity">,
): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin/activity");
  const { t } = await getI18n();
  const value = (await props.searchParams).area;
  const area: Area = AREAS.find((item) => item === value) ?? "all";
  const entries = await listAudit({ limit: 200, area: area === "all" ? undefined : area });
  const words = t.admin.activity;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead} />
      <div className="mt-6">
        <FilterLinks
          options={AREAS.map((item) => ({ value: item, label: words.areas[item] }))}
          current={area}
          hrefFor={(item) => (item === "all" ? "/admin/activity" : `/admin/activity?area=${item}`)}
        />
      </div>
      <div className="mt-4">
        <AuditList entries={entries} t={t} />
      </div>
    </Container>
  );
}
