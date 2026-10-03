import { parseEnv, publicEnvSchema, type PublicEnv } from "@/lib/env-schema";

/**
 * Validated NEXT_PUBLIC_* variables, safe to use in both Server and Client Components.
 *
 * Each variable is referenced explicitly (`process.env.NEXT_PUBLIC_...`) because
 * Next.js only inlines public variables into the browser bundle when it can see
 * the full name at build time. `parseEnv(publicEnvSchema, process.env)` would be
 * empty in the browser.
 */
export const publicEnv: PublicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
