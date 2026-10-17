import type { JSX } from "react";

import { AdminNav } from "@/app/(admin)/admin/_components/admin-nav";
import { getCurrentAccount } from "@/lib/auth/session";
import { sql } from "@/lib/db";

/**
 * The section tabs, for admins only. This is not the access check: every
 * admin page and action calls `requirePlatformAdmin()` itself. Anyone else
 * gets just the page, which sends them to sign in or shows "not found".
 */
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">): Promise<JSX.Element> {
  const account = await getCurrentAccount();
  if (!account?.isPlatformAdmin) return <>{children}</>;
  const [row] = await sql<{ pending: number }[]>`
    SELECT count(*)::int AS pending FROM businesses WHERE status = 'pending'
  `.catch(() => [{ pending: 0 }]);

  return (
    <>
      <AdminNav pending={row?.pending ?? 0} />
      {children}
    </>
  );
}
