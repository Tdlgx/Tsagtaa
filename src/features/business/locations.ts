/**
 * Map pins. Shared by the server (which checks) and the map components.
 * The service area is Ulaanbaatar with a margin, the same box the database
 * enforces (`businesses_location_area`).
 */

export type LatLng = { lat: number; lng: number };

export const SERVICE_AREA = { south: 47.6, north: 48.2, west: 106.4, east: 107.6 } as const;

/** Sükhbaatar Square: where a map opens when there is nothing to show. */
export const CITY_CENTER: LatLng = { lat: 47.9186, lng: 106.9176 };

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

/** Six decimals is about 10 cm: enough, and keeps stored values tidy. */
export function roundLatLng({ lat, lng }: LatLng): LatLng {
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

/**
 * Approximate pins for the sample places (by their neighbourhood), so the
 * map is not empty in a fresh demo. Real places set their own.
 */
export const SAMPLE_LOCATIONS: Record<string, LatLng> = {
  "ongo-salon": { lat: 47.9192, lng: 106.9168 },
  "khaan-barber": { lat: 47.8889, lng: 106.9152 },
  "gerelt-manicure": { lat: 47.9221, lng: 106.9625 },
  "amar-massage": { lat: 47.9163, lng: 106.9043 },
  "tod-beauty": { lat: 47.9177, lng: 106.8889 },
  "setgel-salon": { lat: 47.9188, lng: 106.8712 },
  "nomad-barber": { lat: 47.9142, lng: 106.9138 },
  "tsetseg-nail": { lat: 47.8562, lng: 106.8352 },
  "nar-spa": { lat: 47.8584, lng: 106.9551 },
  "sod-beauty": { lat: 47.9071, lng: 106.9493 },
  "erdene-hair": { lat: 47.9254, lng: 106.8263 },
  "khurel-barber": { lat: 47.9128, lng: 106.8183 },
  "enkh-amgalan-clinic": { lat: 47.9206, lng: 106.9658 },
  "inee-dental": { lat: 47.9134, lng: 106.9224 },
  "tsagaan-shud-dental": { lat: 47.8547, lng: 106.8381 },
  "khurdan-auto": { lat: 47.8697, lng: 106.7826 },
  "bat-motor": { lat: 47.9161, lng: 106.8862 },
  "tunglag-car-wash": { lat: 47.9121, lng: 106.8594 },
  "nokhor-vet": { lat: 47.8876, lng: 106.9187 },
};
