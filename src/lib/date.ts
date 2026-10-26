import { TIME_ZONE } from "@/lib/constants";

/**
 * Сервер (ихэвчлэн UTC) эсвэл зочны төхөөрөмж аль цагийн бүсэд байхаас үл хамааран
 * үргэлж Улаанбаатарын цагийг харуулдаг огнооны туслах функцууд.
 *
 * Гаралтын текстийг `Intl.DateTimeFormat("mn-MN")`-ийн оронд гараар угсардаг,
 * учир нь ICU өгөгдөл Node.js болон browser-т ялгаатай; сервер, client дээр ижил
 * гаралт React-ийн hydration-ий зөрүүнээс сэргийлнэ.
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
  /** 0 = Ням … 6 = Бямба */
  weekday: number;
};

const WEEKDAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"] as const;

// "en-US" + тоон хэсгүүд нь parse хийхэд тогтвортой, locale-оос хамаарахгүй цифр өгнө.
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

/** Дэмжигдсэн аливаа оролтыг хүчинтэй `Date` болгоно, эсвэл алдаа шиднэ. */
export function toDate(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date input: ${String(input)}`);
  }

  return date;
}

/** `input`-ийн Улаанбаатарын цагаар харагдах хуанли, цагийн хэсгүүд. */
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

/** "14:30" (24 цагийн формат) */
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

/** "2026-10-04" — Улаанбаатарын хуанлийн өдөр, тогтвортой түлхүүр болгоход тохиромжтой. */
export function toDateKey(input: DateInput): string {
  const { year, month, day } = getZonedParts(input);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Харуулах үйлчилгээний хугацаа: 45 → "45 мин", 60 → "1 цаг", 90 → "1 цаг 30 мин". */
export function formatDuration(totalMinutes: number): string {
  if (!Number.isInteger(totalMinutes) || totalMinutes <= 0) {
    throw new RangeError(`Invalid duration: ${totalMinutes}`);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} цаг`;
  return `${hours} цаг ${minutes} мин`;
}
