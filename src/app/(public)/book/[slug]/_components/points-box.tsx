"use client";

import { Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import { Switch } from "radix-ui";
import type { JSX } from "react";

import {
  formatPoints,
  maxRedeemable,
  pointsToEarn,
  REDEEM_STEP,
  type LoyaltySettings,
} from "@/features/points/points";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";

type PointsBoxProps = {
  settings: LoyaltySettings;
  /** null: нэвтрээгүй тул зөвхөн захиалгаас олох оноог харуулна. */
  balance: number | null;
  price: number;
  /** Сонгосон оноо; 0 = ашиглахгүй. */
  value: number;
  onChange: (points: number) => void;
  /** Нэвтрэх холбоос, нэвтэрсний дараа ижил сонголттойгоор энэ захиалга руу буцна. */
  signInHref: string;
  t: Dictionary;
};

/**
 * Энэ захиалгад оноо зарцуулж, хэдэн оноо олохыг харна. Зөвхөн урьдчилсан харагдац:
 * сервер ижил дүрмийг мөрдөж, үлдэгдлийг DB шалгана.
 */
export function PointsBox({
  settings,
  balance,
  price,
  value,
  onChange,
  signInHref,
  t,
}: PointsBoxProps): JSX.Element {
  const words = t.points.book;
  const earn = pointsToEarn(price, value, settings);

  if (balance === null) {
    return (
      <p className="flex items-start gap-3 rounded-lg border border-dashed border-primary-strong/40 bg-primary-soft/40 px-4 py-3 text-sm text-foreground">
        <Coins className="mt-0.5 size-4 shrink-0 text-primary-strong" />
        <span>
          {words.signInToEarn(formatPoints(pointsToEarn(price, 0, settings)))}{" "}
          <Link
            href={signInHref}
            className="font-medium underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
          >
            {words.signIn}
          </Link>
        </span>
      </p>
    );
  }

  const most = maxRedeemable(price, balance, settings);
  const least = Math.max(settings.minRedeem, REDEEM_STEP);
  const using = value > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-ink text-primary">
          <Coins className="size-4" />
        </span>
        <label htmlFor="booking-points" className="min-w-0 flex-1 cursor-pointer">
          <span className="block text-sm font-medium text-foreground">{words.use}</span>
          <span className="block text-xs text-muted-foreground tabular-nums">
            {words.balance(formatPoints(balance))}
          </span>
        </label>
        <Switch.Root
          id="booking-points"
          checked={using}
          disabled={most === 0}
          onCheckedChange={(checked) => onChange(checked ? most : 0)}
          className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-input transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-strong"
        >
          <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-soft data-[state=checked]:translate-x-5.5" />
        </Switch.Root>
      </div>

      {most === 0 ? (
        <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
          {balance < least
            ? words.notEnough(formatPoints(least - balance))
            : words.tooSmall(settings.maxRedeemPercent)}
        </p>
      ) : using ? (
        <div className="flex animate-in flex-col gap-2 border-t border-border px-4 py-3 duration-250 fade-in">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">{words.amount}</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              −{formatMNT(value)}
            </span>
          </div>
          {most > least ? (
            <input
              type="range"
              min={least}
              max={most}
              step={REDEEM_STEP}
              value={value}
              onChange={(event) => onChange(Number(event.target.value))}
              aria-label={words.amount}
              aria-valuetext={formatMNT(value)}
              className="w-full cursor-pointer accent-primary-strong"
            />
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">
            {words.limits(formatPoints(least), settings.maxRedeemPercent, formatPoints(most))}
          </p>
        </div>
      ) : null}

      {earn > 0 ? (
        <p className="flex items-center gap-2 border-t border-border bg-primary-soft/50 px-4 py-2.5 text-xs text-primary-strong tabular-nums">
          <Sparkles className="size-3.5 shrink-0" />
          {words.willEarn(formatPoints(earn))}
        </p>
      ) : null}
    </div>
  );
}
