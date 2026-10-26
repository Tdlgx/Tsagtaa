import "server-only";

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/** Scrypt-ийн өртөг: laptop дээр нэг шалгалтад ~50 ms, brute-force хийхэд хэт удаан. */
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // NFKC: өөр өөр гар дээр бичсэн ижил нууц үг ижилхэн hash болно.
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** "scrypt$N$r$p$salt$hash" (base64). Формат нь scripts/create-admin.mjs-тэй ижил. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * Нууц үгийг хадгалсан scrypt hash-тай тулгана. Hash-д хадгалсан параметрүүдээр
 * дахин тооцоолж, timing-safe харьцуулалт хийнэ.
 */
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

/** Утас бүртгэлгүй үед шалгадаг хоосон зүйлийн жинхэнэ hash, ингэснээр хугацаагаар аль утас бүртгэлтэйг мэдэхгүй. */
let decoy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  decoy ??= hashPassword(randomBytes(12).toString("base64"));
  await verifyPassword(password, await decoy);
}

/** Хамгийн багадаа 8 тэмдэгт, зөвхөн цифр биш (утасны дугаар нууц үг биш). */
export function isAcceptablePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 200 && !/^\d+$/.test(password);
}
