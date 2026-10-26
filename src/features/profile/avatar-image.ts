/** Жижигрүүлэхээс өмнө хүлээн авах хамгийн том зураг (утасны камер 3–12 MB үүсгэдэг). */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
/** Хадгалах дөрвөлжингийн тал, px: 80 px avatar-д 2× дээр хурц. */
const SIDE = 320;

export type AvatarError = "notImage" | "tooLarge" | "failed";

/**
 * Сонгосон зураг → голлуулсан дөрвөлжин JPEG data URL, localStorage-д багтахаар
 * жижиг. Зургийг browser дээр decode хийж дахин зурдаг тул юу ч upload хийгдэхгүй,
 * EXIF мэдээлэл (байршил, камер) үлдэхгүй.
 */
export async function toAvatar(file: File): Promise<string | AvatarError> {
  if (!file.type.startsWith("image/")) return "notImage";
  if (file.size > MAX_SOURCE_BYTES) return "tooLarge";

  try {
    // `imageOrientation: "from-image"` утасны зургийг зөв чиглэлтэй байлгана.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = SIDE;
    canvas.height = SIDE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "failed";
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      SIDE,
      SIDE,
    );
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    // Decode хийж чаддаггүй browser дээрх HEIC, эсвэл эвдэрсэн файл.
    return "failed";
  }
}
