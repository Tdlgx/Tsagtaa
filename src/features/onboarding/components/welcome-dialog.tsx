"use client";

import { CirclePlay, MousePointerClick, Search, Ticket, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useState, type JSX } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  TOUR_HREF,
  TOUR_PARAM,
} from "@/features/onboarding/onboarding";
import { SPLASH_MS } from "@/features/splash/splash";
import { useLocale, useT } from "@/i18n/client";
import { APP_NAME } from "@/lib/constants";

/** Icons for `t.onboarding.points`, in the same order. */
const POINT_ICONS = [Search, MousePointerClick, Ticket] as const;

/** Delay before greeting, so the page is seen first. */
const GREET_AFTER_MS = 900;

/**
 * Greets a first-time visitor once and offers the guided tour. Never shown
 * mid-booking or while the tour itself is running.
 */
export function WelcomeDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useT();
  const brand = locale === "mn" ? APP_NAME : t.brand;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const touring = searchParams.get(TOUR_PARAM) === "1";

  useEffect(() => {
    // Not mid-booking, and not for business owners: their page has its own tour.
    if (
      touring ||
      pathname.startsWith("/book/") ||
      pathname.startsWith("/business/") ||
      hasSeenOnboarding()
    ) {
      return;
    }
    // On the first page of a visit, wait for the launch splash to lift first.
    const splashing = document.querySelector("[data-splash]") !== null;
    const timer = window.setTimeout(
      () => setOpen(true),
      splashing ? SPLASH_MS + GREET_AFTER_MS : GREET_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pathname, touring]);

  const close = (): void => {
    markOnboardingSeen();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-ink/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface shadow-lg duration-400 ease-soft outline-none data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-4">
          {/* Ink header: the logo's hourglass turning over, on a faint dot grid. */}
          <div className="relative flex h-40 items-center justify-center bg-brand-ink">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--primary)_22%,transparent)_1px,transparent_1.5px)] mask-[radial-gradient(closest-side,black,transparent)] bg-size-[14px_14px]"
            />
            <span
              aria-hidden
              className="absolute size-28 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_35%,transparent),transparent)] blur-xl"
            />
            <BrandMark className="relative size-16 animate-flip text-primary" />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t.common.close}
                className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-brand-ink-muted outline-none focus-visible:ring-3 focus-visible:ring-primary/60 is-hover:bg-brand-ink-foreground/10 is-hover:text-brand-ink-foreground"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            <Dialog.Title className="font-heading text-xl font-medium text-foreground">
              {t.onboarding.welcomeTitle(brand)}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.onboarding.welcomeText}
            </Dialog.Description>

            <ul className="mt-5 flex flex-col gap-3">
              {t.onboarding.points.map((text, index) => {
                const Icon = POINT_ICONS[index] ?? Search;
                return (
                  <li
                    key={text}
                    className="flex animate-in items-center gap-3 text-sm text-foreground duration-500 ease-soft fill-mode-both fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${250 + index * 110}ms` }}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                      <Icon className="size-4" />
                    </span>
                    {text}
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-col gap-2">
              <Button
                size="lg"
                onClick={() => {
                  close();
                  router.push(TOUR_HREF);
                }}
              >
                <CirclePlay data-icon="start" />
                {t.onboarding.start}
              </Button>
              <Button size="lg" variant="ghost" onClick={close}>
                {t.onboarding.later}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
