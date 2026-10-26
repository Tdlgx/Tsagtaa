"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizePhone } from "@/features/booking/booking";
import {
  hasRecentRequest,
  issueCode,
  redeemCode,
  type IssueResult,
} from "@/features/auth/email-codes";
import { EMAIL_MAX, normalizeEmail, parseLoginId } from "@/features/auth/identifier";
import { getI18n } from "@/i18n/server";
import {
  burnPasswordCheck,
  hashPassword,
  isAcceptablePassword,
  verifyPassword,
} from "@/lib/auth/password";
import { endSession, getCurrentAccount, homeFor, safeNext, startSession } from "@/lib/auth/session";
import { isPgError, PG, sql } from "@/lib/db";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

/** Дахиад нэг буруу нууц үг; дараалсан тав дахь нь бүртгэлийг хэсэг хугацаанд түгжинэ. */
async function countWrongPassword(accountId: string): Promise<void> {
  await sql`
    UPDATE accounts SET
      failed_logins = failed_logins + 1,
      locked_until = CASE WHEN failed_logins + 1 >= ${MAX_FAILURES}
        THEN now() + ${`${LOCK_MINUTES} minutes`}::interval ELSE locked_until END
    WHERE id = ${accountId}
  `;
}

/** Бичсэн зургаан цифр, хамт ирсэн хоосон зай, зураасыг үл харгалзан. */
const readCode = (form: FormData): string =>
  String(form.get("code") ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);

const CODE_PATTERN = /^\d{6}$/;

/** Код илгээх үед алдаа гарсан: нийтлэг алдааны нэрсийн аль нь шалтгааныг хэлэх вэ. */
const issueError = (result: Exclude<IssueResult, { ok: true }>): "tooSoon" | "tooMany" | "mail" =>
  result.reason === "too_soon" ? "tooSoon" : result.reason === "too_many" ? "tooMany" : "mail";

/* Нэвтрэх -------------------------------------------------------------------------- */

export type LoginState = {
  error: "invalid" | "wrong" | "locked" | "code" | "tooSoon" | "tooMany" | "mail" | "server" | null;
  /** Бичсэн утга, ингэснээр амжилтгүй оролдлого талбарыг хоослохгүй. */
  login: string;
  /** Нэвтрэх код илгээсэн хаяг: маягт дараа нь тэр кодыг асууна. */
  codeFor: string | null;
};

type SignedIn = { home: string };

/**
 * Нэг маягт, нэвтрэх хоёр зам. Утас нууц үгээрээ нэвтэрнэ; имэйлд оронд нь нэг удаагийн
 * код ирнэ (нууц үг хэрэггүй). Аль ч зам бүртгэл байгаа эсэхийг хэлэхгүй: бүртгэлгүй
 * утас буруу нууц үгтэй адил хариуг ижил хугацаанд өгч, бүртгэлгүй имэйл ч бүртгэлтэй
 * имэйлтэй адил "кодоо оруулна уу" алхам руу шилжинэ.
 */
export async function loginAction(previous: LoginState, form: FormData): Promise<LoginState> {
  const intent = String(form.get("intent") ?? "");
  const typed = String(form.get("login") ?? "").slice(0, EMAIL_MAX);
  const codeFor = normalizeEmail(String(form.get("codeFor") ?? ""));

  if (intent === "back") return { error: null, login: previous.login, codeFor: null };

  let outcome: LoginState | SignedIn;
  try {
    if (codeFor && intent === "verify")
      outcome = await signInWithCode(codeFor, readCode(form), typed);
    else if (codeFor && intent === "resend") outcome = await sendLoginCode(codeFor, typed);
    else {
      const id = parseLoginId(typed);
      const password = String(form.get("password") ?? "").slice(0, 200);
      if (!id) return { error: "invalid", login: typed, codeFor: null };
      if (id.kind === "email") outcome = await sendLoginCode(id.email, typed);
      else if (!password) return { error: "invalid", login: typed, codeFor: null };
      else outcome = await signInWithPassword(id.phone, password, typed);
    }
  } catch (error) {
    console.error("loginAction failed", error);
    return { error: "server", login: typed, codeFor };
  }

  // Try-ийн гадна: redirect() нь алдаа шидэх замаар ажилладаг.
  if ("home" in outcome) redirect(safeNext(form.get("next"), outcome.home));
  return outcome;
}

