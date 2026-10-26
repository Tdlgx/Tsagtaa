import type { NextConfig } from "next";

import { envSchema, parseEnv } from "./src/lib/env-schema";

// Хоёр нийтийн тохиргоо Vercel дээр ойлгомжтой утгатай тул dashboard-д бичих
// шаардлагагүй: нэр нь брэнд, домэйныг Vercel build бүрт өгдөг. Тодорхой зааж өгсөн
// утга (.env, dashboard) давуу эрхтэй хэвээр. DATABASE_URL нууц тул хэзээ ч таахгүй.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (!process.env.NEXT_PUBLIC_APP_URL && vercelHost) {
  process.env.NEXT_PUBLIC_APP_URL = `https://${vercelHost}`;
}
if (!process.env.NEXT_PUBLIC_APP_NAME) process.env.NEXT_PUBLIC_APP_NAME = "Цагтаа";

// Эрт зогсоох: .env байхгүй эсвэл буруу бол `next dev`, `next build`, `next start`-ийг
// санамсаргүй хуудсан дээр хожим унахын оронд ойлгомжтой мессежтэйгээр шууд зогсооно.
// Next.js энэ config-ийг уншихаас өмнө .env файлуудыг ачаалдаг.
parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // `X-Powered-By` header-ээр framework-ээ зарлахгүй.
  poweredByHeader: false,
  // Browser bundle-д шингээнэ, дээр бөглөсөн анхдагч утгуудын хамт.
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
};

export default nextConfig;
