import { ArrowDown } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { BenefitsSection } from "@/app/(public)/_components/benefits-section";
import { TodayBoard } from "@/app/(public)/_components/today-board";
import { Container } from "@/components/layout/container";
import { LiquidMetal } from "@/components/shared/liquid-metal";
import { getBoardRows } from "@/features/business/board-data";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { CATEGORY_GROUPS } from "@/features/business/categories";
import { DEFAULT_FILTERS, toSearchHref } from "@/features/business/search";
import { getI18n } from "@/i18n/server";

export default async function HomePage(): Promise<JSX.Element> {
  const { locale, t } = await getI18n();
  const boardRows = await getBoardRows(locale, new Date());

  return (
    <>
      {/* Hero: the promise, then the day itself ------------------------- */}
      <section className="border-b border-border">
        <Container className="pt-6 pb-12 md:pt-8 md:pb-20">
          {/* Molten lime chrome in the logo's colors; a scrim keeps the words readable. */}
          <div className="relative isolate overflow-hidden rounded-xl bg-brand-ink text-brand-ink-foreground shadow-lg">
            {/* Ambient only: it flows on its own and ignores the pointer. */}
            <LiquidMetal className="-z-20" mouse={0} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-brand-ink from-45% via-brand-ink/85 to-brand-ink/10 md:bg-linear-to-r md:from-brand-ink md:from-25% md:via-brand-ink/70 md:via-50% md:to-transparent"
            />
            <div className="px-6 pt-48 pb-10 md:max-w-2xl md:px-10 md:py-20 lg:py-24">
              <h1 className="font-heading text-display font-medium text-brand-ink-foreground">
                {t.home.title}
              </h1>
              <div>
                <p className="mt-5 max-w-md text-lg text-brand-ink-foreground/85">{t.home.lead}</p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button asChild size="lg">
                    <a href="#today">
                      {t.home.seeTimes}
                      <ArrowDown data-icon="end" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="#how-it-works">{t.home.howItWorks}</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 md:mt-14">
            <TodayBoard id="today" rows={boardRows} />
            <p className="mt-3 text-sm text-muted-foreground">{t.home.sampleSchedule}</p>
          </div>
        </Container>
      </section>

      {/* How it works: a real sequence, so it is numbered -------------- */}
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-16">
        <Container className="layout-grid gap-y-10 py-16 md:py-24">
          <SectionHeading
            className="col-span-4 md:col-span-8 lg:col-span-4"
            title={<span id="how-it-works-title">{t.home.stepsTitle}</span>}
            description={t.home.stepsLead}
          />
          <ol className="col-span-4 flex flex-col md:col-span-8 lg:col-span-7 lg:col-start-6">
            {t.home.steps.map(({ title, description }, index) => (
              <li
                key={title}
                className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-border py-6 last:border-b sm:grid-cols-[5rem_1fr]"
              >
                <span className="font-heading text-2xl leading-none font-medium text-primary-strong tabular-nums sm:text-3xl">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 max-w-prose text-base text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <BenefitsSection
        id="for-customers"
        title={t.home.benefits.customers.title}
        items={t.home.benefits.customers.items}
      />

      {/* Categories: what can be booked --------------------------------- */}
      <section aria-labelledby="categories-title" className="border-t border-border bg-surface">
        <Container className="py-16 md:py-24">
          <SectionHeading title={<span id="categories-title">{t.home.categoriesTitle}</span>} />
          <ul className="mt-10 grid grid-cols-1 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_GROUPS.map(({ slug, icon: Icon }) => (
              <li key={slug} className="border-b border-border">
                <Link
                  href={toSearchHref({ ...DEFAULT_FILTERS, cat: slug })}
                  className="group flex items-start gap-4 py-6 outline-none focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring sm:pr-6"
                >
                  <Icon className="size-7 shrink-0 text-primary-strong" />
                  <span className="flex flex-col gap-1.5">
                    <span className="font-heading text-lg font-medium tracking-tight text-foreground underline-offset-4 group-hover:underline">
                      {t.groups[slug].label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t.groups[slug].description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <BenefitsSection
        id="for-business"
        tone="ink"
        title={t.home.benefits.business.title}
        items={t.home.benefits.business.items}
      />

      {/* For owners: the one inverted band ------------------------------ */}
      <section aria-labelledby="owners-title" className="bg-primary text-primary-foreground">
        <Container className="layout-grid gap-y-8 py-16 md:py-20">
          <div className="col-span-4 md:col-span-8 lg:col-span-6">
            <h2
              id="owners-title"
              className="font-heading text-heading font-medium text-primary-foreground"
            >
              {t.home.ownersTitle}
            </h2>
            <p className="mt-4 max-w-prose text-base opacity-85">{t.home.ownersLead}</p>
            <Button asChild size="lg" variant="inverse" className="mt-8">
              <Link href="/business/register">{t.home.ownersCta}</Link>
            </Button>
          </div>
          <ul className="col-span-4 flex flex-col self-end md:col-span-8 lg:col-span-5 lg:col-start-8">
            {t.home.ownerPoints.map((point) => (
              <li
                key={point}
                className="border-t border-primary-foreground/25 py-4 text-base last:border-b"
              >
                {point}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
