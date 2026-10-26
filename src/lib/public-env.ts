import { parseEnv, publicEnvSchema, type PublicEnv } from "@/lib/env-schema";

/**
 * Шалгагдсан NEXT_PUBLIC_* хувьсагчид, Server болон Client Component-д хоёуланд аюулгүй.
 *
 * Хувьсагч бүрийг тодорхой (`process.env.NEXT_PUBLIC_...`) нэрлэдэг, учир нь Next.js
 * нийтийн хувьсагчдыг зөвхөн build хийх үед бүтэн нэрийг нь харж чадвал browser
 * bundle-д шингээдэг. `parseEnv(publicEnvSchema, process.env)` browser дээр хоосон байна.
 */
export const publicEnv: PublicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
