import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { env } from "@/lib/env";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Internal tools (e.g. /design-system) exist only in development; production gets a 404. */
export default function InternalLayout({ children }: { children: ReactNode }): ReactNode {
  if (env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
