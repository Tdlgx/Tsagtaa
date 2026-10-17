import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

/** The visitor's language from the cookie; Mongolian when unset or unknown. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Locale + its dictionary, for Server Components and metadata. */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
