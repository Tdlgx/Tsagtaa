import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { JSX } from "react";

import { LoginForm } from "@/app/(auth)/login/_components/login-form";
import { Container } from "@/components/layout/container";
import { BrandMark } from "@/components/shared/brand-mark";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount, homeFor, safeNext } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.metaTitle, robots: { index: false } };
}

/** Бүх хүнд нэг нэвтрэх хуудас: үйлчлүүлэгч, газар эрхлэгч, Цагтаагийн баг. */
export default async function LoginPage(props: PageProps<"/login">): Promise<JSX.Element> {
  const { t } = await getI18n();
  const params = await props.searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNext(nextParam, "");
  const account = await getCurrentAccount();
  // Аль хэдийн нэвтэрсэн бол очих гэж байсан газар руу нь шууд явуулна.
  if (account) {
    redirect(
      safeNext(
        nextParam,
        homeFor({
          memberships: account.memberships.length,
          isPlatformAdmin: account.isPlatformAdmin,
        }),
      ),
    );
  }

  return (
    <Container className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <span className="flex size-14 items-center justify-center rounded-xl bg-brand-ink text-primary">
          <BrandMark className="size-7" />
        </span>
        <h1 className="mt-6 font-heading text-heading font-medium text-foreground">
          {t.auth.title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{t.auth.lead}</p>

        <LoginForm next={next} />

        <p className="mt-6 text-sm text-muted-foreground">{t.auth.forgot}</p>
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            {t.auth.noAccount}{" "}
            <Link
              href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
            >
              {t.auth.signup}
            </Link>
          </p>
          <p>
            {t.auth.ownBusiness}{" "}
            <Link
              href="/business/register"
              className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
            >
              {t.auth.register}
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
