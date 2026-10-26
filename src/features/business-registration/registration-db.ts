import "server-only";

import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isPgError, PG, sql } from "@/lib/db";

/** Transaction-ийг буцаахын тулд дотор нь шиддэг: утас өөр нууц үгтэй бүртгэлтэй. */
class WrongOwnerPassword extends Error {}

/** Жишээ газруудын аль хэдийн эзэлсэн хаягууд, тэд хүснэгтэд биш, кодонд байдаг. */
const RESERVED_SLUGS = new Set(SAMPLE_BUSINESSES.map((business) => business.slug));

export type NewBusiness = {
  requestId: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  phone: string;
  email: string | null;
  registerNumber: string | null;
  description: string;
  slotMinutes: number;
  /** Индекс 0 = Даваа; амралтын өдрүүдийг оруулахгүй. */
  hours: readonly { weekday: number; opens: string; closes: string }[];
  services: readonly { name: string; duration: number; price: number }[];
  staff: readonly string[];
  /** Газрын зургийн цэг, хотод байгаа эсэхийг аль хэдийн шалгасан. */
  location: { lat: number; lng: number } | null;
  consentedAt: Date;
  /** Бүртгүүлж буй хүн: эзэмшигч болж, бизнесийн утсаар нэвтэрч чадна. */
  owner: { name: string; password: string };
};

export type RegisterResult =
  | { ok: true; id: string; slug: string; createdAt: Date; ownerId: string }
  | { ok: false; reason: "slug_taken"; suggestion: string }
  | { ok: false; reason: "register_taken" | "request_reused" | "owner_password" };

/**
 * Бүртгэлийг нэг transaction-оор хадгална: бизнес, түүний цагийн хуваарь,
 * үйлчилгээ, ажилтан хамт орно, эсвэл огт орохгүй. Давтагдашгүй байдлыг DB-д
 * үлдээнэ (хоёр эзэмшигч зэрэг давж болох "хаяг сул уу?" гэсэн урьдчилсан
 * шалгалт байхгүй); зөрчигдсөн constraint ойлгомжтой хариу болж хувирна.
 */
export async function insertBusiness(business: NewBusiness): Promise<RegisterResult> {
  if (RESERVED_SLUGS.has(business.slug)) {
    return { ok: false, reason: "slug_taken", suggestion: await suggestSlug(business.slug) };
  }

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await sql.begin(async (tx): Promise<RegisterResult> => {
        const [row] = await tx<{ id: string; slug: string; createdAt: Date }[]>`
          INSERT INTO businesses (
            request_id, slug, name, category, district, address, phone, email,
            register_number, description, slot_minutes, owner_consented_at,
            latitude, longitude
          ) VALUES (
            ${business.requestId}, ${business.slug}, ${business.name}, ${business.category},
            ${business.district}, ${business.address}, ${business.phone}, ${business.email},
            ${business.registerNumber}, ${business.description}, ${business.slotMinutes},
            ${business.consentedAt}, ${business.location?.lat ?? null}, ${business.location?.lng ?? null}
          )
          ON CONFLICT (request_id) DO NOTHING
          RETURNING id, slug, created_at AS "createdAt"
        `;

        // Өмнө илгээсэн (давхар дарах, хариу алдагдсаны дараах дахин оролдлого): хадгалсныг буцаана.
        if (!row) {
          const [existing] = await tx<
            { id: string; slug: string; phone: string; createdAt: Date }[]
          >`
            SELECT id, slug, phone, created_at AS "createdAt"
            FROM businesses WHERE request_id = ${business.requestId}
          `;
          if (!existing || existing.phone !== business.phone) {
            return { ok: false, reason: "request_reused" };
          }
          const [owner] = await tx<{ accountId: string }[]>`
            SELECT account_id AS "accountId" FROM memberships
            WHERE business_id = ${existing.id} AND role = 'owner'
          `;
          if (!owner) return { ok: false, reason: "request_reused" };
          return {
            ok: true,
            id: existing.id,
            slug: existing.slug,
            createdAt: existing.createdAt,
            ownerId: owner.accountId,
          };
        }

        const id = row.id;
        if (business.hours.length > 0) {
          await tx`INSERT INTO business_hours ${tx(
            business.hours.map((item) => ({ business_id: id, ...item })),
          )}`;
        }
        await tx`INSERT INTO services ${tx(
          business.services.map((service, position) => ({
            business_id: id,
            position,
            name: service.name,
            duration_min: service.duration,
            price: service.price,
          })),
        )}`;
        await tx`INSERT INTO staff ${tx(
          business.staff.map((name, position) => ({ business_id: id, position, name })),
        )}`;
        // Эзэмшигчийн бүртгэл: шинэ утсанд шинээр; байгаа бүртгэл нууц үгээ батлах ёстой.
        const [account] = await tx<{ id: string; passwordHash: string }[]>`
          SELECT id, password_hash AS "passwordHash" FROM accounts
          WHERE phone = ${business.phone} FOR UPDATE
        `;
        let ownerId = account?.id;
        if (account) {
          if (!(await verifyPassword(business.owner.password, account.passwordHash))) {
            throw new WrongOwnerPassword();
          }
        } else {
          const [created] = await tx<{ id: string }[]>`
            INSERT INTO accounts (phone, name, password_hash)
            VALUES (${business.phone}, ${business.owner.name},
              ${await hashPassword(business.owner.password)})
            RETURNING id
          `;
          ownerId = created?.id;
        }
        if (!ownerId) throw new Error("owner account missing");
        await tx`
          INSERT INTO memberships (account_id, business_id, role)
          VALUES (${ownerId}, ${id}, 'owner')
        `;
        return { ok: true, ...row, ownerId };
      });
    } catch (error) {
      if (error instanceof WrongOwnerPassword) return { ok: false, reason: "owner_password" };
      if (isPgError(error, PG.uniqueViolation, "businesses_slug_key")) {
        return { ok: false, reason: "slug_taken", suggestion: await suggestSlug(business.slug) };
      }
      if (isPgError(error, PG.uniqueViolation, "businesses_register_number_key")) {
        return { ok: false, reason: "register_taken" };
      }
      // Нэг хүсэлтийн хоёр хуулбар зэрэг deadlock үүсгэж болно; дахин оролдлого хадгалагдсаныг олно.
      const retryable =
        isPgError(error, PG.deadlockDetected) || isPgError(error, PG.serializationFailure);
      if (!retryable || attempt >= 3) throw error;
    }
  }
}

/** Хаяг яг одоо сул уу? Бичих явцын зөвлөмж л; эцсийн шийдвэрийг insert гаргана. */
export async function isSlugFree(slug: string): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return false;
  const [row] = await sql`SELECT 1 FROM businesses WHERE slug = ${slug}`;
  return !row;
}

/** "ongo-salon" эзэлсэн → "ongo-salon-2" (эсвэл дараагийн сул дугаар). */
export async function suggestSlug(base: string): Promise<string> {
  const stem = base.slice(0, 56).replace(/-+$/, "");
  const rows = await sql<{ slug: string }[]>`
    SELECT slug FROM businesses WHERE slug = ${stem} OR slug LIKE ${`${stem}-%`}
  `;
  const used = new Set([...rows.map((row) => row.slug), ...RESERVED_SLUGS]);
  for (let n = 2; ; n += 1) {
    const candidate = `${stem}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
