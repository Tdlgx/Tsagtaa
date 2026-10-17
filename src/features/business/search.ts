import { z } from "zod";

import {
  CATEGORY_FILTER_SLUGS,
  getBusinessCategory,
  matchesCategoryFilter,
  type CategoryFilterSlug,
} from "@/features/business/categories";
import { DISTRICT_SLUGS, type DistrictSlug } from "@/features/business/districts";
import { getSearchableText } from "@/features/business/localize";
import { SAMPLE_BUSINESSES, type SampleBusiness } from "@/features/business/sample-businesses";
import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { mn } from "@/i18n/dictionaries/mn";
import { formatDayLabel } from "@/i18n/format";
import { getZonedParts } from "@/lib/date";

/** Businesses are listed for one working day, 09:00–21:00 Ulaanbaatar time. */
export const DAY_START = 9 * 60;
export const DAY_END = 21 * 60;

export type SearchDay = "today" | "tomorrow";
export type TimeOfDay = "morning" | "afternoon" | "evening";
export type SearchSort = "soonest" | "rating" | "price";

export type SearchFilters = {
  q: string;
  /** A group ("salon") or one category inside it ("nails"). */
  cat: CategoryFilterSlug | "";
  district: DistrictSlug | "";
  day: SearchDay;
  time: TimeOfDay | "";
  sort: SearchSort;
};

export const DEFAULT_FILTERS: SearchFilters = {
  q: "",
  cat: "",
  district: "",
  day: "today",
  time: "",
  sort: "soonest",
};

export const SEARCH_DAYS: readonly { value: SearchDay; label: string }[] = [
  { value: "today", label: "Өнөөдөр" },
  { value: "tomorrow", label: "Маргааш" },
];

export const TIMES_OF_DAY: readonly {
  value: TimeOfDay;
  label: string;
  from: number;
  to: number;
}[] = [
  { value: "morning", label: "Өглөө", from: 9 * 60, to: 12 * 60 },
  { value: "afternoon", label: "Өдөр", from: 12 * 60, to: 17 * 60 },
  { value: "evening", label: "Орой", from: 17 * 60, to: 21 * 60 },
];

export const SEARCH_SORTS: readonly { value: SearchSort; label: string }[] = [
  { value: "soonest", label: "Хамгийн ойрын цаг" },
  { value: "rating", label: "Үнэлгээ өндөр" },
  { value: "price", label: "Үнэ хямд" },
];

const MAX_QUERY_LENGTH = 60;

type RawSearchParams = Record<string, string | string[] | undefined>;

