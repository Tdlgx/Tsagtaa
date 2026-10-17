import { Coins, Phone } from "lucide-react";
import type { Metadata } from "next";
import type { JSX } from "react";

import { Empty, PageHeader, SearchBar } from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { findBookings } from "@/features/admin/admin-db";
import { AdminCancelBookingButton } from "@/features/admin/components/admin-controls";
import { formatPhone } from "@/features/booking/booking";
import { SAMPLE_BUSINESSES } from "@/features/business/sample-businesses";
import { formatPoints } from "@/features/points/points";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatMNT } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.bookings, robots: { index: false } };
}

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Support desk: find a booking by its code, the customer's phone or the place. */
export default async function AdminBookingsPage(
  props: PageProps<"/admin/bookings">,
): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin/bookings");
  const { t } = await getI18n();
  const query = first((await props.searchParams).q).slice(0, 80);
  const bookings = await findBookings(query);
  const now = new Date().getTime();
  const words = t.admin.bookings;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead}>
        <SearchBar action="/admin/bookings" value={query} placeholder={words.search} />
      </PageHeader>

      <p className="mt-6 text-sm text-muted-foreground">
        {query ? words.results(bookings.length, query) : words.latest}
      </p>
      <div className="mt-3">
        {bookings.length === 0 ? (
          <Empty>{words.empty}</Empty>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {bookings.map((booking) => {
              const place =
                booking.businessName ??
                SAMPLE_BUSINESSES.find((item) => item.slug === booking.businessSlug)?.name ??
                booking.businessSlug;
              const upcoming = booking.status === "confirmed" && booking.startsAt.getTime() > now;
              const state =
                booking.status === "cancelled"
                  ? "cancelled"
                  : booking.attendance === "attended"
                    ? "attended"
                    : booking.attendance === "no_show"
                      ? "no_show"
                      : upcoming
                        ? "upcoming"
                        : "past";
              return (
                <li
                  key={booking.id}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center"
                >
                  <div className="w-36 shrink-0">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {booking.code}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(booking.startsAt)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{place}</span>
                      <Badge tone={STATE_TONE[state]}>{words.state[state]}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.serviceName} · {booking.customerName} ·{" "}
                      <span
                        className={cn(
                          "tabular-nums",
                          booking.status === "cancelled" && "line-through",
                        )}
                      >
                        {formatMNT(booking.price)}
                      </span>
                    </p>
                    {booking.pointsUsed > 0 || booking.pointsEarn > 0 ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                        <Coins className="size-3.5 text-primary-strong" />
                        {[
                          booking.pointsUsed > 0
                            ? words.pointsUsed(formatPoints(booking.pointsUsed))
                            : null,
                          booking.pointsEarn > 0
                            ? words.pointsEarn(formatPoints(booking.pointsEarn))
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`tel:${booking.phone}`}
                      className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted"
                    >
                      <Phone className="size-4" />
                      {formatPhone(booking.phone)}
                    </a>
                    {upcoming ? <AdminCancelBookingButton bookingId={booking.id} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}

const STATE_TONE = {
  upcoming: "primary",
  past: "neutral",
  attended: "success",
  no_show: "warning",
  cancelled: "danger",
} as const;
