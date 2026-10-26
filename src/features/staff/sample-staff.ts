import type { BusinessCategorySlug } from "@/features/business/categories";
import type { SampleBusiness } from "@/features/business/sample-businesses";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { transliterate } from "@/i18n/transliterate";

export type StaffMember = {
  id: string;
  /** Зочны хэл дээрх харуулах нэр. */
  name: string;
  /** Хадгалсан (Монгол) нэр; захиалгад хадгалагдах утга. */
  canonicalName: string;
  role: string;
  /** Энэ хүний авч болох сул эхлэх цагууд; бизнесийн цагуудын дэд олонлог. */
  open: { today: readonly string[]; tomorrow: readonly string[] };
};

const SALON_NAMES = ["Сарнай", "Номин", "Анужин", "Хулан", "Оюунаа"] as const;

/** Газрын төрөл бүрт хэнийг сонгож болох вэ. Алхмын шошго, үүргүүд толь бичгүүдэд байдаг. */
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

/** Газар бүрт 3 хүртэл хүн; slug нь нэрсийн жагсаалтын тогтвортой эхлэх цэгийг сонгоно. */
const MAX_STAFF = 3;

function seed(text: string): number {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/**
 * Жинхэнэ ажилтнууд DB-ээс ирэх хүртэл бизнесийн жишээ ажилтнууд. Хүн бүр сул
 * цагуудын тодорхой хэсгийг (хагас эсвэл гуравны хоёр) авна; хамтдаа бүгдийг нь
 * хамардаг тул "Хамаагүй" үргэлж бүтэн жагсаалтыг харуулна.
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
 * Газарт хэнийг захиалж болох вэ: бүртгэлтэй газарт жинхэнэ ажилтнууд, жишээ газарт
 * үүсгэсэн жишээ ажилтнууд. Жинхэнэ ажилтан бүр дурын сул цагийг авч болно; хэн
 * үнэхээр сул байгааг захиалгууд шийднэ.
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
