"use client"; // Error boundaries must be Client Components.

import { useEffect, type JSX } from "react";

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
export default function GlobalError({ error, retry }: GlobalErrorProps): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="mn">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 text-center font-sans text-foreground">
        <title>Алдаа гарлаа</title>
        <h1 className="font-heading text-heading font-medium">Уучлаарай, систем алдаа гарлаа</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Хуудсыг дахин ачаалж үзнэ үү. Асуудал давтагдвал түр хүлээгээд дахин оролдоорой.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="h-11 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Дахин оролдох
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout is broken here, so force a full page reload instead of client-side navigation */}
          <a
            href="/"
            className="flex h-11 items-center rounded-md border border-border bg-surface px-5 text-sm font-medium"
          >
            Нүүр хуудас руу буцах
          </a>
        </div>
      </body>
    </html>
  );
}