/** `?a=1&a=2` arrives as an array; only the first value counts. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Anything missing or invalid in the URL quietly falls back to the default,
// so a hand-edited or outdated link still shows a sensible page.
const searchParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value.slice(0, MAX_QUERY_LENGTH))
    .catch(DEFAULT_FILTERS.q),
  cat: z.union([z.enum(CATEGORY_FILTER_SLUGS), z.literal("")]).catch(DEFAULT_FILTERS.cat),
  district: z.union([z.enum(DISTRICT_SLUGS), z.literal("")]).catch(DEFAULT_FILTERS.district),
  day: z.enum(["today", "tomorrow"]).catch(DEFAULT_FILTERS.day),
  time: z.enum(["morning", "afternoon", "evening", ""]).catch(DEFAULT_FILTERS.time),
  sort: z.enum(["soonest", "rating", "price"]).catch(DEFAULT_FILTERS.sort),
});

export function parseSearchParams(raw: RawSearchParams): SearchFilters {
  return searchParamsSchema.parse({
    q: first(raw.q),
    cat: first(raw.cat),
    district: first(raw.district),
    day: first(raw.day),
    time: first(raw.time),
    sort: first(raw.sort),
  });
}

/** "/search?cat=nails&day=tomorrow". Default values are left out to keep links short. */
export function toSearchHref(filters: SearchFilters): string {
  const params = new URLSearchParams();
  const keys = Object.keys(DEFAULT_FILTERS) as (keyof SearchFilters)[];

  for (const key of keys) {
    const value = filters[key].trim();
    if (value !== "" && value !== DEFAULT_FILTERS[key]) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function countActiveFilters(filters: SearchFilters): number {
  const keys = Object.keys(DEFAULT_FILTERS) as (keyof SearchFilters)[];
  return keys.filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length;
}

export function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export type SearchClock = {
  /** Minutes since midnight in Ulaanbaatar. */
  nowMinutes: number;
  /** "Мягмар, 10-р сарын 7" / "Tuesday, October 7" */
  todayLabel: string;
  tomorrowLabel: string;
};

export function getSearchClock(now: Date, locale: Locale): SearchClock {
  const { hour, minute } = getZonedParts(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    nowMinutes: hour * 60 + minute,
    todayLabel: formatDayLabel(now, locale),
    tomorrowLabel: formatDayLabel(tomorrow, locale),
  };
}

/** open: bookable · past: already gone today · outside: not in the chosen part of the day */
export type SlotState = "open" | "past" | "outside";

export type ResultSlot = { time: string; start: number; state: SlotState };

export type SearchResult = {
  business: SampleBusiness;
  slots: readonly ResultSlot[];
  openCount: number;
  /** Earliest bookable start, or null when the day is full. */
  firstOpen: number | null;
  priceFrom: number;
  /** Shortest service; sets the width of a slot on the day strip. */
  shortestService: number;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(business: SampleBusiness, query: string): boolean {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;

  const { group } = getBusinessCategory(business.category);
  // Both languages, so "маникюр" and "manicure" find the same places.
  const haystack = normalize(
    [
      business.slug,
      business.category,
      ...[mn, en].flatMap((words) => [
        words.categories[business.category].label,
        // "салон" / "salon" finds every salon type, not just places named "... салон".
        group === "salon" ? words.groups.salon.label : "",
        words.districts[business.district],
      ]),
      ...getSearchableText(business),
    ].join(" "),
  );

  // Every word must appear somewhere: "маникюр хан-уул" narrows to both.
  return words.every((word) => haystack.includes(word));
}

/**
 * Filters and sorts the sample businesses. `nowMinutes` hides today's past
 * times; pass null when searching tomorrow.
 */
export function searchBusinesses(
  filters: SearchFilters,
  nowMinutes: number | null,
): SearchResult[] {
  const range = TIMES_OF_DAY.find((item) => item.value === filters.time);

  const results = SAMPLE_BUSINESSES.filter(
    (business) =>
      (filters.cat === "" || matchesCategoryFilter(business.category, filters.cat)) &&
      (filters.district === "" || business.district === filters.district) &&
      matchesQuery(business, filters.q),
  ).map((business): SearchResult => {
    const slots = business.open[filters.day].map((time): ResultSlot => {
      const start = toMinutes(time);
      let state: SlotState = "open";
      if (nowMinutes !== null && start < nowMinutes) state = "past";
      else if (range && (start < range.from || start >= range.to)) state = "outside";
      return { time, start, state };
    });
    const open = slots.filter((slot) => slot.state === "open");

    return {
      business,
      slots,
      openCount: open.length,
      firstOpen: open[0]?.start ?? null,
      priceFrom: Math.min(...business.services.map((service) => service.price)),
      shortestService: Math.min(...business.services.map((service) => service.duration)),
    };
  });

  const byRating = (a: SearchResult, b: SearchResult): number =>
    b.business.rating - a.business.rating || b.business.reviewCount - a.business.reviewCount;

  return results.sort((a, b) => {
    // Places with no time left always go last, whatever the sort.
    if ((a.openCount === 0) !== (b.openCount === 0)) return a.openCount === 0 ? 1 : -1;
    if (filters.sort === "rating") return byRating(a, b);
    if (filters.sort === "price") return a.priceFrom - b.priceFrom || byRating(a, b);
    return (a.firstOpen ?? Infinity) - (b.firstOpen ?? Infinity) || byRating(a, b);
  });
}
