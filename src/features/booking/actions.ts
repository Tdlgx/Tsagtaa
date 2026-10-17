"use server";

import { z } from "zod";

import { normalizePhone, toStartInstant, type Booking } from "@/features/booking/booking";
import { cancelBookingRow, insertBooking, isBookable } from "@/features/booking/booking-db";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { isAllowedSpend, pointsToEarn } from "@/features/points/points";
import { getLoyaltySettings } from "@/features/points/points-db";
import { getSampleStaff } from "@/features/staff/sample-staff";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentAccount } from "@/lib/auth/session";

/** "No preference": the server picks the first free person. */
const ANY_STAFF = "any";

const createInput = z.object({
  requestId: z.uuid(),
  slug: z.string().max(80),
  serviceIndex: z.number().int().min(0),
  staffId: z.string().max(80),
  day: z.enum(["today", "tomorrow"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(20),
  note: z.string().trim().max(300),
  // Consent is required before any personal data is stored.
  consent: z.literal(true),
  // Points to spend; only a signed-in customer can, and the rules are checked here.
  points: z.number().int().min(0).max(10_000_000).default(0),
});

export type CreateBookingInput = z.input<typeof createInput>;

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | {
      ok: false;
      /**
       * slot_taken: someone else got the time first. unavailable: not on the
       * schedule (any more). points: not enough points (any more).
       */
      error: "invalid" | "unavailable" | "slot_taken" | "points" | "server";
    };

/**
 * Books a time. Server Actions can be called by anyone with a POST, so
 * nothing from the browser is trusted: the business, service, price,
 * duration, staff and start time are all looked up or computed here.
 */
export async function createBookingAction(input: unknown): Promise<CreateBookingResult> {
  const parsed = createInput.safeParse(input);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const business = SAMPLE_BUSINESSES.find((item) => item.slug === data.slug);
  const service = business?.services[data.serviceIndex];
  if (!business || !service) return { ok: false, error: "invalid" };

  // People on duty at that time; the database decides which of them is still free.
  const staff = getSampleStaff(business, "mn");
  const candidates = staff.filter(
    (member) =>
      (data.staffId === ANY_STAFF || member.id === data.staffId) &&
      member.open[data.day].includes(data.time),
  );
  const now = new Date();
  const startsAt = toStartInstant(data.day, data.time, now);
  if (candidates.length === 0 || startsAt <= now) return { ok: false, error: "unavailable" };

  try {
    // A place the Цагтаа team suspended (or has not approved) takes no bookings.
    if (!(await isBookable(business.slug))) return { ok: false, error: "unavailable" };

    // Points belong to the signed-in account, never to a phone typed in the form.
    const account = await getCurrentAccount();
    const settings = account ? await getLoyaltySettings() : null;
    const pointsUsed = data.points;
    if (pointsUsed > 0 && (!settings || !isAllowedSpend(pointsUsed, service.price, settings))) {
      return { ok: false, error: "invalid" };
    }
    const pointsEarn = settings ? pointsToEarn(service.price, pointsUsed, settings) : 0;

    const result = await insertBooking({
      requestId: data.requestId,
      businessSlug: business.slug,
      staffIds: candidates.map((member) => member.id),
      serviceName: service.name,
      durationMin: service.duration,
      price: service.price,
      startsAt,
      customerName: data.name,
      phone,
      note: data.note,
      consentedAt: now,
      customerAccountId: account?.id ?? null,
      pointsUsed,
      pointsEarn,
    });
    if (!result.ok) {
      return {
        ok: false,
        error:
          result.reason === "slot_taken"
            ? "slot_taken"
            : result.reason === "points"
              ? "points"
              : "invalid",
      };
    }

    const { row } = result;
    const member = staff.find((person) => person.id === row.staffId);
    // Saved in the source language; every screen localizes it when shown.
    return {
      ok: true,
      booking: {
        id: row.id,
        code: row.code,
        businessSlug: business.slug,
        businessName: business.name,
        category: business.category,
        district: business.district,
        area: business.area,
        serviceName: service.name,
        duration: service.duration,
        price: service.price,
        staffName: member?.canonicalName ?? "",
        staffRole: getDictionary("mn").staff[business.category].role,
        startsAt: row.startsAt.toISOString(),
        customerName: data.name,
        phone,
        note: data.note,
        status: "confirmed",
        createdAt: row.createdAt.toISOString(),
        consentedAt: now.toISOString(),
        pointsUsed,
        pointsToEarn: pointsEarn,
      },
    };
  } catch (error) {
    console.error("createBookingAction failed", error);
    return { ok: false, error: "server" };
  }
}

const cancelInput = z.object({ id: z.uuid(), phone: z.string().max(20) });

export type CancelBookingResult = { ok: true } | { ok: false; error: "not_found" | "server" };

/** Cancels a stored booking; the phone number must match the booking's. */
export async function cancelBookingAction(input: unknown): Promise<CancelBookingResult> {
  const parsed = cancelInput.safeParse(input);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) return { ok: false, error: "not_found" };

  try {
    return (await cancelBookingRow(parsed.data.id, phone))
      ? { ok: true }
      : { ok: false, error: "not_found" };
  } catch (error) {
    console.error("cancelBookingAction failed", error);
    return { ok: false, error: "server" };
  }
}
