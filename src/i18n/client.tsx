"use client";

import { createContext, use, type JSX, type ReactNode } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Set once in the root layout from the cookie the server read. */
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

/** The dictionary for the current language, in Client Components. */
export function useT(): Dictionary {
  return getDictionary(use(LocaleContext));
}
