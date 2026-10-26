import { normalizePhone } from "@/features/booking/booking";

/** Санаатайгаар сул шалгалт: өгөгдлийн сан ижил дүрэмтэй, үсгийн алдаа нэвтрэх үед илэрнэ. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 120;

/** " Bold@Gmail.com " → "bold@gmail.com" (хадгалах хэлбэр); хаяг биш бол null. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email) ? email : null;
}

export type LoginId = { kind: "phone"; phone: string } | { kind: "email"; email: string };

/** Нэвтрэх талбарт бичсэн зүйл: "@" байвал имэйл, үгүй бол утас. */
export function parseLoginId(input: string): LoginId | null {
  if (input.includes("@")) {
    const email = normalizeEmail(input);
    return email ? { kind: "email", email } : null;
  }
  const phone = normalizePhone(input);
  return phone ? { kind: "phone", phone } : null;
}
