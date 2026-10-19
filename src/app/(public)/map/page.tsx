import type { Metadata } from "next";
import type { JSX } from "react";

import { MapExplorer, type MapEntry } from "@/app/(public)/map/_components/map-explorer";
import { Container } from "@/components/layout/container";
import { getMapBusinesses } from "@/features/business/media-db";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { getI18n } from "@/i18n/server";
import { withDeadline } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.map.metaTitle, description: t.map.metaDescription };
}

/** A real place joined in the last month gets a "new" badge. */
const NEW_FOR_DAYS = 30;
const BOOKABLE = new Set(SAMPLE_BUSINESSES.map((business) => business.slug));

async function loadEntries(): Promise<MapEntry[]> {
  try {
    const rows = await withDeadline(getMapBusinesses());
    const newSince = Date.now() - NEW_FOR_DAYS * 24 * 60 * 60 * 1000;
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      district: row.district,
      address: row.address,
      phone: row.phone,
      lat: row.lat,
      lng: row.lng,
      logoUrl: row.logoId ? `/api/business-images/${row.logoId}` : null,
      photoUrl: row.photoId ? `/api/business-images/${row.photoId}` : null,
      bookable: BOOKABLE.has(row.slug),
      isNew: !BOOKABLE.has(row.slug) && row.createdAt.getTime() > newSince,
    }));
  } catch (error) {
    console.error("Could not load the map", error);
    return [];
  }
}

/** Every live place on a map of the city, newest first in the list. */
export default async function MapPage(): Promise<JSX.Element> {
  const { t } = await getI18n();
  const entries = await loadEntries();
  return (
    <Container className="pt-6 pb-16 md:pt-10 md:pb-24">
      <h1 className="font-heading text-heading font-medium text-foreground">{t.map.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.map.lead(entries.length)}</p>
      <MapExplorer entries={entries} />
    </Container>
  );
}