type SignInRow = { id: string; isPlatformAdmin: boolean; memberships: number };

const SIGN_IN_COLUMNS = sql`
  a.id, a.is_platform_admin AS "isPlatformAdmin",
  (SELECT count(*) FROM memberships m WHERE m.account_id = a.id)::int AS memberships
`;

/** 5 удаа буруу нууц үг оруулбал бүртгэл 15 минут түгжигдэнэ. */
async function signInWithPassword(
  phone: string,
  password: string,
  typed: string,
): Promise<LoginState | SignedIn> {
  const [account] = await sql<(SignInRow & { passwordHash: string; lockedUntil: Date | null })[]>`
    SELECT ${SIGN_IN_COLUMNS}, a.password_hash AS "passwordHash", a.locked_until AS "lockedUntil"
    FROM accounts a WHERE a.phone = ${phone}
  `;
  if (!account) {
    await burnPasswordCheck(password);
    return { error: "wrong", login: typed, codeFor: null };
  }
  if (account.lockedUntil && account.lockedUntil > new Date()) {
    return { error: "locked", login: typed, codeFor: null };
  }
  if (!(await verifyPassword(password, account.passwordHash))) {
    await countWrongPassword(account.id);
    return { error: "wrong", login: typed, codeFor: null };
  }
  await sql`UPDATE accounts SET failed_logins = 0, locked_until = NULL WHERE id = ${account.id}`;
  await startSession(account.id);
  return { home: homeFor(account) };
}

/** Бүртгэлгүй хаяг руу юу ч илгээхгүй, гэхдээ гаднаас ижилхэн харагдана. */
async function sendLoginCode(email: string, typed: string): Promise<LoginState> {
  const asked = { login: typed, codeFor: email };
  const [account] = await sql`SELECT 1 FROM accounts WHERE email = ${email}`;
  if (!account) return { error: null, ...asked };
  const result = await issueCode(email, "login", null, (await getI18n()).t);
  if (result.ok) return { error: null, ...asked };
  // Хэтэрхий эрт: саяхан илгээсэн код ажилласаар байгаа тул түүнийг асуусаар байна.
  if (result.reason === "too_soon") return { error: "tooSoon", ...asked };
  return { error: issueError(result), login: typed, codeFor: null };
}

async function signInWithCode(
  email: string,
  code: string,
  typed: string,
): Promise<LoginState | SignedIn> {
  const asked = { login: typed, codeFor: email };
  // Буруу болон хугацаа дууссан кодод нэг хариу: бүртгэлгүй хаягт код огт байхгүй,
  // түүнд "хугацаа дууссан" гэвэл бүртгэлгүй гэдгийг илчилнэ.
  if (!CODE_PATTERN.test(code)) return { error: "code", ...asked };
  const result = await redeemCode(email, "login", code);
  if (!result.ok) return { error: "code", ...asked };

  const [account] = await sql<SignInRow[]>`
    SELECT ${SIGN_IN_COLUMNS} FROM accounts a WHERE a.email = ${email}
  `;
  // Код илгээгдсэний дараа хаягийг бүртгэлээс хассан.
  if (!account) return { error: "code", ...asked };
  await startSession(account.id);
  return { home: homeFor(account) };
}

/* Бүртгүүлэх -------------------------------------------------------------------------- */

export type SignupState = {
  error:
    | "name"
    | "phone"
    | "email"
    | "password"
    | "confirm"
    | "consent"
    | "taken"
    | "emailTaken"
    | "server"
    | null;
  name: string;
  phone: string;
  email: string;
};

