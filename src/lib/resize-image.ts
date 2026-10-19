/** Largest file accepted before shrinking (phone cameras produce 3–12 MB). */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
/** What the server accepts after shrinking (the database allows a little more). */
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
 * A chosen image → a smaller WebP (JPEG where WebP cannot be written), the
 * longest side at most `maxSide`. Redrawing it in the browser leaves EXIF
 * data (location, camera) behind and means only our own formats are sent.
 * Transparency survives in WebP, which suits logos.
 */
export async function resizeImage(
  file: File,
  { maxSide, quality = 0.82 }: { maxSide: number; quality?: number },
): Promise<ResizedImage | ResizeError> {
  if (!file.type.startsWith("image/")) return "notImage";
  if (file.size > MAX_SOURCE_BYTES) return "tooLarge";

  try {
    // `imageOrientation: "from-image"` keeps phone photos the right way up.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    let side = maxSide;
    let q = quality;
    // Shrink further if a detailed photo is still too heavy.
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
      // Browsers that cannot write WebP hand back PNG instead.
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
    // HEIC on browsers that can't decode it, or a broken file.
    return "failed";
  }
}
