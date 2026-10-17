import type { Metadata } from "next";
import type { JSX } from "react";

import { NotFoundView } from "@/components/shared/not-found-view";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.errors.notFoundTitle };
}

export default function NotFound(): JSX.Element {
  return (
    <main className="flex flex-1 flex-col">
      <NotFoundView />
    </main>
  );
}
