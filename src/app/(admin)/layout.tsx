import type { JSX, ReactNode } from "react";

import { ManageShell } from "@/components/layout/manage-shell";

/** Удирдлагын хэсэг: нийтлэг header, үйлчлүүлэгчийн хэсгийн элементгүй (ManageShell-ийг үз). */
export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return <ManageShell>{children}</ManageShell>;
}
