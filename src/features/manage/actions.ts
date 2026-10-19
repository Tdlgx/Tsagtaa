"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizePhone } from "@/features/booking/booking";
import { isInServiceArea, roundLatLng } from "@/features/business/locations";
import {
  addPhoto,
  deleteImage,
  saveLogo,
  setLocation,
  sniffImageType,
} from "@/features/business/media-db";
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

/* Logo, photos, map pin ------------------------------------------------------------ */

const IMAGE_KINDS = ["logo", "photo"] as const;

/**
 * Uploads a logo (replacing the old one) or adds a photo. The browser has
 * already resized it; here the type is read from the bytes and the size and
 * dimensions are checked again, since anyone can call this with a POST.
 */
export async function uploadImageAction(form: FormData): Promise<ActionResult> {
  const slug = String(form.get("slug") ?? "");
  const kind = IMAGE_KINDS.find((value) => value === form.get("kind"));
  const file = form.get("file");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (!slugSchema.safeParse(slug).success || !kind || !(file instanceof Blob)) {
    return { ok: false, error: "invalid" };
  }
  const { account } = await requireBusinessAccess(slug, `/dashboard/${slug}`);
  const valid = (side: number): boolean => Number.isInteger(side) && side >= 16 && side <= 4096;
  if (!valid(width) || !valid(height) || file.size > 700 * 1024) {
    return { ok: false, error: "image" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffImageType(bytes);
  if (!contentType) return { ok: false, error: "image" };

  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  const upload = { bytes, width, height };
  if (kind === "logo") {
    await saveLogo(business.id, upload, contentType, account.id);
  } else {
    const result = await addPhoto(business.id, upload, contentType, account.id);
    if (!result.ok) return { ok: false, error: "limit" };
  }
  revalidatePath(`/dashboard/${slug}`);
  revalidatePath("/map");
  return { ok: true };
}

export async function deleteImageAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ slug: slugSchema, imageId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, imageId } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`);
  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  const done = await deleteImage(business.id, imageId);
  revalidatePath(`/dashboard/${slug}`);
  revalidatePath("/map");
  return done ? { ok: true } : { ok: false, error: "not_found" };
}

/** Sets the map pin, or removes it with `location: null`. */
export async function setLocationAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      slug: slugSchema,
      location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, location } = parsed.data;
  await requireBusinessAccess(slug, `/dashboard/${slug}`);
  if (location && !isInServiceArea(location)) return { ok: false, error: "area" };
  const business = await getManagedBusiness(slug);
  if (!business) return { ok: false, error: "not_found" };
  await setLocation(business.id, location ? roundLatLng(location) : null);
  revalidatePath(`/dashboard/${slug}`);
  revalidatePath("/map");
  return { ok: true };
}
