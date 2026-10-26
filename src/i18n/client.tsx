"use client";

import { createContext, use, type JSX, type ReactNode } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Серверийн уншсан cookie-ээс root layout дотор нэг удаа тохирно. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}): JSX.Element {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return use(LocaleContext);
}

/** Client Component-д одоогийн хэлний толь бичиг. */
export function useT(): Dictionary {
  return getDictionary(use(LocaleContext));
}
