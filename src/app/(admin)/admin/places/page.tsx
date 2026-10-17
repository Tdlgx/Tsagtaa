import { ArrowRight, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import {
  Empty,
  FilterLinks,
  PageHeader,
  PlaceSummary,
  SearchBar,
} from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { listBusinesses } from "@/features/admin/admin-db";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.places, robots: { index: false } };
}

const FILTERS = ["all", "pending", "active", "suspended", "rejected"] as const;
type Filter = (typeof FILTERS)[number];

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function PlacesPage(props: PageProps<"/admin/places">): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin/places");
  const { t } = await getI18n();
  const params = await props.searchParams;
  const filter: Filter = FILTERS.find((item) => item === first(params.status)) ?? "all";
  const query = first(params.q).slice(0, 80);
  const places = await listBusinesses(filter, query);
  const words = t.admin;

  const hrefFor = (value: Filter): string => {
    const search = new URLSearchParams();
    if (value !== "all") search.set("status", value);
    if (query) search.set("q", query);
    const text = search.toString();
    return text ? `/admin/places?${text}` : "/admin/places";
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.allTitle} lead={words.placesLead}>
        <SearchBar
          action="/admin/places"
          value={query}
          placeholder={words.placesSearch}
          keep={filter === "all" ? {} : { status: filter }}
        />
      </PageHeader>

      <div className="mt-6">
        <FilterLinks
          options={FILTERS.map((value) => ({
            value,
            label: value === "all" ? words.filterAll : t.manage.status[value],
          }))}
          current={filter}
          hrefFor={hrefFor}
        />
      </div>

      <div className="mt-4">
        {places.length === 0 ? (
          <Empty>{words.empty}</Empty>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <PlaceSummary place={place} t={t} link />
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/dashboard/${place.slug}`}
                    className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                  >
                    <LayoutDashboard className="size-4" />
                    {words.openDashboard}
                  </Link>
                  <Link
                    href={`/admin/places/${place.slug}`}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                  >
                    {words.details}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
