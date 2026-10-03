"use client"; // Error boundaries must be Client Components.

import Link from "next/link";
import { useEffect, type JSX } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps): JSX.Element {
  useEffect(() => {
    // Replace with an error reporting service (e.g. Sentry) in a later step.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-destructive">Алдаа</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Уучлаарай, алдаа гарлаа
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Түр зуурын асуудал байж магадгүй. Дахин оролдоно уу, эсвэл нүүр хуудас руу буцна уу.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">Алдааны код: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="lg" onClick={() => retry()}>
          Дахин оролдох
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Нүүр хуудас руу буцах</Link>
        </Button>
      </div>
    </main>
  );
}
