import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import type { Env } from "@/lib/env-schema";

type HealthResponse = {
  status: "ok";
  time: string;
  env: Env["NODE_ENV"];
};

/**
 * GET /api/health — uptime monitor болон deploy шалгалтад зориулсан амьд эсэхийн шалгалт.
 * Зөвхөн нууц бус мэдээлэл буцаана. GET Route Handler анхдагчаар dynamic тул
 * `time` хүсэлт бүрт шинэ байна.
 */
export function GET(): NextResponse<HealthResponse> {
  return NextResponse.json(
    {
      status: "ok",
      time: new Date().toISOString(),
      env: env.NODE_ENV,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
