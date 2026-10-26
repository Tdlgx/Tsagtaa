"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Coins,
  Hourglass,
  LogOut,
  RotateCcw,
  Sparkles,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { formatPhone } from "@/features/booking/booking";
import { localizeBusiness } from "@/features/business/localize";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import {
  formatPoints,
  type LedgerEntry,
  type LedgerKind,
  type PointsSummary,
} from "@/features/points/points";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Профайл хуудас серверээс авдаг нэвтэрсэн үйлчлүүлэгч. */
export type ProfileAccount = {
  name: string;
  phone: string;
  /** Нэвтэрч болох имэйл, нэмсэн бол. */
  email: string | null;
  /** Кодоо оруулахыг хүлээж буй хаяг. */
  pendingEmail: string | null;
  /** Оноог ачаалж чадаагүй бол null (DB ажиллахгүй байна). */
  points: PointsSummary | null;
};

const KIND_ICON: Record<LedgerKind, LucideIcon> = {
  earn: ArrowDownLeft,
  redeem: ArrowUpRight,
  refund: RotateCcw,
  adjust: Wrench,
};

/** Оноо: карт, хэрхэн ажилладаг, түүх. Нэвтрээгүй бол эхлэх урилга. */
export function PointsSection({ account }: { account: ProfileAccount | null }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const words = t.points;

  if (!account) return <SignedOut t={t} />;
  const summary = account.points;

  return (
    <section aria-labelledby="points-title" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="points-title" className="font-heading text-xl font-medium text-foreground">
          {words.title}
        </h2>
        <Link
          href="/search"
          className="rounded-sm text-sm font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          {words.useThem}
        </Link>
      </div>

      {summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <LoyaltyCard account={account} summary={summary} t={t} />
            <HowItWorks summary={summary} t={t} />
          </div>
          <History entries={summary.history} t={t} locale={locale} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          {words.unavailable}
        </p>
      )}
    </section>
  );
}

