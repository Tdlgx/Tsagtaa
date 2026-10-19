import "server-only";

import postgres from "postgres";

import { env } from "@/lib/env";

function connect(): postgres.Sql {
  const url = new URL(env.DATABASE_URL);
  // Options PostgreSQL itself rejects: `?schema=public` is Prisma-style, and
  // Neon adds `channel_binding=require`, which this driver does not support
  // and would send to the server as an unknown setting. TLS still comes from `sslmode`.
  url.searchParams.delete("schema");
  url.searchParams.delete("channel_binding");
  // "localhost" makes Node try ::1 and 127.0.0.1 in turn; when that attempt
  // is cut short (connect timeout, database down) Node can throw an
  // uncatchable "object null is not iterable" from its AggregateError.
  // One address, one attempt: the local Docker database listens on IPv4.
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
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

/**
 * Gives up on a read after `ms`. For reads a page can do without (it then
 * shows the plain schedule, or treats the visitor as signed out): when the
 * database host accepts the connection but never answers (a stopped Docker
 * container, a network hiccup), the driver would otherwise wait forever and
 * the page with it. The connect timeout only covers opening the socket.
 */
export function withDeadline<T>(work: PromiseLike<T>, ms = 4000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Database did not answer within ${ms} ms`)), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}
