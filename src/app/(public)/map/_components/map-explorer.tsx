"use client";

import { ArrowRight, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, type JSX } from "react";

import { BusinessMap, type MapPlace } from "@/components/shared/map/business-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/features/booking/booking";
import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import { localizeBusiness } from "@/features/business/localize";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { useLocale, useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type MapEntry = {
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  logoUrl: string | null;
  photoUrl: string | null;
  /** Takes bookings on the site (for now, the sample places). */
  bookable: boolean;
  /** Joined recently. */
  isNew: boolean;
};

/**
 * The map with a list underneath (on wide screens, beside it). Choosing a
 * pin or a list row shows that place's card. The list is also how keyboard
 * and screen-reader users reach every place.
 */
export function MapExplorer({ entries }: { entries: readonly MapEntry[] }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Sample places have English names too.
  const named = useMemo(
    () =>
      entries.map((entry) => {
        const sample = SAMPLE_BUSINESSES.find((business) => business.slug === entry.slug);
        return sample ? { ...entry, name: localizeBusiness(sample, locale).name } : entry;
      }),
    [entries, locale],
  );
  const places = useMemo<MapPlace[]>(
    () => named.map(({ slug, name, lat, lng, logoUrl }) => ({ slug, name, lat, lng, logoUrl })),
    [named],
  );
  const current = named.find((entry) => entry.slug === selected) ?? null;

  if (entries.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted-foreground">
        {t.map.empty}
      </p>
    );
  }

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
      <div
        ref={mapRef}
        className="flex scroll-mt-20 flex-col gap-3 lg:sticky lg:top-20 lg:self-start"
      >
        <BusinessMap
          places={places}
          selected={selected}
          onSelect={setSelected}
          label={t.map.mapLabel}
          className="h-[52vh] min-h-72 lg:h-[70vh]"
        />
        {current ? <PlaceCard entry={current} t={t} /> : null}
      </div>

      <section aria-labelledby="map-list-title">
        <h2 id="map-list-title" className="text-sm font-medium text-muted-foreground">
          {t.map.listTitle}
        </h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {named.map((entry) => (
            <li key={entry.slug}>
              <button
                type="button"
                aria-pressed={entry.slug === selected}
                onClick={() => {
                  setSelected(entry.slug);
                  // On phones the map is above the list: bring it back into view.
                  if (window.matchMedia("(max-width: 1023px)").matches) {
                    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset",
                  entry.slug === selected ? "bg-primary-soft" : "is-hover:bg-surface-muted",
                )}
              >
                <Logo entry={entry} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {entry.name}
                    </span>
                    {entry.isNew ? <Badge tone="sun">{t.map.new}</Badge> : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {describe(entry, t)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function describe(entry: MapEntry, t: Dictionary): string {
  const category = t.categories[entry.category as BusinessCategorySlug]?.label ?? entry.category;
  const district = t.districts[entry.district as DistrictSlug] ?? entry.district;
  return `${category} · ${district}`;
}

function Logo({ entry, large = false }: { entry: MapEntry; large?: boolean }): JSX.Element {
  const size = large ? "size-12" : "size-9";
  return entry.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- our own small, cached images
    <img
      src={entry.logoUrl}
      alt=""
      className={cn(size, "shrink-0 rounded-lg border border-border bg-surface object-contain")}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-lg bg-brand-ink font-semibold text-primary",
      )}
    >
      {entry.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function PlaceCard({ entry, t }: { entry: MapEntry; t: Dictionary }): JSX.Element {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${entry.lat},${entry.lng}`;
  return (
    <article
      aria-live="polite"
      className="flex animate-in gap-4 overflow-hidden rounded-xl border border-border bg-surface p-4 duration-250 fade-in"
    >
      {entry.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- our own small, cached images
        <img
          src={entry.photoUrl}
          alt=""
          className="hidden size-24 shrink-0 rounded-lg object-cover sm:block"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <Logo entry={entry} large />
          <div className="min-w-0">
            <h3 className="truncate font-medium text-foreground">{entry.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{describe(entry, t)}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.address}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.bookable ? (
            <Button asChild size="sm">
              <Link href={`/book/${entry.slug}`}>
                {t.map.book}
                <ArrowRight data-icon="end" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <a href={`tel:${entry.phone}`}>
                <Phone data-icon="start" />
                {formatPhone(entry.phone)}
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={directions} target="_blank" rel="noopener noreferrer">
              <Navigation data-icon="start" />
              {t.map.directions}
            </a>
          </Button>
        </div>
        {!entry.bookable ? (
          <p className="mt-2 text-xs text-muted-foreground">{t.map.notBookableYet}</p>
        ) : null}
      </div>
    </article>
  );
}