function LoyaltyCard({
  account,
  summary,
  t,
}: {
  account: ProfileAccount;
  summary: PointsSummary;
  t: Dictionary;
}): JSX.Element {
  const words = t.points;
  const { balance, settings } = summary;
  const short = Math.max(settings.minRedeem - balance, 0);
  const progress = settings.minRedeem > 0 ? Math.min(balance / settings.minRedeem, 1) : 1;

  return (
    <TiltCard className="rounded-2xl flex min-h-56 flex-col justify-between bg-brand-ink p-6 text-brand-ink-foreground">
      {/* Профайлын баннер шиг сийлбэр цэгүүд. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--primary)_22%,transparent)_1px,transparent_1.5px)] mask-[linear-gradient(135deg,transparent_40%,black)] bg-size-[12px_12px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/25 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Coins className="size-4 text-primary" />
          {words.cardTitle}
        </span>
        <span className="text-xs text-brand-ink-muted tabular-nums">
          •••• {account.phone.slice(-4)}
        </span>
      </div>

      <div className="relative mt-6">
        <p className="font-heading text-4xl leading-none font-medium text-primary tabular-nums">
          {formatPoints(balance)}
        </p>
        <p className="mt-2 text-sm text-brand-ink-muted">
          {words.balanceLabel} · {words.worth(formatMNT(balance))}
        </p>
      </div>

      <div className="relative mt-6 flex flex-col gap-2">
        {settings.enabled && short > 0 ? (
          <>
            <div
              aria-hidden
              className="h-1.5 overflow-hidden rounded-full bg-brand-ink-foreground/15"
            >
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-soft"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-brand-ink-muted tabular-nums">
              {words.untilSpend(formatPoints(short))}
            </p>
          </>
        ) : settings.enabled ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {words.readyToSpend}
          </p>
        ) : (
          <p className="text-xs text-brand-ink-muted">{words.paused}</p>
        )}
        <div className="flex items-center justify-between gap-3 text-xs text-brand-ink-muted">
          <span className="truncate">{account.name}</span>
          {summary.pending > 0 ? (
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              <Hourglass className="size-3.5" />
              {words.pending(formatPoints(summary.pending))}
            </span>
          ) : null}
        </div>
      </div>
    </TiltCard>
  );
}

function HowItWorks({ summary, t }: { summary: PointsSummary; t: Dictionary }): JSX.Element {
  const words = t.points;
  const { settings } = summary;
  const steps: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: CalendarCheck, title: words.how.book, text: words.how.bookText },
    {
      icon: Coins,
      title: words.how.earn(settings.earnPercent),
      text: words.how.earnText,
    },
    {
      icon: Ticket,
      title: words.how.spend,
      text: words.how.spendText(formatPoints(settings.minRedeem), settings.maxRedeemPercent),
    },
  ];

  return (
    <div className="rounded-2xl flex flex-col gap-3 border border-border bg-surface p-5">
      <ol className="flex flex-col gap-4">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex items-start gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
              <Icon className="size-4" />
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand-ink text-[10px] font-semibold text-primary">
                {index + 1}
              </span>
            </span>
            <span>
              <span className="block text-sm font-medium text-foreground">{title}</span>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{words.earnedTotal}</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatPoints(summary.earnedTotal)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{words.spentTotal}</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatPoints(summary.spentTotal)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function placeName(entry: LedgerEntry, locale: Locale): string | null {
  const sample = SAMPLE_BUSINESSES.find((business) => business.slug === entry.businessSlug);
  return sample ? localizeBusiness(sample, locale).name : entry.businessName;
}

function History({
  entries,
  t,
  locale,
}: {
  entries: LedgerEntry[];
  t: Dictionary;
  locale: Locale;
}): JSX.Element {
  const words = t.points;
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
        {words.historyEmpty}
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground">{words.historyTitle}</h3>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {entries.map((entry) => {
          const Icon = KIND_ICON[entry.kind];
          const where = [placeName(entry, locale), entry.serviceName].filter(Boolean).join(" · ");
          return (
            <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  entry.delta > 0
                    ? "bg-success-soft text-success-foreground"
                    : "bg-surface-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {words.kinds[entry.kind]}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.kind === "adjust" ? entry.note : where || entry.code}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={cn(
                    "block text-sm font-semibold tabular-nums",
                    entry.delta > 0 ? "text-success-foreground" : "text-foreground",
                  )}
                >
                  {entry.delta > 0 ? "+" : "−"}
                  {formatPoints(Math.abs(entry.delta))}
                </span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {formatDate(entry.createdAt)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SignedOut({ t }: { t: Dictionary }): JSX.Element {
  const words = t.points;
  return (
    <section aria-labelledby="points-title">
      <TiltCard
        maxDegrees={4}
        className="rounded-2xl flex flex-col gap-5 bg-brand-ink p-6 text-brand-ink-foreground sm:flex-row sm:items-center sm:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coins className="size-6" />
          </span>
          <div>
            <h2 id="points-title" className="font-heading text-xl font-medium">
              {words.signedOutTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-ink-muted max-sm:hidden">{words.signedOutText}</p>
          </div>
        </div>
        <div className="relative flex shrink-0 gap-2">
          <Button asChild>
            <Link href="/signup?next=/profile">{words.signup}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-brand-ink-foreground is-hover:bg-brand-ink-foreground/10"
          >
            <Link href="/login?next=/profile">{t.auth.submit}</Link>
          </Button>
        </div>
      </TiltCard>
    </section>
  );
}

/** Профайлын картын доор "… нэвтэрсэн", гарах товчтой. */
export function AccountStrip({ account }: { account: ProfileAccount }): JSX.Element {
  const t = useT();
  return (
    <form
      action={logoutAction}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
    >
      <input type="hidden" name="next" value="/profile" />
      <span className="min-w-0 text-sm">
        <span className="block text-xs text-muted-foreground">{t.points.signedInAs}</span>
        <span className="block truncate font-medium text-foreground tabular-nums">
          {account.name} · {formatPhone(account.phone)}
        </span>
      </span>
      <Button type="submit" variant="outline" size="sm">
        <LogOut data-icon="start" />
        {t.auth.logout}
      </Button>
    </form>
  );
}
