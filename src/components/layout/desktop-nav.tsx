"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";

import { isActivePath, MAIN_NAV } from "@/components/layout/nav-items";
import { useT } from "@/i18n/client";
import { UpcomingCount } from "@/features/booking/components/upcoming-count";
import { cn } from "@/lib/utils";

export function DesktopNav({ className }: { className?: string }): JSX.Element {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav aria-label={t.nav.label} className={className}>
      <ul className="flex items-center gap-1">
        {MAIN_NAV.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              data-tour-nav={href}
              aria-current={isActivePath(pathname, href) ? "page" : undefined}
              className={cn(
                "relative flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground",
                "aria-[current=page]:text-foreground",
                // Active marker: 1px line under the label.
                "after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-primary after:opacity-0 aria-[current=page]:after:opacity-100",
              )}
            >
              {t.nav[labelKey]}
              {href === "/bookings" ? <UpcomingCount /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
