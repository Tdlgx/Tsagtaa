import { z } from "zod";

import { normalizePhone } from "@/features/booking/booking";
import { BUSINESS_CATEGORIES, type BusinessCategorySlug } from "@/features/business/categories";
import { DISTRICT_SLUGS, type DistrictSlug } from "@/features/business/districts";
import { isInServiceArea, type LatLng } from "@/features/business/locations";
import { transliterate } from "@/i18n/transliterate";

/* Бүтэц ---------------------------------------------------------------------- */

/** Даваа эхэнд. Индекс 0 = Даваа … 6 = Ням (ISO гараг 1–7 хэлбэрээр хадгална). */
export type DayHours = { open: boolean; opens: string; closes: string };
export type ServiceDraft = { id: string; name: string; duration: number; price: number };
/** `position` нь аль хэдийн хадгалагдсан хүнд байна (захиалгууд түүнийг заадаг); шинэ мөрөнд байхгүй. */
export type StaffDraft = { id: string; name: string; position?: number };
export type SlotMinutes = 15 | 30 | 60;

/** Маягтын агуулж буй бүх зүйл. Илгээх хүртэл энэ төхөөрөмж дээр автоматаар хадгалагдана. */
export type RegistrationDraft = {
  /** Энэ маягтын бүх дахин оролдлогод ижил id, ингэснээр нэг л удаа хадгалагдана. Эхний өөрчлөлтөөр тохирно. */
  requestId: string;
  step: number;
  category: BusinessCategorySlug | null;
  name: string;
  slug: string;
  /** Эзэмшигч хаягийг гараар зассаны дараа нэр түүнийг дахин бичихээ болино. */
  slugEdited: boolean;
  district: DistrictSlug | "";
  address: string;
  phone: string;
  email: string;
  registerNumber: string;
  description: string;
  hours: DayHours[];
  /** Эзэмшигч цагийн хуваарийг өөрчилсний дараа ангилал сонгох нь түүнийг дахин тохируулахаа болино. */
  hoursEdited: boolean;
  slotMinutes: SlotMinutes;
  services: ServiceDraft[];
  staff: StaffDraft[];
  /** Газрын зургийн цэг; заавал биш, гэхдээ цэгтэй газар газрын зураг дээр гарна. */
  location: LatLng | null;
};

/**
 * Алхам харуулагдаж буй маягтаа хэрхэн өөрчлөх вэ: автоматаар хадгалагддаг
 * бүртгэл, эсвэл самбар дээрх газрын цагийн хуваарь, үйлчилгээ, ажилтан засварлагч.
 */
export type DraftUpdate = (change: (draft: RegistrationDraft) => RegistrationDraft) => void;

export const STEPS = ["category", "basics", "hours", "services", "staff", "review"] as const;
export type StepKey = (typeof STEPS)[number];

export const SLOT_OPTIONS: readonly SlotMinutes[] = [15, 30, 60];
export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120] as const;
export const MAX_SERVICES = 30;
export const MAX_STAFF = 20;
export const DESCRIPTION_MAX = 300;

