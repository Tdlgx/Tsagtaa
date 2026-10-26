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
  /** Цагийг авч чадах хүмүүс, давуу эрхийн дарааллаар; эхний сул нь авна. */
  staffIds: readonly string[];
  serviceName: string;
  durationMin: number;
  price: number;
  startsAt: Date;
  customerName: string;
  phone: string;
  note: string;
  consentedAt: Date;
  /** Нэвтэрсэн үйлчлүүлэгч: захиалга оноо зарцуулж, олж болно. */
  customerAccountId: string | null;
  pointsUsed: number;
  pointsEarn: number;
};

export type InsertResult =
  { ok: true; row: BookingRow } | { ok: false; reason: "slot_taken" | "request_reused" | "points" };

/** Deadlock эсвэл serialization failure нь "амжилтгүй" биш, "дахин оролд" гэсэн утгатай. */
const MAX_ATTEMPTS = 3;
const MAX_CODE_TRIES = 3;

/**
 * Захиалгыг хадгална. Зөв байдал нь урьдчилан шалгахаас биш, хүснэгтийн
 * constraint-уудаас ирнэ: "сул байна уу?" гэсэн query байхгүй, учир нь тэр шалгалт
 * ба insert-ийн хооронд өөр хүн цагийг авч болно.
 *
 * - `bookings_no_overlap` нэг хүний аливаа давхцлыг татгалзана (23P01).
 *   Сонгох хэд хэдэн хүн байвал нэг transaction дотор ээлжлэн оролдоно; оролдлого
 *   бүрт savepoint ашигласнаар татгалзсан insert-ийн дараа ч transaction ажилласаар байна.
 * - `request_id` давтагдашгүй: давтагдсан хүсэлт (давхар дарах, хариу алдагдсаны
 *   дараах дахин оролдлого) хоёр дахь захиалгын оронд аль хэдийн хадгалсныг буцаана.
 */
export async function insertBooking(booking: NewBooking): Promise<InsertResult> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await insertOnce(booking);
    } catch (error) {
      // Нэг хүсэлтийн хоёр хуулбар яг нэг мөчид request_id болон давхцлын index дээр
      // deadlock үүсгэж болох ба PostgreSQL нэгийг нь зогсооно. Дахин оролдоно:
      // хоёр дахь удаад хадгалагдсан захиалгыг олно.
      const retryable =
        isPgError(error, PG.deadlockDetected) || isPgError(error, PG.serializationFailure);
      // Үлдэгдлээс их оноо зарцуулах гэсэн: үлдэгдлийн CHECK татгалзаж, бүх
      // transaction (захиалгын хамт) буцаагдсан.
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
            // Оноог захиалга хадгалагдах transaction дотор зарцуулна:
            // хоёулаа болно, эсвэл аль нь ч болохгүй.
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
          // Энэ хүнийг саяхан авчихсан: дараагийнхыг оролдоно.
          if (isPgError(error, PG.exclusionViolation, "bookings_no_overlap")) break;
          // Ресепшний код аль хэдийн ашиглагдсан (~33 саяас 1): өөрийг сугална.
          if (isPgError(error, PG.uniqueViolation, "bookings_code_key")) continue;
          throw error;
        }
      }
    }
    return { ok: false, reason: "slot_taken" };
  });
}

/** Хүсэлт өмнө хадгалагдсан: тэр захиалгыг буцаана, гэхдээ зөвхөн ижил үйлчлүүлэгчид. */
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

/** Бизнесийн [from, to)-той давхцах баталгаажсан захиалгууд; давхцлын index үйлчилнэ. */
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

/** Ижил зүйлийг хэд хэдэн бизнесийн хувьд нэг query-ээр (нүүр хуудасны самбар). */
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
 * Хараахан эхлээгүй баталгаажсан захиалгыг цуцална. Id нь таах боломжгүй UUID
 * бөгөөд утас ч таарах ёстой. Цуцлахад цаг шууд чөлөөлөгдөнө (давхцлын дүрэм зөвхөн
 * баталгаажсан захиалгад хамаарна), зарцуулсан оноо нэг statement дотор буцна.
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
 * Цуцлалтын буцаалтын хэсэг: `cancelled` дээрх CTE (id, customer_account_id,
 * points_used бүхий мөрүүд). Ledger захиалга бүрт нэг л буцаалт авдаг тул
 * хоёр удаа ажиллуулсан ч хоёр удаа буцаахгүй.
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
 * Газар захиалга авдаг эсэх. Хэзээ ч импортлогдоогүй жишээ газар мөргүй тул
 * нээлттэй; хадгалагдсан газар идэвхтэй байх ёстой (pending, rejected,
 * suspended биш).
 */
export async function isBookable(slug: string): Promise<boolean> {
  const [row] = await sql<{ status: string }[]>`SELECT status FROM businesses WHERE slug = ${slug}`;
  return !row || row.status === "active";
}
