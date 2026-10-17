"use client";

import {
  draftSchema,
  EMPTY_DRAFT,
  type RegistrationDraft,
} from "@/features/business-registration/registration";
import { createLocalStore } from "@/lib/local-store";

/**
 * The registration form, autosaved on this device: closing the tab or
 * losing the connection never loses what was typed.
 */
const store = createLocalStore<RegistrationDraft>(
  "tsagtaa.business-draft.v1",
  EMPTY_DRAFT,
  (raw) => {
    const parsed = draftSchema.safeParse(raw);
    return parsed.success ? parsed.data : EMPTY_DRAFT;
  },
);

/** `null` while rendering on the server / hydrating. */
export function useDraft(): RegistrationDraft | null {
  return store.use();
}

/** Applies a change; the first change also gives the form its request id. */
export function updateDraft(change: (draft: RegistrationDraft) => RegistrationDraft): void {
  const next = change(store.read());
  store.write(next.requestId ? next : { ...next, requestId: crypto.randomUUID() });
}

export function clearDraft(): void {
  store.clear();
}

/** True when the visitor has typed or chosen anything worth restoring. */
export function hasProgress(draft: RegistrationDraft): boolean {
  return draft.category !== null || draft.name.trim() !== "" || draft.services.length > 0;
}

const TOUR_SEEN_KEY = "tsagtaa.business-tour.v1";

/** The registration tour starts by itself once; afterwards only from its button. */
export function takeFirstTourVisit(): boolean {
  try {
    if (window.localStorage.getItem(TOUR_SEEN_KEY)) return false;
    window.localStorage.setItem(TOUR_SEEN_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
