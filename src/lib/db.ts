import "server-only";

import postgres from "postgres";

import { env } from "@/lib/env";

function connect(): postgres.Sql {
  const url = new URL(env.DATABASE_URL);
  // PostgreSQL өөрөө татгалздаг сонголтууд: `?schema=public` бол Prisma-гийн хэв маяг,
  // Neon нэмдэг `channel_binding=require`-ийг энэ driver дэмждэггүй бөгөөд серверт
  // үл мэдэгдэх тохиргоо болгож илгээнэ. TLS нь `sslmode`-оос ирсээр байна.
  url.searchParams.delete("schema");
  url.searchParams.delete("channel_binding");
  // "localhost" нь Node-ийг ::1 болон 127.0.0.1-ийг ээлжлэн оролдоход хүргэнэ; тэр
  // оролдлого тасарвал (холбогдох хугацаа дуусах, DB унтарсан) Node AggregateError-оос
  // барьж болохгүй "object null is not iterable" алдаа шидэж болно.
  // Нэг хаяг, нэг оролдлого: local Docker DB IPv4 дээр сонсдог.
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  return postgres(url.toString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
    onnotice: () => {},
  });
}

// Серверийн процесс бүрт нэг pool. Хөгжүүлэлтэд hot reload энэ модулийг дахин
// ажиллуулдаг тул шинийг нээхийн оронд pool-ыг globalThis дээр хадгална.
const globalForDb = globalThis as typeof globalThis & { tsagtaaSql?: postgres.Sql };

export const sql = globalForDb.tsagtaaSql ?? connect();
if (env.NODE_ENV !== "production") globalForDb.tsagtaaSql = sql;

/** Энэ аппын хариу үйлдэл үзүүлдэг PostgreSQL алдааны кодууд. */
export const PG = {
  uniqueViolation: "23505",
  checkViolation: "23514",
  exclusionViolation: "23P01",
  deadlockDetected: "40P01",
  serializationFailure: "40001",
} as const;

/**
 * `instanceof PostgresError`-ийн оронд алдааны талбаруудыг шалгана: серверийн хуудас
 * болон Server Action driver-ийн тусдаа хуулбарыг ачаалж болох ч pool (хөгжүүлэлтэд
 * globalThis дээр хадгалагддаг) хуваалцагддаг тул алдааг үүсгэсэн класс энд
 * импортолсонтой ижил байх албагүй.
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
 * `ms`-ийн дараа уншилтаас татгалзана. Хуудас түүнгүйгээр ч болох уншилтуудад
 * (тэр үед энгийн хуваарь харуулах, эсвэл зочныг нэвтрээгүй гэж үзнэ): DB-ийн
 * сервер холболтыг хүлээн авсан ч хэзээ ч хариулахгүй үед (зогссон Docker контейнер,
 * сүлжээний доголдол) driver үгүй бол үүрд хүлээж, хуудас ч түүнтэй хамт хүлээнэ.
 * Холбогдох хугацааны хязгаар зөвхөн socket нээхийг хамардаг.
 */
export function withDeadline<T>(work: PromiseLike<T>, ms = 4000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Database did not answer within ${ms} ms`)), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}
