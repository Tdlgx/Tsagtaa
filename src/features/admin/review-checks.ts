import "server-only";

import type { ManagedBusiness, Member } from "@/features/manage/manage-db";
import type { BusinessStatus } from "@/lib/auth/session";
import { sql } from "@/lib/db";

/*
 * Automatic checks on a registration, so a reviewer looks first where it
 * matters. They advise; the decision stays with a person.
 */

export type CheckLevel = "pass" | "warn" | "fail";

export type DuplicateMatch = {
  slug: string;
  name: string;
  status: BusinessStatus;
  /** 0–1, trigram similarity of the names. */
  similarity: number;
  samePhone: boolean;
  sameOwner: boolean;
  sameRegister: boolean;
};

export type ReviewCheck =
  | { id: "owner"; level: CheckLevel; owner: { name: string; phone: string } | null }
  | { id: "register"; level: CheckLevel; kind: "company" | "person" | null }
  | { id: "duplicates"; level: CheckLevel; matches: DuplicateMatch[] }
  | { id: "name"; level: CheckLevel; issue: "lowercase" | "contact" | null }
  | { id: "address"; level: CheckLevel; length: number }
  | { id: "hours"; level: CheckLevel; openDays: number; odd: number[] }
  | { id: "services"; level: CheckLevel; count: number; free: string[] }
  | {
      id: "prices";
      level: CheckLevel;
      median: number | null;
      outliers: { name: string; price: number }[];
    }
  | { id: "fit"; level: CheckLevel; tooLong: string[] }
  | { id: "staff"; level: CheckLevel; count: number }
  | { id: "description"; level: CheckLevel; length: number }
  | { id: "email"; level: CheckLevel; email: string }
  | { id: "waiting"; level: CheckLevel; hours: number };

export type ReviewReport = {
  checks: ReviewCheck[];
  /** 0–100: passes count fully, warnings half. */
  score: number;
  verdict: "ready" | "look" | "fix";
};

/** Names this alike are probably the same place ("Тулгаа салон" / "Tulgaa salon" aside). */
const SIMILAR = 0.45;
const SAME = 0.75;
/** Prices this far from the category's middle are worth a second look. */
const PRICE_LOW = 0.25;
const PRICE_HIGH = 4;
/** Enough prices in the category to say what is normal. */
const PRICE_SAMPLE = 5;
const OVERDUE_HOURS = 48;
/** Sample places share a placeholder number; it says nothing about duplicates. */
const SAMPLE_PHONE = "99000000";

