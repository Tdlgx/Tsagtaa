import type { NextConfig } from "next";

import { envSchema, parseEnv } from "./src/lib/env-schema";

// Fail fast: stop `next dev`, `next build` and `next start` right away with a
// readable message if .env is missing or invalid, instead of failing later on a
// random page. Next.js loads .env files before this config is evaluated.
parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // Do not advertise the framework in the `X-Powered-By` response header.
  poweredByHeader: false,
};

export default nextConfig;
