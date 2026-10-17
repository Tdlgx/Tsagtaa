"use client";

import {
  Activity,
  CalendarSearch,
  ClipboardCheck,
  Coins,
  LayoutGrid,
  Store,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Tab = { href: string; icon: LucideIcon; key: keyof ReturnType<typeof useT>["admin"]["nav"] };

const TABS: Tab[] = [
  { href: "/admin", icon: LayoutGrid, key: "overview" },
  { href: "/admin/review", icon: ClipboardCheck, key: "review" },
  { href: "/admin/places", icon: Store, key: "places" },
  { href: "/admin/accounts", icon: UsersRound, key: "accounts" },
  { href: "/admin/bookings", icon: CalendarSearch, key: "bookings" },
  { href: "/admin/points", icon: Coins, key: "points" },
  { href: "/admin/activity", icon: Activity, key: "activity" },
];

/** Sections of admin. Scrolls sideways on phones rather than wrapping. */
export function AdminNav({ pending }: { pending: number }): JSX.Element {
  const t = useT();
  const pathname = usePathname();

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <Container>
        <nav
          aria-label={t.admin.nav.label}
          className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0"
        >
          {TABS.map(({ href, icon: Icon, key }) => {
            const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  current
                    ? "bg-foreground text-background"
                    : "text-muted-foreground is-hover:bg-surface-muted is-hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.admin.nav[key]}
                {key === "review" && pending > 0 ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                      current ? "bg-primary text-primary-foreground" : "bg-sun text-foreground",
                    )}
                  >
                    {pending}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}
