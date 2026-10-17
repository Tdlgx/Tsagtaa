import "server-only";

import type postgres from "postgres";

import { refundCancelled } from "@/features/booking/booking-db";
import { hashPassword } from "@/lib/auth/password";
import type { BusinessStatus, Role } from "@/lib/auth/session";
import { isPgError, PG, sql } from "@/lib/db";

/* Shapes ----------------------------------------------------------------------- */

export type ManagedBusiness = {
  id: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  phone: string;
  email: string | null;
  registerNumber: string | null;
  description: string;
  status: BusinessStatus;
  slotMinutes: number;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  hours: { weekday: number; opens: string; closes: string }[];
  services: { name: string; duration: number; price: number }[];
  staff: { position: number; name: string }[];
};

export type ManagedBooking = {
  id: string;
  code: string;
  businessSlug: string;
  staffId: string;
  serviceName: string;
  durationMin: number;
  price: number;
  startsAt: Date;
  endsAt: Date;
  customerName: string;
  phone: string;
  note: string;
  status: "confirmed" | "cancelled";
  createdAt: Date;
  /** ₮ of the price paid in points (Цагтаа covers it). */
  pointsUsed: number;
  attendance: Attendance | null;
};

export type Attendance = "attended" | "no_show";

export type Member = { accountId: string; name: string; phone: string; role: Role };

/* One business ----------------------------------------------------------------- */

export async function getManagedBusiness(slug: string): Promise<ManagedBusiness | null> {
  const [business] = await sql<Omit<ManagedBusiness, "hours" | "services" | "staff">[]>`
    SELECT id, slug, name, category, district, address, phone, email,
      register_number AS "registerNumber", description, status,
      slot_minutes AS "slotMinutes", created_at AS "createdAt",
      reviewed_at AS "reviewedAt", review_note AS "reviewNote"
    FROM businesses WHERE slug = ${slug}
  `;
  if (!business) return null;
  const [hours, services, staff] = await Promise.all([
    sql<ManagedBusiness["hours"]>`
      SELECT weekday, to_char(opens, 'HH24:MI') AS opens, to_char(closes, 'HH24:MI') AS closes
      FROM business_hours WHERE business_id = ${business.id} ORDER BY weekday`,
    sql<ManagedBusiness["services"]>`
      SELECT name, duration_min AS duration, price
      FROM services WHERE business_id = ${business.id} ORDER BY position`,
    sql<ManagedBusiness["staff"]>`
      SELECT position, name FROM staff WHERE business_id = ${business.id} ORDER BY position`,
  ]);
  return { ...business, hours, services, staff };
}

const BOOKING_COLUMNS = sql`
  id, code, business_slug AS "businessSlug", staff_id AS "staffId",
  service_name AS "serviceName", duration_min AS "durationMin", price,
  starts_at AS "startsAt", ends_at AS "endsAt", customer_name AS "customerName",
  phone, note, status, created_at AS "createdAt", points_used AS "pointsUsed", attendance
`;

/** Bookings of one place that start in [from, to), cancelled ones included. */
export async function getBusinessBookings(
  slug: string,
  from: Date,
  to: Date,
): Promise<ManagedBooking[]> {
  return sql<ManagedBooking[]>`
    SELECT ${BOOKING_COLUMNS} FROM bookings
    WHERE business_slug = ${slug} AND starts_at >= ${from} AND starts_at < ${to}
    ORDER BY starts_at
  `;
}

export type BusinessStats = {
  today: number;
  todayRevenue: number;
  next7: number;
  cancelled30: number;
  total30: number;
};

export async function getBusinessStats(slug: string, dayStart: Date): Promise<BusinessStats> {
  const [stats] = await sql<BusinessStats[]>`
    SELECT
      count(*) FILTER (WHERE status = 'confirmed' AND starts_at >= ${dayStart}
        AND starts_at < ${dayStart}::timestamptz + interval '1 day')::int AS today,
      coalesce(sum(price) FILTER (WHERE status = 'confirmed' AND starts_at >= ${dayStart}
        AND starts_at < ${dayStart}::timestamptz + interval '1 day'), 0)::int AS "todayRevenue",
      count(*) FILTER (WHERE status = 'confirmed' AND starts_at >= now()
        AND starts_at < now() + interval '7 days')::int AS next7,
      count(*) FILTER (WHERE status = 'cancelled'
        AND created_at >= now() - interval '30 days')::int AS cancelled30,
      count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS total30
    FROM bookings WHERE business_slug = ${slug}
  `;
  return stats ?? { today: 0, todayRevenue: 0, next7: 0, cancelled30: 0, total30: 0 };
}

/**
 * A manager cancels on the customer's behalf; only bookings of their own place
 * that have not started (after that, it is "came" or "did not come"). Points
 * spent on it go back to the customer in the same statement.
 */
