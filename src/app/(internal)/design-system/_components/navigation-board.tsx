import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Design system: header (гүйлгэхээс өмнө/дараа) болон утасны доод цэс. */
export function NavigationBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Header · гүйлгэхээс өмнө / дараа">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <SiteHeader sticky={false} forceScrolled={false} />
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-linear-to-b from-primary-soft to-background">
            <SiteHeader sticky={false} forceScrolled />
          </div>
        </div>
        <Spec>
          Хуудасны дээд хэсэгт header тунгалаг. Гүйлгэх үед бүдэг (blur) дэвсгэр ба 1px шугам
          250ms-д бүдгэрч гарна. Энэ хуудсыг гүйлгээд дээрх жинхэнэ header-ээс харж болно.
        </Spec>
      </BoardSection>

      <BoardSection title="Гар утасны доод навигаци">
        <div className="grid gap-6 sm:grid-cols-2">
          {(["/", "/bookings"] as const).map((href) => (
            <div
              key={href}
              className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface-muted"
            >
              <div className="h-24" />
              <MobileNav activeHref={href} />
            </div>
          ))}
        </div>
        <Spec>
          Эрхий хуруу хүрэх доод хэсэгт 4 гол хэсэг. Нэг товч 64px өндөр, идэвхтэйг нь icon-ы ард
          зөөлөн ногоон хэлбэрээр тэмдэглэнэ. iPhone-ий доод зурвасаас (home indicator) зай авна.
        </Spec>
      </BoardSection>

      <BoardSection title="Footer">
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <SiteFooter />
        </div>
      </BoardSection>
    </>
  );
}
