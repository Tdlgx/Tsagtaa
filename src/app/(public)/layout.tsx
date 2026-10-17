import type { JSX, ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Shell for public pages: sticky header, content, footer, phone tab bar. */
export default function PublicLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Reserves room so the fixed tab bar never covers the footer on phones. */}
      <div aria-hidden className="h-16 pb-safe md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
