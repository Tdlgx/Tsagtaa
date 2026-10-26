import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/lib/env";

export type Email = { to: string; subject: string; text: string; html: string };

/*
 * Тохиргооноос хамаарч хоёр аргаар илгээнэ:
 * - SMTP (SMTP_USER + SMTP_PASSWORD): App Password-той Gmail бүртгэл. Өөрийн домэйн
 *   хэрэггүй, өдөрт ~500 имэйл.
 * - Resend (RESEND_API_KEY): Resend-д баталгаажсан домэйн шаардана.
 * Аль нь ч байхгүй бол хөгжүүлэлтийн үед имэйлийг terminal-д хэвлэж нэвтрэхийг
 * туршиж болно, production дээр алдаа гэж мэдээлнэ.
 */

let smtp: Transporter | null = null;

/** Серверийн instance тус бүрт нэг холболтын тохиргоо, анх хэрэглэх үед үүснэ. */
function smtpTransport(): Transporter {
  smtp ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 порт эхнээсээ TLS-ээр ярьдаг; 587 нь STARTTLS-ээр шилждэг.
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
  });
  return smtp;
}

/** Нэг имэйл илгээнэ. Хүргэлтэд амжилттай шилжүүлсэн эсэхийг буцаана. */
export async function sendEmail(email: Email): Promise<boolean> {
  if (env.SMTP_USER) return sendBySmtp(email);
  if (env.RESEND_API_KEY) return sendByResend(email, env.RESEND_API_KEY);

  if (env.NODE_ENV === "production") {
    console.error("No email sender configured (SMTP_USER or RESEND_API_KEY): email not sent");
    return false;
  }
  // Warning түвшинд хэвлэнэ, ингэснээр dev terminal-д тод харагдана: үнэндээ юу ч илгээгээгүй.
  console.warn(`\n✉️  [dev, not sent] to ${email.to}: ${email.subject}\n${email.text}\n`);
  return true;
}

async function sendBySmtp(email: Email): Promise<boolean> {
  if (!env.SMTP_PASSWORD) {
    console.error("SMTP_USER is set but SMTP_PASSWORD is not: email not sent");
    return false;
  }
  try {
    await smtpTransport().sendMail({
      // "from" юу ч байсан Gmail нэвтэрсэн бүртгэлийнхээ нэрээр илгээдэг тул анхдагчаар түүнийг авна.
      from: env.EMAIL_FROM ?? `Цагтаа <${env.SMTP_USER}>`,
      ...email,
    });
    return true;
  } catch (error) {
    console.error("SMTP refused the email", error);
    return false;
  }
}

async function sendByResend(email: Email, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM ?? "Цагтаа <onboarding@resend.dev>", ...email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("Resend refused the email", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Could not reach Resend", error);
    return false;
  }
}
