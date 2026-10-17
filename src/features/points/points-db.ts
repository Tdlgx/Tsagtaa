import "server-only";

import type { LedgerEntry, LoyaltySettings, PointsSummary } from "@/features/points/points";
import { sql } from "@/lib/db";

/**
 * A booking's points arrive when the place marks the customer as having come,
 * or, if nobody marks it, a day after the visit ends. Within that day the
 * place can still mark a no-show, which earns nothing.
 */
export const SETTLE_AFTER_HOURS = 24;

const DISABLED: LoyaltySettings = {
  enabled: false,
  earnPercent: 0,
  minRedeem: 0,
  maxRedeemPercent: 0,
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [row] = await sql<LoyaltySettings[]>`
    SELECT enabled, earn_percent AS "earnPercent", min_redeem AS "minRedeem",
      max_redeem_percent AS "maxRedeemPercent"
    FROM loyalty_settings
  `;
  return row ?? DISABLED;
}

/**
 * Credits the points of this customer's visits that are past the marking
 * window. Safe to run any number of times, even concurrently: the ledger
 * allows one "earn" per booking, so a second run inserts nothing.
 */
/** Returns the points credited now (0 when nothing was due). */
export async function settleEarnedPoints(accountId: string): Promise<number> {
  const rows = await sql<{ delta: number }[]>`
    INSERT INTO points_ledger (account_id, delta, kind, booking_id)
    SELECT customer_account_id, points_earn, 'earn', id
    FROM bookings
    WHERE customer_account_id = ${accountId}
      AND status = 'confirmed'
      AND points_earn > 0
      AND attendance IS NULL
      AND ends_at < now() - ${`${SETTLE_AFTER_HOURS} hours`}::interval
    ON CONFLICT (booking_id, kind) WHERE booking_id IS NOT NULL DO NOTHING
    RETURNING delta
  `;
  return rows.reduce((sum, row) => sum + row.delta, 0);
}

export async function getPointsSummary(accountId: string): Promise<PointsSummary> {
  await settleEarnedPoints(accountId);
  const [[totals], history, settings] = await Promise.all([
    sql<Omit<PointsSummary, "history" | "settings">[]>`
      SELECT a.points_balance AS balance,
        (SELECT coalesce(sum(b.points_earn), 0) FROM bookings b
          WHERE b.customer_account_id = a.id AND b.status = 'confirmed'
            AND b.attendance IS NULL AND b.points_earn > 0
            AND NOT EXISTS (SELECT 1 FROM points_ledger l
              WHERE l.booking_id = b.id AND l.kind = 'earn'))::int AS pending,
        (SELECT coalesce(sum(delta), 0) FROM points_ledger
          WHERE account_id = a.id AND delta > 0 AND kind <> 'refund')::int AS "earnedTotal",
        (SELECT coalesce(-sum(delta), 0) FROM points_ledger
          WHERE account_id = a.id AND kind = 'redeem')::int
          - (SELECT coalesce(sum(delta), 0) FROM points_ledger
          WHERE account_id = a.id AND kind = 'refund')::int AS "spentTotal"
      FROM accounts a WHERE a.id = ${accountId}
    `,
    getLedger(accountId, 20),
    getLoyaltySettings(),
  ]);
  return {
    balance: totals?.balance ?? 0,
    pending: totals?.pending ?? 0,
    earnedTotal: totals?.earnedTotal ?? 0,
    spentTotal: totals?.spentTotal ?? 0,
    history,
    settings,
  };
}

export async function getLedger(accountId: string, limit: number): Promise<LedgerEntry[]> {
  const rows = await sql<
    (Omit<LedgerEntry, "createdAt" | "id"> & { id: bigint | string; createdAt: Date })[]
  >`
    SELECT l.id::text AS id, l.delta, l.kind, l.note, l.created_at AS "createdAt",
      b.business_slug AS "businessSlug", biz.name AS "businessName",
      b.service_name AS "serviceName", b.code
    FROM points_ledger l
      LEFT JOIN bookings b ON b.id = l.booking_id
      LEFT JOIN businesses biz ON biz.slug = b.business_slug
    WHERE l.account_id = ${accountId}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    createdAt: row.createdAt.toISOString(),
  }));
}

/** The balance to offer on a booking form, with any due visits credited first. */
export async function getSpendableBalance(accountId: string): Promise<number> {
  await settleEarnedPoints(accountId);
  const [row] = await sql<{ balance: number }[]>`
    SELECT points_balance AS balance FROM accounts WHERE id = ${accountId}
  `;
  return row?.balance ?? 0;
}
