/** Opening this link on the search page starts the guided tour. */
export const TOUR_HREF = "/search?tour=1";
export const TOUR_PARAM = "tour";

const SEEN_KEY = "tsagtaa.onboarding.v1";

/** True once the visitor has taken or skipped the welcome. Blocked storage counts as seen (no nagging). */
export function hasSeenOnboarding(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // Storage blocked: the welcome may show again next visit, which is harmless.
  }
}
