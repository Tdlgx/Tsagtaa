import { Map as MapIcon, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type JSX } from "react";

import { ResultRow } from "@/app/(public)/search/_components/result-row";
import { SearchShell } from "@/app/(public)/search/_components/search-shell";
import { getSearchTour } from "@/app/(public)/search/_components/search-tour";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  countActiveFilters,
  getSearchClock,
  parseSearchParams,
  searchBusinesses,
} from "@/features/business/search";
import { getListings } from "@/features/business/listings";
import { GuidedTour } from "@/features/onboarding/components/guided-tour";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.metaTitle, description: t.search.metaDescription };
}

export default async function SearchPage(props: PageProps<"/search">): Promise<JSX.Element> {
  const { locale, t } = await getI18n();
  const filters = parseSearchParams(await props.searchParams);
  const clock = getSearchClock(new Date(), locale);
  const nowMinutes = filters.day === "today" ? clock.nowMinutes : null;

  // The samples and every approved registered place.
  const results = searchBusinesses(filters, nowMinutes, await getListings());
  const withTime = results.filter((result) => result.openCount > 0).length;
  const full = results.length - withTime;
  const activeFilters = countActiveFilters(filters);
  const dayLabel = filters.day === "today" ? clock.todayLabel : clock.tomorrowLabel;
  const dayWord = filters.day === "today" ? t.common.todayWord : t.common.tomorrowWord;

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{dayLabel}</p>
          <h1 className="font-heading text-heading font-medium text-foreground">
            {t.search.title}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/map">
            <MapIcon data-icon="start" />
            {t.search.mapLink}
          </Link>
        </Button>
      </div>

      <SearchShell filters={filters}>
        {/* Kept in the DOM (only hidden when empty) so screen readers hear every new count. */}
        <div
          className={cn(
            results.length > 0
              ? "mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-4"
              : "sr-only",
          )}
        >
          <p aria-live="polite" className="text-base text-foreground tabular-nums">
            {results.length === 0 ? (
              t.search.noneFound
            ) : withTime === 0 ? (
              t.search.allFull(full, dayWord)
            ) : (
              <>
                {t.search.withTime(withTime, dayWord)}
                {full > 0 ? (
                  <span className="text-muted-foreground">{t.search.fullSuffix(full)}</span>
                ) : null}
              </>
            )}
          </p>
          {results.length > 0 && activeFilters > 0 ? (
            <Link
              href="/search"
              scroll={false}
              className="text-sm font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
            >
              {t.search.clearFilters}
            </Link>
          ) : null}
        </div>

        {results.length > 0 ? (
          <ol>
            {results.map((result, index) => (
              <ResultRow
                key={result.business.slug}
                tourAnchor={index === 0}
                result={result}
                filters={filters}
                nowMinutes={nowMinutes}
                locale={locale}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={SearchX}
            title={t.search.emptyTitle}
            description={t.search.emptyText}
            action={
              <Button asChild variant="outline">
                <Link href="/search" scroll={false}>
                  {t.search.clearFilters}
                </Link>
              </Button>
            }
          />
        )}

        <p className="mt-6 text-sm text-muted-foreground">{t.common.demoData}</p>
      </SearchShell>

      <Suspense fallback={null}>
        <GuidedTour steps={getSearchTour(t)} />
      </Suspense>
    </Container>
  );
}
