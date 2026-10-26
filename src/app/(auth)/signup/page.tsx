import { Coins, Gift, Ticket, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { JSX } from "react";

import { SignupForm } from "@/app/(auth)/signup/_components/signup-form";
import { Container } from "@/components/layout/container";
import { getLoyaltySettings } from "@/features/points/points-db";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount, safeNext } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.signup.metaTitle };
}

/** Оноо цуглуулж, зарцуулах үйлчлүүлэгчийн бүртгэл. */
export default async function SignupPage(props: PageProps<"/signup">): Promise<JSX.Element> {
  const { t } = await getI18n();
  const params = await props.searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next, "");
  if (await getCurrentAccount()) redirect(next || "/profile");
  const settings = await getLoyaltySettings().catch(() => null);
  const words = t.signup;

  const perks: { icon: LucideIcon; text: string }[] = settings?.enabled
    ? [
        { icon: Coins, text: words.perkEarn(settings.earnPercent) },
        { icon: Ticket, text: words.perkSpend(settings.maxRedeemPercent) },
        { icon: Gift, text: words.perkValue },
      ]
    : [];

  return (
    <Container className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-heading font-medium text-foreground">{words.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{words.lead}</p>
        {perks.length > 0 ? (
          <ul className="mt-6 flex flex-col gap-2 rounded-xl bg-brand-ink p-4 text-sm text-brand-ink-foreground">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="size-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        ) : null}

        <SignupForm next={next} />

        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          {words.haveAccount}{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
          >
            {t.auth.submit}
          </Link>
        </p>
      </div>
    </Container>
  );
}
