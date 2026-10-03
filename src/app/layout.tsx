import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { JSX } from "react";

import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import "./globals.css";

// Mongolian needs "cyrillic-ext" for Ө ө Ү ү, and "latin-ext" covers the ₮ sign.
// With only "cyrillic" those letters would fall back to a different system font.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
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
  themeColor: "#04654c",
};

export default function RootLayout({ children }: LayoutProps<"/">): JSX.Element {
  return (
    <html lang="mn" className={cn(inter.variable, "h-full antialiased")}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
