import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import type { JSX } from "react";

import { StorageScope } from "@/components/shared/storage-scope";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/i18n/client";
import { getI18n, getLocale } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import "./globals.css";

// Монгол Ө ө Ү ү үсгүүд "cyrillic-ext" дэд олонлогт байдаг; ₮-ийг "latin-ext" агуулна.
// Үндсэн текст + UI: Onest, кирилл үсгийг тэгш эрхтэйгээр зурсан тайван grotesque фонт.
const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

// Display: Unbounded, өргөн геометрийн фонт. Түүний бөөрөнхий, цаг шиг цифрүүд
// брэндийн том мөчүүдийг (гарчиг, амьд цаг) илэрхийлнэ; үндсэн текстэд хэзээ ч биш.
const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-unbounded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  // Env-ийн нэр staging/demo build-ийг ялгана; англи хэл дээр брэндийг латинаар бичнэ.
  const brand = locale === "mn" ? APP_NAME : t.brand;
  const title = `${brand} — ${t.meta.tagline}`;

  return {
    metadataBase: new URL(APP_URL),
    title: { default: title, template: `%s | ${brand}` },
    description: t.meta.description,
    applicationName: brand,
    openGraph: {
      type: "website",
      locale: locale === "mn" ? "mn_MN" : "en_US",
      siteName: brand,
      title,
      description: t.meta.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0f" },
  ],
};

/** Бүх хуудасны үндсэн layout: фонт, хэл, theme, хэрэглэгчийн storage хүрээ, toast, analytics. */
export default async function RootLayout({ children }: LayoutProps<"/">): Promise<JSX.Element> {
  const [locale, account] = await Promise.all([getLocale(), getCurrentAccount()]);

  return (
    // next-themes React hydrate хийхээс өмнө <html> дээр theme-ийн классыг тохируулна.
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(onest.variable, unbounded.variable, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={locale}>
          <ThemeProvider>
            <StorageScope accountId={account?.id ?? null}>{children}</StorageScope>
            <Toaster />
            {/* Vercel Web Analytics: хуудас үзэлт, cookie-гүй; Vercel-ээс гадна юу ч хийхгүй. */}
            <Analytics />
            {/* Vercel Speed Insights: Core Web Vitals; мөн Vercel-ээс гадна юу ч хийхгүй. */}
            <SpeedInsights />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
