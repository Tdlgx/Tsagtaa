import type { TourStep } from "@/features/onboarding/components/guided-tour";
import type { Dictionary } from "@/i18n/dictionaries";

/** Танилцуулгын алхам бүр юуг заах вэ, унших дарааллаар; текст нь `t.search.tour`. */
const TARGETS = [
  '[data-tour="search"]',
  '[data-tour="categories"]',
  '[data-tour="filters"]',
  '[data-tour="day-strip"]',
  '[data-tour="slots"]',
  '[data-tour-nav="/bookings"]',
] as const;

/** Хайлтын хуудасны анхны айлчлалын танилцуулга, зочны хэлээр. */
export function getSearchTour(t: Dictionary): TourStep[] {
  return TARGETS.flatMap((target, index) => {
    const text = t.search.tour[index];
    return text ? [{ target, ...text }] : [];
  });
}
