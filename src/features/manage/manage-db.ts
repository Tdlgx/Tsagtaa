import "server-only";

import type postgres from "postgres";

import { refundCancelled } from "@/features/booking/booking-db";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { hashPassword } from "@/lib/auth/password";
import type { BusinessStatus, Role } from "@/lib/auth/session";
import { isPgError, PG, sql } from "@/lib/db";

/* Бүтэц ----------------------------------------------------------------------- */

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
  /** Газрын зургийн цэг, тохируулсан бол. */
  latitude: number | null;
  longitude: number | null;
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
  /** Үнийн оноогоор төлсөн ₮ (Цагтаа нөхнө). */
  pointsUsed: number;
  attendance: Attendance | null;
};

export type Attendance = "attended" | "no_show";

export type Member = { accountId: string; name: string; phone: string; role: Role };

/* Нэг бизнес ----------------------------------------------------------------- */

export async function getManagedBusiness(slug: string): Promise<ManagedBusiness | null> {
  const [business] = await sql<Omit<ManagedBusiness, "hours" | "services" | "staff">[]>`
    SELECT id, slug, name, category, district, address, phone, email,
      register_number AS "registerNumber", description, status,
      slot_minutes AS "slotMinutes", created_at AS "createdAt",
      reviewed_at AS "reviewedAt", review_note AS "reviewNote", latitude, longitude
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

/** Нэг газрын [from, to)-д эхлэх захиалгууд, цуцлагдсаныг оруулаад. */
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

/** Самбарын тоонууд: өнөөдрийн захиалга ба орлого, ирэх 7 хоног, сүүлийн 30 хоногийн цуцлалт. */
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
 * Менежер үйлчлүүлэгчийн өмнөөс цуцална; зөвхөн өөрийн газрын хараахан эхлээгүй
 * захиалгыг (эхэлсний дараа "Ирсэн" эсвэл "Ирээгүй" болно). Зарцуулсан оноо
 * нэг statement дотор үйлчлүүлэгчид буцна.
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

/** Айлчлалаас хойш газар хэр удаан тэмдэглэж чадах вэ; дараа нь оноо өөрөө шийдэгдэнэ. */
export const ATTENDANCE_WINDOW_HOURS = 24;

/**
 * Газар үйлчлүүлэгч ирсэн эсэхийг айлчлал эхэлснээс дууссанаас хойш нэг өдрийн
 * дотор нэг удаа тэмдэглэнэ. "Ирсэн" амласан оноог одоо олгоно; "Ирээгүй" юу ч
 * олгохгүй бөгөөд зарцуулсан оноог буцаана. Ledger-ийн захиалга бүрт нэг бичлэгийн
 * дүрэм давталтыг хоргүй болгоно.
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

/* Цагийн хуваарь, үйлчилгээ, ажилтан ------------------------------------------------------- */

/**
 * Админы импорт хүснэгтэд хуулсан ч жишээ газар кодоос жагсаагддаг тул тэр
 * хуулбарыг засах нь үйлчлүүлэгчдийн харах зүйлийг өөрчлөхгүй.
 */
export function isSamplePlace(slug: string): boolean {
  return SAMPLE_BUSINESSES.some((business) => business.slug === slug);
}

/**
 * Ажлын цаг болон захиалгын торыг солино. Аль хэдийн хийсэн захиалгууд цагаа
 * хадгална; шинэ цаг одооноос захиалж болох зүйлд хамаарна.
 */
export async function saveHours(
  businessId: string,
  hours: readonly { weekday: number; opens: string; closes: string }[],
  slotMinutes: number,
): Promise<void> {
  await sql.begin(async (tx) => {
    // Газрыг мөн lock хийдэг тул зэрэг хадгалж буй хоёр хүн нэг нэгээрээ хэрэгжинэ.
    await tx`UPDATE businesses SET slot_minutes = ${slotMinutes} WHERE id = ${businessId}`;
    await tx`DELETE FROM business_hours WHERE business_id = ${businessId}`;
    if (hours.length > 0) {
      await tx`INSERT INTO business_hours ${tx(
        hours.map((item) => ({ business_id: businessId, ...item })),
      )}`;
    }
  });
}

/** Үнийн жагсаалтыг солино. Захиалга хийгдсэн үеийнхээ нэр, хугацаа, үнийг хадгална. */
export async function saveServices(
  businessId: string,
  services: readonly { name: string; duration: number; price: number }[],
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`SELECT 1 FROM businesses WHERE id = ${businessId} FOR UPDATE`;
    await tx`DELETE FROM services WHERE business_id = ${businessId}`;
    await tx`INSERT INTO services ${tx(
      services.map((service, position) => ({
        business_id: businessId,
        position,
        name: service.name,
        duration_min: service.duration,
        price: service.price,
      })),
    )}`;
  });
}

export type SaveStaffResult =
  | { ok: true }
  | { ok: false; reason: "has_bookings"; names: string[] }
  | { ok: false; reason: "invalid" };

/**
 * Захиалгууд хүнийг position-оор нь заадаг ("<slug>-<position>") тул position хэзээ ч
 * шилжихгүй, дахин ашиглагдахгүй: нэр солиход хадгалагдана, хасахад завсар үлдэнэ,
 * шинэ хүн ямар ч захиалгад хэрэглэгдээгүй дугаар авна. Ирэх айлчлалтай хүнийг
 * тэр захиалгууд цуцлагдах хүртэл хасах боломжгүй.
 */
export async function saveStaff(
  business: { id: string; slug: string },
  staff: readonly { position: number | null; name: string }[],
): Promise<SaveStaffResult> {
  return sql.begin(async (tx): Promise<SaveStaffResult> => {
    await tx`SELECT 1 FROM businesses WHERE id = ${business.id} FOR UPDATE`;
    const current = await tx<{ position: number; name: string }[]>`
      SELECT position, name FROM staff WHERE business_id = ${business.id}
    `;
    const kept = staff.flatMap((member) => (member.position === null ? [] : [member.position]));
    // Үлдээсэн position бүр нэг удаа, зөвхөн энэ газарт үнэхээр байгаа position-ууд.
    if (
      new Set(kept).size !== kept.length ||
      kept.some((position) => !current.some((member) => member.position === position))
    ) {
      return { ok: false, reason: "invalid" };
    }

    const removed = current.filter((member) => !kept.includes(member.position));
    if (removed.length > 0) {
      const busy = await tx<{ staffId: string }[]>`
        SELECT DISTINCT staff_id AS "staffId" FROM bookings
        WHERE business_slug = ${business.slug} AND status = 'confirmed' AND ends_at > now()
          AND staff_id IN ${tx(removed.map((member) => `${business.slug}-${member.position}`))}
      `;
      if (busy.length > 0) {
        const ids = new Set(busy.map((row) => row.staffId));
        return {
          ok: false,
          reason: "has_bookings",
          names: removed
            .filter((member) => ids.has(`${business.slug}-${member.position}`))
            .map((member) => member.name),
        };
      }
    }

    // Хасагдсан хүний өнгөрсөн захиалгууд дугаарыг нь агуулсаар байна: түүнээс дээш эхэлнэ.
    const [used] = await tx<{ max: number | null }[]>`
      SELECT greatest(
        (SELECT max(position) FROM staff WHERE business_id = ${business.id}),
        (SELECT max(substring(staff_id FROM '-([0-9]+)$')::int)
          FROM bookings WHERE business_slug = ${business.slug})
      ) AS max
    `;
    let next = (used?.max ?? -1) + 1;
    const rows = staff.map((member) => ({
      business_id: business.id,
      position: member.position ?? next++,
      name: member.name,
    }));
    // Хамт устгаж, хамт оруулдаг тул хоёр нэрийг солиход unique index зөрчигдөхгүй.
    await tx`DELETE FROM staff WHERE business_id = ${business.id}`;
    await tx`INSERT INTO staff ${tx(rows)}`;
    return { ok: true };
  });
}

/* Баг ------------------------------------------------------------------------- */

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
 * Хүнд газарт хандах эрх өгнө. Шинэ утсанд энд өгсөн анхны нууц үгтэй бүртгэл
 * үүснэ (түүнд биечлэн хэлж болно); байгаа бүртгэл зөвхөн үүргийг авч, өөрийн нууц
 * үгээ хадгална. `afterAdd` нэг transaction дотор ажилладаг (админы үйлдлийн түүх)
 * тул хоёулаа болно, эсвэл аль нь ч болохгүй.
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

/** Менежерийг хасаж болно; эзэмшигчийг болохгүй (газар үргэлж эзэмшигчтэй байна). */
export async function removeManager(businessId: string, accountId: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM memberships
    WHERE business_id = ${businessId} AND account_id = ${accountId} AND role = 'manager'
    RETURNING account_id
  `;
  return rows.length > 0;
}

/** "khaan-barber-2" → position 2 дахь ажилтны мөр, мэдэгдэхгүй бол id-г өөрийг нь. */
export function staffNameFor(
  staffId: string,
  slug: string,
  staff: readonly { position: number; name: string }[],
): string {
  const position = Number(staffId.slice(slug.length + 1));
  return staff.find((member) => member.position === position)?.name ?? staffId;
}
