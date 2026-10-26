import type { JSX, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ArtboardProps = {
  id: string;
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Canvas дээрх гарчигтай хүрээ, Affinity Designer-ийн artboard шиг. */
export function Artboard({
  id,
  number,
  title,
  description,
  children,
  className,
}: ArtboardProps): JSX.Element {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <p className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="tabular-nums">{String(number).padStart(2, "0")}</span>
        <span aria-hidden className="h-px w-6 bg-border" />
        {id}
      </p>
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <header className="border-b border-border px-5 py-5 md:px-8">
          <h2 id={`${id}-title`} className="font-heading text-xl font-medium text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
        <div className={cn("flex flex-col gap-10 px-5 py-6 md:px-8 md:py-8", className)}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Жишээний доор эсвэл дээр байх жижиг тайлбар. */
export function Spec({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}

/** Artboard доторх дэд гарчиг. */
export function BoardSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}
