import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

import { UlziiPattern } from "@/components/shared/ulzii";
import { Badge } from "@/components/ui/badge";
import { cardVariants } from "@/components/ui/card";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import { cn } from "@/lib/utils";

type BusinessCardProps = {
  name: string;
  category: BusinessCategorySlug;
  location: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  /** When set, the whole card becomes one link (stretched-link pattern). */
  href?: string;
  className?: string;
};

export function BusinessCard({
  name,
  category,
  location,
  rating,
  reviewCount,
  imageUrl,
  href,
  className,
}: BusinessCardProps): JSX.Element {
  const { label, icon: CategoryIcon } = getBusinessCategory(category);

  return (
    <article
      className={cn(
        cardVariants({ variant: href ? "interactive" : "default" }),
        "gap-0 py-0",
        className,
      )}
    >
      {/* Inner radius = card radius − 1px border, so the corners stay concentric. */}
      <div className="relative aspect-4/3 overflow-hidden rounded-t-[calc(var(--radius-lg)-1px)] bg-surface-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-soft to-sun-soft">
            <UlziiPattern
              className="absolute inset-0 size-full text-primary-strong opacity-10"
              tile={56}
            />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-surface text-primary-strong shadow-sm">
              <CategoryIcon className="size-6" />
            </span>
          </div>
        )}
        <Badge tone="outline" className="absolute top-3 left-3">
          {label}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-medium text-foreground">
            {href ? (
              <Link href={href} className="outline-none after:absolute after:inset-0">
                {name}
              </Link>
            ) : (
              name
            )}
          </h3>
          {rating !== undefined ? (
            <p className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums">
              <span className="sr-only">Үнэлгээ:</span>
              <Star className="size-4 fill-sun text-sun" />
              {rating.toFixed(1)}
              {reviewCount !== undefined ? (
                <span className="font-normal text-muted-foreground">
                  ({reviewCount}
                  <span className="sr-only"> сэтгэгдэл</span>)
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      </div>
    </article>
  );
}
