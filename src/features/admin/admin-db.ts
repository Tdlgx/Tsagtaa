import "server-only";

import { randomInt } from "node:crypto";
import type postgres from "postgres";

import { refundCancelled } from "@/features/booking/booking-db";
import { getBusinessCategory } from "@/features/business/categories";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import type { ManagedBooking } from "@/features/manage/manage-db";
import type { LoyaltySettings } from "@/features/points/points";
import { getSampleStaff } from "@/features/staff/sample-staff";
import { hashPassword } from "@/lib/auth/password";
import type { BusinessStatus, Role } from "@/lib/auth/session";
import { isPgError, PG, sql } from "@/lib/db";

/*
 * The Цагтаа team's data access. Callers check `requirePlatformAdmin()`
 * first; every change here writes its audit entry in the same transaction,
 * so the log cannot miss a change or record one that did not happen.
 */

type Db = postgres.Sql | postgres.TransactionSql;

export type AuditAction =
  | "business.approve"
  | "business.reject"
  | "business.reopen"
  | "business.suspend"
  | "business.reinstate"
  | "member.assign"
  | "account.unlock"
  | "account.reset_password"
  | "account.admin_grant"
  | "account.admin_revoke"
  | "account.sign_out"
  | "points.adjust"
  | "points.settings"
  | "booking.cancel"
  | "samples.import";

export async function audit(
  db: Db,
  actorId: string,
  action: AuditAction,
  target: string,
  targetId: string | null,
  detail: string | null = null,
): Promise<void> {
  await db`
    INSERT INTO admin_audit (actor_id, action, target, target_id, detail)
    VALUES (${actorId}, ${action}, ${target}, ${targetId}, ${detail})
  `;
}

/* Overview --------------------------------------------------------------------- */

export type PlatformStats = {
  pending: number;
  /** Pending for more than two days: someone is waiting on us. */
  overdue: number;
  active: number;
  suspended: number;
  rejected: number;
  bookingsToday: number;
  bookings7: number;
  customers: number;
  staff: number;
  pointsOutstanding: number;
};

export async function getPlatformStats(dayStart: Date): Promise<PlatformStats> {
  const [stats] = await sql<PlatformStats[]>`
    SELECT
      count(*) FILTER (WHERE status = 'pending')::int AS pending,
      count(*) FILTER (WHERE status = 'pending' AND created_at < now() - interval '48 hours')::int
        AS overdue,
      count(*) FILTER (WHERE status = 'active')::int AS active,
      count(*) FILTER (WHERE status = 'suspended')::int AS suspended,
      count(*) FILTER (WHERE status = 'rejected')::int AS rejected,
      (SELECT count(*) FROM bookings WHERE status = 'confirmed' AND starts_at >= ${dayStart}
        AND starts_at < ${dayStart}::timestamptz + interval '1 day')::int AS "bookingsToday",
      (SELECT count(*) FROM bookings WHERE created_at >= now() - interval '7 days')::int AS bookings7,
      (SELECT count(*) FROM accounts a WHERE NOT a.is_platform_admin
        AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.account_id = a.id))::int AS customers,
      (SELECT count(DISTINCT account_id) FROM memberships)::int AS staff,
      (SELECT coalesce(sum(points_balance), 0) FROM accounts)::int AS "pointsOutstanding"
    FROM businesses
  `;
  return stats!;
}

/* Places ------------------------------------------------------------------------- */

export type BusinessListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  phone: string;
  registerNumber: string | null;
  status: BusinessStatus;
  createdAt: Date;
  reviewNote: string | null;
  services: number;
  staff: number;
  owner: string | null;
  bookings30: number;
};

export async function listBusinesses(
  status: BusinessStatus | "all",
  query = "",
): Promise<BusinessListItem[]> {
  const like = `%${query.trim().toLowerCase()}%`;
  return sql<BusinessListItem[]>`
    SELECT b.id, b.slug, b.name, b.category, b.district, b.address, b.phone,
      b.register_number AS "registerNumber", b.status, b.created_at AS "createdAt",
      b.review_note AS "reviewNote",
      (SELECT count(*) FROM services s WHERE s.business_id = b.id)::int AS services,
      (SELECT count(*) FROM staff s WHERE s.business_id = b.id)::int AS staff,
      (SELECT a.phone FROM memberships m JOIN accounts a ON a.id = m.account_id
        WHERE m.business_id = b.id AND m.role = 'owner') AS owner,
      (SELECT count(*) FROM bookings k WHERE k.business_slug = b.slug
        AND k.created_at >= now() - interval '30 days')::int AS "bookings30"
    FROM businesses b
    WHERE ${status === "all" ? sql`true` : sql`b.status = ${status}`}
      AND ${
        query.trim()
          ? sql`(lower(b.name) LIKE ${like} OR b.slug LIKE ${like} OR b.phone LIKE ${like}
              OR lower(coalesce(b.register_number, '')) LIKE ${like})`
          : sql`true`
      }
    ORDER BY (b.status = 'pending') DESC, b.created_at DESC
    LIMIT 200
  `;
}

