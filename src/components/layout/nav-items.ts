import { CalendarDays, House, Search, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  /** `nav` толь бичгийн хэсгийн түлхүүр. */
  labelKey: "home" | "search" | "bookings" | "profile";
  icon: LucideIcon;
};

/**
 * Үйлчлүүлэгчийн үндсэн цэс. Нэг жагсаалт компьютерийн header болон утасны доод
 * цэсийг хоёуланг тэжээнэ. "/"-ээс бусад хуудсыг дараагийн шатуудад хийнэ.
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
