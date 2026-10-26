import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { settleEarnedPoints } from "@/features/points/points-db";
import { sql, withDeadline } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Нэвтрэлтийн өгөгдлийн хандалтын давхарга. Удирдлагын өгөгдлийг харуулдаг эсвэл
 * өөрчилдөг хуудас, Server Action бүр доорх `require…` функцуудын аль нэгийг дууддаг
 * тул шалгалт зөвхөн UI-д биш, өгөгдлийн хажууд байрлана.
 */

const COOKIE = "tsagtaa_session";
const SESSION_DAYS = 30;

export type Role = "owner" | "manager";
export type BusinessStatus = "pending" | "active" | "rejected" | "suspended";

export type Membership = {
  businessId: string;
  slug: string;
  name: string;
  category: string;
  status: BusinessStatus;
  role: Role;
};

export type Account = {
  id: string;
  name: string;
  phone: string;
  /** Нэвтрэх хоёр дахь зам; хүн нэмэх хүртэл null. */
  email: string | null;
  isPlatformAdmin: boolean;
  /** Урамшууллын оноо (1 оноо = захиалгаас 1 ₮ хямдрал). */
  pointsBalance: number;
  memberships: Membership[];
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Энэ browser-ийг нэвтрүүлнэ: httpOnly cookie-д санамсаргүй token, DB-д түүний hash. */
export async function startSession(accountId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO sessions (token_hash, account_id, expires_at)
    VALUES (${hashToken(token)}, ${accountId}, ${expires})
  `;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Энэ browser-ийг гаргана: session-ыг DB-ээс устгаж, cookie-г арилгана. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  store.delete(COOKIE);
}

/** Нэвтэрсэн бүртгэл, эсвэл null. Хүсэлт бүрт memoize хийдэг тул олон дуудагч нэг query-ийн өртөгтэй. */
export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await withDeadline(readAccount(token));
  } catch (error) {
    // DB байхгүй: хуудас бүрийг эвдэх (эсвэл гацаах)-ын оронд нэвтрээгүй гэж үзнэ.
    console.error("Could not read the session", error);
    return null;
  }
});

/** Session token-ий ард байгаа бүртгэл, гишүүнчлэлүүдийн хамт. */
async function readAccount(token: string): Promise<Account | null> {
  const [account] = await sql<Omit<Account, "memberships">[]>`
    SELECT a.id, a.name, a.phone, a.email, a.is_platform_admin AS "isPlatformAdmin",
        a.points_balance AS "pointsBalance"
    FROM sessions s JOIN accounts a ON a.id = s.account_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `;
  if (!account) return null;
  // Аливаа зүйл үлдэгдэл харуулахаас өмнө хугацаа нь болсон айлчлалуудыг олгоно, ингэснээр
  // header ба хуудас таарна. Энд алдаа гарвал зөвхөн оноо хоцорно.
  try {
    account.pointsBalance += await settleEarnedPoints(account.id);
  } catch (error) {
    console.error("Could not settle points", error);
  }
  const memberships = await sql<Membership[]>`
    SELECT b.id AS "businessId", b.slug, b.name, b.category, b.status, m.role
    FROM memberships m JOIN businesses b ON b.id = m.business_id
    WHERE m.account_id = ${account.id}
    ORDER BY b.name
  `;
  return { ...account, memberships };
}

/** Зөвхөн ижил сайтын зам, ингэснээр `?next=` хүмүүсийг өөр сайт руу явуулж чадахгүй. */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : fallback;
}

/**
 * Нэвтэрсний дараа хүн хаашаа очих вэ: газар эрхэлдэг хүмүүс самбар руугаа,
 * Цагтаагийн баг админ руу, үйлчлүүлэгчид профайл руугаа.
 */
export function homeFor(account: { memberships: number; isPlatformAdmin: boolean }): string {
  if (account.memberships > 0) return "/dashboard";
  return account.isPlatformAdmin ? "/admin" : "/profile";
}

/** Нэвтэрсэн байх, эсвэл нэвтрэх хуудас руу (дараа нь энд буцна). */
export async function requireAccount(returnTo: string): Promise<Account> {
  const account = await getCurrentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return account;
}

/** Зөвхөн Цагтаагийн баг. Бусдад "олдсонгүй" гэж харагдах тул хуудас байгаа эсэхийг ч илчлэхгүй. */
export async function requirePlatformAdmin(returnTo = "/admin"): Promise<Account> {
  const account = await requireAccount(returnTo);
  if (!account.isPlatformAdmin) notFound();
  return account;
}

/** Энэ газрын эзэмшигч эсвэл менежер (Цагтаагийн баг ч харж болно). */
export async function requireBusinessAccess(
  slug: string,
  returnTo: string,
  roles: readonly Role[] = ["owner", "manager"],
): Promise<{ account: Account; membership: Membership | null }> {
  const account = await requireAccount(returnTo);
  const membership = account.memberships.find((item) => item.slug === slug) ?? null;
  if (membership && roles.includes(membership.role)) return { account, membership };
  if (account.isPlatformAdmin) return { account, membership: null };
  notFound();
}
