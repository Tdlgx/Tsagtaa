import type { JSX, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Гарчгийн дээрх жижиг шошго, жишээ нь "Ангилал". */
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  /** Жишээ нь утсан дээр тайлбарыг нуух. */
  descriptionClassName?: string;
  /** Document outline зөв байхад зориулсан гарчгийн түвшин; харагдах байдал ижил. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Хэсгийн толгой: сонголттой богино шошго, өргөн display гарчиг, тайван тайлбар. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  descriptionClassName,
  as: Heading = "h2",
  className,
}: SectionHeadingProps): JSX.Element {
  return (
    <div className={cn("flex max-w-2xl flex-col", className)}>
      {eyebrow ? <p className="mb-3 text-sm font-medium text-primary-strong">{eyebrow}</p> : null}
      <Heading className="font-heading text-heading font-medium text-foreground">{title}</Heading>
      {description ? (
        <p className={cn("mt-4 max-w-prose text-base text-muted-foreground", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
