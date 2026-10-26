"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, JSX } from "react";

/**
 * Light / dark / system theme. next-themes хуудас зурагдахаас өмнө <html> дээр
 * `.dark` классыг бичдэг тул dark mode хэрэглэгчдэд цагаан анивчилт гарахгүй.
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
