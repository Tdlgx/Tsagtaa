"use server";

import { z } from "zod";

import { normalizePhone, toStartInstant, type Booking } from "@/features/booking/booking";
import { cancelBookingRow, insertBooking, isBookable } from "@/features/booking/booking-db";
import { findListing } from "@/features/business/listings";
import { closingMinutes, toMinutes } from "@/features/business/search";
import { isAllowedSpend, pointsToEarn } from "@/features/points/points";
import { getLoyaltySettings } from "@/features/points/points-db";
import { getStaff } from "@/features/staff/sample-staff";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentAccount } from "@/lib/auth/session";

/** "Хамаагүй": сервер эхний сул хүнийг сонгоно. */
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
  // Хувийн мэдээлэл хадгалахаас өмнө зөвшөөрөл заавал шаардлагатай.
  consent: z.literal(true),
  // Зарцуулах оноо; зөвхөн нэвтэрсэн үйлчлүүлэгч зарцуулж чадах ба дүрмийг энд шалгана.
  points: z.number().int().min(0).max(10_000_000).default(0),
});

export type CreateBookingInput = z.input<typeof createInput>;

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | {
      ok: false;
      /**
       * slot_taken: өөр хүн цагийг түрүүлж авсан. unavailable: хуваарьт (одоо) байхгүй.
       * points: оноо (одоо) хүрэлцэхгүй.
       */
      error: "invalid" | "unavailable" | "slot_taken" | "points" | "server";
    };

/**
 * Цаг захиална. Server Action-ыг хэн ч POST-оор дуудаж болох тул browser-оос ирсэн
 * юунд ч итгэхгүй: бизнес, үйлчилгээ, үнэ, хугацаа, ажилтан, эхлэх цагийг бүгдийг
 * энд хайж олох эсвэл тооцоолно.
 */
export async function createBookingAction(input: unknown): Promise<CreateBookingResult> {
  const parsed = createInput.safeParse(input);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) return { ok: false, error: "invalid" };
  const data = parsed.data;

  // Жишээ газар эсвэл зөвшөөрөгдсөн бүртгэлтэй газар (DB-ээс).
  const business = await findListing(data.slug);
  const service = business?.services[data.serviceIndex];
  if (!business || !service) return { ok: false, error: "invalid" };

  // Тэр цагт ажиллаж буй хүмүүс; тэдний хэн нь сул байгааг DB шийднэ.
  const staff = getStaff(business, "mn");
  const candidates = staff.filter(
    (member) =>
      (data.staffId === ANY_STAFF || member.id === data.staffId) &&
      member.open[data.day].includes(data.time),
  );
  const now = new Date();
  const startsAt = toStartInstant(data.day, data.time, now);
  // Үйлчилгээ хаах цагаас өмнө дуусах ёстой.
  const endsBy = toMinutes(data.time) + service.duration <= closingMinutes(business, data.day);
  if (candidates.length === 0 || startsAt <= now || !endsBy) {
    return { ok: false, error: "unavailable" };
  }

  try {
    // Цагтаагийн баг түр хаасан (эсвэл зөвшөөрөөгүй) газар захиалга авахгүй.
    if (!(await isBookable(business.slug))) return { ok: false, error: "unavailable" };

    // Оноо нь маягтад бичсэн утсанд биш, нэвтэрсэн бүртгэлд л хамаарна.
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
    // Эх хэлээр нь хадгална; дэлгэц бүр харуулахдаа орчуулна.
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

/** Хадгалсан захиалгыг цуцална; утасны дугаар захиалгынхтай таарах ёстой. */
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
