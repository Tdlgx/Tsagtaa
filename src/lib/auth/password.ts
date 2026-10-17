import "server-only";

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/** scrypt cost: ~50 ms per check on a laptop, far too slow to brute-force. */
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // NFKC: the same password typed on different keyboards hashes the same.
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** "scrypt$N$r$p$salt$hash" (base64). The format is shared with scripts/create-admin.mjs. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await derive(password, Buffer.from(salt, "base64"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A real hash of nothing, checked when the phone is unknown, so timing does not reveal which phones have accounts. */
let decoy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  decoy ??= hashPassword(randomBytes(12).toString("base64"));
  await verifyPassword(password, await decoy);
}

/** At least 8 characters, and not only digits (a phone number is not a password). */
export function isAcceptablePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 200 && !/^\d+$/.test(password);
}
