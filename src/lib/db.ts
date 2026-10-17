import "server-only";

import postgres from "postgres";

import { env } from "@/lib/env";

function connect(): postgres.Sql {
  const url = new URL(env.DATABASE_URL);
  // `?schema=public` is a Prisma-style option; PostgreSQL itself rejects it.
  url.searchParams.delete("schema");
  return postgres(url.toString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
    onnotice: () => {},
  });
}

// One pool per server process. In development, hot reload re-runs this
// module, so the pool is kept on globalThis instead of opening a new one.
const globalForDb = globalThis as typeof globalThis & { tsagtaaSql?: postgres.Sql };

export const sql = globalForDb.tsagtaaSql ?? connect();
if (env.NODE_ENV !== "production") globalForDb.tsagtaaSql = sql;

/** PostgreSQL error codes this app reacts to. */
export const PG = {
  uniqueViolation: "23505",
  checkViolation: "23514",
  exclusionViolation: "23P01",
  deadlockDetected: "40P01",
  serializationFailure: "40001",
} as const;

/**
 * Checks the error's fields rather than `instanceof PostgresError`: server
 * pages and Server Actions can load separate copies of the driver, while the
 * pool (kept on globalThis in development) is shared, so the class an error
 * was made with need not be the one imported here.
 */
export function isPgError(
  error: unknown,
  code: string,
  constraint?: string,
): error is postgres.PostgresError {
  if (typeof error !== "object" || error === null) return false;
  const fields = error as { code?: unknown; constraint_name?: unknown };
  return (
    fields.code === code && (constraint === undefined || fields.constraint_name === constraint)
  );
}
