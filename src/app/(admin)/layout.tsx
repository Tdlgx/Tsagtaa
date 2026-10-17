import type { JSX, ReactNode } from "react";

import { ManageShell } from "@/components/layout/manage-shell";

/** Management side: shared header, no customer chrome (see ManageShell). */
export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return <ManageShell>{children}</ManageShell>;
}
