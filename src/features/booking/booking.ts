import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDayLabel } from "@/i18n/format";
import { toDateKey } from "@/lib/date";

/** Үйлчлүүлэгчийн хадгалдаг захиалга. Байгаагаар нь хадгалдаг тул хавтгай, serialize хийгдэхүйц байлгана. */
export type Booking = {
  id: string;
  /** Ресепшинд харуулах богино код: "TS-7K2Q9". */
  code: string;
  businessSlug: string;
  businessName: string;
  category: BusinessCategorySlug;
  district: DistrictSlug;
  area: string;
  serviceName: string;
  /** Минут */
  duration: number;
  /** Төгрөг */
  price: number;
  staffName: string;
  staffRole: string;
  /** Эхлэх цагийн ISO агшин. */
  startsAt: string;
  customerName: string;
  phone: string;
  note: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  /**
   * Үйлчлүүлэгч нэр, утсаа ашиглахыг зөвшөөрсөн ISO агшин (Хувь хүний мэдээлэл
   * хамгаалах тухай хууль боловсруулахаас өмнө зөвшөөрөл шаарддаг).
   * Зөвшөөрөл асууж эхлэхээс өмнөх захиалга болон demo жишээнд байхгүй.
   */
  consentedAt?: string;
  /** Энэ захиалгад зарцуулсан оноо (1 оноо = 1 ₮ хямдрал). Зөвхөн нэвтэрсэн үйлчлүүлэгчид. */
  pointsUsed?: number;
  /** Үйлчлүүлсний дараа олох оноо. */
  pointsToEarn?: number;
};

/** Жагсаалтад харуулах төлөв: цаг нь өнгөрсөн баталгаажсан захиалга дууссанд тооцогдоно. */
export type BookingPhase = "upcoming" | "now" | "completed" | "cancelled";

const MINUTE = 60_000;

export function getEndsAt(booking: Pick<Booking, "startsAt" | "duration">): Date {
  return new Date(new Date(booking.startsAt).getTime() + booking.duration * MINUTE);
}

/** Захиалгын одоогийн үе шат: цуцлагдсан, ирэх, яг одоо, эсвэл дууссан. */
export function getBookingPhase(booking: Booking, now: number): BookingPhase {
  if (booking.status === "cancelled") return "cancelled";
  const start = new Date(booking.startsAt).getTime();
  if (now < start) return "upcoming";
  return now < getEndsAt(booking).getTime() ? "now" : "completed";
}

/**
 * Улаанбаатарын өнөөдрийн эсвэл маргаашийн хуанлийн өдөр дээрх "HH:MM" агшин.
 * Монгол жилийн турш UTC+8 (зуны цаг байхгүй) тул зөрүү тогтмол.
 */
export function toStartInstant(day: "today" | "tomorrow", time: string, now: Date): Date {
  const base = day === "today" ? now : new Date(now.getTime() + 24 * 60 * MINUTE);
  return new Date(`${toDateKey(base)}T${time}:00+08:00`);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 0/O, 1/I андуурагдахгүй

/** "TS-XXXXX" хэлбэрийн санамсаргүй ресепшний код (андуурагдах үсэггүй цагаан толгойгоор). */
export function createBookingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const body = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
  return `TS-${body}`;
}

/** "Өнөөдөр" / "Today", "Маргааш", "Өчигдөр", бусад үед "Баасан, 10-р сарын 24". */
export function formatRelativeDay(input: Date | string, now: Date, locale: Locale): string {
  const { common } = getDictionary(locale);
  const key = toDateKey(input);
  const day = 24 * 60 * MINUTE;
  if (key === toDateKey(now)) return common.today;
  if (key === toDateKey(new Date(now.getTime() + day))) return common.tomorrow;
  if (key === toDateKey(new Date(now.getTime() - day))) return common.yesterday;
  return formatDayLabel(input, locale);
}

/** `target` хүртэл үлдсэн хугацаа: "3 өдөр 4 цаг", "2 цаг 15 мин" / "2 h 15 min", "1 минут хүрэхгүй". */
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

/** Монгол гар утасны дугаар: 6–9-өөр эхэлсэн 8 оронтой тоо. Хоосон зай, зураасыг үл тооно. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^\+?976/, "");
  return /^[6-9]\d{7}$/.test(digits) ? digits : null;
}
