/** Largest photo accepted before shrinking (phone cameras produce 3–12 MB). */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
/** Side of the stored square, px: sharp at 2× for the 80 px avatar. */
const SIDE = 320;

export type AvatarError = "notImage" | "tooLarge" | "failed";

/**
 * A chosen photo → a centred square JPEG data URL, small enough to keep in
 * localStorage. The photo is decoded and redrawn in the browser, so nothing
 * is uploaded and any EXIF data (location, camera) is left behind.
 */
export async function toAvatar(file: File): Promise<string | AvatarError> {
  if (!file.type.startsWith("image/")) return "notImage";
  if (file.size > MAX_SOURCE_BYTES) return "tooLarge";

  try {
    // `imageOrientation: "from-image"` keeps phone photos the right way up.
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
    // HEIC on browsers that can't decode it, or a broken file.
    return "failed";
  }
}
