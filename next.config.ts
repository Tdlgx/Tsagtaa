import type { NextConfig } from "next";

import { envSchema, parseEnv } from "./src/lib/env-schema";

// The two public settings have obvious values on Vercel, so they need not be
// typed into the dashboard: the name is the brand, and Vercel gives every
// build its production domain. Anything set explicitly (.env, the dashboard)
// still wins. DATABASE_URL is a secret and is never guessed.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (!process.env.NEXT_PUBLIC_APP_URL && vercelHost) {
  process.env.NEXT_PUBLIC_APP_URL = `https://${vercelHost}`;
}
if (!process.env.NEXT_PUBLIC_APP_NAME) process.env.NEXT_PUBLIC_APP_NAME = "Цагтаа";

// Fail fast: stop `next dev`, `next build` and `next start` right away with a
// readable message if .env is missing or invalid, instead of failing later on a
// random page. Next.js loads .env files before this config is evaluated.
parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // Do not advertise the framework in the `X-Powered-By` response header.
  poweredByHeader: false,
  // Inlined into the browser bundle, including the defaults filled in above.
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
};

export default nextConfig;
