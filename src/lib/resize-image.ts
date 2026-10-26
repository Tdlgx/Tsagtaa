/** Жижигрүүлэхээс өмнө хүлээн авах хамгийн том файл (утасны камер 3–12 MB үүсгэдэг). */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
/** Жижигрүүлсний дараа серверийн хүлээн авах хэмжээ (DB арай илүүг зөвшөөрнө). */
export const MAX_UPLOAD_BYTES = 700 * 1024;

export type ResizedImage = {
  blob: Blob;
  type: "image/webp" | "image/jpeg";
  width: number;
  height: number;
};

export type ResizeError = "notImage" | "tooLarge" | "failed";

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Сонгосон зураг → урт тал нь хамгийн ихдээ `maxSide` байх жижиг WebP (WebP бичиж
 * чадахгүй бол JPEG). Browser дээр дахин зурснаар EXIF мэдээлэл (байршил, камер)
 * үлдэхгүй бөгөөд зөвхөн манай форматууд илгээгдэнэ. WebP тунгалаг байдлыг
 * хадгалдаг нь логонд тохиромжтой.
 */
export async function resizeImage(
  file: File,
  { maxSide, quality = 0.82 }: { maxSide: number; quality?: number },
): Promise<ResizedImage | ResizeError> {
  if (!file.type.startsWith("image/")) return "notImage";
  if (file.size > MAX_SOURCE_BYTES) return "tooLarge";

  try {
    // `imageOrientation: "from-image"` утасны зургийг зөв чиглэлтэй байлгана.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    let side = maxSide;
    let q = quality;
    // Нарийн зураг хүнд хэвээр байвал улам жижигрүүлнэ.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(16, Math.round(bitmap.width * scale));
      const height = Math.max(16, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "failed";
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, width, height);

      let blob = await toBlob(canvas, "image/webp", q);
      // WebP бичиж чаддаггүй browser-ууд оронд нь PNG буцаадаг.
      if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", q);
      if (!blob) return "failed";
      if (blob.size <= MAX_UPLOAD_BYTES) {
        bitmap.close();
        return { blob, type: blob.type as ResizedImage["type"], width, height };
      }
      side = Math.round(side * 0.8);
      q = Math.max(0.6, q - 0.08);
    }
    bitmap.close();
    return "tooLarge";
  } catch {
    // Decode хийж чаддаггүй browser дээрх HEIC, эсвэл эвдэрсэн файл.
    return "failed";
  }
}