export async function cancelBusinessBooking(slug: string, bookingId: string): Promise<boolean> {
  const [row] = await sql<{ cancelled: number }[]>`
    WITH cancelled AS (
      UPDATE bookings SET status = 'cancelled', cancelled_at = now()
      WHERE id = ${bookingId} AND business_slug = ${slug} AND status = 'confirmed'
        AND starts_at > now()
      RETURNING id, customer_account_id, points_used
    ), ${refundCancelled()}
    SELECT count(*)::int AS cancelled FROM cancelled
  `;
  return (row?.cancelled ?? 0) > 0;
}

/** How long after a visit the place can still mark it; then points settle on their own. */
export const ATTENDANCE_WINDOW_HOURS = 24;

/**
 * The place marks whether the customer came, once, from the start of the
 * visit until a day after it ends. "Came" credits the promised points now;
 * "did not come" earns nothing and gives back any points spent. The ledger's
 * one-entry-per-booking rule makes a repeat harmless.
 */
export async function markAttendance(
  slug: string,
  bookingId: string,
  attendance: Attendance,
): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [booking] = await tx<
      { id: string; accountId: string | null; pointsEarn: number; pointsUsed: number }[]
    >`
      UPDATE bookings SET attendance = ${attendance}, attendance_at = now()
      WHERE id = ${bookingId} AND business_slug = ${slug} AND status = 'confirmed'
        AND attendance IS NULL AND starts_at <= now()
        AND ends_at > now() - ${`${ATTENDANCE_WINDOW_HOURS} hours`}::interval
      RETURNING id, customer_account_id AS "accountId", points_earn AS "pointsEarn",
        points_used AS "pointsUsed"
    `;
    if (!booking) return false;
    if (!booking.accountId) return true;
    const entry =
      attendance === "attended"
        ? { kind: "earn", delta: booking.pointsEarn }
        : { kind: "refund", delta: booking.pointsUsed };
    if (entry.delta > 0) {
      await tx`
        INSERT INTO points_ledger (account_id, delta, kind, booking_id)
        VALUES (${booking.accountId}, ${entry.delta}, ${entry.kind}, ${booking.id})
        ON CONFLICT (booking_id, kind) WHERE booking_id IS NOT NULL DO NOTHING
      `;
    }
    return true;
  });
}

/* Team ------------------------------------------------------------------------- */

export async function getMembers(businessId: string): Promise<Member[]> {
  return sql<Member[]>`
    SELECT a.id AS "accountId", a.name, a.phone, m.role
    FROM memberships m JOIN accounts a ON a.id = m.account_id
    WHERE m.business_id = ${businessId}
    ORDER BY m.role DESC, a.name
  `;
}

export type AddMemberResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: "needs_password" | "already_member" | "owner_exists" };

/**
 * Gives someone access to a place. A new phone gets an account with the
 * starting password given here (they can be told it in person); an existing
 * account just gains the role and keeps its own password. `afterAdd` runs in
 * the same transaction (the admin's audit entry), so both happen or neither.
 */
export async function addMember(
  businessId: string,
  member: { phone: string; name: string; password: string | null; role: Role },
  afterAdd?: (tx: postgres.TransactionSql) => Promise<unknown>,
): Promise<AddMemberResult> {
  return sql.begin(async (tx): Promise<AddMemberResult> => {
    let [account] = await tx<
      { id: string }[]
    >`SELECT id FROM accounts WHERE phone = ${member.phone}`;
    let created = false;
    if (!account) {
      if (!member.password) return { ok: false, reason: "needs_password" };
      [account] = await tx<{ id: string }[]>`
        INSERT INTO accounts (phone, name, password_hash)
        VALUES (${member.phone}, ${member.name}, ${await hashPassword(member.password)})
        RETURNING id
      `;
      created = true;
    }
    if (!account) throw new Error("account insert returned nothing");
    try {
      await tx.savepoint(
        (sp) => sp`
        INSERT INTO memberships (account_id, business_id, role)
        VALUES (${account.id}, ${businessId}, ${member.role})
      `,
      );
    } catch (error) {
      if (isPgError(error, PG.uniqueViolation, "memberships_pkey")) {
        return { ok: false, reason: "already_member" };
      }
      if (isPgError(error, PG.uniqueViolation, "memberships_one_owner")) {
        return { ok: false, reason: "owner_exists" };
      }
      throw error;
    }
    if (afterAdd) await afterAdd(tx);
    return { ok: true, created };
  });
}

/** Managers can be removed; the owner cannot (a place always keeps its owner). */
export async function removeManager(businessId: string, accountId: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM memberships
    WHERE business_id = ${businessId} AND account_id = ${accountId} AND role = 'manager'
    RETURNING account_id
  `;
  return rows.length > 0;
}

/** "khaan-barber-2" → the staff row at position 2, or the raw id when unknown. */
export function staffNameFor(
  staffId: string,
  slug: string,
  staff: readonly { position: number; name: string }[],
): string {
  const position = Number(staffId.slice(slug.length + 1));
  return staff.find((member) => member.position === position)?.name ?? staffId;
}
