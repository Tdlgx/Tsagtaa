import { CalendarDays, House, Search, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  /** Key into the `nav` dictionary section. */
  labelKey: "home" | "search" | "bookings" | "profile";
  icon: LucideIcon;
};

/**
 * Main navigation for customers. The same list feeds the desktop header and the
 * mobile bottom bar. Pages other than "/" are built in later steps.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { href: "/", labelKey: "home", icon: House },
  { href: "/search", labelKey: "search", icon: Search },
  { href: "/bookings", labelKey: "bookings", icon: CalendarDays },
  { href: "/profile", labelKey: "profile", icon: UserRound },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