const minutes = (clock: string): number => {
  const [h, m] = clock.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export async function getReviewReport(
  business: ManagedBusiness,
  members: readonly Member[],
): Promise<ReviewReport> {
  const owner = members.find((member) => member.role === "owner") ?? null;
  const ownerId = owner?.accountId ?? null;

  const [matches, [prices]] = await Promise.all([
    sql<DuplicateMatch[]>`
      SELECT b.slug, b.name, b.status,
        round(similarity(lower(b.name), lower(${business.name}))::numeric, 2)::float AS similarity,
        (b.phone = ${business.phone} AND b.phone <> ${SAMPLE_PHONE}) AS "samePhone",
        EXISTS (SELECT 1 FROM memberships m WHERE m.business_id = b.id
          AND m.role = 'owner' AND m.account_id = ${ownerId}) AS "sameOwner",
        (b.register_number IS NOT NULL
          AND b.register_number = ${business.registerNumber}) AS "sameRegister"
      FROM businesses b
      WHERE b.id <> ${business.id}
        AND (similarity(lower(b.name), lower(${business.name})) >= ${SIMILAR}
          OR (b.phone = ${business.phone} AND b.phone <> ${SAMPLE_PHONE})
          OR b.register_number = ${business.registerNumber}
          OR EXISTS (SELECT 1 FROM memberships m WHERE m.business_id = b.id
            AND m.role = 'owner' AND m.account_id = ${ownerId}))
      ORDER BY similarity DESC
      LIMIT 6
    `,
    sql<{ median: number | null; count: number }[]>`
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price)::int AS median,
        count(*)::int AS count
      FROM services s JOIN businesses b ON b.id = s.business_id
      WHERE b.category = ${business.category} AND b.status = 'active'
        AND b.id <> ${business.id} AND s.price > 0
    `,
  ]);

  const checks: ReviewCheck[] = [];

  checks.push({
    id: "owner",
    level: owner ? "pass" : "fail",
    owner: owner ? { name: owner.name, phone: owner.phone } : null,
  });

  const register = business.registerNumber;
  checks.push({
    id: "register",
    level: register ? "pass" : "warn",
    kind: !register ? null : /^\d{7}$/.test(register) ? "company" : "person",
  });

  // The same place twice: very alike and still live, or tied by phone, owner or register.
  const live = matches.filter((match) => match.status === "pending" || match.status === "active");
  const strong = live.some(
    (match) =>
      match.similarity >= SAME && (match.samePhone || match.sameOwner || match.sameRegister),
  );
  checks.push({
    id: "duplicates",
    level: strong ? "fail" : matches.length > 0 ? "warn" : "pass",
    matches,
  });

  const letters = business.name.replace(/[^\p{L}]/gu, "");
  const nameIssue = /(https?:|www\.|\d{6,})/i.test(business.name)
    ? "contact"
    : letters && letters === letters.toLowerCase()
      ? "lowercase"
      : null;
  checks.push({ id: "name", level: nameIssue ? "warn" : "pass", issue: nameIssue });

  const address = business.address.trim();
  checks.push({
    id: "address",
    level: address.length >= 10 && /\d/.test(address) ? "pass" : "warn",
    length: address.length,
  });

  // A day under 2 hours or over 16 is more likely a typo than a schedule.
  const odd = business.hours
    .filter((day) => {
      const length = minutes(day.closes) - minutes(day.opens);
      return length < 120 || length > 16 * 60;
    })
    .map((day) => day.weekday);
  checks.push({
    id: "hours",
    level: business.hours.length === 0 ? "fail" : odd.length > 0 ? "warn" : "pass",
    openDays: business.hours.length,
    odd,
  });

  const free = business.services.filter((service) => service.price === 0).map((s) => s.name);
  checks.push({
    id: "services",
    level: business.services.length === 0 ? "fail" : free.length > 0 ? "warn" : "pass",
    count: business.services.length,
    free,
  });

  const median = prices && prices.count >= PRICE_SAMPLE ? prices.median : null;
  const outliers =
    median === null
      ? []
      : business.services
          .filter(
            (service) =>
              service.price > 0 &&
              (service.price < median * PRICE_LOW || service.price > median * PRICE_HIGH),
          )
          .map(({ name, price }) => ({ name, price }));
  checks.push({ id: "prices", level: outliers.length > 0 ? "warn" : "pass", median, outliers });

  const longestDay = Math.max(
    0,
    ...business.hours.map((day) => minutes(day.closes) - minutes(day.opens)),
  );
  const tooLong = business.services
    .filter((service) => longestDay > 0 && service.duration > longestDay)
    .map((service) => service.name);
  checks.push({ id: "fit", level: tooLong.length > 0 ? "warn" : "pass", tooLong });

  checks.push({
    id: "staff",
    level: business.staff.length > 0 ? "pass" : "fail",
    count: business.staff.length,
  });

  const description = business.description.trim().length;
  checks.push({
    id: "description",
    level: description >= 20 ? "pass" : "warn",
    length: description,
  });

  if (business.email) {
    checks.push({
      id: "email",
      level: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(business.email) ? "pass" : "warn",
      email: business.email,
    });
  }

  if (business.status === "pending") {
    const hours = Math.floor((Date.now() - business.createdAt.getTime()) / 3_600_000);
    checks.push({ id: "waiting", level: hours > OVERDUE_HOURS ? "warn" : "pass", hours });
  }

  const points = checks.reduce(
    (sum, check) => sum + (check.level === "pass" ? 1 : check.level === "warn" ? 0.5 : 0),
    0,
  );
  return {
    checks,
    score: Math.round((points / checks.length) * 100),
    verdict: checks.some((check) => check.level === "fail")
      ? "fix"
      : checks.some((check) => check.level === "warn")
        ? "look"
        : "ready",
  };
}
