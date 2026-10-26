"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizePhone } from "@/features/booking/booking";
import {
  EMPTY_DRAFT,
  MAX_STAFF,
  registrationInput,
  validateStep,
  type RegistrationDraft,
  type StepKey,
} from "@/features/business-registration/registration";
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
  isSamplePlace,
  markAttendance,
  removeManager,
  saveHours,
  saveServices,
  saveStaff,
  type ManagedBusiness,
} from "@/features/manage/manage-db";
import { isAcceptablePassword } from "@/lib/auth/password";
import { requireBusinessAccess } from "@/lib/auth/session";

/*
 * Action бүр оролтоо уншихаас өмнө хэн асууж байгааг шалгана: Server Action-ыг
 * зөвхөн эдгээр хуудаснаас биш, шууд POST-оор ч дуудаж болно.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const slugSchema = z.string().min(3).max(60);

/* Бизнесийн самбар ------------------------------------------------------------ */

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

/** Эзэмшигч менежер нэмнэ. Шинэ утсанд анхны нууц үг хэрэгтэй. */
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

/** Эзэмшигч менежерийг багаас хасна. */
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

/** Айлчлал бүрт нэг удаа "Ирсэн" эсвэл "Ирээгүй"; үйлчлүүлэгчийн оноог шийднэ. */
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

/* Цагийн хуваарь, үйлчилгээ, ажилтан ------------------------------------------------------------ */

/** Бүртгэлийн маягтын өөрийн дүрмүүд, ингэснээр газар бүртгүүлж чадахааргүй хэлбэрээр хэзээ ч хадгалагдахгүй. */
const breaksStepRules = (step: StepKey, change: Partial<RegistrationDraft>): boolean =>
  Object.keys(validateStep(step, { ...EMPTY_DRAFT, ...change })).length > 0;

/** Дуудагч засах эрхтэй бол газар; жишээ газар кодоос жагсаагддаг тул засах боломжгүй. */
async function editablePlace(slug: string): Promise<ManagedBusiness | null> {
  await requireBusinessAccess(slug, `/dashboard/${slug}/edit`);
  if (isSamplePlace(slug)) return null;
  return getManagedBusiness(slug);
}

const hoursInput = z.object({
  slug: slugSchema,
  hours: registrationInput.shape.hours,
  slotMinutes: registrationInput.shape.slotMinutes,
});

/**
 * Самбараас ажлын цаг болон захиалгын торыг хадгална (бүртгэлийн маягтын дүрмээр шалгасны дараа).
 */
export async function saveHoursAction(input: unknown): Promise<ActionResult> {
  const parsed = hoursInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, hours, slotMinutes } = parsed.data;
  const business = await editablePlace(slug);
  if (!business) return { ok: false, error: "not_found" };
  if (breaksStepRules("hours", { hours })) return { ok: false, error: "invalid" };

  await saveHours(
    business.id,
    hours.flatMap((item, index) =>
      item.open ? [{ weekday: index + 1, opens: item.opens, closes: item.closes }] : [],
    ),
    slotMinutes,
  );
  revalidatePath(`/dashboard/${slug}`, "layout");
  return { ok: true };
}

const servicesInput = z.object({ slug: slugSchema, services: registrationInput.shape.services });

/** Самбараас үйлчилгээний жагсаалтыг хадгална (бүртгэлийн маягтын дүрмээр шалгасны дараа). */
export async function saveServicesAction(input: unknown): Promise<ActionResult> {
  const parsed = servicesInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, services } = parsed.data;
  const business = await editablePlace(slug);
  if (!business) return { ok: false, error: "not_found" };
  if (breaksStepRules("services", { services })) return { ok: false, error: "invalid" };

  await saveServices(
    business.id,
    services.map(({ name, duration, price }) => ({ name, duration, price })),
  );
  revalidatePath(`/dashboard/${slug}`, "layout");
  return { ok: true };
}

const staffInput = z.object({
  slug: slugSchema,
  // Шинэ хүний `position` нь null.
  staff: z
    .array(
      z.object({
        position: z.number().int().min(0).max(32_767).nullable(),
        name: z.string().trim().min(2).max(60),
      }),
    )
    .min(1)
    .max(MAX_STAFF),
});

export type SaveStaffActionResult =
  ActionResult | { ok: false; error: "has_bookings"; names: string[] };

/**
 * Самбараас ажилтнуудыг хадгална. Ирэх захиалгатай хүнийг хасах гэвэл
 * "has_bookings" алдааг тэдний нэрсийн хамт буцаана.
 */
export async function saveStaffAction(input: unknown): Promise<SaveStaffActionResult> {
  const parsed = staffInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, staff } = parsed.data;
  const business = await editablePlace(slug);
  if (!business) return { ok: false, error: "not_found" };
  const rows = staff.map((member, index) => ({ id: String(index), name: member.name }));
  if (breaksStepRules("staff", { staff: rows })) return { ok: false, error: "invalid" };

  const result = await saveStaff(business, staff);
  revalidatePath(`/dashboard/${slug}`, "layout");
  if (result.ok) return { ok: true };
  if (result.reason === "has_bookings") {
    return { ok: false, error: "has_bookings", names: result.names };
  }
  return { ok: false, error: "invalid" };
}

/* Лого, зураг, байршлын цэг ------------------------------------------------------------ */

const IMAGE_KINDS = ["logo", "photo"] as const;

/**
 * Лого оруулна (хуучныг солино) эсвэл зураг нэмнэ. Browser аль хэдийн жижигрүүлсэн;
 * энд төрлийг byte-уудаас уншиж, хэмжээ болон харьцааг дахин шалгана, учир нь
 * хэн ч үүнийг POST-оор дуудаж болно.
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

/** Газрын нэг зургийг устгана (газрын баг эсвэл Цагтаагийн баг). */
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

/** Газрын зургийн цэгийг тохируулна, эсвэл `location: null`-оор хасна. */
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
