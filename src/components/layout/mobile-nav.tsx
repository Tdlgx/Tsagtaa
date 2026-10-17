"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";

import { isActivePath, MAIN_NAV } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  /** Override the highlighted item (used for previews). */
  activeHref?: string;
  className?: string;
};

/** Bottom tab bar for phones: 4 destinations, 64px tall, thumb-friendly. */
export function MobileNav({ activeHref, className }: MobileNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Үндсэн цэс"
      className={cn("border-t border-border bg-background/90 pb-safe backdrop-blur-md", className)}
    >
      <ul className="grid grid-cols-4">
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = activeHref ? activeHref === href : isActivePath(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/tab flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none",
                  "focus-visible:bg-surface-muted aria-[current=page]:text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-transform duration-150 ease-soft",
                    "group-active/tab:scale-92 group-aria-[current=page]/tab:bg-primary-soft",
                  )}
                >
                  <Icon className="size-6" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
