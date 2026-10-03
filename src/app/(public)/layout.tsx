import type { JSX, ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Shell for public pages: header + page content + footer. */
export default function PublicLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