/**
 * Үйлчлүүлэгчийн бүртгэл: оноо цуглуулах утас + нууц үг, мөн нэвтрэх сонголттой
 * имэйл. Имэйл руу илгээсэн кодыг оруулсны дараа л холбогдоно (профайл хуудсанд,
 * энэ action тэнд илгээнэ). Утсыг SMS-ээр хараахан баталгаажуулдаггүй тул оноо зөвхөн
 * нэвтэрсэн үедээ хийсэн захиалгаас ирнэ (тэр дугаараар өөр хүний хийсэн захиалгаас хэзээ ч биш).
 */
export async function signupAction(_previous: SignupState, form: FormData): Promise<SignupState> {
  const name = String(form.get("name") ?? "")
    .trim()
    .slice(0, 80);
  const typedPhone = String(form.get("phone") ?? "").slice(0, 20);
  const typedEmail = String(form.get("email") ?? "").slice(0, EMAIL_MAX);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const confirm = String(form.get("confirm") ?? "").slice(0, 200);
  const keep = { name, phone: typedPhone, email: typedEmail };
  const phone = normalizePhone(typedPhone);
  const email = typedEmail.trim() ? normalizeEmail(typedEmail) : null;

  if (name.length < 2) return { error: "name", ...keep };
  if (!phone) return { error: "phone", ...keep };
  if (typedEmail.trim() && !email) return { error: "email", ...keep };
  if (!isAcceptablePassword(password)) return { error: "password", ...keep };
  if (password !== confirm) return { error: "confirm", ...keep };
  // Хувийн мэдээлэл хадгалахаас өмнө зөвшөөрөл (Хувь хүний мэдээлэл хамгаалах тухай хууль).
  if (form.get("consent") !== "on") return { error: "consent", ...keep };

  try {
    if (email) {
      const [owner] = await sql`SELECT 1 FROM accounts WHERE email = ${email}`;
      if (owner) return { error: "emailTaken", ...keep };
    }
    // Нэг утсаар зэрэг хоёр бүртгүүлэх оролдлого: UNIQUE index нэгийг нь л оруулна.
    const [account] = await sql<{ id: string }[]>`
      INSERT INTO accounts (phone, name, password_hash)
      VALUES (${phone}, ${name}, ${await hashPassword(password)})
      ON CONFLICT (phone) DO NOTHING
      RETURNING id
    `;
    if (!account) return { error: "taken", ...keep };
    await startSession(account.id);
    // Илгээж чадаагүй бол профайл хуудас дахин илгээхийг санал болгоно.
    if (email) await issueCode(email, "set_email", account.id, (await getI18n()).t);
  } catch (error) {
    console.error("signupAction failed", error);
    return { error: "server", ...keep };
  }

  redirect(safeNext(form.get("next"), "/profile"));
}

/* Профайл дээрх нэвтрэх имэйл ------------------------------------------------------ */

export type EmailState = {
  error:
    | "email"
    | "password"
    | "locked"
    | "same"
    | "taken"
    | "code"
    | "codeExpired"
    | "tooSoon"
    | "tooMany"
    | "mail"
    | "server"
    | null;
  /** Хадгалагдсаны дараа бөглөгдөнө. */
  done: "added" | "changed" | "removed" | null;
  /** Имэйлийн талбарт бичсэн утга. */
  email: string;
  /** Код илгээсэн хаяг: маягт дараа нь түүнийг асууна. */
  codeFor: string | null;
};

/**
 * Нэвтэрсэн бүртгэлийн нэвтрэх имэйлийг нэмэх, солих эсвэл (хоосон үлдээвэл) хасна.
 * Энэ нь бүртгэлд хэрхэн нэвтрэхийг өөрчилдөг тул эхлээд одоогийн нууц үг шаардана
 * (нэвтэрсэн хэвээр үлдсэн browser хангалтгүй; буруу оролдлого нэвтрэх түгжээнд
 * тоологдоно). Дараа нь шинэ хаяг руу илгээсэн кодыг буцааж оруулсны дараа л
 * холбогдоно, энэ нь хаяг тэр хүнийх гэдгийг батална.
 */
