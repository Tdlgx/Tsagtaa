"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { TOUR_HREF } from "@/features/onboarding/onboarding";
import { useT } from "@/i18n/client";

/** Хайлтын хуудсан дээр заавартай аяллыг (дахин) эхлүүлэх header-ийн холбоос. */
export function TourButton(): JSX.Element {
  const t = useT();

  return (
    <Link
      href={TOUR_HREF}
      title={t.nav.guideTitle}
      className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted is-hover:text-foreground"
    >
      <CircleHelp className="size-5" />
      <span className="max-sm:sr-only">{t.nav.guide}</span>
    </Link>
  );
}
