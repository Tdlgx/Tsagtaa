"use client"; // Error boundaries must be Client Components.

import { useEffect, type JSX } from "react";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 * It replaces the whole document, so it renders its own <html> and <body>.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="mn">
      <body className="flex min-h-dvh flex-col items-center justify-center px-4 text-center font-sans">
        <title>Алдаа гарлаа</title>
        <h1 className="text-3xl font-bold tracking-tight">Уучлаарай, систем алдаа гарлаа</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Хуудсыг дахин ачаалж үзнэ үү. Асуудал давтагдвал түр хүлээгээд дахин оролдоорой.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="h-10 rounded-lg bg-primary px-5 font-medium text-primary-foreground"
          >
            Дахин оролдох
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout is broken here, so force a full page reload instead of client-side navigation */}
          <a href="/" className="flex h-10 items-center rounded-lg border px-5 font-medium">
            Нүүр хуудас руу буцах
          </a>
        </div>
      </body>
    </html>
  );
}
