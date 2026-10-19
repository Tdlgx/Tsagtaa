"use server";

import { normalizePhone } from "@/features/booking/booking";
import {
  insertBusiness,
  isSlugFree,
  suggestSlug,
} from "@/features/business-registration/registration-db";
import { isAcceptablePassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import {
  firstInvalidStep,
  isValidSlug,
  normalizeRegisterNumber,
  registrationInput,
  type RegistrationDraft,
} from "@/features/business-registration/registration";
import { roundLatLng } from "@/features/business/locations";

export type SlugCheck =
  | { slug: string; status: "available" }
  | { slug: string; status: "taken"; suggestion: string }
  | { slug: string; status: "invalid" | "unknown" };

/** Live "is this address free?" while the owner types. */
export async function checkSlugAction(slug: unknown): Promise<SlugCheck> {
  const value = typeof slug === "string" ? slug : "";
  if (!isValidSlug(value)) return { slug: value, status: "invalid" };
  try {
    if (await isSlugFree(value)) return { slug: value, status: "available" };
    return { slug: value, status: "taken", suggestion: await suggestSlug(value) };
  } catch (error) {
    console.error("checkSlugAction failed", error);
    return { slug: value, status: "unknown" };
  }
}

export type RegisterBusinessResult =
  | { ok: true; slug: string; createdAt: string }
  | {
      ok: false;
      error: "invalid" | "slug_taken" | "register_taken" | "owner_password" | "password" | "server";
      /** Which step to send the owner back to. */
      step?: number;
      suggestion?: string;
    };

/**
 * Registers a business. Anyone can POST to a Server Action, so the input is
 * parsed and every rule from the form is checked again here.
 */
export async function registerBusinessAction(input: unknown): Promise<RegisterBusinessResult> {
  const parsed = registrationInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (!isAcceptablePassword(data.password)) return { ok: false, error: "password", step: 5 };

  const phone = normalizePhone(data.phone);
  const draft: RegistrationDraft = {
    ...data,
    step: 0,
    slugEdited: true,
    hoursEdited: true,
  };
  const invalidStep = firstInvalidStep(draft);
  if (!phone || invalidStep !== -1) {
    return { ok: false, error: "invalid", step: invalidStep === -1 ? 1 : invalidStep };
  }

  try {
    const result = await insertBusiness({
      requestId: data.requestId,
      slug: data.slug,
      name: data.name,
      category: data.category,
      district: data.district,
      address: data.address,
      phone,
      email: data.email || null,
      registerNumber: data.registerNumber ? normalizeRegisterNumber(data.registerNumber) : null,
      location: data.location ? roundLatLng(data.location) : null,
      description: data.description,
      slotMinutes: data.slotMinutes,
      hours: data.hours.flatMap((item, index) =>
        item.open ? [{ weekday: index + 1, opens: item.opens, closes: item.closes }] : [],
      ),
      services: data.services.map(({ name, duration, price }) => ({ name, duration, price })),
      staff: data.staff.map((member) => member.name),
      consentedAt: new Date(),
      owner: { name: data.ownerName, password: data.password },
    });

    if (result.ok) {
      // Signed in straight away, so the dashboard is one tap from the success screen.
      await startSession(result.ownerId);
      return { ok: true, slug: result.slug, createdAt: result.createdAt.toISOString() };
    }
    if (result.reason === "owner_password") return { ok: false, error: "owner_password", step: 5 };
    if (result.reason === "slug_taken") {
      return { ok: false, error: "slug_taken", step: 1, suggestion: result.suggestion };
    }
    if (result.reason === "register_taken") return { ok: false, error: "register_taken", step: 1 };
    return { ok: false, error: "invalid" };
  } catch (error) {
    console.error("registerBusinessAction failed", error);
    return { ok: false, error: "server" };
  }
}
