/** Дэмжигдсэн интерфейсийн хэлнүүд. Монгол нь анхдагч бөгөөд эх хэл. */
export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";

/** Зочны сонголтыг санах cookie (сервер уншдаг тул хуудсууд тэр хэлээр render хийгдэнэ). */
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  mn: { short: "MN", name: "Монгол" },
  en: { short: "EN", name: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
