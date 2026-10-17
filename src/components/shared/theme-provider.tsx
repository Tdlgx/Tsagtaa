"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, JSX } from "react";

/**
 * Light / dark / system theme. next-themes writes the `.dark` class on <html>
 * before the page paints, so there is no white flash for dark-mode users.
 */
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>): JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}
