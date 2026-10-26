"use client";

import { ArrowRight, Hourglass, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type JSX } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import { useT } from "@/i18n/client";
import { APP_URL } from "@/lib/constants";

export type RegisteredBusiness = {
  name: string;
  slug: string;
  category: BusinessCategorySlug;
};

/** Илгээсний дараа: шинэ газрын бэхэн "гишүүнчлэлийн карт", дараа нь юу болохыг. */
export function RegistrationSuccess({
  business,
  onAnother,
}: {
  business: RegisteredBusiness;
  onAnother: () => void;
}): JSX.Element {
  const t = useT();
  const words = t.register.success;
  const { icon: Icon } = getBusinessCategory(business.category);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Шинэ картыг харагдах хүрээнд оруулна (маягтыг орлох ба хуудасны оройгоос хол доор байдаг).
  useEffect(() => {
    const heading = headingRef.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="mx-auto flex max-w-xl animate-in flex-col items-center text-center duration-500 ease-soft fade-in slide-in-from-bottom-4">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="scroll-mt-24 font-heading text-heading font-medium text-foreground outline-none"
      >
        {words.title}
      </h2>
      <p role="status" className="mt-2 text-base text-muted-foreground">
        {words.lead(business.name)}
      </p>

      <TiltCard className="mt-8 w-full rounded-xl bg-brand-ink text-left text-brand-ink-foreground shadow-lg">
        <BrandMark
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-12 size-48 text-primary opacity-[0.08]"
        />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="size-6" />
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-sun px-2.5 py-1 text-xs font-semibold text-brand-ink">
              <Hourglass className="size-3.5" />
              {words.status}
            </span>
          </div>
          <p className="mt-6 font-heading text-2xl font-medium tracking-tight">{business.name}</p>
          <p className="text-sm text-brand-ink-muted">{t.categories[business.category].label}</p>
          <div className="mt-6 border-t border-dashed border-brand-ink-muted/30 pt-4">
            <p className="text-xs text-brand-ink-muted">{words.address}</p>
            <p className="font-medium break-all text-primary">
              {new URL(APP_URL).host}/book/{business.slug}
            </p>
          </div>
        </div>
      </TiltCard>

      <div className="mt-8 w-full text-left">
        <h3 className="text-sm font-medium text-foreground">{words.nextTitle}</h3>
        <ol className="mt-3 flex flex-col gap-3">
          {words.next.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href={`/dashboard/${business.slug}`}>
            {words.dashboard}
            <ArrowRight data-icon="end" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="flex-1" onClick={onAnother}>
          <Plus data-icon="start" />
          {words.another}
        </Button>
      </div>
    </div>
  );
}
