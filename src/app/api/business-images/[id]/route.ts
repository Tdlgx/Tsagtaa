import type { NextRequest } from "next/server";

import { getStoredImage } from "@/features/business/media-db";
import { getCurrentAccount } from "@/lib/auth/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Бизнесийн лого эсвэл зураг. Идэвхтэй газрын зургууд нийтэд нээлттэй бөгөөд нэг
 * жил cache-лэгдэнэ (нэг id хэзээ ч шинэ агуулга авахгүй: шинэ upload = шинэ id).
 * Шалгагдаж буй газрын зургийг зөвхөн тэр газрын баг болон Цагтаагийн баг харна.
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
      // s-maxage нь Vercel-ийн CDN-д нийтийн зургийг хадгалах боломж олгоно, ингэснээр давтан
      // үзэлт function болон Neon-ыг алгасна. Жил биш нэг өдөр: устгасан зураг үйлчлэгдэхээ болино.
      "Cache-Control": isPublic
        ? "public, max-age=31536000, s-maxage=86400, immutable"
        : "private, no-store",
      // Browser эдгээр byte-уудыг энэ зургаас өөр зүйл гэж хэзээ ч ойлгохгүй байхаар.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
