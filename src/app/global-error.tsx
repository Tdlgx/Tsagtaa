"use client"; // Error boundary нь Client Component байх ёстой.

import { useEffect, useSyncExternalStore, type JSX } from "react";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Root layout өөрөө алдаа шидвэл барих сүүлчийн хамгаалалт.
 * Бүх document-ийг орлодог тул өөрийн <html>, <body>-г render хийж, зөвхөн энгийн
 * элементүүд ашиглана (аппын provider-ууд өөрсдөө эвдэрсэн байж магадгүй).
 */
// Provider-ууд эвдэрсэн байж магадгүй тул хэлийг cookie-ээс шууд авна.
function readLocale(): Locale {
  const value = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

const noSubscribe = (): (() => void) => () => {};

/** Root layout өөрөө эвдэрсэн үеийн алдааны хуудас, хэлийг cookie-ээс уншина. */
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- энд root layout эвдэрсэн тул client-side шилжилтийн оронд хуудсыг бүтэн дахин ачаална */}
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
