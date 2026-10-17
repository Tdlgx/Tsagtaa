import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { settleEarnedPoints } from "@/features/points/points-db";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Data access layer for sign-in. Every page and Server Action that shows or
 * changes management data calls one of the `require…` functions below, so
 * the check sits next to the data rather than only in the UI.
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
  isPlatformAdmin: boolean;
  /** Loyalty points (1 point = 1 ₮ off a booking). */
  pointsBalance: number;
  memberships: Membership[];
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Signs this browser in: a random token in an httpOnly cookie, its hash in the database. */
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

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  store.delete(COOKIE);
}

/** The signed-in account, or null. Memoized per request, so many callers cost one query. */
export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  try {
    const [account] = await sql<Omit<Account, "memberships">[]>`
      SELECT a.id, a.name, a.phone, a.is_platform_admin AS "isPlatformAdmin",
        a.points_balance AS "pointsBalance"
      FROM sessions s JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    `;
    if (!account) return null;
    // Credit visits that are due before anything shows a balance, so the
    // header and the page agree. A failure here only delays the points.
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
  } catch (error) {
    // No database: treat as signed out rather than breaking every page.
    console.error("Could not read the session", error);
    return null;
  }
});

/** Only a same-site path, so `?next=` cannot send people to another site. */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : fallback;
}

/**
 * Where someone lands after signing in: the people who run a place go to
 * its dashboard, the Цагтаа team to admin, customers to their profile.
 */
export function homeFor(account: { memberships: number; isPlatformAdmin: boolean }): string {
  if (account.memberships > 0) return "/dashboard";
  return account.isPlatformAdmin ? "/admin" : "/profile";
}

/** Signed in, or off to the sign-in page (and back here afterwards). */
export async function requireAccount(returnTo: string): Promise<Account> {
  const account = await getCurrentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return account;
}

/** The Цагтаа team only. Anyone else gets "not found", which does not reveal the page exists. */
export async function requirePlatformAdmin(returnTo = "/admin"): Promise<Account> {
  const account = await requireAccount(returnTo);
  if (!account.isPlatformAdmin) notFound();
  return account;
}

/** The owner or a manager of this place (the Цагтаа team may look too). */
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
