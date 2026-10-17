import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n/dictionaries";
import type { BusinessStatus } from "@/lib/auth/session";

const TONES = {
  pending: "warning",
  active: "success",
  rejected: "danger",
  suspended: "neutral",
} as const;

export function StatusBadge({ status, t }: { status: BusinessStatus; t: Dictionary }): JSX.Element {
  return (
    <Badge tone={TONES[status]} dot>
      {t.manage.status[status]}
    </Badge>
  );
}
