import "server-only";

import { getBookableWindow, isTaken, toTakenSlots } from "@/features/booking/availability";
import { getTakenRangesForMany } from "@/features/booking/booking-db";
import {
  getBusinessCategory,
  type BusinessCategorySlug,
  type CategoryGroupSlug,
} from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import { localizeBusiness } from "@/features/business/localize";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { toMinutes, type SearchDay } from "@/features/business/search";
import { getSampleStaff } from "@/features/staff/sample-staff";
import type { Locale } from "@/i18n/config";

/** A start time on the board; `taken` = someone booked it since the schedule was made. */
export type BoardSlot = { time: string; taken: boolean };

/** One place on the home page board, already in the visitor's language. */
export type BoardRow = {
  slug: string;
  name: string;
  area: string;
  district: DistrictSlug;
  category: BusinessCategorySlug;
  group: CategoryGroupSlug;
  rating: number;
  reviewCount: number;
  /** The row shows the place's first (most booked) service. */
  serviceIndex: number;
  service: string;
  price: number;
  /** Minutes. */
  duration: number;
  slots: Record<SearchDay, BoardSlot[]>;
};

/**
 * Every place's open times for today and tomorrow, with the ones already
 * booked in the database marked, using the same rule as the booking page: a
 * time is free while someone on duty then has the whole service length free.
 * If the database cannot be reached, the plain schedule is shown.
 */
export async function getBoardRows(locale: Locale, now: Date): Promise<BoardRow[]> {
  const { from, to } = getBookableWindow(now);
  let ranges: Awaited<ReturnType<typeof getTakenRangesForMany>> = [];
  try {
    ranges = await getTakenRangesForMany(
      SAMPLE_BUSINESSES.map((business) => business.slug),
      from,
      to,
    );
  } catch (error) {
    console.error("Could not load booked times for the board", error);
  }

  return SAMPLE_BUSINESSES.flatMap((business): BoardRow[] => {
    const service = business.services[0];
    if (!service) return [];
    const local = localizeBusiness(business, locale);
    const staff = getSampleStaff(business, "mn");
    const taken = toTakenSlots(
      ranges.filter((range) => range.businessSlug === business.slug),
      now,
    );
    const slotsFor = (day: SearchDay): BoardSlot[] =>
      business.open[day].map((time) => ({
        time,
        taken: !staff.some(
          (member) =>
            member.open[day].includes(time) &&
            !isTaken(taken, member.id, day, toMinutes(time), service.duration),
        ),
      }));

    return [
      {
        slug: business.slug,
        name: local.name,
        area: local.area,
        district: business.district,
        category: business.category,
        group: getBusinessCategory(business.category).group,
        rating: business.rating,
        reviewCount: business.reviewCount,
        serviceIndex: 0,
        service: local.services[0]?.name ?? service.name,
        price: service.price,
        duration: service.duration,
        slots: { today: slotsFor("today"), tomorrow: slotsFor("tomorrow") },
      },
    ];
  });
}
