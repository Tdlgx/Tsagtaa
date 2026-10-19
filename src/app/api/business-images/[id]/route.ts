import type { NextRequest } from "next/server";

import { getStoredImage } from "@/features/business/media-db";
import { getCurrentAccount } from "@/lib/auth/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A business's logo or photo. A live place's images are public and cached
 * for a year (an id never gets new bytes: a new upload is a new id). Images
 * of a place still under review are only for its team and the Цагтаа team.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/business-images/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });

  const image = await getStoredImage(id).catch(() => null);
  if (!image) return new Response(null, { status: 404 });

  const isPublic = image.status === "active";
  if (!isPublic) {
    const account = await getCurrentAccount();
    const allowed =
      account?.isPlatformAdmin ||
      account?.memberships.some((membership) => membership.slug === image.slug);
    if (!allowed) return new Response(null, { status: 404 });
  }

  return new Response(Buffer.from(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      // Never let a browser treat the bytes as anything but this image.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
