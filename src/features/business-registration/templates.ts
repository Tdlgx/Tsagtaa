import type { BusinessCategorySlug } from "@/features/business/categories";

export type ServiceTemplate = { mn: string; en: string; duration: number; price: number };

/** Usual services and Ulaanbaatar prices per kind of place; added in one tap, then edited. */
export const SERVICE_TEMPLATES: Record<BusinessCategorySlug, readonly ServiceTemplate[]> = {
  hair: [
    { mn: "Эмэгтэй үс засалт", en: "Women's haircut", duration: 45, price: 35_000 },
    { mn: "Эрэгтэй үс засалт", en: "Men's haircut", duration: 30, price: 20_000 },
    { mn: "Үс будалт", en: "Hair colouring", duration: 120, price: 90_000 },
    { mn: "Угаалт, хатаалт", en: "Wash and blow-dry", duration: 30, price: 15_000 },
    { mn: "Кератин эмчилгээ", en: "Keratin treatment", duration: 150, price: 150_000 },
  ],
  barber: [
    { mn: "Эрэгтэй үс засалт", en: "Men's haircut", duration: 30, price: 25_000 },
    { mn: "Сахал засалт", en: "Beard trim", duration: 20, price: 15_000 },
    { mn: "Үс, сахал хамт", en: "Haircut and beard", duration: 50, price: 35_000 },
    { mn: "Хүүхдийн үс засалт", en: "Kids' haircut", duration: 25, price: 15_000 },
  ],
  nails: [
    { mn: "Маникюр", en: "Manicure", duration: 45, price: 25_000 },
    { mn: "Гель будалт", en: "Gel polish", duration: 60, price: 35_000 },
    { mn: "Педикюр", en: "Pedicure", duration: 60, price: 40_000 },
    { mn: "Хумс уртасгалт", en: "Nail extensions", duration: 90, price: 60_000 },
  ],
  massage: [
    { mn: "Тайвшруулах массаж", en: "Relaxing massage", duration: 60, price: 60_000 },
    { mn: "Нуруу, хүзүүний массаж", en: "Back and neck massage", duration: 30, price: 35_000 },
    { mn: "Хөлийн массаж", en: "Foot massage", duration: 30, price: 30_000 },
    { mn: "Халуун чулуун массаж", en: "Hot stone massage", duration: 90, price: 90_000 },
  ],
  beauty: [
    { mn: "Нүүр цэвэрлэгээ", en: "Facial cleansing", duration: 60, price: 50_000 },
    { mn: "Сормуус суулгалт", en: "Eyelash extensions", duration: 90, price: 60_000 },
    { mn: "Хөмсөг засалт", en: "Brow shaping", duration: 20, price: 15_000 },
    { mn: "Арьс арчилгаа", en: "Skin care", duration: 45, price: 45_000 },
  ],
  clinic: [
    { mn: "Дотрын эмчийн үзлэг", en: "GP consultation", duration: 30, price: 30_000 },
    { mn: "Цусны ерөнхий шинжилгээ", en: "Blood test", duration: 15, price: 20_000 },
    { mn: "Зүрхний бичлэг (ЭКГ)", en: "ECG", duration: 20, price: 25_000 },
    { mn: "Хэт авиан шинжилгээ", en: "Ultrasound", duration: 30, price: 40_000 },
  ],
  dental: [
    { mn: "Шүдний үзлэг", en: "Dental check-up", duration: 30, price: 20_000 },
    { mn: "Шүдний цэвэрлэгээ", en: "Teeth cleaning", duration: 45, price: 60_000 },
    { mn: "Ломбо", en: "Filling", duration: 60, price: 80_000 },
    { mn: "Шүд авалт", en: "Tooth extraction", duration: 30, price: 50_000 },
  ],
  "auto-repair": [
    { mn: "Тос солих", en: "Oil change", duration: 30, price: 40_000 },
    { mn: "Компьютер оношилгоо", en: "Computer diagnostics", duration: 45, price: 30_000 },
    { mn: "Дугуй солих", en: "Tyre change", duration: 60, price: 40_000 },
    { mn: "Тоормосны засвар", en: "Brake repair", duration: 90, price: 80_000 },
  ],
  "car-wash": [
    { mn: "Гадна угаалга", en: "Exterior wash", duration: 30, price: 20_000 },
    { mn: "Бүтэн угаалга", en: "Full wash", duration: 60, price: 40_000 },
    { mn: "Дотор цэвэрлэгээ", en: "Interior cleaning", duration: 90, price: 60_000 },
    { mn: "Химийн цэвэрлэгээ", en: "Deep cleaning", duration: 180, price: 150_000 },
  ],
  vet: [
    { mn: "Ерөнхий үзлэг", en: "General check-up", duration: 30, price: 30_000 },
    { mn: "Вакцинжуулалт", en: "Vaccination", duration: 15, price: 25_000 },
    { mn: "Ариутгал", en: "Neutering", duration: 90, price: 150_000 },
    { mn: "Үс засалт, угаалга", en: "Grooming", duration: 60, price: 50_000 },
  ],
};
