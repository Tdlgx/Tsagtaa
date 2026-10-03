import { TIME_ZONE } from "@/lib/constants";

/**
 * Date helpers that always show Ulaanbaatar wall-clock time, no matter which
 * time zone the server (usually UTC) or the visitor's device is in.
 *
 * Output strings are assembled by hand instead of `Intl.DateTimeFormat("mn-MN")`
 * because ICU data differs between Node.js and browsers; identical output on
 * server and client avoids React hydration mismatches.
 */

export type DateInput = Date | string | number;

export type ZonedDateParts = {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
};

const WEEKDAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"] as const;

// "en-US" + numeric parts gives stable, locale-independent digits for parsing.
const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Converts any supported input into a valid `Date`, or throws. */
export function toDate(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date input: ${String(input)}`);
  }

  return date;
}

/** Calendar and clock parts of `input` as seen on a wall clock in Ulaanbaatar. */
export function getZonedParts(input: DateInput): ZonedDateParts {
  const parts = partsFormatter.formatToParts(toDate(input));

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) {
      throw new Error(`Missing "${type}" in formatted date parts`);
    }
    return Number(part.value);
  };

  const year = read("year");
  const month = read("month");
  const day = read("day");

  return {
    year,
    month,
    day,
    hour: read("hour"),
    minute: read("minute"),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

/** "2026.10.04" */
export function formatDate(input: DateInput): string {
  const { year, month, day } = getZonedParts(input);
  return `${year}.${pad2(month)}.${pad2(day)}`;
}

/** "2026 оны 10-р сарын 4" */
export function formatDateLong(input: DateInput): string {
  const { year, month, day } = getZonedParts(input);
  return `${year} оны ${month}-р сарын ${day}`;
}

/** "14:30" (24-hour clock) */
export function formatTime(input: DateInput): string {
  const { hour, minute } = getZonedParts(input);
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** "2026.10.04 14:30" */
export function formatDateTime(input: DateInput): string {
  return `${formatDate(input)} ${formatTime(input)}`;
}

/** "Даваа" */
export function formatWeekday(input: DateInput): string {
  const { weekday } = getZonedParts(input);
  const name = WEEKDAY_NAMES[weekday];
  if (!name) {
    throw new RangeError(`Invalid weekday index: ${weekday}`);
  }
  return name;
}

/** "2026-10-04" — the Ulaanbaatar calendar day, handy as a stable key. */
export function toDateKey(input: DateInput): string {
  const { year, month, day } = getZonedParts(input);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
