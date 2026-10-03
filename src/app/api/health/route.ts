import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import type { Env } from "@/lib/env-schema";

type HealthResponse = {
  status: "ok";
  time: string;
  env: Env["NODE_ENV"];
};

/**
 * GET /api/health — liveness probe for uptime monitors and deploy checks.
 * Returns only non-sensitive data. GET Route Handlers are dynamic by default,
 * so `time` is fresh on every request.
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
