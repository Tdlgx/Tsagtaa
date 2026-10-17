import {
  Armchair,
  Flower2,
  MirrorRound,
  Paintbrush,
  Scissors,
  type LucideIcon,
} from "lucide-react";

export type BusinessCategorySlug = "hair" | "barber" | "nails" | "massage" | "beauty";

export type BusinessCategory = {
  slug: BusinessCategorySlug;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Business categories shown in search filters, cards and the home page. */
export const BUSINESS_CATEGORIES: readonly BusinessCategory[] = [
  {
    slug: "hair",
    label: "Үсчин",
    description: "Үс засалт, будалт, арчилгаа",
    icon: Scissors,
  },
  {
    slug: "barber",
    label: "Барбер",
    description: "Эрэгтэй үс засалт, сахал засалт",
    icon: Armchair,
  },
  {
    slug: "nails",
    label: "Маникюр",
    description: "Маникюр, педикюр, гель будалт",
    icon: Paintbrush,
  },
  {
    slug: "massage",
    label: "Массаж",
    description: "Тайвшруулах болон эмчилгээний массаж",
    icon: Flower2,
  },
  {
    slug: "beauty",
    label: "Гоо сайхан",
    description: "Нүүр арчилгаа, сормуус, хөмсөг",
    icon: MirrorRound,
  },
];

export function getBusinessCategory(slug: BusinessCategorySlug): BusinessCategory {
  const category = BUSINESS_CATEGORIES.find((item) => item.slug === slug);
  if (!category) {
    throw new Error(`Unknown business category: ${slug}`);
  }
  return category;
}
