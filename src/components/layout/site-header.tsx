import { Coins, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { HeaderShell } from "@/components/layout/header-shell";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { ThemeSwitch, ThemeToggle } from "@/components/layout/theme-toggle";
import { TourButton } from "@/features/onboarding/components/tour-button";
import { formatPoints } from "@/features/points/points";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";

type SiteHeaderProps = {
  forceScrolled?: boolean;
  sticky?: boolean;
};

export async function SiteHeader({ forceScrolled, sticky }: SiteHeaderProps): Promise<JSX.Element> {
  const { t } = await getI18n();
  // Only owners, managers and the Цагтаа team see a way into management.
  const account = await getCurrentAccount();
  const manageHref = account?.memberships.length
    ? "/dashboard"
    : account?.isPlatformAdmin
      ? "/admin"
      : null;

  return (
    <HeaderShell forceScrolled={forceScrolled} sticky={sticky}>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo className="shrink-0 whitespace-nowrap" />
        <div className="flex items-center gap-2 md:gap-4">
          <DesktopNav className="hidden md:block" />
          {manageHref ? (
            <Link
              href={manageHref}
              title={t.manage.dashboard}
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand-ink px-3 text-sm font-medium text-brand-ink-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:opacity-90"
            >
              <LayoutDashboard className="size-4 text-primary" />
              <span className="max-lg:sr-only">{t.manage.dashboard}</span>
            </Link>
          ) : account ? (
            // A signed-in customer: their points, one tap from the profile.
            <Link
              href="/profile"
              title={t.points.title}
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand-ink px-3 text-sm font-medium text-primary tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:opacity-90"
            >
              <Coins className="size-4" />
              {formatPoints(account.pointsBalance)}
              <span className="sr-only">{t.points.unit}</span>
            </Link>
          ) : null}
          {/* Phones keep the header to the essentials: the tour and the language
              switch are one tap away in Profile. */}
          <div className="contents max-sm:hidden">
            <TourButton />
          </div>
          <LanguageToggle className="max-sm:hidden" />
          {/* Phones get a one-tap switch; the three-way control needs more room. */}
          <ThemeSwitch className="sm:hidden" />
          <ThemeToggle className="max-sm:hidden" />
        </div>
      </Container>
    </HeaderShell>
  );
}