/** 06:00-оос 23:30 хүртэлх хагас цагууд: цагийн талбаруудын санал, тэд дурын бичсэн цагийг ч хүлээн авна. */
export const TIME_OPTIONS: readonly string[] = Array.from({ length: 36 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

/**
 * Бичсэн цаг → "HH:MM", өдрийн цаг биш бол null.
 * Утасны товчлуур эсвэл гараар бичдэг зүйлийг хүлээн авна:
 * "8" → 08:00, "845" / "0845" / "8:45" / "8.45" / "8 45" → 08:45, "21:5" → 21:05.
 */
export function parseTime(input: string): string | null {
  const text = input.trim().replace(/[.,hч\s]+/gi, ":");
  let hours: number;
  let minutes: number;
  const parts = /^(\d{1,2}):(\d{1,2})$/.exec(text);
  if (parts) {
    hours = Number(parts[1]);
    minutes = Number(parts[2]);
  } else if (/^\d{1,4}$/.test(text)) {
    // Зөвхөн цифр: хоёроос олон байвал сүүлийн хоёр нь минут.
    hours = Number(text.length <= 2 ? text : text.slice(0, -2));
    minutes = text.length <= 2 ? 0 : Number(text.slice(-2));
  } else {
    return null;
  }
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/* Газрын төрөл бүрийн ухаалаг анхдагч утгууд -------------------------------------------- */

const day = (opens: string, closes: string): DayHours => ({ open: true, opens, closes });
const closed = (opens = "09:00", closes = "18:00"): DayHours => ({ open: false, opens, closes });

export const HOURS_PRESETS = {
  weekdays: [...Array(5).fill(day("09:00", "18:00")), closed(), closed()] as DayHours[],
  daily: Array(7).fill(day("10:00", "20:00")) as DayHours[],
  clinic: [...Array(5).fill(day("09:00", "18:00")), day("10:00", "14:00"), closed()] as DayHours[],
  garage: [...Array(6).fill(day("09:00", "19:00")), closed()] as DayHours[],
  wash: Array(7).fill(day("08:00", "22:00")) as DayHours[],
  vet: [...Array(6).fill(day("09:00", "18:00")), closed()] as DayHours[],
} satisfies Record<string, DayHours[]>;

export type HoursPreset = keyof typeof HOURS_PRESETS;

/** Ийм төрлийн газар ихэвчлэн ямар байдаг: цагийн хуваарь болон цаг хэр давтамжтай эхэлж болох. */
export const CATEGORY_DEFAULTS: Record<
  BusinessCategorySlug,
  { hours: HoursPreset; slotMinutes: SlotMinutes }
> = {
  hair: { hours: "daily", slotMinutes: 15 },
  barber: { hours: "daily", slotMinutes: 15 },
  nails: { hours: "daily", slotMinutes: 30 },
  massage: { hours: "daily", slotMinutes: 30 },
  beauty: { hours: "daily", slotMinutes: 30 },
  clinic: { hours: "clinic", slotMinutes: 15 },
  dental: { hours: "clinic", slotMinutes: 30 },
  "auto-repair": { hours: "garage", slotMinutes: 60 },
  "car-wash": { hours: "wash", slotMinutes: 30 },
  vet: { hours: "vet", slotMinutes: 30 },
};

export const EMPTY_DRAFT: RegistrationDraft = {
  requestId: "",
  step: 0,
  category: null,
  name: "",
  slug: "",
  slugEdited: false,
  district: "",
  address: "",
  phone: "",
  email: "",
  registerNumber: "",
  description: "",
  hours: HOURS_PRESETS.daily,
  hoursEdited: false,
  slotMinutes: 30,
  services: [],
  staff: [],
  location: null,
};

/* Туслах функцууд ---------------------------------------------------------------------- */

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * "Өнгө салон" → "ongo-salon": латин, жижиг үсэг, үгсийг зураасаар холбоно.
 * Үгийн дотор "е"-г "e" гэж уншина ("тест" → "test"); зөвхөн эхэнд "ye".
 */
export function slugify(text: string): string {
  return transliterate(text.replace(/(?<=[а-яёөү])е/giu, "э"))
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 60 && SLUG_PATTERN.test(slug);
}

/** Компани: 7 оронтой тоо. Хувь хүн: 2 кирилл үсэг + 8 оронтой тоо ("УБ99112233"). */
export function detectRegisterNumber(input: string): "company" | "person" | null {
  const value = input.replace(/\s/g, "").toUpperCase();
  if (/^\d{7}$/.test(value)) return "company";
  if (/^[А-ЯЁӨҮ]{2}\d{8}$/.test(value)) return "person";
  return null;
}

export function normalizeRegisterNumber(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
};

/** "bold@gmial.com" → "bold@gmail.com"; алдаатай бичсэн юм харагдахгүй бол null. */
export function suggestEmail(email: string): string | null {
  const [local, domain] = email.trim().toLowerCase().split("@");
  const fixed = domain ? DOMAIN_TYPOS[domain] : undefined;
  return local && fixed ? `${local}@${fixed}` : null;
}

export function toMinutes(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Газар долоо хоногт нээлттэй байх минут. */
export function weeklyMinutes(hours: readonly DayHours[]): number {
  return hours.reduce(
    (sum, item) =>
      item.open ? sum + Math.max(0, toMinutes(item.closes) - toMinutes(item.opens)) : sum,
    0,
  );
}

/* Шалгалт (browser болон сервер дээр ижил дүрэм) ----------------------- */

export type FieldError =
  | "category"
  | "name"
  | "slug"
  | "district"
  | "address"
  | "phone"
  | "email"
  | "registerNumber"
  | "hoursNone"
  | "hoursOrder"
  | "servicesNone"
  | "serviceName"
  | "serviceDuplicate"
  | "serviceDuration"
  | "servicePrice"
  | "staffNone"
  | "staffName"
  | "staffDuplicate";

/** Талбар → асуудал. Мөрийн талбаруудын түлхүүр нь "service:<id>:name", "staff:<id>" гэх мэт. */
export type StepErrors = Record<string, FieldError>;

/** Алдааны түлхүүр хамаарах элемент: "service:<id>:name" → "reg-service-<id>-name". */
export const fieldId = (key: string): string => `reg-${key.replaceAll(":", "-")}`;

const sameText = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Нэг алхмын бүх дүрмийг шалгаж, талбар → алдааны кодыг буцаана (хоосон бол алхам зөв).
 * Browser болон сервер хоёулаа энэ функцийг ашигладаг тул дүрэм нэг газар л байна.
 */
export function validateStep(step: StepKey, draft: RegistrationDraft): StepErrors {
  const errors: StepErrors = {};

  if (step === "category" && !draft.category) errors.category = "category";

  if (step === "basics") {
    if (draft.name.trim().length < 2) errors.name = "name";
    if (!isValidSlug(draft.slug)) errors.slug = "slug";
    if (!draft.district) errors.district = "district";
    if (draft.address.trim().length < 5) errors.address = "address";
    if (!normalizePhone(draft.phone)) errors.phone = "phone";
    if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim())) errors.email = "email";
    if (draft.registerNumber.trim() && !detectRegisterNumber(draft.registerNumber)) {
      errors.registerNumber = "registerNumber";
    }
  }

  if (step === "hours") {
    if (!draft.hours.some((item) => item.open)) errors.hours = "hoursNone";
    draft.hours.forEach((item, index) => {
      if (item.open && toMinutes(item.closes) <= toMinutes(item.opens)) {
        errors[`hours:${index}`] = "hoursOrder";
      }
    });
  }

  if (step === "services") {
    if (draft.services.length === 0) errors.services = "servicesNone";
    draft.services.forEach((service, index) => {
      const key = `service:${service.id}`;
      if (service.name.trim().length < 2) errors[`${key}:name`] = "serviceName";
      else if (draft.services.slice(0, index).some((other) => sameText(other.name, service.name)))
        errors[`${key}:name`] = "serviceDuplicate";
      if (!(service.duration >= 5 && service.duration <= 480 && service.duration % 5 === 0)) {
        errors[`${key}:duration`] = "serviceDuration";
      }
      if (!(service.price >= 0 && service.price <= 10_000_000)) {
        errors[`${key}:price`] = "servicePrice";
      }
    });
  }

  if (step === "staff") {
    if (draft.staff.length === 0) errors.staff = "staffNone";
    draft.staff.forEach((member, index) => {
      const key = `staff:${member.id}`;
      if (member.name.trim().length < 2) errors[key] = "staffName";
      else if (draft.staff.slice(0, index).some((other) => sameText(other.name, member.name)))
        errors[key] = "staffDuplicate";
    });
  }

  return errors;
}

/** Асуудалтай эхний алхам, эсвэл бүх маягт илгээхэд бэлэн бол -1. */
export function firstInvalidStep(draft: RegistrationDraft): number {
  return STEPS.findIndex((step) => Object.keys(validateStep(step, draft)).length > 0);
}

/* Бүрэн байдал ба зөөлөн анхааруулга ------------------------------------------------ */

export type Tip =
  "description" | "moreServices" | "email" | "registerNumber" | "moreStaff" | "location";

/** 0–100, мөн түүнийг юу өсгөх вэ. Заавал талбарууд хамгийн их жинтэй; нэмэлтүүд бүртгэлийг тодруулна. */
export function getCompleteness(draft: RegistrationDraft): { score: number; tips: Tip[] } {
  const checks: [boolean, number, Tip | null][] = [
    [draft.category !== null, 10, null],
    [draft.name.trim().length >= 2 && isValidSlug(draft.slug), 10, null],
    [Boolean(draft.district) && draft.address.trim().length >= 5, 10, null],
    [normalizePhone(draft.phone) !== null, 10, null],
    [draft.hours.some((item) => item.open), 10, null],
    [draft.services.length > 0, 10, null],
    [draft.staff.length > 0, 10, null],
    [draft.description.trim().length >= 40, 8, "description"],
    [draft.location !== null, 6, "location"],
    [draft.services.length >= 3, 6, "moreServices"],
    [detectRegisterNumber(draft.registerNumber) !== null, 4, "registerNumber"],
    [EMAIL_PATTERN.test(draft.email.trim()), 3, "email"],
    [draft.staff.length >= 2, 3, "moreStaff"],
  ];
  const score = checks.reduce((sum, [done, weight]) => sum + (done ? weight : 0), 0);
  const tips = checks.flatMap(([done, , tip]) => (!done && tip ? [tip] : []));
  return { score, tips };
}

export type Warning = { kind: "serviceTooLong"; service: string; minutes: number };

/** Зөвшөөрөгдөх боловч алдаа байх магадлалтай зүйлс, илгээхээс өмнө харуулна. */
export function getWarnings(draft: RegistrationDraft): Warning[] {
  const openDays = draft.hours.filter((item) => item.open);
  if (openDays.length === 0) return [];
  const longestDay = Math.max(
    ...openDays.map((item) => toMinutes(item.closes) - toMinutes(item.opens)),
  );
  return draft.services
    .filter((service) => service.duration > longestDay)
    .map((service) => ({ kind: "serviceTooLong", service: service.name, minutes: longestDay }));
}

/* Серверийн хүлээн авах өгөгдөл ---------------------------------------------------------- */

const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const CATEGORY_SLUGS = BUSINESS_CATEGORIES.map((category) => category.slug) as [
  BusinessCategorySlug,
  ...BusinessCategorySlug[],
];

/** Бүртгэлийн маягтаас серверт ирэх өгөгдлийн schema; Server Action оролтоо үүгээр шалгана. */
export const registrationInput = z.object({
  requestId: z.uuid(),
  category: z.enum(CATEGORY_SLUGS),
  name: z.string().trim().min(2).max(80),
  slug: z.string().min(3).max(60).regex(SLUG_PATTERN),
  district: z.enum(DISTRICT_SLUGS),
  address: z.string().trim().min(5).max(160),
  phone: z.string().max(20),
  email: z.string().trim().max(120),
  registerNumber: z.string().trim().max(14),
  description: z.string().trim().max(DESCRIPTION_MAX),
  slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  hours: z.array(z.object({ open: z.boolean(), opens: TIME, closes: TIME })).length(7),
  services: z
    .array(
      z.object({
        id: z.string().max(64),
        name: z.string().trim().min(2).max(80),
        duration: z.number().int(),
        price: z.number().int(),
      }),
    )
    .min(1)
    .max(MAX_SERVICES),
  staff: z
    .array(z.object({ id: z.string().max(64), name: z.string().trim().min(2).max(60) }))
    .min(1)
    .max(MAX_STAFF),
  location: z
    .object({ lat: z.number(), lng: z.number() })
    .nullable()
    .refine((value) => value === null || isInServiceArea(value)),
  // Хэн бүртгүүлж байна: эзэмшигч болж, бизнесийн утсаар нэвтэрнэ.
  ownerName: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(200),
  // Эзэмшигч мэдээлэл үнэн гэдгийг баталж, нууцлалын бодлогыг зөвшөөрнө.
  consent: z.literal(true),
});

export type RegistrationInput = z.input<typeof registrationInput>;

/** Автоматаар хадгалсан зүйлийн сул шалгалт: уншиж болохгүй бүх зүйл шинэ маягтаас эхэлнэ. */
export const draftSchema = z.object({
  requestId: z.string(),
  step: z
    .number()
    .int()
    .min(0)
    .max(STEPS.length - 1),
  category: z.enum(CATEGORY_SLUGS).nullable(),
  name: z.string(),
  slug: z.string(),
  slugEdited: z.boolean(),
  district: z.union([z.enum(DISTRICT_SLUGS), z.literal("")]),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  registerNumber: z.string(),
  description: z.string(),
  hours: z.array(z.object({ open: z.boolean(), opens: TIME, closes: TIME })).length(7),
  hoursEdited: z.boolean(),
  slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  services: z.array(
    z.object({ id: z.string(), name: z.string(), duration: z.number(), price: z.number() }),
  ),
  staff: z.array(z.object({ id: z.string(), name: z.string() })),
  // Газрын зураг гарахаас өмнө хадгалсан ноорогт цэг байхгүй.
  location: z.object({ lat: z.number(), lng: z.number() }).nullable().default(null),
});
