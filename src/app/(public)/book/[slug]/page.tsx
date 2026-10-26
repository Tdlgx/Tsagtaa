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
import { findListing } from "@/features/business/listings";
import { getSearchClock } from "@/features/business/search";
import { getLoyaltySettings, getSpendableBalance } from "@/features/points/points-db";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";
import { withDeadline } from "@/lib/db";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Аль хэдийн захиалагдсан цагууд, ингэснээр тэдгээр нь "авсан" гэж харагдана.
 * DB-тэй холбогдож чадахгүй бол хуудас жишээ хуваарьтайгаар нээгдэх ба захиалга
 * өөрөө эвдэрсэн хуудасны оронд ойлгомжтой мессежээр амжилтгүй болно.
 */
async function loadTakenSlots(slug: string, now: Date): Promise<TakenSlot[]> {
  const { from, to } = getBookableWindow(now);
  try {
    return toTakenSlots(await withDeadline(getTakenRanges(slug, from, to)), now);
  } catch (error) {
    console.error("Could not load booked times", error);
    return [];
  }
}

/**
 * Санал болгож буй оноо: бүх хүнд зориулсан дүрэм (захиалга хэдэн оноо өгөхийг
 * харуулахад), нэвтэрсэн үйлчлүүлэгчийн үлдэгдэл. DB байхгүй бол маягтад онооны
 * хэсэг гарахгүй.
 */
async function loadPoints(): Promise<BookingPoints | null> {
  try {
    const settings = await withDeadline(getLoyaltySettings());
    if (!settings.enabled) return null;
    const account = await getCurrentAccount();
    if (!account) return { settings, customer: null };
    return {
      settings,
      customer: {
        name: account.name,
        phone: account.phone,
        balance: await withDeadline(getSpendableBalance(account.id)),
      },
    };
  } catch (error) {
    console.error("Could not load points", error);
    return null;
  }
}

/** Цагтаагийн баг түр хаасан (эсвэл зөвшөөрөөгүй) хадгалагдсан газар захиалга авахгүй. */
async function loadBookable(slug: string): Promise<boolean> {
  try {
    return await withDeadline(isBookable(slug));
  } catch {
    return true;
  }
}

export async function generateMetadata(props: PageProps<"/book/[slug]">): Promise<Metadata> {
  const { locale, t } = await getI18n();
  const business = await findListing((await props.params).slug);
  return {
    title: business ? t.book.metaTitle(localizeBusiness(business, locale).name) : t.book.notFound,
  };
}

/**
 * Захиалгын хуудас. Газрыг slug-аар олж, URL-аас өдөр, цаг, үйлчилгээг урьдчилан
 * сонгоод, захиалагдсан цагууд, оноо, газар захиалга авдаг эсэхийг зэрэг ачаална.
 */
export default async function BookPage(props: PageProps<"/book/[slug]">): Promise<JSX.Element> {
  const { locale, t } = await getI18n();
  // Жишээ газар эсвэл зөвшөөрөгдсөн бүртгэлтэй газар.
  const canonical = await findListing((await props.params).slug);
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
          {business.isNew ? (
            <li className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-semibold text-sun-strong">
              {t.common.newPlace}
            </li>
          ) : (
            <li className="inline-flex items-center gap-1.5 font-medium text-foreground tabular-nums">
              <Star className="size-4 fill-sun text-sun" />
              {business.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">
                ({t.common.reviews(business.reviewCount)})
              </span>
            </li>
          )}
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {t.districts[business.district]}, {business.area}
          </li>
        </ul>
      </header>

      {bookable ? (
        // Урсгал хадгалагдсан (Монгол) өгөгдлийг авч, харуулах хэсгээ орчуулна.
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
