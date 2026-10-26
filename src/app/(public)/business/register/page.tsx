import { CirclePlay } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { RegistrationWizard } from "@/features/business-registration/components/registration-wizard";
import { getRegisterTour } from "@/features/business-registration/register-tour";
import { GuidedTour } from "@/features/onboarding/components/guided-tour";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.register.metaTitle, description: t.register.metaDescription };
}

/** Бизнес бүртгэл: хэрхэн ажилладаг, дараа нь заавартай 6 алхамт маягт. */
export default async function RegisterBusinessPage(): Promise<JSX.Element> {
  const { t } = await getI18n();
  const words = t.register;

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium text-primary-strong">{words.eyebrow}</p>
          <h1 className="font-heading text-display font-medium text-foreground">{words.title}</h1>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">{words.lead}</p>
        </div>
        <Button asChild variant="outline" className="self-start md:self-auto">
          <Link href="/business/register?tour=1" scroll={false}>
            <CirclePlay data-icon="start" />
            {words.tourButton}
          </Link>
        </Button>
      </header>

      <section aria-labelledby="how-title" className="mt-10">
        <h2
          id="how-title"
          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {words.howTitle}
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {words.how.map((item, index) => (
            <li key={item.title}>
              <TiltCard className="h-full rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-ink font-heading text-sm font-medium text-primary tabular-nums">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-strong">
                    {item.meta}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </TiltCard>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 border-t border-border pt-10">
        <RegistrationWizard />
      </div>

      <GuidedTour steps={getRegisterTour(t)} done={words.tourDone} />
    </Container>
  );
}
