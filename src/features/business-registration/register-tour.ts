import type { TourStep } from "@/features/onboarding/components/guided-tour";
import type { Dictionary } from "@/i18n/dictionaries";

/** Аяллын алхам бүр юуг заах вэ; текст нь `t.register.tour`. Нуугдсан элементүүдийг алгасна. */
const TARGETS = [
  '[data-tour="reg-stepper"]',
  '[data-tour="reg-step"]',
  '[data-tour="reg-preview"]',
  '[data-tour="reg-score"]',
  '[data-tour="reg-draft"]',
  '[data-tour="reg-actions"]',
] as const;

/** Бүртгэлийн аяллын алхмууд: элемент бүрийг зочны хэл дээрх текстэй нь хослуулна. */
export function getRegisterTour(t: Dictionary): TourStep[] {
  return TARGETS.flatMap((target, index) => {
    const text = t.register.tour[index];
    return text ? [{ target, ...text }] : [];
  });
}
