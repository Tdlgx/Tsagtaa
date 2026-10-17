import "server-only";

import type postgres from "postgres";

import { createBookingCode } from "@/features/booking/booking";
import { isPgError, PG, sql } from "@/lib/db";

export type BookingRow = {
  id: string;
  code: string;
  staffId: string;
  phone: string;
  startsAt: Date;
  createdAt: Date;
};

export type NewBooking = {
  requestId: string;
  businessSlug: string;
  /** People who can take the time, in order of preference; the first free one gets it. */
  staffIds: readonly string[];
  serviceName: string;
  durationMin: number;
  price: number;
  startsAt: Date;
  customerName: string;
  phone: string;
  note: string;
  consentedAt: Date;
  /** Signed-in customer: the booking can spend and earn points. */
  customerAccountId: string | null;
  pointsUsed: number;
  pointsEarn: number;
};

export type InsertResult =
  { ok: true; row: BookingRow } | { ok: false; reason: "slot_taken" | "request_reused" | "points" };

/** A deadlock or serialization failure means "try again", not "failed". */
const MAX_ATTEMPTS = 3;
const MAX_CODE_TRIES = 3;

/**
 * Stores a booking. Correctness comes from the table's constraints, not from
 * checking first: there is no "is it free?" query, because between that
 * check and the insert someone else could take the time.
 *
 * - `bookings_no_overlap` rejects any overlap for the same person (23P01).
 *   With several people to choose from, each is tried in turn inside one
 *   transaction; a savepoint per try keeps the transaction usable after a
 *   rejected insert.
 * - `request_id` is unique: a repeated request (double click, retry after
 *   a lost response) returns the booking already stored instead of a second one.
 */
export async function insertBooking(booking: NewBooking): Promise<InsertResult> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await insertOnce(booking);
    } catch (error) {
      // Two copies of the same request at the same moment can deadlock on the
      // request_id and overlap indexes; PostgreSQL aborts one. Retry it: the
      // second time round it finds the stored booking.
      const retryable =
        isPgError(error, PG.deadlockDetected) || isPgError(error, PG.serializationFailure);
      // Spending more points than the balance holds: the CHECK on the balance
      // rejected it, and the whole transaction (booking included) rolled back.
      if (isPgError(error, PG.checkViolation, "accounts_points_not_negative")) {
        return { ok: false, reason: "points" };
      }
      if (!retryable || attempt >= MAX_ATTEMPTS) throw error;
    }
  }
}

async function insertOnce(booking: NewBooking): Promise<InsertResult> {
  const endsAt = new Date(booking.startsAt.getTime() + booking.durationMin * 60_000);

  return sql.begin(async (tx): Promise<InsertResult> => {
    for (const staffId of booking.staffIds) {
      for (let codeTry = 1; codeTry <= MAX_CODE_TRIES; codeTry += 1) {
        try {
          const rows = await tx.savepoint(
            (sp) => sp<BookingRow[]>`
              INSERT INTO bookings (
                request_id, code, business_slug, staff_id, service_name, duration_min,
                price, starts_at, ends_at, customer_name, phone, note, consented_at,
                customer_account_id, points_used, points_earn
              ) VALUES (
                ${booking.requestId}, ${createBookingCode()}, ${booking.businessSlug},
                ${staffId}, ${booking.serviceName}, ${booking.durationMin}, ${booking.price},
                ${booking.startsAt}, ${endsAt}, ${booking.customerName}, ${booking.phone},
                ${booking.note}, ${booking.consentedAt}, ${booking.customerAccountId},
                ${booking.pointsUsed}, ${booking.pointsEarn}
              )
              ON CONFLICT (request_id) DO NOTHING
              RETURNING id, code, staff_id AS "staffId", phone,
                starts_at AS "startsAt", created_at AS "createdAt"
            `,
          );
          const inserted = rows[0];
          if (inserted) {
            // Points are spent in the same transaction as the booking is stored:
            // both happen, or neither does.
            if (booking.pointsUsed > 0 && booking.customerAccountId) {
              await tx`
                INSERT INTO points_ledger (account_id, delta, kind, booking_id)
                VALUES (${booking.customerAccountId}, ${-booking.pointsUsed}, 'redeem', ${inserted.id})
              `;
            }
            return { ok: true, row: inserted };
          }
          return await findReplay(tx, booking);
        } catch (error) {
          // This person was taken a moment ago: try the next one.
          if (isPgError(error, PG.exclusionViolation, "bookings_no_overlap")) break;
          // Front-desk code already used (1 in ~33 million): draw another.
          if (isPgError(error, PG.uniqueViolation, "bookings_code_key")) continue;
          throw error;
        }
      }
    }
    return { ok: false, reason: "slot_taken" };
  });
}

