// Applies db/migrations/*.sql in name order, each once, each in its own
// transaction (a failing file leaves nothing half-applied).
//   npm run db:migrate
import { readdir, readFile } from "node:fs/promises";

import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
// `?schema=public` is a Prisma-style option; PostgreSQL itself rejects it.
url.searchParams.delete("schema");
// Neon adds this; the driver does not support it (see src/lib/db.ts).
url.searchParams.delete("channel_binding");
// One address instead of ::1 + 127.0.0.1 (see src/lib/db.ts).
if (url.hostname === "localhost") url.hostname = "127.0.0.1";
const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
const dir = new URL("../db/migrations/", import.meta.url);

try {
  // One runner at a time, even if two deploys start together.
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
