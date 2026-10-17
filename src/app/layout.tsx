import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import type { JSX } from "react";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";
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

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Онлайн цаг захиалга`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: APP_NAME,
    title: `${APP_NAME} — Онлайн цаг захиалга`,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1030" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">): JSX.Element {
  return (
    // next-themes sets the theme class on <html> before React hydrates.
    <html
      lang="mn"
      suppressHydrationWarning
      className={cn(onest.variable, unbounded.variable, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
