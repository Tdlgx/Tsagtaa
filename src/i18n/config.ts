/** Supported interface languages. Mongolian is the default and the source language. */
export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";

/** Cookie that remembers the visitor's choice (read on the server, so pages render in it). */
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  mn: { short: "MN", name: "Монгол" },
  en: { short: "EN", name: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
