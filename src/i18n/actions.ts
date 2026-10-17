"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Saves the chosen language; the caller refreshes so the server re-renders in it. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}
