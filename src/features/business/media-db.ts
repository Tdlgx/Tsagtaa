import "server-only";

import type { LatLng } from "@/features/business/locations";
import { sql } from "@/lib/db";

/*
 * Газрын лого, зураг, байршлын цэг. Дуудагчид эхлээд хэн асууж байгааг шалгана
 * (`requireBusinessAccess`); эдгээр функцууд зөвхөн хадгалж, уншина.
 */

export const MAX_PHOTOS = 6;

export type ImageKind = "logo" | "photo";

export type BusinessImage = {
  id: string;
  kind: ImageKind;
  position: number;
  width: number;
  height: number;
};

export type ImageUpload = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

/**
 * Төрлийг browser-оос хэзээ ч авахгүй, файлаас өөрөөс нь уншина: зөвхөн WebP
 * болон JPEG (манай жижигрүүлэгчийн үүсгэдэг) нэвтэрнэ. Бусад бүх зүйл, тэр дундаа
 * script агуулж болох SVG татгалзагдана.
 */
export function sniffImageType(bytes: Uint8Array): "image/webp" | "image/jpeg" | null {
  const ascii = (from: number, to: number): string => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

/** Газрын бүх зураг (лого эхэнд, дараа нь зургууд дарааллаар). */
export async function listImages(businessId: string): Promise<BusinessImage[]> {
  return sql<BusinessImage[]>`
    SELECT id, kind, position, width, height FROM business_images
    WHERE business_id = ${businessId}
    ORDER BY kind, position, created_at
  `;
}

/** Шинэ лого хуучныг нэг transaction дотор орлоно (index нэгийг л зөвшөөрнө). */
export async function saveLogo(
  businessId: string,
  upload: ImageUpload,
  contentType: string,
  uploadedBy: string,
): Promise<string> {
  return sql.begin(async (tx) => {
    await tx`DELETE FROM business_images WHERE business_id = ${businessId} AND kind = 'logo'`;
    const [row] = await tx<{ id: string }[]>`
      INSERT INTO business_images (business_id, kind, position, content_type, bytes, width, height, uploaded_by)
      VALUES (${businessId}, 'logo', 0, ${contentType}, ${upload.bytes}, ${upload.width},
        ${upload.height}, ${uploadedBy})
      RETURNING id
    `;
    return row!.id;
  });
}

export type AddPhotoResult = { ok: true; id: string } | { ok: false; reason: "limit" };

/**
 * Зургийг төгсгөлд нэмнэ. Эхлээд газрын мөрийг lock хийдэг тул яг нэг мөчид
 * хоёр upload хоёулаа зургаа дахь болж багтах боломжгүй.
 */
export async function addPhoto(
  businessId: string,
  upload: ImageUpload,
  contentType: string,
  uploadedBy: string,
): Promise<AddPhotoResult> {
  return sql.begin(async (tx): Promise<AddPhotoResult> => {
    await tx`SELECT id FROM businesses WHERE id = ${businessId} FOR UPDATE`;
    const [stats] = await tx<{ count: number; next: number }[]>`
      SELECT count(*)::int AS count, coalesce(max(position) + 1, 0)::int AS next
      FROM business_images WHERE business_id = ${businessId} AND kind = 'photo'
    `;
    const { count = 0, next = 0 } = stats ?? {};
    if (count >= MAX_PHOTOS) return { ok: false, reason: "limit" };
    const [row] = await tx<{ id: string }[]>`
      INSERT INTO business_images (business_id, kind, position, content_type, bytes, width, height, uploaded_by)
      VALUES (${businessId}, 'photo', ${next}, ${contentType}, ${upload.bytes}, ${upload.width},
        ${upload.height}, ${uploadedBy})
      RETURNING id
    `;
    return { ok: true, id: row!.id };
  });
}

/** Газрын нэг зургийг устгана; өөр газрын зургийг устгаж чадахгүй. */
export async function deleteImage(businessId: string, imageId: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM business_images WHERE id = ${imageId} AND business_id = ${businessId}
    RETURNING id
  `;
  return rows.length > 0;
}

/** Цэгийг тохируулна, эсвэл `null`-оор хасна. DB мөн бүсийг шалгана. */
export async function setLocation(businessId: string, location: LatLng | null): Promise<boolean> {
  const rows = await sql`
    UPDATE businesses
    SET latitude = ${location?.lat ?? null}, longitude = ${location?.lng ?? null}
    WHERE id = ${businessId}
    RETURNING id
  `;
  return rows.length > 0;
}

export type StoredImage = {
  contentType: string;
  bytes: Uint8Array;
  status: string;
  slug: string;
};

/** Зургийн route-д: byte-ууд болон хэнийх вэ (хэн харж болохыг шийдэхэд). */
export async function getStoredImage(id: string): Promise<StoredImage | null> {
  const [row] = await sql<StoredImage[]>`
    SELECT i.content_type AS "contentType", i.bytes, b.status, b.slug
    FROM business_images i JOIN businesses b ON b.id = i.business_id
    WHERE i.id = ${id}
  `;
  return row ?? null;
}

export type MapBusiness = {
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  logoId: string | null;
  photoId: string | null;
  createdAt: Date;
};

/** Цэгтэй бүх идэвхтэй газар, шинэ нь эхэндээ, лого болон эхний зурагтайгаа. */
export async function getMapBusinesses(): Promise<MapBusiness[]> {
  return sql<MapBusiness[]>`
    SELECT b.slug, b.name, b.category, b.district, b.address, b.phone,
      b.latitude AS lat, b.longitude AS lng, b.created_at AS "createdAt",
      (SELECT i.id FROM business_images i WHERE i.business_id = b.id AND i.kind = 'logo')
        AS "logoId",
      (SELECT i.id FROM business_images i WHERE i.business_id = b.id AND i.kind = 'photo'
        ORDER BY i.position LIMIT 1) AS "photoId"
    FROM businesses b
    WHERE b.status = 'active' AND b.latitude IS NOT NULL
    ORDER BY b.created_at DESC
  `;
}
