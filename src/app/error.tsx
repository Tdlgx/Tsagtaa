"use client"; // Error boundaries must be Client Components.

import { CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, type JSX } from "react";

import { EmptyState } from "@/components/shared/empty-state";
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
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-sm">
        <EmptyState
          icon={CircleAlert}
          title="Уучлаарай, алдаа гарлаа"
          description="Түр зуурын асуудал байж магадгүй. Дахин оролдоно уу, эсвэл нүүр хуудас руу буцна уу."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => retry()}>
                <RotateCcw data-icon="start" />
                Дахин оролдох
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Нүүр хуудас руу буцах</Link>
              </Button>
            </div>
          }
        />
      </div>
      {error.digest ? (
        <p className="text-sm text-muted-foreground">
          Алдааны код: <span className="tabular-nums">{error.digest}</span>
        </p>
      ) : null}
    </main>
  );
}