/**
 * Which status changes are allowed, and what each is called in the log.
 * Approve or turn down a new place; take a live one off and put it back;
 * look again at one that was turned down.
 */
const TRANSITIONS: Record<BusinessStatus, Partial<Record<BusinessStatus, AuditAction>>> = {
  active: { pending: "business.approve", suspended: "business.reinstate" },
  rejected: { pending: "business.reject" },
  suspended: { active: "business.suspend" },
  pending: { rejected: "business.reopen" },
};

export type StatusChange =
  { ok: true } | { ok: false; reason: "not_found" | "transition" | "note" };

export async function setBusinessStatus(
  actorId: string,
  businessId: string,
  status: BusinessStatus,
  note: string,
): Promise<StatusChange> {
  // Turning down or taking off always says why: the owner sees it.
  if ((status === "rejected" || status === "suspended") && note.length < 3) {
    return { ok: false, reason: "note" };
  }
  return sql.begin(async (tx): Promise<StatusChange> => {
    // Locked, so two admins deciding at once are applied one after the other.
    const [current] = await tx<{ name: string; status: BusinessStatus }[]>`
      SELECT name, status FROM businesses WHERE id = ${businessId} FOR UPDATE
    `;
    if (!current) return { ok: false, reason: "not_found" };
    const action = TRANSITIONS[status][current.status];
    if (!action) return { ok: false, reason: "transition" };
    await tx`
      UPDATE businesses
      SET status = ${status}, reviewed_at = now(), reviewed_by = ${actorId},
        review_note = ${note || null}
      WHERE id = ${businessId}
    `;
    await audit(tx, actorId, action, current.name, businessId, note || null);
    return { ok: true };
  });
}

const BOOKING_COLUMNS = sql`
  id, code, business_slug AS "businessSlug", staff_id AS "staffId",
  service_name AS "serviceName", duration_min AS "durationMin", price,
  starts_at AS "startsAt", ends_at AS "endsAt", customer_name AS "customerName",
  phone, note, status, created_at AS "createdAt", points_used AS "pointsUsed", attendance
`;

export async function getRecentBookings(limit: number): Promise<ManagedBooking[]> {
  return sql<ManagedBooking[]>`
    SELECT ${BOOKING_COLUMNS} FROM bookings ORDER BY created_at DESC LIMIT ${limit}
  `;
}

/**
 * Copies the sample listings (which live in code) into the database as
 * active places, with their services and staff, so they can be given owners
 * and managed. Places already there are left alone.
 */
export async function importSampleBusinesses(actorId: string): Promise<number> {
  let added = 0;
  for (const business of SAMPLE_BUSINESSES) {
    await sql.begin(async (tx) => {
      const [row] = await tx<{ id: string }[]>`
        INSERT INTO businesses (
          request_id, slug, name, category, district, address, phone, description,
          slot_minutes, status, owner_consented_at, reviewed_at, review_note
        ) VALUES (
          gen_random_uuid(), ${business.slug}, ${business.name}, ${business.category},
          ${business.district}, ${business.area}, '99000000',
          ${getBusinessCategory(business.category).description}, 30, 'active', now(), now(),
          'Жишээ бизнес'
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `;
      if (!row) return;
      added += 1;
      // Every day 09:00–21:00: the board's working day.
      await tx`INSERT INTO business_hours ${tx(
        [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
          business_id: row.id,
          weekday,
          opens: "09:00",
          closes: "21:00",
        })),
      )}`;
      await tx`INSERT INTO services ${tx(
        business.services.map((service, position) => ({
          business_id: row.id,
          position,
          name: service.name,
          duration_min: service.duration,
          price: service.price,
        })),
      )}`;
      // Same people, in the same order, as the bookings' "slug-0", "slug-1"… ids.
      await tx`INSERT INTO staff ${tx(
        getSampleStaff(business, "mn").map((member, position) => ({
          business_id: row.id,
          position,
          name: member.canonicalName,
        })),
      )}`;
    });
  }
  if (added > 0) await audit(sql, actorId, "samples.import", `${added}`, null);
  return added;
}

