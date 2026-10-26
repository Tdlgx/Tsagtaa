import "server-only";

import type { LedgerEntry, LoyaltySettings, PointsSummary } from "@/features/points/points";
import { sql } from "@/lib/db";

/**
 * Захиалгын оноо газар үйлчлүүлэгчийг ирсэн гэж тэмдэглэхэд, эсвэл хэн ч
 * тэмдэглээгүй бол айлчлал дууссанаас нэг өдрийн дараа ирнэ. Тэр нэг өдрийн дотор
 * газар ирээгүй гэж тэмдэглэж чадах бөгөөд тэр нь юу ч олгохгүй.
 */
export const SETTLE_AFTER_HOURS = 24;

const DISABLED: LoyaltySettings = {
  enabled: false,
  earnPercent: 0,
  minRedeem: 0,
  maxRedeemPercent: 0,
};

/** Онооны дүрмүүд; хүснэгтэд мөр байхгүй бол оноо унтраалттай гэж үзнэ. */
export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [row] = await sql<LoyaltySettings[]>`
    SELECT enabled, earn_percent AS "earnPercent", min_redeem AS "minRedeem",
      max_redeem_percent AS "maxRedeemPercent"
    FROM loyalty_settings
  `;
  return row ?? DISABLED;
}

/**
 * Тэмдэглэх хугацаа нь өнгөрсөн энэ үйлчлүүлэгчийн айлчлалуудын оноог олгоно.
 * Хэдэн ч удаа, тэр байтугай зэрэг ажиллуулахад аюулгүй: ledger захиалга бүрт нэг
 * "earn" зөвшөөрдөг тул хоёр дахь удаа юу ч оруулахгүй.
 */
/** Одоо олгосон оноог буцаана (олгох юм байхгүй бол 0). */
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

/**
 * Профайлд зориулсан онооны мэдээлэл: үлдэгдэл, хүлээгдэж буй, нийт олсон/зарцуулсан, түүх, дүрэм.
 */
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

/** Бүртгэлийн онооны түүх, шинэ нь эхэндээ, холбогдох захиалгын мэдээлэлтэй. */
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

/** Захиалгын маягтад санал болгох үлдэгдэл, хугацаа нь болсон айлчлалуудыг эхлээд олгоно. */
export async function getSpendableBalance(accountId: string): Promise<number> {
  await settleEarnedPoints(accountId);
  const [row] = await sql<{ balance: number }[]>`
    SELECT points_balance AS balance FROM accounts WHERE id = ${accountId}
  `;
  return row?.balance ?? 0;
}
