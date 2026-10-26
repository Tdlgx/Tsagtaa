import { Search } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

/** 404 хуудасны агуулга, root болон удирдлагын route бүлгүүд хуваалцана. */
export async function NotFoundView({
  withLogo = true,
}: {
  withLogo?: boolean;
}): Promise<JSX.Element> {
  const { t } = await getI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-16">
      {withLogo ? <Logo /> : null}
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-sm">
        <EmptyState
          icon={Search}
          title={t.errors.notFoundTitle}
          description={t.errors.notFoundText}
          action={
            <Button asChild>
              <Link href="/">{t.common.backHome}</Link>
            </Button>
          }
        />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">{t.errors.code} 404</p>
    </div>
  );
}
