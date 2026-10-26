import type { Metadata } from "next";
import type { JSX } from "react";

import { BookingsView } from "@/app/(public)/bookings/_components/bookings-view";
import { Container } from "@/components/layout/container";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.bookings.metaTitle, description: t.bookings.metaDescription };
}

/** Захиалгууд одоогоор энэ browser-т хадгалагддаг тул бүх харагдацыг client дээр render хийнэ. */
export default function BookingsPage(): JSX.Element {
  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <BookingsView />
    </Container>
  );
}
