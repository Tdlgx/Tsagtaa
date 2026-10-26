/** Хайлтын хуудсан дээр энэ холбоосыг нээхэд заавартай аялал эхэлнэ. */
export const TOUR_HREF = "/search?tour=1";
export const TOUR_PARAM = "tour";

const SEEN_KEY = "tsagtaa.onboarding.v1";

/** Зочин мэндчилгээг үзсэн эсвэл алгассан бол true. Хаагдсан storage-ийг үзсэнд тооцно (дахин дахин гаргахгүй). */
export function hasSeenOnboarding(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

/** Зочин мэндчилгээг үзсэн эсвэл алгассан гэж санана. */
export function markOnboardingSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // Storage хаалттай: дараагийн айлчлалд мэндчилгээ дахин гарч магадгүй, энэ нь хоргүй.
  }
}
