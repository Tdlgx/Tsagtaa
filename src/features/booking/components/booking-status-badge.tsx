import type { JSX } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const STATUS_META: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Хүлээгдэж буй", tone: "warning" },
  confirmed: { label: "Баталгаажсан", tone: "success" },
  completed: { label: "Дууссан", tone: "neutral" },
  cancelled: { label: "Цуцлагдсан", tone: "danger" },
};

/** Захиалгын төлөвийн өнгөт тэмдэг. */
export function BookingStatusBadge({ status }: { status: BookingStatus }): JSX.Element {
  const { label, tone } = STATUS_META[status];

  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
