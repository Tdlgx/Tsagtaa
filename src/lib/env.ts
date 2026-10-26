import "server-only";

import { envSchema, parseEnv, type Env } from "@/lib/env-schema";

/**
 * Зөвхөн серверийн кодод зориулсан шалгагдсан environment хувьсагчид
 * (Server Component, Route Handler, Server Action).
 *
 * Дээрх `server-only` import нь энэ файлыг Client Component-оос import хийх аливаа
 * оролдлогыг build-ийн алдаа болгодог тул DATABASE_URL зэрэг нууц мэдээлэл browser
 * bundle-д хэзээ ч орохгүй. Client кодод оронд нь `publicEnv` ашиглана.
 */
export const env: Env = parseEnv(envSchema, {
  ...process.env,
  // Build тэднийг анхдагч утгуудын хамт шингээхийн тулд нэг нэгээр нь нэрлэнэ
  // (next.config.ts-ийг үз). Vercel дээр тэд runtime environment-д байхгүй.
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
