import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";

export type SampleService = {
  name: string;
  /** Минут */
  duration: number;
  /** Төгрөг */
  price: number;
};

export type SampleBusiness = {
  slug: string;
  name: string;
  category: BusinessCategorySlug;
  district: DistrictSlug;
  /** Хүмүүс газрыг олоход хэрэглэдэг хороолол эсвэл тэмдэгт газар. */
  area: string;
  rating: number;
  reviewCount: number;
  services: readonly SampleService[];
  /** Сул эхлэх цагууд, "HH:MM", Улаанбаатарын цагаар. Завсрууд нь аль хэдийн захиалагдсан. */
  open: { today: readonly string[]; tomorrow: readonly string[] };
  /** Сайт дээр бүртгүүлсэн газрууд (DB-ээс) мөн дараахыг агуулна: */
  /** өөрийн ажилтнууд (аль нь ч дурын сул цагийг авч болно; id нь "slug-position"), */
  staff?: readonly { position: number; name: string }[];
  /** өдөр бүрийн хаах цаг минутаар, үйлчилгээ тэр болтол дуусах ёстой (null: амарна), */
  closesAt?: { today: number | null; tomorrow: number | null };
  /** мөн хараахан үнэлгээгүй: одны үнэлгээний оронд "шинэ" гэж харагдана. */
  isNew?: boolean;
};

/**
 * Жинхэнэ бүртгэлүүд DB-ээс ирэх хүртэл хайлтын хуудсанд зориулсан жишээ бизнесүүд.
 * Нэрс зохиомол; сул цагууд өдөр бүрт тогтмол тул хуудас айлчлал бүрт ижил
 * харагдана (өнгөрсөн цагуудыг хүсэлтийн үед нууна).
 */
