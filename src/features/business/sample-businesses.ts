import type { BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";

export type SampleService = {
  name: string;
  /** Minutes */
  duration: number;
  /** Tögrög */
  price: number;
};

export type SampleBusiness = {
  slug: string;
  name: string;
  category: BusinessCategorySlug;
  district: DistrictSlug;
  /** Neighbourhood or landmark people use to find the place. */
  area: string;
  rating: number;
  reviewCount: number;
  services: readonly SampleService[];
  /** Open start times, "HH:MM", Ulaanbaatar time. Gaps are already booked. */
  open: { today: readonly string[]; tomorrow: readonly string[] };
};

/**
 * Sample businesses for the search page until real listings come from the
 * database. Names are invented; open times are fixed per day so the page looks
 * the same on every visit (past times are hidden at request time).
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
    slug: "setgel-salon",
    name: "Сэтгэл салон",
    category: "hair",
    district: "bayangol",
    area: "3, 4-р хороолол",
    rating: 4.5,
    reviewCount: 74,
    services: [
      { name: "Эмэгтэй үс засалт", duration: 45, price: 28000 },
      { name: "Хими", duration: 150, price: 110000 },
      { name: "Хүүхдийн үс засалт", duration: 30, price: 15000 },
    ],
    open: {
      today: ["10:00", "11:30", "15:00", "18:30"],
      tomorrow: ["10:00", "12:00", "13:30", "16:00", "18:00", "19:30"],
    },
  },
  {
    slug: "nomad-barber",
    name: "Номад барбер",
    category: "barber",
    district: "sukhbaatar",
    area: "Сөүлийн гудамж",
    rating: 4.9,
    reviewCount: 302,
    services: [
      { name: "Эрэгтэй үс засалт", duration: 45, price: 30000 },
      { name: "Халуун алчууртай сахал засалт", duration: 30, price: 20000 },
    ],
    open: {
      today: ["12:00", "17:15", "20:15"],
      tomorrow: ["10:00", "11:45", "15:30", "17:15", "19:00"],
    },
  },
  {
    slug: "tsetseg-nail",
    name: "Цэцэг нэйл студи",
    category: "nails",
    district: "khan-uul",
    area: "Яармаг",
    rating: 4.8,
    reviewCount: 143,
    services: [
      { name: "Гель будалт", duration: 60, price: 38000 },
      { name: "Хумс уртасгалт", duration: 120, price: 75000 },
      { name: "Маникюр", duration: 45, price: 25000 },
    ],
    open: {
      today: ["09:00", "10:00", "13:00", "14:00", "16:00", "18:00", "20:00"],
      tomorrow: ["09:00", "11:00", "13:00", "15:00", "17:00"],
    },
  },
  {
    slug: "nar-spa",
    name: "Нар спа",
    category: "massage",
    district: "khan-uul",
    area: "Нүхтийн ам",
    rating: 4.7,
    reviewCount: 89,
    services: [
      { name: "Чулуун массаж", duration: 90, price: 95000 },
      { name: "Нуруу, хүзүүний массаж", duration: 60, price: 65000 },
    ],
    open: {
      today: ["10:30", "15:30", "19:00"],
      tomorrow: ["09:00", "12:00", "15:00", "18:00"],
    },
  },
  {
    slug: "sod-beauty",
    name: "Сод гоо сайхан",
    category: "beauty",
    district: "bayangol",
    area: "Нарантуулын зах орчим",
    rating: 4.4,
    reviewCount: 37,
    services: [
      { name: "Хөмсөг шивээс", duration: 120, price: 150000 },
      { name: "Хөмсөг засалт", duration: 30, price: 18000 },
      { name: "Сормуус өргөлт", duration: 60, price: 45000 },
    ],
    open: {
      today: ["11:00", "13:30", "17:00"],
      tomorrow: ["10:30", "14:00", "16:30", "18:30"],
    },
  },
  {
    slug: "erdene-hair",
    name: "Эрдэнэ үсчин",
    category: "hair",
    district: "bayanzurkh",
    area: "Улаанхуаран",
    rating: 4.3,
    reviewCount: 52,
    services: [
      { name: "Эрэгтэй үс засалт", duration: 30, price: 15000 },
      { name: "Эмэгтэй үс засалт", duration: 45, price: 22000 },
    ],
    open: {
      today: ["09:00", "09:30", "12:00", "14:30", "15:00", "17:30", "18:00", "20:30"],
      tomorrow: ["09:00", "10:30", "11:00", "13:00", "16:30", "19:00"],
    },
  },
  {
    slug: "khurel-barber",
    name: "Хүрэл барбер",
    category: "barber",
    district: "songinokhairkhan",
    area: "Толгойт",
    rating: 4.6,
    reviewCount: 66,
    services: [
      { name: "Эрэгтэй үс засалт", duration: 30, price: 18000 },
      { name: "Сахал засалт", duration: 30, price: 12000 },
    ],
    open: {
      today: ["10:00", "11:00", "14:30", "19:00"],
      tomorrow: ["09:30", "10:00", "12:30", "15:00", "18:30", "20:00"],
    },
  },
];
