import { cookies } from "next/headers";
import { Suspense, type JSX, type ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CursorBackdrop } from "@/components/shared/cursor-backdrop";
import { WelcomeDialog } from "@/features/onboarding/components/welcome-dialog";
import { SplashScreen } from "@/features/splash/components/splash-screen";
import { SPLASH_COOKIE } from "@/features/splash/splash";

/** Нийтийн хуудсуудын хүрээ: наалттай header, агуулга, footer, утасны доод цэс. */
export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  // Нээлтийн splash зөвхөн айлчлалын эхний хуудсан дээр тоглоно.
  const splashSeen = (await cookies()).has(SPLASH_COOKIE);

  return (
    <>
      {splashSeen ? null : <SplashScreen />}
      <CursorBackdrop />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* URL-ийг (?tour=1) уншдаг тул статик хуудсан дээр өөрийн Suspense хил хэрэгтэй. */}
      <Suspense fallback={null}>
        <WelcomeDialog />
      </Suspense>
      {/* Зай нөөцөлдөг тул утсан дээр тогтмол доод цэс footer-ийг хэзээ ч халхлахгүй. */}
      <div aria-hidden className="h-16 pb-safe md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
