"use client"; // Error boundaries must be Client Components.

import { CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, type JSX } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps): JSX.Element {
  const t = useT();
  useEffect(() => {
    // Replace with an error reporting service (e.g. Sentry) in a later step.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-sm">
        <EmptyState
          icon={CircleAlert}
          title={t.errors.title}
          description={t.errors.text}
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => retry()}>
                <RotateCcw data-icon="start" />
                {t.errors.retry}
              </Button>
              <Button asChild variant="outline">
                <Link href="/">{t.common.backHome}</Link>
              </Button>
            </div>
          }
        />
      </div>
      {error.digest ? (
        <p className="text-sm text-muted-foreground">
          {t.errors.code} <span className="tabular-nums">{error.digest}</span>
        </p>
      ) : null}
    </main>
  );
}
