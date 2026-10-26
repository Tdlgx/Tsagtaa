/**
 * Газрын зургийн цэгүүд. Сервер (шалгадаг) болон газрын зургийн компонентууд
 * хуваалцана. Үйлчилгээний бүс нь зайтай Улаанбаатар, DB-ийн мөрддөг
 * (`businesses_location_area`) хүрээтэй ижил.
 */

export type LatLng = { lat: number; lng: number };

export const SERVICE_AREA = { south: 47.6, north: 48.2, west: 106.4, east: 107.6 } as const;

/** Сүхбаатарын талбай: харуулах юм байхгүй үед газрын зураг эндээс нээгдэнэ. */
export const CITY_CENTER: LatLng = { lat: 47.9186, lng: 106.9176 };

/** Цэг Улаанбаатарын үйлчилгээний бүсэд (DB-ийн шалгадагтай ижил хүрээнд) байгаа эсэх. */
export function isInServiceArea({ lat, lng }: LatLng): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= SERVICE_AREA.south &&
    lat <= SERVICE_AREA.north &&
    lng >= SERVICE_AREA.west &&
    lng <= SERVICE_AREA.east
  );
}

/** Зургаан аравтын орон нь ойролцоогоор 10 см: хангалттай бөгөөд хадгалсан утгыг цэгцтэй байлгана. */
export function roundLatLng({ lat, lng }: LatLng): LatLng {
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

/**
 * Жишээ газруудын ойролцоо цэгүүд (хорооллоор нь), ингэснээр шинэ demo-д газрын
 * зураг хоосон биш байна. Жинхэнэ газрууд өөрсдөө тохируулна.
 */
export const SAMPLE_LOCATIONS: Record<string, LatLng> = {
  "ongo-salon": { lat: 47.9192, lng: 106.9168 },
  "khaan-barber": { lat: 47.8889, lng: 106.9152 },
  "gerelt-manicure": { lat: 47.9221, lng: 106.9625 },
  "amar-massage": { lat: 47.9163, lng: 106.9043 },
  "tod-beauty": { lat: 47.9177, lng: 106.8889 },
  "enkh-amgalan-clinic": { lat: 47.9206, lng: 106.9658 },
  "inee-dental": { lat: 47.9134, lng: 106.9224 },
  "khurdan-auto": { lat: 47.8697, lng: 106.7826 },
  "tunglag-car-wash": { lat: 47.9121, lng: 106.8594 },
  "nokhor-vet": { lat: 47.8876, lng: 106.9187 },
};
