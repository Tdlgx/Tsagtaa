"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  adjustPoints,
  adminCancelBooking,
  audit,
  endAllSessions,
  importSampleBusinesses,
  resetPassword,
  setBusinessStatus,
  setPlatformAdmin,
  unlockAccount,
  updateLoyaltySettings,
} from "@/features/admin/admin-db";
import { normalizePhone } from "@/features/booking/booking";
import { addMember, getManagedBusiness } from "@/features/manage/manage-db";
import { isAcceptablePassword } from "@/lib/auth/password";
import { requirePlatformAdmin } from "@/lib/auth/session";

/*
 * The Цагтаа team's actions. Each one checks the admin before it reads its
 * input: Server Actions can be called directly with a POST, not only from
 * the admin pages.
 */

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

/** Every admin page shows fresh data after a change. */
function refresh(): void {
  revalidatePath("/admin", "layout");
}

export async function reviewBusinessAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = z
    .object({
      businessId: z.uuid(),
      status: z.enum(["active", "rejected", "pending", "suspended"]),
      note: z.string().trim().max(300),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { businessId, status, note } = parsed.data;
  const result = await setBusinessStatus(admin.id, businessId, status, note);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.reason };
}

export async function importSamplesAction(): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const added = await importSampleBusinesses(admin.id);
  refresh();
  return { ok: true, message: String(added) };
}

/** Gives a place its owner or a manager (e.g. after a phone call). */
export async function assignMemberAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = z
    .object({
      slug: z.string().min(3).max(60),
      phone: z.string().max(20),
      name: z.string().trim().min(2).max(80),
      password: z.string().max(200),
      role: z.enum(["owner", "manager"]),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, name, password, role } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: "phone" };
  if (password && !isAcceptablePassword(password)) return { ok: false, error: "password" };
  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  const result = await addMember(
    business.id,
    { phone, name, password: password || null, role },
    (tx) => audit(tx, admin.id, "member.assign", business.name, business.id, `${role} · ${phone}`),
  );
  refresh();
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true, message: result.created ? "created" : "linked" };
}

/* Accounts ------------------------------------------------------------------------ */

const accountInput = z.object({ accountId: z.uuid() });

export async function unlockAccountAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = accountInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const done = await unlockAccount(admin.id, parsed.data.accountId);
  refresh();
  return done ? { ok: true } : { ok: false, error: "not_found" };
}

/** Returns the new password once, for the admin to pass on in person. */
export async function resetPasswordAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = accountInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const password = await resetPassword(admin.id, parsed.data.accountId);
  refresh();
  return password ? { ok: true, message: password } : { ok: false, error: "not_found" };
}

export async function setAdminAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = accountInput.extend({ value: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const result = await setPlatformAdmin(admin.id, parsed.data.accountId, parsed.data.value);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.reason };
}

export async function endSessionsAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = accountInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ended = await endAllSessions(admin.id, parsed.data.accountId);
  refresh();
  return { ok: true, message: String(ended) };
}

export async function adjustPointsAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = accountInput
    .extend({
      delta: z
        .number()
        .int()
        .min(-1_000_000)
        .max(1_000_000)
        .refine((value) => value !== 0),
      note: z.string().trim().min(3).max(200),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { accountId, delta, note } = parsed.data;
  const result = await adjustPoints(admin.id, accountId, delta, note);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.reason };
}

/* Bookings and points ----------------------------------------------------------------- */

export async function adminCancelBookingAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = z.object({ bookingId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const done = await adminCancelBooking(admin.id, parsed.data.bookingId);
  refresh();
  return done ? { ok: true } : { ok: false, error: "not_found" };
}

export async function loyaltySettingsAction(input: unknown): Promise<AdminResult> {
  const admin = await requirePlatformAdmin();
  const parsed = z
    .object({
      enabled: z.boolean(),
      earnPercent: z.number().int().min(0).max(30),
      minRedeem: z.number().int().min(0).max(1_000_000),
      maxRedeemPercent: z.number().int().min(0).max(100),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await updateLoyaltySettings(admin.id, parsed.data);
  refresh();
  return { ok: true };
}
