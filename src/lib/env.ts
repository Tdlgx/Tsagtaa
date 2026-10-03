import "server-only";

import { envSchema, parseEnv, type Env } from "@/lib/env-schema";

/**
 * Validated environment variables for server code only
 * (Server Components, Route Handlers, Server Actions).
 *
 * The `server-only` import above turns any attempt to import this file from a
 * Client Component into a build error, so secrets like DATABASE_URL can never
 * end up in the browser bundle. In client code use `publicEnv` instead.
 */
export const env: Env = parseEnv(envSchema, process.env);
