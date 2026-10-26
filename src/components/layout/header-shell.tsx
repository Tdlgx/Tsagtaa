"use client";

import type { JSX, ReactNode } from "react";

import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

type HeaderShellProps = {
  children: ReactNode;
  /** Гүйлгэлтийн байрлалаас үл хамааран төлөвийг урьдчилан харуулна (/design-system-д ашиглана). */
  forceScrolled?: boolean;
  sticky?: boolean;
  className?: string;
};

/**
 * Header-ийн дэвсгэр. Хуудасны дээд хэсэгт тунгалаг; хуудсыг гүйлгэмэгц бүдгэрүүлсэн
 * хагас тунгалаг давхарга нарийн шугамтайгаар аажуухан гарч ирнэ. Зөвхөн давхаргын
 * тунгалаг байдал анимэйшн хийгдэнэ.
 */
export function HeaderShell({
  children,
  forceScrolled,
  sticky = true,
  className,
}: HeaderShellProps): JSX.Element {
  const scrolled = useScrolled();
  const isScrolled = forceScrolled ?? scrolled;

  return (
    <header
      data-scrolled={isScrolled}
      className={cn(
        // Байрлалтай элемент дээрх z-40 аль хэдийн stacking context үүсгэдэг.
        // `isolate` бүү нэм: Chrome дээр тэр нь "backdrop root" болж, доорх blur
        // бүдгэрүүлэх юмгүй болно.
        "z-40",
        sticky ? "sticky top-0" : "relative",
        "before:absolute before:inset-0 before:-z-10 before:border-b before:border-border before:bg-background/80 before:opacity-0 before:backdrop-blur-md before:transition-opacity before:duration-250 before:ease-soft",
        "data-[scrolled=true]:before:opacity-100",
        className,
      )}
    >
      {children}
    </header>
  );
}
