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
 * Бүртгэлтэй газрууд (/admin-д зөвшөөрөгдөж, DB-д хадгалагдсан) жишээ газруудтай
 * ижил хэлбэрээр, ингэснээр хайлт, нүүр хуудасны самбар, захиалгын хуудас хоёуланд
 * адилхан хандана. Тэдний сул цагууд өөрсдийн ажлын цагаас ирнэ.
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

/** Улаанбаатарын өнөөдөр, маргаашийн ISO гараг (1 = Даваа … 7 = Ням). */
function weekdays(now: Date): Record<SearchDay, number> {
  const iso = (date: Date): number => getZonedParts(date).weekday || 7;
  return { today: iso(now), tomorrow: iso(new Date(now.getTime() + DAY_MINUTES * 60_000)) };
}

/**
 * Газрын өөрийн тор дээрх эхлэх цагууд (нээснээс хойш `slot` минут тутамд), сайтын
 * хуваарийн харуулдаг цагийн хүрээнд, мөн хамгийн богино үйлчилгээ хаах цагаас
 * өмнө дуусах цагуудад л.
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
    // Үйлчилгээ, түүнийг хийх хүнгүйгээр захиалах зүйл алга.
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
      // Ядаж нэг хүн сул байх хооронд цагийг харуулна.
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
 * Үйлчлүүлэгчдийн олж чадах бүх газар: жишээ газрууд болон зөвшөөрөгдсөн
 * бүртгэлтэй газрууд. DB хариу өгөхгүй бол зөвхөн жишээнүүд.
 * Хүсэлт бүрт memoize хийнэ (хуудас болон түүний metadata хоёр удаа асуудаг).
 */
export const getListings = cache(async (): Promise<SampleBusiness[]> => {
  try {
    return [...SAMPLE_BUSINESSES, ...(await withDeadline(loadStoredPlaces(new Date())))];
  } catch (error) {
    console.error("Could not load registered places", error);
    return [...SAMPLE_BUSINESSES];
  }
});

/** Хаягаар нь нэг газар: жишээ, эсвэл зөвшөөрөгдсөн бүртгэлтэй газар. */
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