/* Accounts ------------------------------------------------------------------------- */

export type AccountFilter = "all" | "admins" | "staff" | "customers" | "locked";

export type AdminAccount = {
  id: string;
  name: string;
  phone: string;
  isPlatformAdmin: boolean;
  pointsBalance: number;
  failedLogins: number;
  lockedUntil: Date | null;
  createdAt: Date;
  memberships: { slug: string; name: string; role: Role }[];
  bookings: number;
  sessions: number;
  lastSeen: Date | null;
};

export async function listAccounts(filter: AccountFilter, query = ""): Promise<AdminAccount[]> {
  const text = query.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");
  const where = {
    all: sql`true`,
    admins: sql`a.is_platform_admin`,
    staff: sql`EXISTS (SELECT 1 FROM memberships m WHERE m.account_id = a.id)`,
    customers: sql`NOT a.is_platform_admin
      AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.account_id = a.id)`,
    locked: sql`a.locked_until > now()`,
  }[filter];
  return sql<AdminAccount[]>`
    SELECT a.id, a.name, a.phone, a.is_platform_admin AS "isPlatformAdmin",
      a.points_balance AS "pointsBalance", a.failed_logins AS "failedLogins",
      a.locked_until AS "lockedUntil", a.created_at AS "createdAt",
      coalesce((SELECT json_agg(json_build_object('slug', b.slug, 'name', b.name, 'role', m.role)
          ORDER BY m.role DESC, b.name)
        FROM memberships m JOIN businesses b ON b.id = m.business_id
        WHERE m.account_id = a.id), '[]'::json) AS memberships,
      (SELECT count(*) FROM bookings k WHERE k.customer_account_id = a.id)::int AS bookings,
      (SELECT count(*) FROM sessions s WHERE s.account_id = a.id AND s.expires_at > now())::int
        AS sessions,
      (SELECT max(s.created_at) FROM sessions s WHERE s.account_id = a.id) AS "lastSeen"
    FROM accounts a
    WHERE ${where}
      AND ${
        text
          ? sql`(lower(a.name) LIKE ${`%${text}%`}
              ${digits.length >= 3 ? sql`OR a.phone LIKE ${`%${digits}%`}` : sql``})`
          : sql`true`
      }
    ORDER BY a.is_platform_admin DESC, a.created_at DESC
    LIMIT 100
  `;
}

async function accountLabel(db: Db, accountId: string): Promise<string | null> {
  const [row] = await db<{ label: string }[]>`
    SELECT name || ' · ' || phone AS label FROM accounts WHERE id = ${accountId}
  `;
  return row?.label ?? null;
}

export async function unlockAccount(actorId: string, accountId: string): Promise<boolean> {
  return sql.begin(async (tx) => {
    const rows = await tx`
      UPDATE accounts SET failed_logins = 0, locked_until = NULL WHERE id = ${accountId}
      RETURNING id
    `;
    if (rows.length === 0) return false;
    await audit(tx, actorId, "account.unlock", (await accountLabel(tx, accountId))!, accountId);
    return true;
  });
}

/** No 0/O, 1/l/I: the password is read out over the phone. */
const TEMP_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function tempPassword(): string {
  const pick = (): string => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]!;
  // xxxx-xxxx-xxxx: 12 random characters (~70 bits), easy to read out.
  return [0, 1, 2].map(() => Array.from({ length: 4 }, pick).join("")).join("-");
}

/**
 * A new random password, shown once to the admin (never stored in plain
 * text, never logged). Every browser signed in to the account is signed
 * out, and a lock from wrong guesses is lifted.
 */
export async function resetPassword(actorId: string, accountId: string): Promise<string | null> {
  const password = tempPassword();
  const hash = await hashPassword(password);
  return sql.begin(async (tx) => {
    const rows = await tx`
      UPDATE accounts SET password_hash = ${hash}, failed_logins = 0, locked_until = NULL
      WHERE id = ${accountId} RETURNING id
    `;
    if (rows.length === 0) return null;
    await tx`DELETE FROM sessions WHERE account_id = ${accountId}`;
    await audit(
      tx,
      actorId,
      "account.reset_password",
      (await accountLabel(tx, accountId))!,
      accountId,
    );
    return password;
  });
}

