import { getEndsAt, type Booking } from "@/features/booking/booking";
import { localizeBooking } from "@/features/business/localize";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** 2026-10-17T03:30:00.000Z → 20261017T033000Z */
function toIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Commas, semicolons and backslashes are special in iCalendar text. */
function escapeText(text: string): string {
  return text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");
}

/** An .ics event with a 1-hour reminder; opens in Apple, Google and Outlook calendars. */
export function toIcs(stored: Booking, locale: Locale): string {
  const t = getDictionary(locale);
  const booking = localizeBooking(stored, locale);
  const start = new Date(booking.startsAt);
  const location = `${booking.businessName}, ${t.districts[booking.district]}, ${booking.area}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Tsagtaa//Booking//${locale.toUpperCase()}`,
    "BEGIN:VEVENT",
    `UID:${booking.id}@tsagtaa`,
    `DTSTAMP:${toIcsDate(new Date(booking.createdAt))}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(getEndsAt(booking))}`,
    `SUMMARY:${escapeText(`${booking.serviceName} · ${booking.businessName}`)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(`${booking.staffName}\n${t.calendar.code}: ${booking.code}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(booking.serviceName)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(booking: Booking, locale: Locale): void {
  const blob = new Blob([toIcs(booking, locale)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.code}.ics`;
  link.click();
  // Revoking right away can cancel the download in Safari; give it a moment.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
