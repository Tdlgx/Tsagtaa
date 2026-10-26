import {
  CarFront,
  Hand,
  HandHeart,
  PawPrint,
  Scissors,
  ScissorsLineDashed,
  Smile,
  Sparkle,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Бизнесийн газрын төрөл. Бизнес бүр яг нэгтэй. */
export type BusinessCategorySlug =
  | "hair"
  | "barber"
  | "nails"
  | "massage"
  | "beauty"
  | "clinic"
  | "dental"
  | "auto-repair"
  | "car-wash"
  | "vet";

/** Дээд түвшний шүүлтүүр. Салон дэд ангилал руу салаална; бусад нь нэг ангилал. */
export type CategoryGroupSlug = "salon" | "clinic" | "dental" | "auto-repair" | "car-wash" | "vet";

export type BusinessCategory = {
  slug: BusinessCategorySlug;
  group: CategoryGroupSlug;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type CategoryGroup = {
  slug: CategoryGroupSlug;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Нэгээс олон бичлэгтэй бол бүлэг дэд ангиллууд руу задарна. */
  categories: readonly BusinessCategorySlug[];
};

/** Бизнес хамаарч болох бүх ангилал. */
export const BUSINESS_CATEGORIES: readonly BusinessCategory[] = [
  {
    slug: "hair",
    group: "salon",
    label: "Үсчин",
    description: "Үс засалт, будалт, арчилгаа",
    icon: Scissors,
  },
  {
    slug: "barber",
    group: "salon",
    label: "Барбер",
    description: "Эрэгтэй үс засалт, сахал засалт",
    icon: ScissorsLineDashed,
  },
  {
    slug: "nails",
    group: "salon",
    label: "Маникюр",
    description: "Маникюр, педикюр, гель будалт",
    icon: Hand,
  },
  {
    slug: "massage",
    group: "salon",
    label: "Массаж",
    description: "Тайвшруулах болон эмчилгээний массаж",
    icon: HandHeart,
  },
  {
    slug: "beauty",
    group: "salon",
    label: "Гоо сайхан",
    description: "Нүүр арчилгаа, сормуус, хөмсөг",
    icon: Sparkle,
  },
  {
    slug: "clinic",
    group: "clinic",
    label: "Эмнэлэг",
    description: "Эмчийн үзлэг, шинжилгээ, оношилгоо",
    icon: Stethoscope,
  },
  {
    slug: "dental",
    group: "dental",
    label: "Шүдний эмнэлэг",
    description: "Шүдний үзлэг, цэвэрлэгээ, ломбо",
    icon: Smile,
  },
  {
    slug: "auto-repair",
    group: "auto-repair",
    label: "Авто засвар",
    description: "Тос солих, оношилгоо, дугуй, явах эд анги",
    icon: Wrench,
  },
  {
    slug: "car-wash",
    group: "car-wash",
    label: "Авто угаалга",
    description: "Гадна, дотор угаалга, химийн цэвэрлэгээ",
    icon: CarFront,
  },
  {
    slug: "vet",
    group: "vet",
    label: "Мал эмнэлэг",
    description: "Тэжээвэр амьтны үзлэг, вакцин, арчилгаа",
    icon: PawPrint,
  },
];

/** Дээд түвшний бүлгүүд, шүүлтүүр болон нүүр хуудсанд гарах дарааллаар. */
export const CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    slug: "salon",
    label: "Салон",
    description: "Үсчин, барбер, маникюр, массаж, гоо сайхан",
    icon: Scissors,
    categories: ["hair", "barber", "nails", "massage", "beauty"],
  },
  ...BUSINESS_CATEGORIES.filter((category) => category.group !== "salon").map(
    ({ slug, label, description, icon }): CategoryGroup => ({
      slug: slug as CategoryGroupSlug,
      label,
      description,
      icon,
      categories: [slug],
    }),
  ),
];

/** `cat` шүүлтүүрийн хүлээн авах утга: бүлэг ("salon") эсвэл нэг ангилал ("nails"). */
export type CategoryFilterSlug = CategoryGroupSlug | BusinessCategorySlug;

export const CATEGORY_FILTER_SLUGS = [
  ...new Set<CategoryFilterSlug>([
    ...CATEGORY_GROUPS.map((group) => group.slug),
    ...BUSINESS_CATEGORIES.map((category) => category.slug),
  ]),
] as [CategoryFilterSlug, ...CategoryFilterSlug[]];

/** Ангиллын slug-аар мэдээллийг (нэр, icon, бүлэг) авна; байхгүй slug бол алдаа шиднэ. */
export function getBusinessCategory(slug: BusinessCategorySlug): BusinessCategory {
  const category = BUSINESS_CATEGORIES.find((item) => item.slug === slug);
  if (!category) {
    throw new Error(`Unknown business category: ${slug}`);
  }
  return category;
}

/** Бүлгийн slug-аар бүлгийн мэдээллийг авна; байхгүй бол алдаа шиднэ. */
export function getCategoryGroup(slug: CategoryGroupSlug): CategoryGroup {
  const group = CATEGORY_GROUPS.find((item) => item.slug === slug);
  if (!group) {
    throw new Error(`Unknown category group: ${slug}`);
  }
  return group;
}

/** Шүүлтүүрийн утга хамаарах бүлэг: "nails" → salon, "salon" → salon, "vet" → vet. */
export function getFilterGroup(slug: CategoryFilterSlug): CategoryGroup {
  const group = CATEGORY_GROUPS.find(
    (item) => item.slug === slug || item.categories.includes(slug as BusinessCategorySlug),
  );
  if (!group) {
    throw new Error(`Unknown category filter: ${slug}`);
  }
  return group;
}

/** `category` төрлийн бизнес `cat` шүүлтүүрийг давах уу? "salon" бүх салоны төрлийг нэвтрүүлнэ. */
export function matchesCategoryFilter(
  category: BusinessCategorySlug,
  filter: CategoryFilterSlug,
): boolean {
  return category === filter || getBusinessCategory(category).group === filter;
}
