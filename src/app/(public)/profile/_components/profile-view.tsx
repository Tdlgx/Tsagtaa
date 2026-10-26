"use client";

import {
  Award,
  Bell,
  CalendarCheck,
  CalendarClock,
  CircleHelp,
  CirclePlay,
  Lock,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "radix-ui";
import { useState, type JSX, type ReactNode } from "react";

import { AccountEmail } from "@/app/(public)/profile/_components/account-email";
import { ClearDataDialog } from "@/app/(public)/profile/_components/clear-data-dialog";
import {
  AccountStrip,
  PointsSection,
  type ProfileAccount,
} from "@/app/(public)/profile/_components/points-card";
import {
  ProfileAvatar,
  RemoveAvatarButton,
} from "@/app/(public)/profile/_components/profile-avatar";
import { ProfileForm } from "@/app/(public)/profile/_components/profile-form";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPhone, formatRelativeDay } from "@/features/booking/booking";
import { useBookings } from "@/features/booking/booking-store";
import {
  getBusinessCategory,
  getCategoryGroup,
  type CategoryGroupSlug,
} from "@/features/business/categories";
import { localizeBooking } from "@/features/business/localize";
import { TOUR_HREF } from "@/features/onboarding/onboarding";
import { getProfileStats, type ProfileStats } from "@/features/profile/profile-stats";
import { saveProfile, useProfile, type Profile } from "@/features/profile/profile-store";
import { useNow } from "@/hooks/use-now";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Газрын төрөл бүрт нэг өнгө, задаргааны зурвас болон тайлбарт хэрэглэнэ. */
const GROUP_FILL: Record<CategoryGroupSlug, string> = {
  salon: "bg-primary",
  clinic: "bg-success",
  dental: "bg-sun",
  "auto-repair": "bg-foreground",
  "car-wash": "bg-primary-strong",
  vet: "bg-muted-foreground",
};

