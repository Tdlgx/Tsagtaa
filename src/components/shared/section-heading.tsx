import type { JSX, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Small label above the title, e.g. "Ангилал". */
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  /** Heading level for correct document outline; looks the same. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Section header: optional short label, wide display title, calm description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  className,
}: SectionHeadingProps): JSX.Element {
  return (
    <div className={cn("flex max-w-2xl flex-col", className)}>
      {eyebrow ? <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p> : null}
      <Heading className="font-heading text-heading font-medium text-foreground">{title}</Heading>
      {description ? (
        <p className="mt-4 max-w-prose text-base text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
