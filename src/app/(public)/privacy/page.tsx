import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.metaTitle, description: t.privacy.metaDescription };
}

/**
 * How personal data is handled, as required by Mongolia's Law on Personal
 * Data Protection. Describes the current build, where everything stays in the
 * browser; update it before bookings start reaching the server or the places.
 */
export default async function PrivacyPage(): Promise<JSX.Element> {
  const { t } = await getI18n();

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <article className="mx-auto max-w-2xl">
        <ShieldCheck className="size-10 text-primary-strong" />
        <h1 className="mt-4 font-heading text-heading font-medium text-foreground">
          {t.privacy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.privacy.updated}</p>
        <p className="mt-6 text-lg text-muted-foreground">{t.privacy.lead}</p>

        <ol className="mt-10 flex flex-col border-t border-border">
          {t.privacy.sections.map(({ title, text, items, note }, index) => (
            <li
              key={title}
              className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-border py-6 sm:grid-cols-[3rem_1fr]"
            >
              <span className="font-heading text-lg leading-snug font-medium text-primary-strong tabular-nums">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-base text-muted-foreground">{text}</p>
                {items ? (
                  <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-base text-muted-foreground marker:text-primary-strong">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {note ? (
                  <p className="mt-3 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{t.privacy.manage}</p>
            <p className="text-sm text-muted-foreground">{t.privacy.manageText}</p>
          </div>
          <Button asChild>
            <Link href="/profile">
              {t.privacy.toProfile}
              <ArrowRight data-icon="end" />
            </Link>
          </Button>
        </div>
      </article>
    </Container>
  );
}
