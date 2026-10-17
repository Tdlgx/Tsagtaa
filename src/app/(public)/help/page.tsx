import { CirclePlay, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { FaqList } from "@/app/(public)/help/_components/faq-list";
import { Container } from "@/components/layout/container";
import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { TOUR_HREF } from "@/features/onboarding/onboarding";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.help.metaTitle, description: t.help.metaDescription };
}

/** Frequently asked questions, searchable, with a way into the guided tour. */
export default async function HelpPage(): Promise<JSX.Element> {
  const { t } = await getI18n();

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-display font-medium text-foreground">{t.help.title}</h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">{t.help.lead}</p>

        <div className="mt-8">
          <FaqList />
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          <TiltCard className="rounded-xl bg-brand-ink p-6 text-brand-ink-foreground">
            <CirclePlay className="size-7 text-primary" />
            <h2 className="mt-4 font-heading text-lg font-medium">{t.help.guideTitle}</h2>
            <p className="mt-1 text-sm text-brand-ink-muted">{t.help.guideText}</p>
            <Button asChild size="sm" className="mt-5">
              <Link href={TOUR_HREF}>{t.help.guideCta}</Link>
            </Button>
          </TiltCard>
          <TiltCard className="rounded-xl border border-border bg-surface p-6">
            <Store className="size-7 text-primary-strong" />
            <h2 className="mt-4 font-heading text-lg font-medium text-foreground">
              {t.register.eyebrow}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.register.metaDescription}</p>
            <Button asChild size="sm" variant="outline" className="mt-5">
              <Link href="/business/register">{t.help.registerCta}</Link>
            </Button>
          </TiltCard>
        </div>
      </div>
    </Container>
  );
}
