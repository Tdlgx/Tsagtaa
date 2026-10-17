import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { mn, type Dictionary } from "@/i18n/dictionaries/mn";

/**
 * Both dictionaries are small, so they ship together and switching language
 * needs no extra download. Usable from server and client code alike.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { mn, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
