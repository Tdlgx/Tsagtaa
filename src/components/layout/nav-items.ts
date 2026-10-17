import { CalendarDays, House, Search, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Main navigation for customers. The same list feeds the desktop header and the
 * mobile bottom bar. Pages other than "/" are built in later steps.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { href: "/", label: "Нүүр", icon: House },
  { href: "/search", label: "Хайх", icon: Search },
  { href: "/bookings", label: "Захиалга", icon: CalendarDays },
  { href: "/profile", label: "Профайл", icon: UserRound },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
