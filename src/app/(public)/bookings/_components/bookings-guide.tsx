"use client";

import { ChevronDown, CirclePlay, Search, Ticket, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Accordion } from "radix-ui";
import type { JSX, ReactNode } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { createBookingCode, toStartInstant } from "@/features/booking/booking";
import { addBooking } from "@/features/booking/booking-store";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { getSampleStaff } from "@/features/staff/sample-staff";
import { useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { TOUR_HREF } from "@/features/onboarding/onboarding";
import { cn } from "@/lib/utils";

type GuideStep = { icon: LucideIcon; art: (t: Dictionary) => ReactNode };

/** Tiny UI drawings made of the real tokens, one per step. */
const STEPS: readonly GuideStep[] = [
  {
    icon: Search,
    art: (t) => (
      <span className="flex h-8 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs text-muted-foreground">
        <Search className="size-3.5" />
        {t.guide.artQuery}
      </span>
    ),
  },
  {
    icon: CirclePlay,
    art: () => (
      <span className="flex gap-1.5">
        {["11:00", "11:30", "12:00"].map((time, index) => (
          <span
            key={time}
            className={cn(
              "flex h-7 items-center rounded-full border px-2 text-xs font-medium tabular-nums",
              index === 1
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary-strong/30 bg-primary-soft text-primary-strong",
            )}
          >
            {time}
          </span>
        ))}
      </span>
    ),
  },
  {
    icon: UserRound,
    art: (t) => (
      <span className="flex -space-x-2">
        {t.guide.artInitials.map((initial, index) => (
          <span
            key={initial}
            className={cn(
              "flex size-8 items-center justify-center rounded-full font-heading text-xs ring-2 ring-surface",
              [
                "bg-primary-soft text-primary-strong",
                "bg-sun-soft text-sun-strong",
                "bg-success-soft text-success-foreground",
              ][index],
            )}
          >
            {initial}
          </span>
        ))}
      </span>
    ),
  },
  {
    icon: Ticket,
    art: (t) => (
      <span className="flex h-8 items-center gap-2 rounded-md bg-brand-ink px-2.5 text-xs font-medium text-brand-ink-foreground">
        <BrandMark className="size-3 text-primary" />
        <span className="font-heading text-primary tabular-nums">11:30</span>
        <span className="text-brand-ink-muted">{t.guide.artLeft}</span>
      </span>
    ),
  },
];

/** Lets a first-time visitor see the page in action without booking for real. */
function createSampleBooking(t: Dictionary): void {
  const business = SAMPLE_BUSINESSES[0];
  const service = business?.services[0];
  if (!business || !service) return;
  const staff = getSampleStaff(business, "mn")[0];
  const time = business.open.tomorrow[1] ?? business.open.tomorrow[0] ?? "11:00";
  const now = new Date();

  addBooking({
    id: crypto.randomUUID(),
    code: createBookingCode(),
    businessSlug: business.slug,
    businessName: business.name,
    category: business.category,
    district: business.district,
    area: business.area,
    serviceName: service.name,
    duration: service.duration,
    price: service.price,
    staffName: staff?.canonicalName ?? "",
    staffRole: staff?.role ?? "",
    startsAt: toStartInstant("tomorrow", time, now).toISOString(),
    customerName: t.guide.sampleName,
    phone: "99112233",
    note: "",
    status: "confirmed",
    createdAt: now.toISOString(),
  });
  toast.success(t.guide.sampleDone, {
    description: t.guide.sampleDoneText,
  });
}

/** Empty state of the bookings page, doubling as a how-to for first-time visitors. */
export function BookingsGuide(): JSX.Element {
  const t = useT();
  return (
    <section aria-labelledby="guide-title" className="mt-10">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm md:p-10">
        <BrandMark
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-56 text-primary opacity-15"
        />
        <p className="text-sm font-medium text-primary-strong">{t.guide.eyebrow}</p>
        <h2
          id="guide-title"
          className="mt-1 max-w-lg font-heading text-heading font-medium text-foreground"
        >
          {t.guide.title}
        </h2>

        <ol className="relative mt-10 grid gap-6 md:grid-cols-4 md:gap-4">
          {/* Dashed path joining the steps (desktop). */}
          <span
            aria-hidden
            className="absolute top-5 right-[12%] left-[12%] hidden border-t-2 border-dashed border-border md:block"
          />
          {STEPS.map((step, index) => {
            const words = t.guide.steps[index];
            if (!words) return null;
            return (
              <li
                key={words.title}
                className="relative flex animate-in gap-4 duration-500 ease-soft fill-mode-both fade-in slide-in-from-bottom-3 md:flex-col md:items-center md:text-center"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-ink font-heading text-sm font-medium text-primary ring-4 ring-surface">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-2 md:items-center">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <step.icon className="size-4 text-primary-strong" />
                    {words.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{words.text}</p>
                  <div aria-hidden className="mt-1">
                    {step.art(t)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href={TOUR_HREF}>
              <CirclePlay data-icon="start" />
              {t.guide.startTour}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/search">
              <Search data-icon="start" />
              {t.guide.findTimes}
            </Link>
          </Button>
          <Button size="lg" variant="ghost" onClick={() => createSampleBooking(t)}>
            {t.guide.sample}
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-xl font-medium text-foreground">{t.guide.faqTitle}</h2>
        <Accordion.Root type="single" collapsible className="mt-4 border-t border-border">
          {t.guide.faq.map((item) => (
            <Accordion.Item key={item.q} value={item.q} className="border-b border-border">
              <Accordion.Header>
                <Accordion.Trigger className="group/faq flex w-full items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring">
                  {item.q}
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-250 ease-soft group-data-[state=open]/faq:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="max-w-prose pb-4">{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
