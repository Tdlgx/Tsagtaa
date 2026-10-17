/**
 * Loyalty points. 1 point = 1 ₮ off a booking. Shared by the server (which
 * decides) and the booking form (which only previews); the database has the
 * last word on the balance.
 */

export type LoyaltySettings = {
  enabled: boolean;
  /** Points per 100 ₮ paid. */
  earnPercent: number;
  /** Smallest number of points that can be spent at once. */
  minRedeem: number;
  /** Largest share of one booking's price payable in points. */
  maxRedeemPercent: number;
};

/** Spending moves in whole hundreds, so totals stay round. */
export const REDEEM_STEP = 100;

/** Points a booking earns, on what is actually paid (price minus points spent). */
export function pointsToEarn(price: number, pointsUsed: number, settings: LoyaltySettings): number {
  if (!settings.enabled) return 0;
  return Math.floor(((price - pointsUsed) * settings.earnPercent) / 100);
}

/**
 * The most points this booking can take, given the balance; 0 when that is
 * below the minimum spend (so nothing can be spent).
 */
export function maxRedeemable(price: number, balance: number, settings: LoyaltySettings): number {
  if (!settings.enabled) return 0;
  const cap = Math.floor((price * settings.maxRedeemPercent) / 100);
  const most = Math.floor(Math.min(cap, balance) / REDEEM_STEP) * REDEEM_STEP;
  return most >= Math.max(settings.minRedeem, REDEEM_STEP) ? most : 0;
}

/** Whether `points` is a spend the rules allow for this price (the balance is checked by the database). */
export function isAllowedSpend(points: number, price: number, settings: LoyaltySettings): boolean {
  if (points === 0) return true;
  return (
    settings.enabled &&
    Number.isInteger(points) &&
    points % REDEEM_STEP === 0 &&
    points >= settings.minRedeem &&
    points <= Math.floor((price * settings.maxRedeemPercent) / 100)
  );
}

const pointsFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 12500 → "12,500" (same grouping as prices). */
export function formatPoints(points: number): string {
  return pointsFormatter.format(points);
}

export type LedgerKind = "earn" | "redeem" | "refund" | "adjust";

export type LedgerEntry = {
  id: string;
  delta: number;
  kind: LedgerKind;
  note: string | null;
  createdAt: string;
  /** For booking entries: where, and what. */
  businessSlug: string | null;
  /** Stored name of a registered place (sample places are named by the client, localized). */
  businessName: string | null;
  serviceName: string | null;
  code: string | null;
};

/** What the profile shows. Dates are ISO strings: it crosses to the client. */
export type PointsSummary = {
  balance: number;
  /** Promised by bookings not yet visited (or within a day of the visit). */
  pending: number;
  earnedTotal: number;
  spentTotal: number;
  history: LedgerEntry[];
  settings: LoyaltySettings;
};
