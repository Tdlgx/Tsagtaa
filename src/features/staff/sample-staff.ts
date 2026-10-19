import type { BusinessCategorySlug } from "@/features/business/categories";
import type { SampleBusiness } from "@/features/business/sample-businesses";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { transliterate } from "@/i18n/transliterate";

export type StaffMember = {
  id: string;
  /** Display name in the visitor's language. */
  name: string;
  /** Stored (Mongolian) name; what a booking saves. */
  canonicalName: string;
  role: string;
  /** Open start times this person can take; a subset of the business's times. */
  open: { today: readonly string[]; tomorrow: readonly string[] };
};

const SALON_NAMES = ["Сарнай", "Номин", "Анужин", "Хулан", "Оюунаа"] as const;

/** Who can be picked at each kind of place. Step labels and roles live in the dictionaries. */
const STAFF_NAMES: Record<BusinessCategorySlug, readonly string[]> = {
  hair: SALON_NAMES,
  barber: ["Тэмүүлэн", "Билгүүн", "Мөнх-Эрдэнэ"],
  nails: SALON_NAMES,
  massage: ["Энхжин", "Гэрэлмаа", "Батбаяр"],
  beauty: SALON_NAMES,
  clinic: ["Др. Болормаа", "Др. Ганбат", "Др. Цэцэгмаа"],
  dental: ["Др. Уянга", "Др. Эрдэнэбат"],
  "auto-repair": ["Ганзориг", "Батцэцэг", "Төмөрбаатар"],
  "car-wash": ["Бокс 1", "Бокс 2", "Бокс 3"],
  vet: ["Др. Мөнхзул", "Др. Отгонбаяр"],
};

/** Up to 3 people per place; the slug picks a stable starting point in the name list. */
const MAX_STAFF = 3;

function seed(text: string): number {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/**
 * Sample staff for a business, until real staff come from the database. Each
 * person takes a share of the open times (half or two thirds); together they
 * cover all of them, so "no preference" always shows the full list.
 */
export function getSampleStaff(business: SampleBusiness, locale: Locale): StaffMember[] {
  const names = STAFF_NAMES[business.category];
  const { role } = getDictionary(locale).staff[business.category];
  const count = Math.min(MAX_STAFF, names.length);
  const offset = seed(business.slug) % names.length;

  return Array.from({ length: count }, (_, index): StaffMember => {
    const canonicalName = names[(offset + index) % names.length] ?? names[0] ?? role;
    const takes = (_: string, slot: number): boolean => (slot + index) % count !== count - 1;

    return {
      id: `${business.slug}-${index}`,
      name: locale === "en" ? transliterate(canonicalName) : canonicalName,
      canonicalName,
      role,
      open: {
        today: business.open.today.filter(takes),
        tomorrow: business.open.tomorrow.filter(takes),
      },
    };
  });
}

/**
 * Who can be booked at a place: its real staff for a registered place,
 * generated sample staff for a sample one. Real staff can each take any of
 * the open times; who is actually free is decided by the bookings.
 */
export function getStaff(business: SampleBusiness, locale: Locale): StaffMember[] {
  if (!business.staff) return getSampleStaff(business, locale);
  const { role } = getDictionary(locale).staff[business.category];
  return business.staff.map((member) => ({
    id: `${business.slug}-${member.position}`,
    name: locale === "en" ? transliterate(member.name) : member.name,
    canonicalName: member.name,
    role,
    open: business.open,
  }));
}

/** "Др. Болормаа" → "Б", "Dr. Bolormaa" → "B", "Бокс 2" / "Bay 2" → "2". */
export function getInitial(name: string): string {
  const word = name.replace(/^(Др\.|Dr\.)\s*/, "").replace(/^(Бокс|Bay)\s*/, "");
  return word.charAt(0).toUpperCase();
}
