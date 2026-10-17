import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { JSX, ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { ThemeSwitch } from "@/components/layout/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";

/**
 * Shell for the management side (sign-in in `(auth)`, the business dashboard
 * in `(business)`, admin in `(admin)`): a plain header with the signed-in
 * person and the links their roles allow. No splash, backdrop or tab bar.
 */
export async function ManageShell({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const { t } = await getI18n();
  const account = await getCurrentAccount();
  const manages = account?.memberships.length ?? 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-6">
            <Logo />
            {account ? (
              <nav className="flex items-center gap-1 text-sm font-medium">
                {manages > 0 ? (
                  <Link
                    href="/dashboard"
                    className="flex h-9 items-center gap-1.5 rounded-full px-3 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted is-hover:text-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    <span className="max-sm:sr-only">{t.manage.dashboard}</span>
                  </Link>
                ) : null}
                {account.isPlatformAdmin ? (
                  <Link
                    href="/admin"
                    className="flex h-9 items-center gap-1.5 rounded-full px-3 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted is-hover:text-foreground"
                  >
                    <ShieldCheck className="size-4" />
                    <span className="max-sm:sr-only">{t.manage.admin}</span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle className="max-sm:hidden" />
            <ThemeSwitch />
            {account ? (
              <form action={logoutAction} className="flex items-center gap-2">
                <span className="max-w-32 truncate text-sm text-muted-foreground max-md:hidden">
                  {account.name}
                </span>
                <button
                  type="submit"
                  title={t.auth.logout}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                >
                  <LogOut className="size-4" />
                  <span className="max-sm:sr-only">{t.auth.logout}</span>
                </button>
              </form>
            ) : null}
          </div>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
