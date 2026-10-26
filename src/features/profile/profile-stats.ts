import { getBookingPhase, type Booking } from "@/features/booking/booking";
import {
  getBusinessCategory,
  type BusinessCategorySlug,
  type CategoryGroupSlug,
} from "@/features/business/categories";

export type PlaceSummary = {
  slug: string;
  name: string;
  category: BusinessCategorySlug;
  visits: number;
  /** Хамгийн сүүлийн цуцлагдаагүй захиалгын эхлэх цаг. */
  lastAt: string;
};

export type BadgeId = "first" | "regular" | "explorer" | "reliable";

/** Нэг тэмдэг рүү чиглэсэн ахиц; нэр, тайлбар нь толь бичгүүдэд байдаг. */
export type Badge = {
  id: BadgeId;
  /** 0–1 */
  progress: number;
  /** "2/3" */
  progressLabel: string;
};

export type ProfileStats = {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  /** Дууссан захиалгад зарцуулсан төгрөг. */
  spent: number;
  /** Захиалсан ч хараахан ашиглаагүй төгрөг. */
  planned: number;
  byGroup: { group: CategoryGroupSlug; count: number }[];
  places: PlaceSummary[];
  badges: Badge[];
};

function badge(id: BadgeId, current: number, goal: number): Badge {
  return {
    id,
    progress: Math.min(1, current / goal),
    progressLabel: `${Math.min(current, goal)}/${goal}`,
  };
}

/** Профайл хуудасны харуулдаг бүх зүйл, энэ төхөөрөмж дээрх захиалгуудаас гаргасан. */
export function getProfileStats(bookings: readonly Booking[], now: number): ProfileStats {
  const phases = bookings.map((booking) => ({ booking, phase: getBookingPhase(booking, now) }));
  const active = phases.filter(({ phase }) => phase !== "cancelled").map(({ booking }) => booking);
  const completed = phases.filter(({ phase }) => phase === "completed");
  const upcoming = phases.filter(({ phase }) => phase === "upcoming" || phase === "now");
  const cancelled = phases.length - active.length;

  const groupCounts = new Map<CategoryGroupSlug, number>();
  const places = new Map<string, PlaceSummary>();
  for (const booking of active) {
    const { group } = getBusinessCategory(booking.category);
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);

    const place = places.get(booking.businessSlug);
    if (place) {
      place.visits += 1;
      if (booking.startsAt > place.lastAt) place.lastAt = booking.startsAt;
    } else {
      places.set(booking.businessSlug, {
        slug: booking.businessSlug,
        name: booking.businessName,
        category: booking.category,
        visits: 1,
        lastAt: booking.startsAt,
      });
    }
  }

  const placeList = [...places.values()].sort(
    (a, b) => b.visits - a.visits || b.lastAt.localeCompare(a.lastAt),
  );
  const topVisits = placeList[0]?.visits ?? 0;

  return {
    total: bookings.length,
    upcoming: upcoming.length,
    completed: completed.length,
    cancelled,
    spent: completed.reduce((sum, { booking }) => sum + booking.price, 0),
    planned: upcoming.reduce((sum, { booking }) => sum + booking.price, 0),
    byGroup: [...groupCounts.entries()]
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count),
    places: placeList,
    badges: [
      badge("first", active.length, 1),
      badge("regular", topVisits, 3),
      badge("explorer", groupCounts.size, 3),
      badge("reliable", cancelled === 0 ? active.length : 0, 5),
    ],
  };
}
