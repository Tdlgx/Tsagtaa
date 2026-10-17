"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";

import { isActivePath, MAIN_NAV } from "@/components/layout/nav-items";
import { useT } from "@/i18n/client";
import { UpcomingCount } from "@/features/booking/components/upcoming-count";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  /** Override the highlighted item (used for previews). */
  activeHref?: string;
  className?: string;
};

/** Bottom tab bar for phones: 4 destinations, 64px tall, thumb-friendly. */
export function MobileNav({ activeHref, className }: MobileNavProps): JSX.Element {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      aria-label={t.nav.label}
      className={cn("border-t border-border bg-background/90 pb-safe backdrop-blur-md", className)}
    >
      <ul className="grid grid-cols-4">
        {MAIN_NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = activeHref ? activeHref === href : isActivePath(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                data-tour-nav={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/tab flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none",
                  "focus-visible:bg-surface-muted aria-[current=page]:text-primary-strong",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full transition-transform duration-150 ease-soft",
                    "group-active/tab:scale-92 group-aria-[current=page]/tab:bg-primary-soft",
                  )}
                >
                  <Icon className="size-6" />
                  {href === "/bookings" ? (
                    <UpcomingCount className="absolute -top-1 right-1.5 ring-2 ring-background" />
                  ) : null}
                </span>
                {t.nav[labelKey]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
