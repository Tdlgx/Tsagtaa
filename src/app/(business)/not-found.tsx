import type { JSX } from "react";

import { NotFoundView } from "@/components/shared/not-found-view";

/**
 * Удирдлагын хэсэг доторх 404. Зохих эрхгүй хүн ч мөн үүнийг харна, ингэснээр
 * хуудас байгаа эсэхийг ч мэдэгдэхгүй.
 */
export default function NotFound(): JSX.Element {
  return <NotFoundView withLogo={false} />;
}
