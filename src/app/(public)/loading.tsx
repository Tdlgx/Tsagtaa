import type { JSX } from "react";

import { Container } from "@/components/layout/container";

/** Skeleton shown while a public page is loading; header and footer stay visible. */
export default function PublicLoading(): JSX.Element {
  return (
    <Container className="py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="mx-auto flex max-w-xl animate-pulse flex-col items-center gap-4">
        <div className="h-6 w-28 rounded-full bg-muted" />
        <div className="h-12 w-2/3 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="mt-4 h-12 w-40 rounded-lg bg-muted" />
      </div>
      <div className="mt-16 grid animate-pulse gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-36 rounded-xl bg-muted" />
        ))}
      </div>
    </Container>
  );
}
