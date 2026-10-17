"use client"; // Error boundaries must be Client Components.

import { useEffect, useSyncExternalStore, type JSX } from "react";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 * It replaces the whole document, so it renders its own <html> and <body>,
 * and uses only plain elements (the app's providers may be what broke).
 */
// The providers may be what broke, so the language comes straight from the cookie.
function readLocale(): Locale {
  const value = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

const noSubscribe = (): (() => void) => () => {};

export default function GlobalError({ error, retry }: GlobalErrorProps): JSX.Element {
  const locale = useSyncExternalStore(noSubscribe, readLocale, () => DEFAULT_LOCALE);
  const t = getDictionary(locale);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 text-center font-sans text-foreground">
        <title>{t.errors.title}</title>
        <h1 className="font-heading text-heading font-medium">{t.errors.title}</h1>
        <p className="mt-4 max-w-md text-muted-foreground">{t.errors.text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="h-11 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            {t.errors.retry}
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout is broken here, so force a full page reload instead of client-side navigation */}
          <a
            href="/"
            className="flex h-11 items-center rounded-md border border-border bg-surface px-5 text-sm font-medium"
          >
            {t.common.backHome}
          </a>
        </div>
      </body>
    </html>
  );
}
