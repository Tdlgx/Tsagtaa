import type { TourStep } from "@/features/onboarding/components/guided-tour";
import type { Dictionary } from "@/i18n/dictionaries";

/** What each tour step points at, in reading order; the text is `t.search.tour`. */
const TARGETS = [
  '[data-tour="search"]',
  '[data-tour="categories"]',
  '[data-tour="filters"]',
  '[data-tour="day-strip"]',
  '[data-tour="slots"]',
  '[data-tour-nav="/bookings"]',
] as const;

/** The first-visit tour of the search page, in the visitor's language. */
export function getSearchTour(t: Dictionary): TourStep[] {
  return TARGETS.flatMap((target, index) => {
    const text = t.search.tour[index];
    return text ? [{ target, ...text }] : [];
  });
}
