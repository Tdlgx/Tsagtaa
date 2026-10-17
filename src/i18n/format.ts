import type { Locale } from "@/i18n/config";
import { getZonedParts, type DateInput } from "@/lib/date";

/**
 * Date words in each language, always on the Ulaanbaatar calendar. Built by
 * hand (not Intl with "mn-MN") so Node.js and browsers print the same text
 * and hydration never mismatches.
 */
const WEEKDAYS: Record<Locale, readonly string[]> = {
  mn: ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "Бямба" / "Saturday" */
export function formatWeekdayName(input: DateInput, locale: Locale): string {
  return WEEKDAYS[locale][getZonedParts(input).weekday] ?? "";
}

/** "10-р сарын 17" / "October 17" */
export function formatMonthDay(input: DateInput, locale: Locale): string {
  const { month, day } = getZonedParts(input);
  return locale === "mn" ? `${month}-р сарын ${day}` : `${MONTHS_EN[month - 1]} ${day}`;
}

/** "Бямба, 10-р сарын 17" / "Saturday, October 17" */
export function formatDayLabel(input: DateInput, locale: Locale): string {
  return `${formatWeekdayName(input, locale)}, ${formatMonthDay(input, locale)}`;
}
