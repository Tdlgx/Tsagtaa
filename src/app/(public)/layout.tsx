import { cookies } from "next/headers";
import { Suspense, type JSX, type ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CursorBackdrop } from "@/components/shared/cursor-backdrop";
import { WelcomeDialog } from "@/features/onboarding/components/welcome-dialog";
import { SplashScreen } from "@/features/splash/components/splash-screen";
import { SPLASH_COOKIE } from "@/features/splash/splash";

/** Shell for public pages: sticky header, content, footer, phone tab bar. */
export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  // The launch splash plays on the first page of a visit only.
  const splashSeen = (await cookies()).has(SPLASH_COOKIE);

  return (
    <>
      {splashSeen ? null : <SplashScreen />}
      <CursorBackdrop />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Reads the URL (?tour=1), so it needs its own Suspense boundary on static pages. */}
      <Suspense fallback={null}>
        <WelcomeDialog />
      </Suspense>
      {/* Reserves room so the fixed tab bar never covers the footer on phones. */}
      <div aria-hidden className="h-16 pb-safe md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
