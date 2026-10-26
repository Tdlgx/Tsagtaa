/** Бизнесүүд бүртгэгддэг Улаанбаатарын дүүргүүд (төвийн зургаа). */
export const DISTRICTS = [
  { slug: "sukhbaatar", label: "Сүхбаатар дүүрэг" },
  { slug: "chingeltei", label: "Чингэлтэй дүүрэг" },
  { slug: "bayangol", label: "Баянгол дүүрэг" },
  { slug: "bayanzurkh", label: "Баянзүрх дүүрэг" },
  { slug: "khan-uul", label: "Хан-Уул дүүрэг" },
  { slug: "songinokhairkhan", label: "Сонгинохайрхан дүүрэг" },
] as const;

export type DistrictSlug = (typeof DISTRICTS)[number]["slug"];

export const DISTRICT_SLUGS = DISTRICTS.map((district) => district.slug) as [
  DistrictSlug,
  ...DistrictSlug[],
];

/** Дүүргийн slug-аас монгол нэрийг буцаана; байхгүй slug бол алдаа шиднэ. */
export function getDistrictLabel(slug: DistrictSlug): string {
  const district = DISTRICTS.find((item) => item.slug === slug);
  if (!district) {
    throw new Error(`Unknown district: ${slug}`);
  }
  return district.label;
}
