import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDayLabel } from "@/i18n/format";
import { toDateKey } from "@/lib/date";

/** A booking as the customer keeps it. Stored as-is, so keep it flat and serializable. */
export type Booking = {
  id: string;
  /** Short code shown at the front desk: "TS-7K2Q9". */
  code: string;
  businessSlug: string;
  businessName: string;
  category: BusinessCategorySlug;
  district: DistrictSlug;
  area: string;
  serviceName: string;
  /** Minutes */
  duration: number;
  /** Tögrög */
  price: number;
  staffName: string;
  staffRole: string;
  /** ISO instant of the start. */
  startsAt: string;
  customerName: string;
  phone: string;
  note: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  /**
   * ISO instant the customer agreed to their name and phone being used (the
   * Law on Personal Data Protection requires consent before processing).
   * Missing on bookings made before consent was asked and on demo samples.
   */
  consentedAt?: string;
  /** Points spent on this booking (1 point = 1 ₮ off). Only for signed-in customers. */
  pointsUsed?: number;
  /** Points it earns after the visit. */
  pointsToEarn?: number;
};

/** What the list shows: a confirmed booking whose time has passed counts as completed. */
export type BookingPhase = "upcoming" | "now" | "completed" | "cancelled";

const MINUTE = 60_000;

export function getEndsAt(booking: Pick<Booking, "startsAt" | "duration">): Date {
  return new Date(new Date(booking.startsAt).getTime() + booking.duration * MINUTE);
}

export function getBookingPhase(booking: Booking, now: number): BookingPhase {
  if (booking.status === "cancelled") return "cancelled";
  const start = new Date(booking.startsAt).getTime();
  if (now < start) return "upcoming";
  return now < getEndsAt(booking).getTime() ? "now" : "completed";
}

/**
 * The instant of "HH:MM" on today's or tomorrow's Ulaanbaatar calendar day.
 * Mongolia is UTC+8 all year (no daylight saving), so the offset is fixed.
 */
export function toStartInstant(day: "today" | "tomorrow", time: string, now: Date): Date {
  const base = day === "today" ? now : new Date(now.getTime() + 24 * 60 * MINUTE);
  return new Date(`${toDateKey(base)}T${time}:00+08:00`);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O or 1/I mix-ups

export function createBookingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const body = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
  return `TS-${body}`;
}

/** "Өнөөдөр" / "Today", "Маргааш", "Өчигдөр", otherwise "Баасан, 10-р сарын 24". */
export function formatRelativeDay(input: Date | string, now: Date, locale: Locale): string {
  const { common } = getDictionary(locale);
  const key = toDateKey(input);
  const day = 24 * 60 * MINUTE;
  if (key === toDateKey(now)) return common.today;
  if (key === toDateKey(new Date(now.getTime() + day))) return common.tomorrow;
  if (key === toDateKey(new Date(now.getTime() - day))) return common.yesterday;
  return formatDayLabel(input, locale);
}

/** Time left until `target`: "3 өдөр 4 цаг", "2 цаг 15 мин" / "2 h 15 min", "1 минут хүрэхгүй". */
export function formatCountdown(target: Date, now: number, locale: Locale): string {
  const words = getDictionary(locale).countdown;
  const minutes = Math.ceil((target.getTime() - now) / MINUTE);
  if (minutes <= 1) return words.underMinute;
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const rest = minutes % 60;
  if (days > 0) return hours > 0 ? `${words.days(days)} ${words.hours(hours)}` : words.days(days);
  if (hours > 0)
    return rest > 0 ? `${words.hours(hours)} ${words.minutes(rest)}` : words.hours(hours);
  return words.minutes(rest);
}

/** "99112233" → "9911 2233" */
export function formatPhone(phone: string): string {
  return phone.length === 8 ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone;
}

/** Mongolian mobile numbers: 8 digits starting with 6–9. Spaces and dashes are ignored. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^\+?976/, "");
  return /^[6-9]\d{7}$/.test(digits) ? digits : null;
}