export const SAMPLE_BUSINESSES: readonly SampleBusiness[] = [
  {
    slug: "ongo-salon",
    name: "Өнгө салон",
    category: "hair",
    district: "sukhbaatar",
    area: "Төв талбайн орчим",
    rating: 4.9,
    reviewCount: 128,
    services: [
      { name: "Эмэгтэй үс засалт", duration: 45, price: 35000 },
      { name: "Үс будалт", duration: 120, price: 90000 },
      { name: "Үсний арчилгаа", duration: 60, price: 45000 },
    ],
    open: {
      today: ["09:30", "11:00", "12:30", "14:15", "16:00", "17:30", "19:00"],
      tomorrow: ["09:30", "10:15", "11:00", "13:30", "15:00", "16:45", "18:00", "19:30"],
    },
  },
  {
    slug: "khaan-barber",
    name: "Хаан барбер",
    category: "barber",
    district: "khan-uul",
    area: "Зайсан",
    rating: 4.8,
    reviewCount: 214,
    services: [
      { name: "Эрэгтэй үс засалт", duration: 30, price: 25000 },
      { name: "Сахал засалт", duration: 30, price: 15000 },
      { name: "Үс, сахал хамт", duration: 60, price: 35000 },
    ],
    open: {
      today: ["09:00", "10:00", "10:30", "13:00", "15:30", "16:00", "18:00", "19:30", "20:00"],
      tomorrow: ["09:00", "09:30", "11:00", "12:30", "14:00", "17:00", "18:30", "20:00"],
    },
  },
  {
    slug: "gerelt-manicure",
    name: "Гэрэлт маникюр",
    category: "nails",
    district: "bayanzurkh",
    area: "13-р хороолол",
    rating: 4.7,
    reviewCount: 96,
    services: [
      { name: "Гель будалт", duration: 60, price: 40000 },
      { name: "Маникюр", duration: 45, price: 30000 },
      { name: "Педикюр", duration: 60, price: 45000 },
    ],
    open: {
      today: ["10:00", "12:00", "15:00", "17:00", "19:00"],
      tomorrow: ["10:00", "11:00", "14:00", "16:00", "18:00"],
    },
  },
  {
    slug: "amar-massage",
    name: "Амар массаж",
    category: "massage",
    district: "chingeltei",
    area: "Их дэлгүүрийн ар",
    rating: 4.9,
    reviewCount: 171,
    services: [
      { name: "Нуруу, хүзүүний массаж", duration: 60, price: 60000 },
      { name: "Бүтэн биеийн массаж", duration: 90, price: 85000 },
      { name: "Хөлийн массаж", duration: 45, price: 40000 },
    ],
    open: {
      today: ["09:00", "11:30", "14:00", "16:30", "18:30"],
      tomorrow: ["09:00", "10:30", "13:00", "15:30", "19:00"],
    },
  },
  {
    slug: "tod-beauty",
    name: "Тод гоо сайхан",
    category: "beauty",
    district: "songinokhairkhan",
    area: "Баруун 4 зам",
    rating: 4.6,
    reviewCount: 58,
    services: [
      { name: "Сормуус суулгалт", duration: 90, price: 55000 },
      { name: "Хөмсөг засалт", duration: 30, price: 20000 },
      { name: "Нүүр арчилгаа", duration: 60, price: 50000 },
    ],
    open: {
      today: ["10:00", "13:00", "16:30", "19:00"],
      tomorrow: ["09:30", "11:30", "14:00", "17:30"],
    },
  },
  {
    slug: "enkh-amgalan-clinic",
    name: "Энх-Амгалан эмнэлэг",
    category: "clinic",
    district: "bayanzurkh",
    area: "13-р хороолол",
    rating: 4.7,
    reviewCount: 142,
    services: [
      { name: "Дотрын эмчийн үзлэг", duration: 30, price: 30000 },
      { name: "Цусны ерөнхий шинжилгээ", duration: 15, price: 18000 },
      { name: "Хэвлийн хэт авиан шинжилгээ", duration: 30, price: 45000 },
    ],
    open: {
      today: ["09:00", "09:30", "11:00", "13:30", "15:00", "16:30"],
      tomorrow: ["09:00", "10:00", "10:30", "12:00", "14:00", "15:30", "17:00"],
    },
  },
  {
    slug: "inee-dental",
    name: "Инээд шүдний эмнэлэг",
    category: "dental",
    district: "sukhbaatar",
    area: "Шангри-Ла орчим",
    rating: 4.9,
    reviewCount: 203,
    services: [
      { name: "Шүдний үзлэг", duration: 20, price: 20000 },
      { name: "Шүдний чулуу авах", duration: 45, price: 60000 },
      { name: "Ломбо тавих", duration: 60, price: 80000 },
    ],
    open: {
      today: ["10:00", "12:30", "14:00", "17:00", "18:30"],
      tomorrow: ["09:30", "11:00", "13:00", "15:30", "16:00", "19:00"],
    },
  },
  {
    slug: "khurdan-auto",
    name: "Хурдан авто засвар",
    category: "auto-repair",
    district: "songinokhairkhan",
    area: "Нисэхийн тойрог",
    rating: 4.5,
    reviewCount: 97,
    services: [
      { name: "Тос, шүүр солих", duration: 30, price: 45000 },
      { name: "Компьютер оношилгоо", duration: 45, price: 35000 },
      { name: "Дугуй солих, тэнцвэржүүлэх", duration: 60, price: 40000 },
    ],
    open: {
      today: ["09:00", "10:00", "11:30", "14:00", "16:00", "18:00"],
      tomorrow: ["09:00", "09:30", "11:00", "13:00", "15:30", "17:30", "19:00"],
    },
  },
  {
    slug: "tunglag-car-wash",
    name: "Тунгалаг авто угаалга",
    category: "car-wash",
    district: "chingeltei",
    area: "Бөмбөгөр",
    rating: 4.4,
    reviewCount: 88,
    services: [
      { name: "Гадна угаалга", duration: 20, price: 15000 },
      { name: "Гадна, дотор угаалга", duration: 45, price: 30000 },
      { name: "Суудлын химийн цэвэрлэгээ", duration: 120, price: 120000 },
    ],
    open: {
      today: ["09:00", "09:20", "10:40", "12:00", "13:20", "15:40", "17:00", "18:20", "20:00"],
      tomorrow: ["09:00", "09:40", "11:00", "12:20", "14:00", "16:20", "18:00", "19:40"],
    },
  },
  {
    slug: "nokhor-vet",
    name: "Нөхөр мал эмнэлэг",
    category: "vet",
    district: "khan-uul",
    area: "Зайсан",
    rating: 4.9,
    reviewCount: 64,
    services: [
      { name: "Нохой, муурны үзлэг", duration: 30, price: 25000 },
      { name: "Вакцинжуулалт", duration: 20, price: 35000 },
      { name: "Үс засалт, угаалга", duration: 90, price: 60000 },
    ],
    open: {
      today: ["10:00", "11:30", "14:00", "17:30"],
      tomorrow: ["09:30", "11:00", "13:30", "16:00", "18:30"],
    },
  },
];
