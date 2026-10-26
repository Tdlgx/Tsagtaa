"use client";

import {
  draftSchema,
  EMPTY_DRAFT,
  type RegistrationDraft,
} from "@/features/business-registration/registration";
import { createLocalStore } from "@/lib/local-store";

/**
 * Бүртгэлийн маягт, энэ төхөөрөмж дээр автоматаар хадгалагдана: табыг хаах эсвэл
 * холболт тасрах нь бичсэн зүйлийг хэзээ ч алдуулахгүй.
 */
const store = createLocalStore<RegistrationDraft>(
  "tsagtaa.business-draft.v1",
  EMPTY_DRAFT,
  (raw) => {
    const parsed = draftSchema.safeParse(raw);
    return parsed.success ? parsed.data : EMPTY_DRAFT;
  },
);

/** Сервер дээр render / hydrate хийх үед `null`. */
export function useDraft(): RegistrationDraft | null {
  return store.use();
}

/** Өөрчлөлтийг хэрэгжүүлнэ; эхний өөрчлөлт маягтад request id-г нь мөн өгнө. */
export function updateDraft(change: (draft: RegistrationDraft) => RegistrationDraft): void {
  const next = change(store.read());
  store.write(next.requestId ? next : { ...next, requestId: crypto.randomUUID() });
}

export function clearDraft(): void {
  store.clear();
}

/** Зочин сэргээх үнэ цэнтэй ямар нэг зүйл бичсэн эсвэл сонгосон бол true. */
export function hasProgress(draft: RegistrationDraft): boolean {
  return draft.category !== null || draft.name.trim() !== "" || draft.services.length > 0;
}

const TOUR_SEEN_KEY = "tsagtaa.business-tour.v1";

/** Бүртгэлийн аялал нэг удаа өөрөө эхэлнэ; дараа нь зөвхөн товчноос нь. */
export function takeFirstTourVisit(): boolean {
  try {
    if (window.localStorage.getItem(TOUR_SEEN_KEY)) return false;
    window.localStorage.setItem(TOUR_SEEN_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
