"use client";

import { useEffect, useState, type AnimationEvent, type CSSProperties, type JSX } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { SPLASH_COOKIE } from "@/features/splash/splash";
import { useLocale, useT } from "@/i18n/client";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LETTERS_AT = 1000;
const LETTER_STAGGER = 60;

/**
 * Апп маягийн нээлтийн дэлгэц: логоны дарааллыг бэхэн дэвсгэр дээр томоор тоглуулж,
 * дараа нь дэлгэц дээш хөөрч хуудас гарч ирнэ. Сервер дээр render хийгдэж CSS-ээр
 * удирдагддаг тул анхны зурагдалтыг бүрхэж, hydration-оос өмнө ч тоглоно. Товшвол
 * алгасна. Layout үүнийг session cookie тохирох хүртэл л render хийнэ; "reduce motion"
 * бүрмөсөн нууна.
 */
export function SplashScreen(): JSX.Element | null {
  const locale = useLocale();
  const t = useT();
  const brand = locale === "mn" ? APP_NAME : t.brand;
  const [skipping, setSkipping] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Session cookie (хугацаагүй): энэ айлчлалын дараагийн хуудас ачаалахад splash алгасна.
    document.cookie = `${SPLASH_COOKIE}=1; path=/; samesite=lax`;
  }, []);

  const finish = (event: AnimationEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget && event.animationName === "splash-exit") {
      setGone(true);
    }
  };

  if (gone) return null;

  return (
    <div
      data-splash
      aria-hidden
      onClick={() => setSkipping(true)}
      onAnimationEnd={finish}
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-brand-ink motion-reduce:hidden",
        skipping ? "animate-[splash-exit_250ms_var(--ease-soft)_forwards]" : "animate-splash-exit",
      )}
    >
      {/* Ирмэг рүү бүдгэрсэн бүдэг шар-ногоон цэгэн тор. */}
      <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--primary)_18%,transparent)_1px,transparent_1.5px)] mask-[radial-gradient(closest-side,black,transparent)] bg-size-[18px_18px]" />

      <div className="relative flex animate-splash-zoom flex-col items-center gap-7">
        <div className="relative flex items-center justify-center">
          <span className="absolute size-56 animate-splash-halo rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_32%,transparent),transparent)] blur-2xl" />
          <BrandMark className="relative size-24 animate-splash-mark text-primary md:size-28 [&_[data-part=bottom]]:animate-splash-bottom [&_[data-part=top]]:animate-splash-top" />
        </div>

        <p className="relative font-heading text-3xl font-semibold tracking-tight text-brand-ink-foreground md:text-4xl">
          {Array.from(brand).map((letter, index) => (
            <span
              key={index}
              className="inline-block animate-splash-letter"
              style={{ animationDelay: `${LETTERS_AT + index * LETTER_STAGGER}ms` }}
            >
              {letter}
            </span>
          ))}
          {/* Гялбаа: үг дахин шар-ногоон өнгөөр, зөвхөн хөдлөх туузаар харагдана. */}
          <span
            className="pointer-events-none absolute inset-0 animate-splash-shine mask-[linear-gradient(110deg,transparent_42%,black_50%,transparent_58%)] mask-size-[250%_100%] mask-position-[100%_0] mask-no-repeat text-(--shine) opacity-0"
            style={{ "--shine": "var(--primary)" } as CSSProperties}
          >
            {brand}
          </span>
        </p>
      </div>
    </div>
  );
}