export type AdminChange = { ok: true } | { ok: false; reason: "self" | "not_found" };

/** Grants or takes away admin. Nobody can take it from themselves, so one admin always remains. */
export async function setPlatformAdmin(
  actorId: string,
  accountId: string,
  value: boolean,
): Promise<AdminChange> {
  if (actorId === accountId) return { ok: false, reason: "self" };
  return sql.begin(async (tx): Promise<AdminChange> => {
    const rows = await tx`
      UPDATE accounts SET is_platform_admin = ${value} WHERE id = ${accountId} RETURNING id
    `;
    if (rows.length === 0) return { ok: false, reason: "not_found" };
    // Taken away: their open sessions go too, so the change applies at once.
    if (!value) await tx`DELETE FROM sessions WHERE account_id = ${accountId}`;
    await audit(
      tx,
      actorId,
      value ? "account.admin_grant" : "account.admin_revoke",
      (await accountLabel(tx, accountId))!,
      accountId,
    );
    return { ok: true };
  });
}

export async function endAllSessions(actorId: string, accountId: string): Promise<number> {
  return sql.begin(async (tx) => {
    const rows = await tx`DELETE FROM sessions WHERE account_id = ${accountId} RETURNING 1`;
    const label = await accountLabel(tx, accountId);
    if (!label) return 0;
    await audit(tx, actorId, "account.sign_out", label, accountId, String(rows.length));
    return rows.length;
  });
}

export type AdjustResult = { ok: true } | { ok: false; reason: "insufficient" | "not_found" };

/** Adds or takes points with a reason (a goodwill gesture, a correction). */
export async function adjustPoints(
  actorId: string,
  accountId: string,
  delta: number,
  note: string,
): Promise<AdjustResult> {
  try {
    return await sql.begin(async (tx): Promise<AdjustResult> => {
      const label = await accountLabel(tx, accountId);
      if (!label) return { ok: false, reason: "not_found" };
      await tx`
        INSERT INTO points_ledger (account_id, delta, kind, actor_id, note)
        VALUES (${accountId}, ${delta}, 'adjust', ${actorId}, ${note})
      `;
      await audit(
        tx,
        actorId,
        "points.adjust",
        label,
        accountId,
        `${delta > 0 ? "+" : ""}${delta} · ${note}`,
      );
      return { ok: true };
    });
  } catch (error) {
    // Taking more than the balance holds.
    if (isPgError(error, PG.checkViolation, "accounts_points_not_negative")) {
      return { ok: false, reason: "insufficient" };
    }
    throw error;
  }
}

/* Bookings ------------------------------------------------------------------------- */

export type AdminBooking = ManagedBooking & {
  businessName: string | null;
  customerAccountId: string | null;
  pointsEarn: number;
};

/** By front-desk code, phone number or place address; the latest ones when empty. */
export async function findBookings(query: string): Promise<AdminBooking[]> {
  const text = query.trim();
  const digits = text.replace(/[\s-]/g, "").replace(/^\+?976/, "");
  const condition = !text
    ? sql`true`
    : /^\d{4,8}$/.test(digits)
      ? sql`k.phone LIKE ${`%${digits}%`}`
      : sql`(upper(k.code) LIKE ${`%${text.toUpperCase()}%`} OR k.business_slug LIKE ${`%${text.toLowerCase()}%`})`;
  return sql<AdminBooking[]>`
    SELECT k.id, k.code, k.business_slug AS "businessSlug", k.staff_id AS "staffId",
      k.service_name AS "serviceName", k.duration_min AS "durationMin", k.price,
      k.starts_at AS "startsAt", k.ends_at AS "endsAt", k.customer_name AS "customerName",
      k.phone, k.note, k.status, k.created_at AS "createdAt", k.points_used AS "pointsUsed",
      k.attendance, k.points_earn AS "pointsEarn",
      k.customer_account_id AS "customerAccountId", b.name AS "businessName"
    FROM bookings k LEFT JOIN businesses b ON b.slug = k.business_slug
    WHERE ${condition}
    ORDER BY k.created_at DESC
    LIMIT 50
  `;
}

