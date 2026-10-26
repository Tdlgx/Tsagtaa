import { z } from "zod";

/**
 * Аппын уншдаг бүх environment хувьсагчийн Zod schema.
 *
 * Энэ модуль утга агуулдаггүй, зөвхөн дүрэм тул хаанаас ч import хийхэд аюулгүй:
 * `next.config.ts` (эхлэх үеийн шалгалт), `env.ts` (сервер) болон
 * `public-env.ts` (browser)-ээс.
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

/** .env-д хоосон үлдээсэн `KEY=` нь "тохируулаагүй" гэсэн үг, ингэснээр сонголттой утга сонголттой хэвээр. */
const emptyAsUnset = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** Browser руу очиж болох хувьсагчид (NEXT_PUBLIC_-ээр эхлэх ёстой). */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: requiredString("Жишээ: http://localhost:3000").pipe(
    z.url({
      protocol: /^https?$/,
      error: "http:// эсвэл https://-ээр эхэлсэн зөв URL байх ёстой. Жишээ: http://localhost:3000",
    }),
  ),
  NEXT_PUBLIC_APP_NAME: requiredString("Жишээ: Цагтаа"),
});

/** Серверээс хэзээ ч гарч болохгүй хувьсагчид (нууц мэдээлэл, холболтын string). */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: requiredString(EXAMPLE_HINT).pipe(
    z.url({
      protocol: /^postgres(ql)?$/,
      error: "postgresql://-ээр эхэлсэн PostgreSQL холболтын URL байх ёстой.",
    }),
  ),
  // Имэйлээр нэвтрэх код: SMTP-ээр (App Password-той Gmail бүртгэлд домэйн хэрэггүй)
  // эсвэл Resend-ээр (өөрийн домэйн шаардана). Аль нь ч байхгүй бол хөгжүүлэлтэд
  // кодыг terminal-д хэвлэж, production дээр имэйл ашиглах боломжгүй гэж хэлнэ.
  SMTP_USER: z.preprocess(emptyAsUnset, z.string().trim().optional()),
  SMTP_PASSWORD: z.preprocess(emptyAsUnset, z.string().optional()),
  SMTP_HOST: z.preprocess(emptyAsUnset, z.string().trim().default("smtp.gmail.com")),
  SMTP_PORT: z.preprocess(emptyAsUnset, z.coerce.number().int().default(465)),
  RESEND_API_KEY: z.preprocess(
    emptyAsUnset,
    z.string().trim().startsWith("re_", "re_-ээр эхэлсэн Resend API key байх ёстой.").optional(),
  ),
  // Inbox-д харагдах илгээгч. Анхдагчаар SMTP бүртгэл, эсвэл Resend-ийн туршилтын илгээгч.
  EMAIL_FROM: z.preprocess(emptyAsUnset, z.string().trim().min(3).optional()),
});

/** Сервер дээр болон эхлэх үед ашиглагдах бүрэн schema. */
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
 * `source`-ийг `schema`-тай тулгаж, төрөлтэй, parse хийсэн утгуудыг буцаана.
 * Буруу бүх хувьсагчийг нэг дор жагсаасан нэг уншигдахуйц алдаа шиднэ.
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
