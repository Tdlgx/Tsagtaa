import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type Benefit = { label: string; description: string };

type BenefitsSectionProps = {
  id: string;
  title: string;
  items: readonly Benefit[];
  /** "ink" is the dark band in the logo's colors, placed right before the lime one. */
  tone?: "light" | "ink";
  /** Empty slots shown while the list has not been written yet. */
  placeholders?: number;
};

/** Home-page list of what one audience gets from Цагтаа. */
export function BenefitsSection({
  id,
  title,
  items,
  tone = "light",
  placeholders = 3,
}: BenefitsSectionProps): JSX.Element {
  const ink = tone === "ink";
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "scroll-mt-16 border-t",
        ink
          ? "border-brand-ink bg-brand-ink text-brand-ink-foreground"
          : "border-border text-foreground",
      )}
    >
      <Container className="py-16 md:py-24">
        {/* Color comes from the section: `cn` would read `text-heading` (a size)
            as a color and drop it next to another text color. */}
        <h2 id={titleId} className="max-w-2xl font-heading text-heading font-medium">
          {title}
        </h2>

        {items.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ label, description }) => (
              <li
                key={label}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-6",
                  ink ? "border-brand-ink-muted/25" : "border-border bg-surface",
                )}
              >
                <h3 className="font-heading text-lg font-medium tracking-tight">{label}</h3>
                <p
                  className={cn(
                    "text-base",
                    ink ? "text-brand-ink-muted" : "text-muted-foreground",
                  )}
                >
                  {description}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div aria-hidden className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: placeholders }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "min-h-40 rounded-xl border-2 border-dashed",
                  ink ? "border-brand-ink-muted/25" : "border-border",
                )}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
