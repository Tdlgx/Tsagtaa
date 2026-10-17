import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";

/** Skeleton shown while a public page loads; header and tab bar stay visible. */
export default async function PublicLoading(): Promise<JSX.Element> {
  const { t } = await getI18n();

  return (
    <Container className="py-16" aria-busy="true">
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <div className="flex max-w-xl flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-4 h-13 w-44 rounded-md" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-40 rounded-lg" />
        ))}
      </div>
    </Container>
  );
}
