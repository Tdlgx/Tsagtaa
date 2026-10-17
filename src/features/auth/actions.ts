"use server";

import { redirect } from "next/navigation";

import { normalizePhone } from "@/features/booking/booking";
import {
  burnPasswordCheck,
  hashPassword,
  isAcceptablePassword,
  verifyPassword,
} from "@/lib/auth/password";
import { endSession, homeFor, safeNext, startSession } from "@/lib/auth/session";
import { sql } from "@/lib/db";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

export type LoginState = {
  error: "invalid" | "wrong" | "locked" | "server" | null;
  /** What was typed, so a failed attempt does not clear the phone field. */
  phone: string;
};

/**
 * Phone + password sign-in. The answer for an unknown phone and a wrong
 * password is the same ("wrong"), and both take the same time, so the form
 * cannot be used to find out who has an account. Five wrong tries lock the
 * account for 15 minutes.
 */
export async function loginAction(_previous: LoginState, form: FormData): Promise<LoginState> {
  const typedPhone = String(form.get("phone") ?? "").slice(0, 20);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const phone = normalizePhone(typedPhone);
  if (!phone || !password) return { error: "invalid", phone: typedPhone };

  let home: string;
  try {
    const [account] = await sql<
      {
        id: string;
        passwordHash: string;
        lockedUntil: Date | null;
        isPlatformAdmin: boolean;
        memberships: number;
      }[]
    >`
      SELECT a.id, a.password_hash AS "passwordHash", a.locked_until AS "lockedUntil",
        a.is_platform_admin AS "isPlatformAdmin",
        (SELECT count(*) FROM memberships m WHERE m.account_id = a.id)::int AS memberships
      FROM accounts a WHERE a.phone = ${phone}
    `;
    if (!account) {
      await burnPasswordCheck(password);
      return { error: "wrong", phone: typedPhone };
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      return { error: "locked", phone: typedPhone };
    }
    if (!(await verifyPassword(password, account.passwordHash))) {
      await sql`
        UPDATE accounts SET
          failed_logins = failed_logins + 1,
          locked_until = CASE WHEN failed_logins + 1 >= ${MAX_FAILURES}
            THEN now() + ${`${LOCK_MINUTES} minutes`}::interval ELSE locked_until END
        WHERE id = ${account.id}
      `;
      return { error: "wrong", phone: typedPhone };
    }
    await sql`UPDATE accounts SET failed_logins = 0, locked_until = NULL WHERE id = ${account.id}`;
    await startSession(account.id);
    home = homeFor(account);
  } catch (error) {
    console.error("loginAction failed", error);
    return { error: "server", phone: typedPhone };
  }

  redirect(safeNext(form.get("next"), home));
}

export type SignupState = {
  error: "name" | "phone" | "password" | "confirm" | "consent" | "taken" | "server" | null;
  name: string;
  phone: string;
};

/**
 * A customer account: phone + password, to collect points. The phone is not
 * verified by SMS yet, which is why points only come from bookings made while
 * signed in (never from bookings someone else made with that number).
 */
export async function signupAction(_previous: SignupState, form: FormData): Promise<SignupState> {
  const name = String(form.get("name") ?? "")
    .trim()
    .slice(0, 80);
  const typedPhone = String(form.get("phone") ?? "").slice(0, 20);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const confirm = String(form.get("confirm") ?? "").slice(0, 200);
  const keep = { name, phone: typedPhone };
  const phone = normalizePhone(typedPhone);

  if (name.length < 2) return { error: "name", ...keep };
  if (!phone) return { error: "phone", ...keep };
  if (!isAcceptablePassword(password)) return { error: "password", ...keep };
  if (password !== confirm) return { error: "confirm", ...keep };
  // Consent before storing personal data (Law on Personal Data Protection).
  if (form.get("consent") !== "on") return { error: "consent", ...keep };

  try {
    // Two sign-ups for one phone at the same moment: the UNIQUE index lets one in.
    const [account] = await sql<{ id: string }[]>`
      INSERT INTO accounts (phone, name, password_hash)
      VALUES (${phone}, ${name}, ${await hashPassword(password)})
      ON CONFLICT (phone) DO NOTHING
      RETURNING id
    `;
    if (!account) return { error: "taken", ...keep };
    await startSession(account.id);
  } catch (error) {
    console.error("signupAction failed", error);
    return { error: "server", ...keep };
  }

  redirect(safeNext(form.get("next"), "/profile"));
}

export async function logoutAction(form?: FormData): Promise<void> {
  await endSession();
  redirect(safeNext(form?.get("next"), "/login"));
}