/** Support cancels for a customer (e.g. the place closed that day). Points go back. */
export async function adminCancelBooking(actorId: string, bookingId: string): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [row] = await tx<{ code: string; cancelled: number }[]>`
      WITH cancelled AS (
        UPDATE bookings SET status = 'cancelled', cancelled_at = now()
        WHERE id = ${bookingId} AND status = 'confirmed' AND starts_at > now()
        RETURNING id, code, customer_account_id, points_used
      ), ${refundCancelled()}
      SELECT max(code) AS code, count(*)::int AS cancelled FROM cancelled
    `;
    if (!row?.cancelled) return false;
    await audit(tx, actorId, "booking.cancel", row.code, bookingId);
    return true;
  });
}

/* Points ------------------------------------------------------------------------- */

export type PointsOverview = {
  outstanding: number;
  holders: number;
  earned30: number;
  redeemed30: number;
  refunded30: number;
  adjusted30: number;
  bookingsWithPoints30: number;
};

export type LedgerRow = {
  id: string;
  accountId: string;
  name: string;
  phone: string;
  delta: number;
  kind: "earn" | "redeem" | "refund" | "adjust";
  note: string | null;
  code: string | null;
  actor: string | null;
  createdAt: Date;
};

export async function getPointsOverview(): Promise<{
  totals: PointsOverview;
  top: { id: string; name: string; phone: string; balance: number }[];
  recent: LedgerRow[];
}> {
  const [[totals], top, recent] = await Promise.all([
    sql<PointsOverview[]>`
      SELECT
        (SELECT coalesce(sum(points_balance), 0) FROM accounts)::int AS outstanding,
        (SELECT count(*) FROM accounts WHERE points_balance > 0)::int AS holders,
        coalesce(sum(delta) FILTER (WHERE kind = 'earn'), 0)::int AS earned30,
        coalesce(-sum(delta) FILTER (WHERE kind = 'redeem'), 0)::int AS redeemed30,
        coalesce(sum(delta) FILTER (WHERE kind = 'refund'), 0)::int AS refunded30,
        coalesce(sum(delta) FILTER (WHERE kind = 'adjust'), 0)::int AS adjusted30,
        (SELECT count(*) FROM bookings WHERE points_used > 0
          AND created_at >= now() - interval '30 days')::int AS "bookingsWithPoints30"
      FROM points_ledger WHERE created_at >= now() - interval '30 days'
    `,
    sql<{ id: string; name: string; phone: string; balance: number }[]>`
      SELECT id, name, phone, points_balance AS balance FROM accounts
      WHERE points_balance > 0 ORDER BY points_balance DESC LIMIT 8
    `,
    sql<LedgerRow[]>`
      SELECT l.id::text AS id, a.id AS "accountId", a.name, a.phone, l.delta, l.kind, l.note,
        k.code, actor.name AS actor, l.created_at AS "createdAt"
      FROM points_ledger l
        JOIN accounts a ON a.id = l.account_id
        LEFT JOIN bookings k ON k.id = l.booking_id
        LEFT JOIN accounts actor ON actor.id = l.actor_id
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 30
    `,
  ]);
  return { totals: totals!, top, recent };
}

export async function updateLoyaltySettings(
  actorId: string,
  settings: LoyaltySettings,
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`
      UPDATE loyalty_settings SET
        enabled = ${settings.enabled}, earn_percent = ${settings.earnPercent},
        min_redeem = ${settings.minRedeem}, max_redeem_percent = ${settings.maxRedeemPercent},
        updated_at = now(), updated_by = ${actorId}
    `;
    await audit(
      tx,
      actorId,
      "points.settings",
      settings.enabled ? "on" : "off",
      null,
      `${settings.earnPercent}% · min ${settings.minRedeem} · max ${settings.maxRedeemPercent}%`,
    );
  });
}

/* Audit log ------------------------------------------------------------------------- */

export type AuditEntry = {
  id: string;
  action: AuditAction;
  target: string;
  targetId: string | null;
  detail: string | null;
  actor: string | null;
  createdAt: Date;
};

export async function listAudit(options: {
  limit: number;
  targetId?: string;
  area?: string;
}): Promise<AuditEntry[]> {
  return sql<AuditEntry[]>`
    SELECT l.id::text AS id, l.action, l.target, l.target_id AS "targetId", l.detail,
      a.name AS actor, l.created_at AS "createdAt"
    FROM admin_audit l LEFT JOIN accounts a ON a.id = l.actor_id
    WHERE ${options.targetId ? sql`l.target_id = ${options.targetId}` : sql`true`}
      AND ${options.area ? sql`l.action LIKE ${`${options.area}.%`}` : sql`true`}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ${options.limit}
  `;
}
