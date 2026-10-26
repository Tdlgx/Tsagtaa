import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { mn, type Dictionary } from "@/i18n/dictionaries/mn";

/**
 * Хоёр толь бичиг хоёулаа жижиг тул хамт ирдэг бөгөөд хэл солиход нэмэлт татах
 * шаардлагагүй. Сервер, client кодын аль алинд нь ашиглана.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { mn, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