/** `account` нь нэвтэрсэн үйлчлүүлэгч (оноо) эсвэл null; бусад нь энэ browser-т хадгалагдана. */
export function ProfileView({ account }: { account: ProfileAccount | null }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const stored = useProfile();
  const bookings = useBookings();
  const now = useNow(60_000);
  const [editing, setEditing] = useState(false);

  if (!stored || !bookings || now === null) return <ProfileSkeleton />;
  // Энэ бүртгэлийн өөрийн хуулбар хоосноос эхэлнэ; нэр, утас, имэйл нь бүртгэлээс ирнэ.
  const profile = account
    ? {
        ...stored,
        name: stored.name || account.name,
        phone: stored.phone || account.phone,
        email: stored.email || account.email || "",
      }
    : stored;

  // Газрын нэрсийг зочны хэлээр харуулна; хадгалсан захиалгууд хэвээрээ.
  const stats = getProfileStats(
    bookings.map((booking) => localizeBooking(booking, locale)),
    now,
  );
  const hasDetails = Boolean(profile.name || profile.phone);
  const firstBooking = bookings.reduce<string | null>(
    (first, booking) => (first === null || booking.createdAt < first ? booking.createdAt : first),
    null,
  );
  const memberSince = [profile.createdAt, firstBooking]
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12">
      <h1 className="sr-only">{t.profile.title}</h1>
      {/* Зүүн: та хэн бэ + тохиргоо -------------------------------------- */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <section
          aria-labelledby="profile-title"
          className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
        >
          <div className="relative h-20 bg-brand-ink">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--primary)_25%,transparent)_1px,transparent_1.5px)] mask-[linear-gradient(to_left,black,transparent)] bg-size-[12px_12px]"
            />
          </div>
          <div className="px-6 pb-6">
            <div className="relative -mt-10 flex items-end justify-between">
              <ProfileAvatar profile={profile} />
              {hasDetails && !editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil data-icon="start" />
                  {t.common.edit}
                </Button>
              ) : null}
            </div>

            {editing ? (
              <div className="mt-5">
                <ProfileForm profile={profile} onDone={() => setEditing(false)} />
              </div>
            ) : (
              <>
                <h2
                  id="profile-title"
                  className="mt-4 font-heading text-xl font-medium text-foreground"
                >
                  {profile.name || t.profile.guest}
                </h2>
                {memberSince ? (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {t.profile.memberSince(formatDate(memberSince))}
                  </p>
                ) : null}
                {profile.avatar ? <RemoveAvatarButton /> : null}
                {hasDetails ? (
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    <DetailRow icon={Phone} label={t.profile.phone}>
                      {profile.phone ? formatPhone(profile.phone) : "—"}
                    </DetailRow>
                    <DetailRow icon={Mail} label={t.profile.email}>
                      {profile.email || (
                        <span className="text-muted-foreground">{t.profile.notAdded}</span>
                      )}
                    </DetailRow>
                  </ul>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{t.profile.addPrompt}</p>
                    <Button onClick={() => setEditing(true)}>{t.profile.addDetails}</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {account ? <AccountStrip account={account} /> : null}
        {account ? (
          <AccountEmail email={account.email} pendingEmail={account.pendingEmail} />
        ) : null}
        <Settings profile={profile} t={t} />
      </div>

      {/* Баруун: юу хийсэн бэ ----------------------------------------------- */}
      <div className="flex min-w-0 flex-col gap-10">
        <PointsSection account={account} />
        {/* Дөрвөн тэг юу ч хэлэхгүй: тоонууд эхний захиалгатай хамт гарч ирнэ. */}
        {stats.total > 0 ? <StatGrid stats={stats} t={t} /> : null}
        {stats.byGroup.length > 0 ? <Breakdown stats={stats} t={t} /> : null}
        <Places stats={stats} now={now} t={t} locale={locale} />
        <Badges stats={stats} t={t} />

        <section aria-labelledby="help-title">
          <h2 id="help-title" className="font-heading text-xl font-medium text-foreground">
            {t.profile.helpTitle}
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <LinkRow
              href={TOUR_HREF}
              icon={CirclePlay}
              title={t.profile.replayTour}
              text={t.profile.replayTourText}
            />
            <LinkRow
              href="/help"
              icon={CircleHelp}
              title={t.profile.faq}
              text={t.profile.faqText}
            />
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-lg border border-dashed border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-strong" />
              <span>
                {t.profile.privacy}{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {t.profile.privacyPolicy}
                </Link>
              </span>
            </p>
            <ClearDataDialog bookingCount={bookings.length} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-foreground tabular-nums">{children}</span>
      </span>
    </li>
  );
}

function Settings({ profile, t }: { profile: Profile; t: Dictionary }): JSX.Element {
  const toggles = [
    { key: "dayBefore", label: t.profile.dayBefore, hint: t.profile.dayBeforeHint },
    { key: "hourBefore", label: t.profile.hourBefore, hint: t.profile.hourBeforeHint },
  ] as const;

  return (
    <section
      aria-labelledby="settings-title"
      className="rounded-xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 id="settings-title" className="flex items-center gap-2 font-medium text-foreground">
        <Bell className="size-4 text-primary-strong" />
        {t.profile.reminders}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {toggles.map(({ key, label, hint }) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <label htmlFor={`reminder-${key}`} className="cursor-pointer">
              <span className="block text-sm text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </label>
            <Switch.Root
              id={`reminder-${key}`}
              checked={profile.reminders[key]}
              onCheckedChange={(checked) =>
                saveProfile({ reminders: { ...profile.reminders, [key]: checked } })
              }
              className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-input transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring data-[state=checked]:bg-primary-strong"
            >
              <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-soft data-[state=checked]:translate-x-5.5" />
            </Switch.Root>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">{t.profile.smsNote}</p>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">{t.profile.language}</span>
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">{t.profile.appearance}</span>
          <ThemeToggle />
        </div>
      </div>
    </section>
  );
}

function StatGrid({ stats, t }: { stats: ProfileStats; t: Dictionary }): JSX.Element {
  const items = [
    { icon: CalendarCheck, label: t.profile.stats.total, value: String(stats.total) },
    {
      icon: CalendarClock,
      label: t.profile.stats.upcoming,
      value: String(stats.upcoming),
      accent: true,
    },
    { icon: RotateCcw, label: t.profile.stats.completed, value: String(stats.completed) },
    {
      icon: Wallet,
      label: t.profile.stats.spent,
      value: formatMNT(stats.spent),
      compact: true,
      hint: stats.planned > 0 ? t.profile.stats.planned(formatMNT(stats.planned)) : undefined,
    },
  ];

  return (
    <section aria-label={t.profile.overview}>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {items.map(({ icon: Icon, label, value, accent, hint, compact }, index) => (
          <div
            key={label}
            className={cn(
              "flex animate-in flex-col gap-2 rounded-xl border p-3.5 duration-500 ease-soft fill-mode-both fade-in slide-in-from-bottom-2 sm:gap-3 sm:p-5",
              accent
                ? "border-transparent bg-brand-ink text-brand-ink-foreground"
                : "border-border bg-surface",
            )}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <Icon className={cn("size-5", accent ? "text-primary" : "text-primary-strong")} />
            <div>
              <dd
                className={cn(
                  "font-heading leading-none font-medium tabular-nums",
                  compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
                  accent ? "text-primary" : "text-foreground",
                )}
              >
                {value}
              </dd>
              <dt
                className={cn(
                  "mt-1.5 text-xs sm:mt-2 sm:text-sm",
                  accent ? "text-brand-ink-muted" : "text-muted-foreground",
                )}
              >
                {label}
              </dt>
              {hint ? (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{hint}</p>
              ) : null}
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Газрын төрөл тус бүрийн захиалгын хувийг нэг давхарласан зурвасаар харуулна. */
function Breakdown({ stats, t }: { stats: ProfileStats; t: Dictionary }): JSX.Element {
  const total = stats.byGroup.reduce((sum, item) => sum + item.count, 0);

  return (
    <section aria-labelledby="breakdown-title">
      <h2 id="breakdown-title" className="font-heading text-xl font-medium text-foreground">
        {t.profile.breakdownTitle}
      </h2>
      <div
        aria-hidden
        className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface-muted"
      >
        {stats.byGroup.map(({ group, count }) => (
          <span
            key={group}
            className={cn(
              "h-full animate-in duration-700 ease-soft fade-in slide-in-from-left-4",
              GROUP_FILL[group],
            )}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {stats.byGroup.map(({ group, count }) => {
          const { icon: Icon } = getCategoryGroup(group);
          const { label } = t.groups[group];
          return (
            <li key={group} className="flex items-center gap-2 text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", GROUP_FILL[group])} />
              <Icon className="size-4" />
              <span className="text-foreground">{label}</span>
              <span className="tabular-nums">
                {count} · {Math.round((count / total) * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PlacesProps = { stats: ProfileStats; now: number; t: Dictionary; locale: Locale };

function Places({ stats, now, t, locale }: PlacesProps): JSX.Element {
  return (
    <section aria-labelledby="places-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="places-title" className="font-heading text-xl font-medium text-foreground">
          {t.profile.placesTitle}
        </h2>
        <Link
          href="/search"
          className="rounded-sm text-sm font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          {t.profile.findNew}
        </Link>
      </div>
      {stats.places.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          {t.profile.placesEmpty}
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {stats.places.slice(0, 6).map((place) => {
            const { icon: Icon } = getBusinessCategory(place.category);
            const { label } = t.categories[place.category];
            return (
              <li
                key={place.slug}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{place.name}</p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {label} · {t.profile.visits(place.visits)} ·{" "}
                    {formatRelativeDay(place.lastAt, new Date(now), locale).toLowerCase()}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/book/${place.slug}`}>{t.profile.book}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Badges({ stats, t }: { stats: ProfileStats; t: Dictionary }): JSX.Element {
  return (
    <section aria-labelledby="badges-title">
      <h2 id="badges-title" className="font-heading text-xl font-medium text-foreground">
        {t.profile.badgesTitle}
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.badges.map((badge) => {
          const earned = badge.progress >= 1;
          return (
            <li
              key={badge.id}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-5 text-center",
                earned ? "border-primary-strong/30 bg-primary-soft" : "border-border bg-surface",
              )}
            >
              {/* Медалийн эргэн тойрны ахицын цагираг. */}
              <span
                className="relative flex size-16 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary-strong) ${badge.progress * 360}deg, var(--surface-muted) 0deg)`,
                }}
              >
                <span
                  className={cn(
                    "flex size-13 items-center justify-center rounded-full",
                    earned ? "bg-brand-ink text-primary" : "bg-surface text-muted-foreground",
                  )}
                >
                  {earned ? <Award className="size-6" /> : <Lock className="size-5" />}
                </span>
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t.profile.badges[badge.id].title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.profile.badges[badge.id].description}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  earned ? "text-primary-strong" : "text-muted-foreground",
                )}
              >
                {earned ? t.profile.earned : badge.progressLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LinkRow({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  text: string;
}): JSX.Element {
  return (
    <Link
      href={href}
      className="group/row flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-muted-foreground"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-primary-strong" />
      <span>
        <span className="block text-sm font-medium text-foreground underline-offset-4 group-hover/row:underline">
          {title}
        </span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}

function ProfileSkeleton(): JSX.Element {
  const t = useT();
  return (
    <div aria-busy="true" className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:gap-12">
      <span className="sr-only" role="status">
        {t.profile.loading}
      </span>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
