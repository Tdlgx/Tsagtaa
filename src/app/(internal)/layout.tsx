import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { env } from "@/lib/env";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Дотоод хэрэгслүүд (жишээ нь /design-system) зөвхөн хөгжүүлэлтэд байна; production-д 404. */
export default function InternalLayout({ children }: { children: ReactNode }): ReactNode {
  if (env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
