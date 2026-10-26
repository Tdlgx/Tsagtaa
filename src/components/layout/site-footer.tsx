import Link from "next/link";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { getI18n } from "@/i18n/server";
import { APP_NAME } from "@/lib/constants";
import { getZonedParts } from "@/lib/date";

/** Хуудасны доод хэсэг: лого, тайлбар, бизнес бүртгэл болон бусад холбоос. */
export async function SiteFooter(): Promise<JSX.Element> {
  const { locale, t } = await getI18n();
  const { year } = getZonedParts(new Date());

  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-sm:hidden">{t.meta.description}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end">
          <Link
            href="/business/register"
            className="font-medium text-foreground underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:underline"
          >
            {t.home.ownersCta}
          </Link>
          <Link
            href="/help"
            className="underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground is-hover:underline"
          >
            {t.help.title}
          </Link>
          <Link
            href="/login"
            className="underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground is-hover:underline"
          >
            {t.auth.footerLink}
          </Link>
          <Link
            href="/map"
            className="underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground is-hover:underline"
          >
            {t.footer.map}
          </Link>
          <Link
            href="/privacy"
            className="underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground is-hover:underline"
          >
            {t.footer.privacy}
          </Link>
          <p className="tabular-nums">
            {t.footer.copyright(year, locale === "mn" ? APP_NAME : t.brand)}
          </p>
        </div>
      </Container>
    </footer>
  );
}
