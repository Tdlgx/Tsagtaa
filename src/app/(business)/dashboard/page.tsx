import { ArrowRight, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/manage/components/status-badge";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import { getI18n } from "@/i18n/server";
import { requireAccount } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.metaTitle, robots: { index: false } };
}

/** Энэ хүний удирддаг газрууд. Ганцхан байвал шууд түүн рүү орно. */
export default async function DashboardIndex(): Promise<JSX.Element> {
  const { t } = await getI18n();
  const account = await requireAccount("/dashboard");
  const places = account.memberships;
  if (places.length === 1 && places[0]) redirect(`/dashboard/${places[0].slug}`);

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-heading text-heading font-medium text-foreground">
        {places.length > 0 ? t.dashboard.chooseTitle : t.dashboard.none}
      </h1>
      {places.length === 0 ? (
        <div className="mt-4 max-w-lg">
          <p className="text-base text-muted-foreground">{t.dashboard.noneText}</p>
          <Button asChild className="mt-6">
            <Link href="/business/register">{t.auth.register}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => {
            const Icon = getBusinessCategory(place.category as BusinessCategorySlug)?.icon ?? Store;
            return (
              <li key={place.businessId}>
                <TiltCard className="h-full rounded-xl border border-border bg-surface">
                  <Link
                    href={`/dashboard/${place.slug}`}
                    className="flex h-full flex-col gap-4 p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-brand-ink text-primary">
                        <Icon className="size-5" />
                      </span>
                      <StatusBadge status={place.status} t={t} />
                    </div>
                    <div>
                      <p className="font-heading text-lg font-medium text-foreground">
                        {place.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.manage.roles[place.role]}</p>
                    </div>
                    <ArrowRight className="mt-auto size-4 text-muted-foreground" />
                  </Link>
                </TiltCard>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
