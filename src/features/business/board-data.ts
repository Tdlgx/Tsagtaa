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
import { getListings } from "@/features/business/listings";
import { toMinutes, type SearchDay } from "@/features/business/search";
import { getStaff } from "@/features/staff/sample-staff";
import type { Locale } from "@/i18n/config";
import { withDeadline } from "@/lib/db";

/** Самбар дээрх эхлэх цаг; `taken` = хуваарь гарснаас хойш хэн нэгэн захиалсан. */
export type BoardSlot = { time: string; taken: boolean };

/** Нүүр хуудасны самбар дээрх нэг газар, аль хэдийн зочны хэл дээр. */
export type BoardRow = {
  slug: string;
  name: string;
  area: string;
  district: DistrictSlug;
  category: BusinessCategorySlug;
  group: CategoryGroupSlug;
  rating: number;
  reviewCount: number;
  /** Мөр газрын эхний (хамгийн их захиалагддаг) үйлчилгээг харуулна. */
  serviceIndex: number;
  service: string;
  price: number;
  /** Минут. */
  duration: number;
  slots: Record<SearchDay, BoardSlot[]>;
};

/**
 * Газар бүрийн өнөөдөр, маргаашийн сул цагууд, DB-д аль хэдийн захиалагдсаныг нь
 * тэмдэглэсэн, захиалгын хуудастай ижил дүрмээр: тэр үед ажиллаж буй хэн нэгэнд
 * үйлчилгээний бүтэн хугацаа сул байвал цаг сул. DB-д хүрч чадахгүй бол энгийн хуваарийг харуулна.
 */
export async function getBoardRows(locale: Locale, now: Date): Promise<BoardRow[]> {
  // Жишээ газрууд болон зөвшөөрөгдсөн бүх бүртгэлтэй газар.
  const listings = await getListings();
  const { from, to } = getBookableWindow(now);
  let ranges: Awaited<ReturnType<typeof getTakenRangesForMany>> = [];
  try {
    ranges = await withDeadline(
      getTakenRangesForMany(
        listings.map((business) => business.slug),
        from,
        to,
      ),
    );
  } catch (error) {
    console.error("Could not load booked times for the board", error);
  }

  return listings.flatMap((business): BoardRow[] => {
    const service = business.services[0];
    if (!service) return [];
    const local = localizeBusiness(business, locale);
    const staff = getStaff(business, "mn");
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
