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

// Mongolian Ө ө Ү ү live in the "cyrillic-ext" subset; "latin-ext" carries ₮.
// Body + UI: Onest, a calm grotesque drawn with Cyrillic as a first-class script.
const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

// Display: Unbounded, a wide geometric face. Its round, clock-like numerals
// carry the brand's big moments (headlines, the live time); never body text.
const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-unbounded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  // The env name labels staging/demo builds; in English the brand is spelled in Latin.
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

export default async function RootLayout({ children }: LayoutProps<"/">): Promise<JSX.Element> {
  const [locale, account] = await Promise.all([getLocale(), getCurrentAccount()]);

  return (
    // next-themes sets the theme class on <html> before React hydrates.
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
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
