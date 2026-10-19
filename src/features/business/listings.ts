import "server-only";

import { cache } from "react";

import { getBookableWindow, isTaken, toTakenSlots } from "@/features/booking/availability";
import { getTakenRangesForMany } from "@/features/booking/booking-db";
import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import { SAMPLE_BUSINESSES, type SampleBusiness } from "@/features/business/sample-businesses";
import { DAY_END, DAY_START, toClock, toMinutes, type SearchDay } from "@/features/business/search";
import { getZonedParts } from "@/lib/date";
import { sql, withDeadline } from "@/lib/db";

/*
 * Registered places (approved in /admin, stored in the database) in the same
 * shape as the sample places, so search, the home board and the booking page
 * treat both alike. Their open times come from their own working hours.
 */

const SAMPLE_SLUGS = SAMPLE_BUSINESSES.map((business) => business.slug);
const DAY_MINUTES = 24 * 60;

type StoredPlace = {
  slug: string;
  name: string;
  category: BusinessCategorySlug;
  district: DistrictSlug;
  address: string;
  slotMinutes: number;
  services: { name: string; duration: number; price: number }[] | null;
  staff: { position: number; name: string }[] | null;
  hours: { weekday: number; opens: string; closes: string }[] | null;
};

/** ISO weekday (1 = Monday … 7 = Sunday) of today and tomorrow in Ulaanbaatar. */
function weekdays(now: Date): Record<SearchDay, number> {
  const iso = (date: Date): number => getZonedParts(date).weekday || 7;
  return { today: iso(now), tomorrow: iso(new Date(now.getTime() + DAY_MINUTES * 60_000)) };
}

/**
 * Start times on the place's own grid (every `slot` minutes from opening),
 * kept to the hours the site's schedule shows, and only where the shortest
 * service still ends by closing time.
 */
function startTimes(opens: number, closes: number, slot: number, shortest: number): string[] {
  const times: string[] = [];
  for (let start = opens; start + shortest <= closes; start += slot) {
    if (start >= DAY_START && start < DAY_END) times.push(toClock(start));
  }
  return times;
}

async function loadStoredPlaces(now: Date, slug?: string): Promise<SampleBusiness[]> {
  const rows = await sql<StoredPlace[]>`
    SELECT b.slug, b.name, b.category, b.district, b.address, b.slot_minutes AS "slotMinutes",
      (SELECT json_agg(json_build_object('name', s.name, 'duration', s.duration_min, 'price', s.price)
        ORDER BY s.position) FROM services s WHERE s.business_id = b.id) AS services,
      (SELECT json_agg(json_build_object('position', st.position, 'name', st.name)
        ORDER BY st.position) FROM staff st WHERE st.business_id = b.id) AS staff,
      (SELECT json_agg(json_build_object('weekday', h.weekday,
          'opens', to_char(h.opens, 'HH24:MI'), 'closes', to_char(h.closes, 'HH24:MI')))
        FROM business_hours h WHERE h.business_id = b.id) AS hours
    FROM businesses b
    WHERE b.status = 'active'
      AND b.slug NOT IN ${sql(SAMPLE_SLUGS)}
      AND ${slug ? sql`b.slug = ${slug}` : sql`true`}
    ORDER BY b.created_at DESC
  `;
  if (rows.length === 0) return [];

  const { from, to } = getBookableWindow(now);
  const ranges = await getTakenRangesForMany(
    rows.map((row) => row.slug),
    from,
    to,
  );
  const days = weekdays(now);

  return rows.flatMap((row): SampleBusiness[] => {
    const services = row.services ?? [];
    const staff = row.staff ?? [];
    // Nothing to book without a service and someone to do it.
    if (services.length === 0 || staff.length === 0) return [];
    const shortest = Math.min(...services.map((service) => service.duration));
    const taken = toTakenSlots(
      ranges.filter((range) => range.businessSlug === row.slug),
      now,
    );

    const day = (key: SearchDay): { times: string[]; closes: number | null } => {
      const hours = row.hours?.find((item) => item.weekday === days[key]);
      if (!hours) return { times: [], closes: null };
      const opens = toMinutes(hours.opens);
      const closes = toMinutes(hours.closes);
      // A time is shown while at least one person is still free for it.
      const times = startTimes(opens, closes, row.slotMinutes, shortest).filter((time) =>
        staff.some(
          (member) =>
            !isTaken(taken, `${row.slug}-${member.position}`, key, toMinutes(time), shortest),
        ),
      );
      return { times, closes };
    };
    const today = day("today");
    const tomorrow = day("tomorrow");

    return [
      {
        slug: row.slug,
        name: row.name,
        category: row.category,
        district: row.district,
        area: row.address,
        rating: 0,
        reviewCount: 0,
        services,
        open: { today: today.times, tomorrow: tomorrow.times },
        staff,
        closesAt: { today: today.closes, tomorrow: tomorrow.closes },
        isNew: true,
      },
    ];
  });
}

/**
 * Every place customers can find: the samples and the approved registered
 * places. If the database does not answer, the samples alone.
 * Memoized per request (the page and its metadata ask twice).
 */
export const getListings = cache(async (): Promise<SampleBusiness[]> => {
  try {
    return [...SAMPLE_BUSINESSES, ...(await withDeadline(loadStoredPlaces(new Date())))];
  } catch (error) {
    console.error("Could not load registered places", error);
    return [...SAMPLE_BUSINESSES];
  }
});

/** One place by its address: a sample, or an approved registered place. */
export const findListing = cache(async (slug: string): Promise<SampleBusiness | null> => {
  const sample = SAMPLE_BUSINESSES.find((business) => business.slug === slug);
  if (sample) return sample;
  try {
    const [place] = await withDeadline(loadStoredPlaces(new Date(), slug));
    return place ?? null;
  } catch (error) {
    console.error("Could not load the place", error);
    return null;
  }
});
