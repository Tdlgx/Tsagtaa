"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizePhone } from "@/features/booking/booking";
import {
  addMember,
  cancelBusinessBooking,
  getManagedBusiness,
  markAttendance,
  removeManager,
} from "@/features/manage/manage-db";
import { isAcceptablePassword } from "@/lib/auth/password";
import { requireBusinessAccess } from "@/lib/auth/session";

/*
 * Every action checks who is asking before it reads its input: Server
 * Actions can be called directly with a POST, not only from these pages.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const slugSchema = z.string().min(3).max(60);

/* Business dashboard ------------------------------------------------------------ */

export async function cancelBookingAsManager(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ slug: slugSchema, bookingId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, bookingId } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`);
  const done = await cancelBusinessBooking(slug, bookingId);
  revalidatePath(`/dashboard/${slug}`);
  return done ? { ok: true } : { ok: false, error: "not_found" };
}

const memberSchema = z.object({
  slug: slugSchema,
  phone: z.string().max(20),
  name: z.string().trim().min(2).max(80),
  password: z.string().max(200),
});

/** The owner adds a manager. A new phone needs a starting password. */
export async function addManagerAction(input: unknown): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, name, password } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`, ["owner"]);
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: "phone" };
  if (password && !isAcceptablePassword(password)) return { ok: false, error: "password" };

  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  const result = await addMember(business.id, {
    phone,
    name,
    password: password || null,
    role: "manager",
  });
  revalidatePath(`/dashboard/${slug}`);
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true, message: result.created ? "created" : "linked" };
}

export async function removeManagerAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ slug: slugSchema, accountId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, accountId } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`, ["owner"]);
  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  const done = await removeManager(business.id, accountId);
  revalidatePath(`/dashboard/${slug}`);
  return done ? { ok: true } : { ok: false, error: "not_found" };
}

/** "Came" or "did not come", once per visit; settles the customer's points. */
export async function markAttendanceAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ slug: slugSchema, bookingId: z.uuid(), attendance: z.enum(["attended", "no_show"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, bookingId, attendance } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`);
  const done = await markAttendance(slug, bookingId, attendance);
  revalidatePath(`/dashboard/${slug}`);
  return done ? { ok: true } : { ok: false, error: "not_found" };
}
