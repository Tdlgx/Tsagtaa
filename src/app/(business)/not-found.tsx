import type { JSX } from "react";

import { NotFoundView } from "@/components/shared/not-found-view";

/**
 * 404 inside the management shell. Also what someone without the right role
 * sees, so the page does not reveal that it exists.
 */
export default function NotFound(): JSX.Element {
  return <NotFoundView withLogo={false} />;
}
