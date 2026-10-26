import "server-only";

import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

import type { Dictionary } from "@/i18n/dictionaries";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/*
 * Имэйлээр илгээх 6 оронтой кодууд. Код CODE_MINUTES минут, нэг л удаа хүчинтэй;
 * 5 буруу оролдлогоор хүчингүй болох ба нэг хаягийн хамгийн сүүлийн код л тооцогдоно.
 * Нэг хаяг руу минутад 1, цагт 5-аас олон код явуулахгүй. Ингэснээр маягтаар
 * хэн нэгний inbox-ийг дүүргэх (эсвэл илгээх квотыг дуусгах) боломжгүй.
 */

export const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_PER_HOUR = 5;

export type CodePurpose = "login" | "set_email";

const hashCode = (id: string, code: string): string =>
  createHash("sha256").update(`${id}:${code}`).digest("hex");

export type IssueResult = { ok: true } | { ok: false; reason: "too_soon" | "too_many" | "mail" };

/**
 * `email` хаягт шинэ код үүсгэж илгээнэ. `accountId` нь хаягийг холбох гэж буй
 * бүртгэл ("set_email"); нэвтрэх кодод энэ байхгүй.
 */
export async function issueCode(
  email: string,
  purpose: CodePurpose,
  accountId: string | null,
  t: Dictionary,
): Promise<IssueResult> {
  const [recent] = await sql<{ lastAt: Date | null; count: number }[]>`
    SELECT max(created_at) AS "lastAt", count(*)::int AS count FROM email_codes
    WHERE email = ${email} AND purpose = ${purpose} AND created_at > now() - interval '1 hour'
  `;
  if ((recent?.count ?? 0) >= MAX_PER_HOUR) return { ok: false, reason: "too_many" };
  if (recent?.lastAt && recent.lastAt.getTime() > Date.now() - RESEND_SECONDS * 1000) {
    return { ok: false, reason: "too_soon" };
  }

  const id = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql.begin(async (tx) => {
    // Шинэ код нь яг энэ хүсэлтээр өмнө илгээсэн кодуудыг хүчингүй болгоно.
    await tx`
      UPDATE email_codes SET used_at = now()
      WHERE email = ${email} AND purpose = ${purpose} AND used_at IS NULL
        AND account_id IS NOT DISTINCT FROM ${accountId}
    `;
    await tx`
      INSERT INTO email_codes (id, email, purpose, account_id, code_hash, expires_at)
      VALUES (${id}, ${email}, ${purpose}, ${accountId}, ${hashCode(id, code)},
        now() + ${`${CODE_MINUTES} minutes`}::interval)
    `;
  });

  const words = t.emailCode;
  const lead = purpose === "login" ? words.loginLead : words.setEmailLead;
  const sent = await sendEmail({
    to: email,
    subject: words.subject(code),
    text: `${lead}\n\n${code}\n\n${words.expires(CODE_MINUTES)}\n${words.ignore}`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;color:#16181d">
<p>${lead}</p>
<p style="font-size:32px;font-weight:600;letter-spacing:8px;margin:24px 0">${code}</p>
<p style="color:#5b616e">${words.expires(CODE_MINUTES)}<br>${words.ignore}</p>
</div>`,
  });
  return sent ? { ok: true } : { ok: false, reason: "mail" };
}

export type RedeemResult = { ok: true } | { ok: false; reason: "wrong" | "expired" };

/**
 * Оруулсан кодыг `email`-ийн хамгийн сүүлийн хүчинтэй кодтой ("set_email" бол
 * хүссэн бүртгэлтэй нь ч) тулгаж, таарвал ашигласан гэж тэмдэглэнэ.
 * Буруу оролдлого бүр тоологдох ба тав дахь нь кодыг хүчингүй болгоно.
 */
export async function redeemCode(
  email: string,
  purpose: CodePurpose,
  code: string,
  accountId: string | null = null,
): Promise<RedeemResult> {
  return sql.begin(async (tx): Promise<RedeemResult> => {
    const [row] = await tx<{ id: string; codeHash: string; attempts: number }[]>`
      SELECT id, code_hash AS "codeHash", attempts FROM email_codes
      WHERE email = ${email} AND purpose = ${purpose} AND used_at IS NULL
        AND expires_at > now()
        AND ${accountId ? tx`account_id = ${accountId}` : tx`account_id IS NULL`}
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `;
    if (!row || row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "expired" };

    const typed = Buffer.from(hashCode(row.id, code), "hex");
    if (!timingSafeEqual(typed, Buffer.from(row.codeHash, "hex"))) {
      await tx`UPDATE email_codes SET attempts = attempts + 1 WHERE id = ${row.id}`;
      return { ok: false, reason: row.attempts + 1 >= MAX_ATTEMPTS ? "expired" : "wrong" };
    }
    await tx`UPDATE email_codes SET used_at = now() WHERE id = ${row.id}`;
    return { ok: true };
  });
}

/** Бүртгэлд холбохоор хүссэн ч хараахан баталгаажуулаагүй хаяг (байвал). */
export async function pendingEmailFor(accountId: string): Promise<string | null> {
  const [row] = await sql<{ email: string }[]>`
    SELECT c.email FROM email_codes c JOIN accounts a ON a.id = c.account_id
    WHERE c.account_id = ${accountId} AND c.purpose = 'set_email' AND c.used_at IS NULL
      AND c.expires_at > now() AND c.email IS DISTINCT FROM a.email
    ORDER BY c.created_at DESC
    LIMIT 1
  `;
  return row?.email ?? null;
}

/** Энэ бүртгэл сүүлийн нэг цагт `email` руу код хүссэн үү? Тэгвэл дахин илгээх нь зөв. */
export async function hasRecentRequest(accountId: string, email: string): Promise<boolean> {
  const [row] = await sql`
    SELECT 1 FROM email_codes
    WHERE account_id = ${accountId} AND email = ${email} AND purpose = 'set_email'
      AND created_at > now() - interval '1 hour'
  `;
  return Boolean(row);
}