export async function setEmailAction(previous: EmailState, form: FormData): Promise<EmailState> {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=/profile");

  const intent = String(form.get("intent") ?? "");
  const typed = String(form.get("email") ?? "").slice(0, EMAIL_MAX);
  const codeFor = normalizeEmail(String(form.get("codeFor") ?? ""));
  const asked = { done: null, email: previous.email, codeFor };

  try {
    if (intent === "back") {
      await sql`
        UPDATE email_codes SET used_at = now()
        WHERE account_id = ${account.id} AND purpose = 'set_email' AND used_at IS NULL
      `;
      revalidatePath("/profile");
      return { error: null, done: null, email: previous.email, codeFor: null };
    }

    if (codeFor && intent === "resend") {
      if (!(await hasRecentRequest(account.id, codeFor))) {
        return { error: "codeExpired", ...asked };
      }
      const result = await issueCode(codeFor, "set_email", account.id, (await getI18n()).t);
      return { error: result.ok ? null : issueError(result), ...asked };
    }

    if (codeFor && intent === "verify") {
      const code = readCode(form);
      if (!CODE_PATTERN.test(code)) return { error: "code", ...asked };
      const result = await redeemCode(codeFor, "set_email", code, account.id);
      if (!result.ok) {
        return { error: result.reason === "wrong" ? "code" : "codeExpired", ...asked };
      }
      await sql`UPDATE accounts SET email = ${codeFor} WHERE id = ${account.id}`;
      revalidatePath("/profile");
      return {
        error: null,
        done: account.email ? "changed" : "added",
        email: codeFor,
        codeFor: null,
      };
    }

    // Эхний алхам: хаяг (эсвэл хасах бол хоосон) болон нууц үг.
    const keep = { done: null, email: typed, codeFor: null };
    const email = typed.trim() ? normalizeEmail(typed) : null;
    if (typed.trim() && !email) return { error: "email", ...keep };
    if (email && email === account.email) return { error: "same", ...keep };

    const [row] = await sql<{ passwordHash: string; lockedUntil: Date | null }[]>`
      SELECT password_hash AS "passwordHash", locked_until AS "lockedUntil"
      FROM accounts WHERE id = ${account.id}
    `;
    if (!row) return { error: "server", ...keep };
    if (row.lockedUntil && row.lockedUntil > new Date()) return { error: "locked", ...keep };
    const password = String(form.get("password") ?? "").slice(0, 200);
    if (!(await verifyPassword(password, row.passwordHash))) {
      await countWrongPassword(account.id);
      return { error: "password", ...keep };
    }
    await sql`UPDATE accounts SET failed_logins = 0, locked_until = NULL WHERE id = ${account.id}`;

    if (!email) {
      await sql`UPDATE accounts SET email = NULL WHERE id = ${account.id}`;
      revalidatePath("/profile");
      return { error: null, done: "removed", email: "", codeFor: null };
    }
    const [owner] = await sql`SELECT 1 FROM accounts WHERE email = ${email}`;
    if (owner) return { error: "taken", ...keep };
    const result = await issueCode(email, "set_email", account.id, (await getI18n()).t);
    if (!result.ok && result.reason !== "too_soon") return { error: issueError(result), ...keep };
    return { error: result.ok ? null : "tooSoon", done: null, email: typed, codeFor: email };
  } catch (error) {
    // Өөр бүртгэл ижил хаягийг түрүүлж баталгаажуулсан.
    if (isPgError(error, PG.uniqueViolation, "accounts_email_key")) {
      return { error: "taken", ...asked };
    }
    console.error("setEmailAction failed", error);
    return { error: "server", ...asked };
  }
}

export async function logoutAction(form?: FormData): Promise<void> {
  await endSession();
  redirect(safeNext(form?.get("next"), "/login"));
}
