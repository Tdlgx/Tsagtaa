import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { ResultRow } from "@/app/(public)/search/_components/result-row";
import { SearchShell } from "@/app/(public)/search/_components/search-shell";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  countActiveFilters,
  getSearchClock,
  parseSearchParams,
  searchBusinesses,
} from "@/features/business/search";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Сул цаг хайх",
  description:
    "Улаанбаатарын үсчин, барбершоп, маникюр, массаж, гоо сайхны газруудын өнөөдөр, маргаашийн сул цагийг нэг дороос хайна.",
};

export default async function SearchPage(props: PageProps<"/search">): Promise<JSX.Element> {
  const filters = parseSearchParams(await props.searchParams);
  const clock = getSearchClock(new Date());
  const nowMinutes = filters.day === "today" ? clock.nowMinutes : null;

  const results = searchBusinesses(filters, nowMinutes);
  const withTime = results.filter((result) => result.openCount > 0).length;
  const full = results.length - withTime;
  const activeFilters = countActiveFilters(filters);
  const dayLabel = filters.day === "today" ? clock.todayLabel : clock.tomorrowLabel;
  const dayWord = filters.day === "today" ? "өнөөдөр" : "маргааш";

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="mb-6 flex flex-col gap-1 md:mb-8">
        <p className="text-sm text-muted-foreground">{dayLabel}</p>
        <h1 className="font-heading text-heading font-medium text-foreground">Сул цаг хайх</h1>
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
          <p aria-live="polite" className="text-base text-foreground">
            {results.length === 0 ? (
              "Тохирох газар олдсонгүй"
            ) : withTime === 0 ? (
              <>
                <span className="tabular-nums">{full}</span> газар олдсон ч {dayWord} сул цаг алга
              </>
            ) : (
              <>
                <span className="font-semibold tabular-nums">{withTime}</span> газарт {dayWord} сул
                цаг байна
                {full > 0 ? (
                  <span className="text-muted-foreground">
                    , <span className="tabular-nums">{full}</span> газрын цаг дүүрсэн
                  </span>
                ) : null}
              </>
            )}
          </p>
          {results.length > 0 && activeFilters > 0 ? (
            <Link
              href="/search"
              scroll={false}
              className="text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
            >
              Шүүлтүүр арилгах
            </Link>
          ) : null}
        </div>

        {results.length > 0 ? (
          <ol>
            {results.map((result) => (
              <ResultRow
                key={result.business.slug}
                result={result}
                filters={filters}
                nowMinutes={nowMinutes}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Энэ хайлтад газар олдсонгүй"
            description="Өөр үгээр хайж үзээрэй, эсвэл ангилал, дүүргийн шүүлтүүрээ арилгаарай."
            action={
              <Button asChild variant="outline">
                <Link href="/search" scroll={false}>
                  Шүүлтүүр арилгах
                </Link>
              </Button>
            }
          />
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Жишээ өгөгдөл. Бодит газрууд удахгүй нэмэгдэнэ.
        </p>
      </SearchShell>
    </Container>
  );
}
