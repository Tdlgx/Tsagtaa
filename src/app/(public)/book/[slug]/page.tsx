import { ArrowLeft, MapPin, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import {
  BookingFlow,
  type BookingPoints,
} from "@/app/(public)/book/[slug]/_components/booking-flow";
import { Container } from "@/components/layout/container";
import { getBookableWindow, toTakenSlots, type TakenSlot } from "@/features/booking/availability";
import { getTakenRanges, isBookable } from "@/features/booking/booking-db";
import { getBusinessCategory } from "@/features/business/categories";
import { localizeBusiness } from "@/features/business/localize";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { getSearchClock } from "@/features/business/search";
import { getLoyaltySettings, getSpendableBalance } from "@/features/points/points-db";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Times already booked, so they show as taken. If the database cannot be
 * reached the page still opens with the sample schedule; booking itself then
 * fails with a clear message instead of a broken page.
 */
async function loadTakenSlots(slug: string, now: Date): Promise<TakenSlot[]> {
  const { from, to } = getBookableWindow(now);
  try {
    return toTakenSlots(await getTakenRanges(slug, from, to), now);
  } catch (error) {
    console.error("Could not load booked times", error);
    return [];
  }
}

/**
 * Points on offer: the rules for everyone (to show what a booking earns), and
 * the balance for a signed-in customer. Without a database the form simply
 * has no points part.
 */
async function loadPoints(): Promise<BookingPoints | null> {
  try {
    const settings = await getLoyaltySettings();
    if (!settings.enabled) return null;
    const account = await getCurrentAccount();
    if (!account) return { settings, customer: null };
    return {
      settings,
      customer: {
        name: account.name,
        phone: account.phone,
        balance: await getSpendableBalance(account.id),
      },
    };
  } catch (error) {
    console.error("Could not load points", error);
    return null;
  }
}

/** A stored place the Цагтаа team suspended (or has not approved) takes no bookings. */
async function loadBookable(slug: string): Promise<boolean> {
  try {
    return await isBookable(slug);
  } catch {
    return true;
  }
}

function findBusiness(slug: string): (typeof SAMPLE_BUSINESSES)[number] | undefined {
  return SAMPLE_BUSINESSES.find((business) => business.slug === slug);
}

export async function generateMetadata(props: PageProps<"/book/[slug]">): Promise<Metadata> {
  const { locale, t } = await getI18n();
  const business = findBusiness((await props.params).slug);
  return {
    title: business ? t.book.metaTitle(localizeBusiness(business, locale).name) : t.book.notFound,
  };
}

export default async function BookPage(props: PageProps<"/book/[slug]">): Promise<JSX.Element> {
  const { locale, t } = await getI18n();
  const canonical = findBusiness((await props.params).slug);
  if (!canonical) notFound();
  const business = localizeBusiness(canonical, locale);

  const params = await props.searchParams;
  const day = first(params.day) === "tomorrow" ? "tomorrow" : "today";
  const time = first(params.time) ?? "";
  const serviceParam = Number(first(params.service));
  const serviceIndex =
    Number.isInteger(serviceParam) && business.services[serviceParam] ? serviceParam : null;

  const now = new Date();
  const clock = getSearchClock(now, locale);
  const [taken, points, bookable] = await Promise.all([
    loadTakenSlots(canonical.slug, now),
    loadPoints(),
    loadBookable(canonical.slug),
  ]);
  const { icon: CategoryIcon } = getBusinessCategory(business.category);
  const categoryLabel = t.categories[business.category].label;

  return (
    <Container className="pt-6 pb-16 md:pt-10 md:pb-24">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t.book.back}
      </Link>

      <header className="mt-6 flex flex-col gap-3 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-primary">
            <CategoryIcon className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{categoryLabel}</p>
            <h1 className="font-heading text-heading font-medium text-foreground">
              {business.name}
            </h1>
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1.5 font-medium text-foreground tabular-nums">
            <Star className="size-4 fill-sun text-sun" />
            {business.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({t.common.reviews(business.reviewCount)})
            </span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {t.districts[business.district]}, {business.area}
          </li>
        </ul>
      </header>

      {bookable ? (
        // The flow gets the stored (Mongolian) data and localizes what it shows.
        <BookingFlow
          business={canonical}
          initial={{ day, time, serviceIndex }}
          clock={clock}
          taken={taken}
          points={points}
        />
      ) : (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center text-base text-muted-foreground">
          {t.book.paused}
        </p>
      )}
    </Container>
  );
}