/** The request was stored before: hand back that booking, but only to the same customer. */
async function findReplay(tx: postgres.TransactionSql, booking: NewBooking): Promise<InsertResult> {
  const [existing] = await tx<BookingRow[]>`
    SELECT id, code, staff_id AS "staffId", phone,
      starts_at AS "startsAt", created_at AS "createdAt"
    FROM bookings
    WHERE request_id = ${booking.requestId}
  `;
  if (!existing || existing.phone !== booking.phone) return { ok: false, reason: "request_reused" };
  return { ok: true, row: existing };
}

export type TakenRange = { staffId: string; startsAt: Date; endsAt: Date };

/** Confirmed bookings of a business that overlap [from, to); served by the overlap index. */
export async function getTakenRanges(
  businessSlug: string,
  from: Date,
  to: Date,
): Promise<TakenRange[]> {
  return sql<TakenRange[]>`
    SELECT staff_id AS "staffId", starts_at AS "startsAt", ends_at AS "endsAt"
    FROM bookings
    WHERE business_slug = ${businessSlug}
      AND status = 'confirmed'
      AND tstzrange(starts_at, ends_at, '[)') && tstzrange(${from}, ${to}, '[)')
  `;
}

/** The same for several businesses in one query (the home page board). */
export async function getTakenRangesForMany(
  businessSlugs: readonly string[],
  from: Date,
  to: Date,
): Promise<(TakenRange & { businessSlug: string })[]> {
  if (businessSlugs.length === 0) return [];
  return sql<(TakenRange & { businessSlug: string })[]>`
    SELECT business_slug AS "businessSlug", staff_id AS "staffId",
      starts_at AS "startsAt", ends_at AS "endsAt"
    FROM bookings
    WHERE business_slug IN ${sql(businessSlugs)}
      AND status = 'confirmed'
      AND tstzrange(starts_at, ends_at, '[)') && tstzrange(${from}, ${to}, '[)')
  `;
}

/**
 * Cancels a confirmed booking that has not started yet. The id is an
 * unguessable UUID and the phone must match as well. Cancelling frees the
 * time at once (the overlap rule only covers confirmed bookings), and any
 * points spent on it go back in the same statement.
 */
export async function cancelBookingRow(id: string, phone: string): Promise<boolean> {
  const [row] = await sql<{ cancelled: number }[]>`
    WITH cancelled AS (
      UPDATE bookings SET status = 'cancelled', cancelled_at = now()
      WHERE id = ${id} AND phone = ${phone} AND status = 'confirmed' AND starts_at > now()
      RETURNING id, customer_account_id, points_used
    ), ${refundCancelled()}
    SELECT count(*)::int AS cancelled FROM cancelled
  `;
  return (row?.cancelled ?? 0) > 0;
}

/**
 * The refund half of a cancellation: a CTE over `cancelled` (rows with id,
 * customer_account_id, points_used). The ledger takes one refund per
 * booking, so running it twice cannot pay back twice.
 */
export function refundCancelled(): postgres.PendingQuery<postgres.Row[]> {
  return sql`refunded AS (
    INSERT INTO points_ledger (account_id, delta, kind, booking_id)
    SELECT customer_account_id, points_used, 'refund', id FROM cancelled
    WHERE points_used > 0 AND customer_account_id IS NOT NULL
    ON CONFLICT (booking_id, kind) WHERE booking_id IS NOT NULL DO NOTHING
    RETURNING 1
  )`;
}

/**
 * Whether a place takes bookings. Sample places that were never imported
 * have no row and are open; a stored place must be active (not pending,
 * rejected or suspended).
 */
export async function isBookable(slug: string): Promise<boolean> {
  const [row] = await sql<{ status: string }[]>`SELECT status FROM businesses WHERE slug = ${slug}`;
  return !row || row.status === "active";
}
