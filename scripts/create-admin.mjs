// Creates (or promotes) a Цагтаа platform admin account.
//   ADMIN_PASSWORD='a long password' npm run admin:create -- 99112233 "Бат-Эрдэнэ"
// The password comes from the environment, never from the command line,
// so it does not end up in shell history.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import postgres from "postgres";

const [phone, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!/^[6-9]\d{7}$/.test(phone ?? "") || name.length < 2 || password.length < 8) {
  console.error(
    'Usage: ADMIN_PASSWORD="8+ characters" npm run admin:create -- <8-digit phone> "<name>"',
  );
  process.exit(1);
}

// Same format as src/lib/auth/password.ts: scrypt$N$r$p$salt$hash.
const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const hash = await promisify(scrypt)(password.normalize("NFKC"), salt, 64, { N, r, p });
const passwordHash = `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("schema");
const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });

try {
  const [row] = await sql`
    INSERT INTO accounts (phone, name, password_hash, is_platform_admin)
    VALUES (${phone}, ${name}, ${passwordHash}, true)
    ON CONFLICT (phone) DO UPDATE
      SET is_platform_admin = true, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
          failed_logins = 0, locked_until = NULL
    RETURNING (xmax = 0) AS created
  `;
  console.log(
    row.created ? `✓ Admin ${phone} created.` : `✓ ${phone} is now an admin (password reset).`,
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
