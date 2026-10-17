import type { Metadata } from "next";
import type { JSX } from "react";

import type { ProfileAccount } from "@/app/(public)/profile/_components/points-card";
import { ProfileView } from "@/app/(public)/profile/_components/profile-view";
import { Container } from "@/components/layout/container";
import { getPointsSummary } from "@/features/points/points-db";
import { getI18n } from "@/i18n/server";
import { getCurrentAccount } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.profile.metaTitle, description: t.profile.metaDescription };
}

/** Signed in, the points account comes from the server; everything else lives in this browser. */
async function loadAccount(): Promise<ProfileAccount | null> {
  const account = await getCurrentAccount();
  if (!account) return null;
  try {
    return {
      name: account.name,
      phone: account.phone,
      points: await getPointsSummary(account.id),
    };
  } catch (error) {
    console.error("Could not load points", error);
    return { name: account.name, phone: account.phone, points: null };
  }
}

export default async function ProfilePage(): Promise<JSX.Element> {
  const account = await loadAccount();
  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <ProfileView account={account} />
    </Container>
  );
}
