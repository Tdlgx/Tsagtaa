import type { JSX } from "react";

import { AdminNav } from "@/app/(admin)/admin/_components/admin-nav";
import { getCurrentAccount } from "@/lib/auth/session";
import { sql } from "@/lib/db";

/**
 * Хэсгийн табууд, зөвхөн админд. Энэ нь эрхийн шалгалт биш: админы хуудас, action
 * бүр `requirePlatformAdmin()`-ийг өөрөө дуудна. Бусад хүмүүст зөвхөн хуудас
 * ирэх бөгөөд тэр нь нэвтрэх рүү илгээх эсвэл "олдсонгүй" гэж харуулна.
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
