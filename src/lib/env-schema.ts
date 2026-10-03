import { z } from "zod";

/**
 * Zod schemas for every environment variable the app reads.
 *
 * This module holds no values, only rules, so it is safe to import anywhere:
 * from `next.config.ts` (startup validation), from `env.ts` (server) and
 * from `public-env.ts` (browser).
 */

const EXAMPLE_HINT = "`.env.example` файлыг харна уу.";

function requiredString(hint: string): z.ZodString {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined ? `Утга оруулаагүй байна. ${hint}` : "Текст утга байх ёстой.",
    })
    .trim()
    .min(1, `Хоосон байна. ${hint}`);
}

/** Variables that are allowed to reach the browser (must start with NEXT_PUBLIC_). */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: requiredString("Жишээ: http://localhost:3000").pipe(
    z.url({
      protocol: /^https?$/,
      error: "http:// эсвэл https://-ээр эхэлсэн зөв URL байх ёстой. Жишээ: http://localhost:3000",
    }),
  ),
  NEXT_PUBLIC_APP_NAME: requiredString("Жишээ: ЦагАвъя"),
});

/** Variables that must never leave the server (secrets, connection strings). */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: requiredString(EXAMPLE_HINT).pipe(
    z.url({
      protocol: /^postgres(ql)?$/,
      error: "postgresql://-ээр эхэлсэн PostgreSQL холболтын URL байх ёстой.",
    }),
  ),
});

/** Full schema used on the server and at startup. */
export const envSchema = serverEnvSchema.extend(publicEnvSchema.shape);

export type PublicEnv = z.output<typeof publicEnvSchema>;
export type Env = z.output<typeof envSchema>;

type EnvSource = Record<string, string | undefined>;

function formatEnvError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const name = issue.path.join(".") || "(root)";
    return `  • ${name}: ${issue.message}`;
  });

  return [
    "",
    "❌ Environment variable буруу эсвэл дутуу байна:",
    ...lines,
    "",
    "Засах: төслийн үндсэн хавтсанд .env файл байгаа эсэхийг шалгаад,",
    "дутуу утгуудыг .env.example-ийн дагуу бөглөнө үү.",
    "  PowerShell: Copy-Item .env.example .env",
    "",
  ].join("\n");
}

/**
 * Validates `source` against `schema` and returns typed, parsed values.
 * Throws one readable error listing every invalid variable at once.
 */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  source: EnvSource,
): z.output<TSchema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}
