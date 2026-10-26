// db/migrations/*.sql файлуудыг нэрийн дарааллаар, тус бүрийг нэг удаа, өөрийн
// transaction дотор хэрэгжүүлнэ (алдаатай файл хагас хэрэгжсэн зүйл үлдээхгүй).
//   npm run db:migrate
import { readdir, readFile } from "node:fs/promises";

import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
// `?schema=public` бол Prisma-гийн сонголт; PostgreSQL өөрөө үүнийг хүлээн авахгүй.
url.searchParams.delete("schema");
// Neon үүнийг нэмдэг ч driver нь дэмждэггүй (src/lib/db.ts-ийг үз).
url.searchParams.delete("channel_binding");
// ::1 + 127.0.0.1 хоёрын оронд нэг хаяг (src/lib/db.ts-ийг үз).
if (url.hostname === "localhost") url.hostname = "127.0.0.1";
const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
const dir = new URL("../db/migrations/", import.meta.url);

try {
  // Хоёр deploy зэрэг эхэлсэн ч нэг удаад зөвхөн нэг migration ажиллана.
  await sql`SELECT pg_advisory_lock(hashtext('tsagtaa.migrate'))`;
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((row) => row.name));
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  const pending = files.filter((file) => !applied.has(file));

  for (const file of pending) {
    const body = await readFile(new URL(file, dir), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    console.log(`✓ ${file}`);
  }
  console.log(pending.length ? `Applied ${pending.length} migration(s).` : "Up to date.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
