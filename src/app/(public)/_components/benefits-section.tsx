import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type Benefit = { label: string; description: string };

type BenefitsSectionProps = {
  id: string;
  title: string;
  items: readonly Benefit[];
  /** "ink" бол логоны өнгөөрх бараан тууз, шар-ногоон туузын яг өмнө байрлана. */
  tone?: "light" | "ink";
  /** Жагсаалт хараахан бичигдээгүй үед харуулах хоосон хайрцгууд. */
  placeholders?: number;
};

/** Нүүр хуудсан дээр нэг төрлийн хэрэглэгч Цагтаагаас юу авахыг жагсаана. */
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
        // Одоохондоо хоосон: том дэлгэцэнд layout төлөвлөгдөж байгаа тул хоосон хайрцгууд
        // үлдэнэ, харин утсан дээр гүйлгэх үнэ цэнгүй тул харуулахгүй.
        items.length === 0 && "max-md:hidden",
        ink
          ? "border-brand-ink bg-brand-ink text-brand-ink-foreground"
          : "border-border text-foreground",
      )}
    >
      <Container className="py-16 md:py-24">
        {/* Өнгө нь хэсгээс ирнэ: `cn` нь `text-heading`-ийг (хэмжээ) өнгө гэж уншиж,
            өөр текстийн өнгөний хажууд хасах байсан. */}
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
