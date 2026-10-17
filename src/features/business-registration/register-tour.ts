import type { TourStep } from "@/features/onboarding/components/guided-tour";
import type { Dictionary } from "@/i18n/dictionaries";

/** What each tour step points at; the text is `t.register.tour`. Hidden targets are skipped. */
const TARGETS = [
  '[data-tour="reg-stepper"]',
  '[data-tour="reg-step"]',
  '[data-tour="reg-preview"]',
  '[data-tour="reg-score"]',
  '[data-tour="reg-draft"]',
  '[data-tour="reg-actions"]',
] as const;

export function getRegisterTour(t: Dictionary): TourStep[] {
  return TARGETS.flatMap((target, index) => {
    const text = t.register.tour[index];
    return text ? [{ target, ...text }] : [];
  });
}
