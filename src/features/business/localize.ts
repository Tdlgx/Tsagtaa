import type { Booking } from "@/features/booking/booking";
import { SAMPLE_BUSINESSES, type SampleBusiness } from "@/features/business/sample-businesses";
import { SAMPLE_BUSINESSES_EN } from "@/features/business/sample-businesses-en";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { transliterate } from "@/i18n/transliterate";

/**
 * Жишээ өгөгдлийг Монголоор бичсэн (хадгалагдах, үндсэн хэлбэр). Эдгээр туслах
 * функцууд зочны хэл дээрх харуулах хуулбарыг буцаана; хадгалагдсан юу ч хэлээ
 * хэзээ ч солихгүй.
 */
export function localizeBusiness(business: SampleBusiness, locale: Locale): SampleBusiness {
  const en = locale === "en" ? SAMPLE_BUSINESSES_EN[business.slug] : undefined;
  if (!en) return business;
  return {
    ...business,
    name: en.name,
    area: en.area,
    services: business.services.map((service, index) => ({
      ...service,
      name: en.services[index] ?? service.name,
    })),
  };
}

/** Хадгалсан захиалгын бизнес, үйлчилгээ, ажилтны текст, зочны хэл дээр. */
export function localizeBooking(booking: Booking, locale: Locale): Booking {
  if (locale === "mn") return booking;
  const business = SAMPLE_BUSINESSES.find((item) => item.slug === booking.businessSlug);
  const en = SAMPLE_BUSINESSES_EN[booking.businessSlug];
  const serviceIndex =
    business?.services.findIndex((service) => service.name === booking.serviceName) ?? -1;

  return {
    ...booking,
    businessName: en?.name ?? booking.businessName,
    area: en?.area ?? booking.area,
    serviceName:
      (serviceIndex >= 0 ? en?.services[serviceIndex] : undefined) ?? booking.serviceName,
    staffName: transliterate(booking.staffName),
    staffRole: getDictionary(locale).staff[booking.category].role,
  };
}

/** Газрын хоёр хэл дээрх бүх нэр, хайлтад тааруулахад. */
export function getSearchableText(business: SampleBusiness): string[] {
  const en = SAMPLE_BUSINESSES_EN[business.slug];
  return [
    business.name,
    business.area,
    ...business.services.map((service) => service.name),
    ...(en ? [en.name, en.area, ...en.services] : []),
  ];
}
