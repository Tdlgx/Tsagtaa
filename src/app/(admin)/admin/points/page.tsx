import { ArrowDownLeft, ArrowUpRight, Coins, RotateCcw, UsersRound, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Empty, PageHeader, StatCard } from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { getPointsOverview } from "@/features/admin/admin-db";
import { LoyaltySettingsForm } from "@/features/admin/components/admin-controls";
import { formatPhone } from "@/features/booking/booking";
import { formatPoints } from "@/features/points/points";
import { getLoyaltySettings } from "@/features/points/points-db";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatMNT } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.points, robots: { index: false } };
}

/** The points programme: what it costs, who holds what, the rules. */
export default async function AdminPointsPage(): Promise<JSX.Element> {
  await requirePlatformAdmin("/admin/points");
  const { t } = await getI18n();
  const [{ totals, top, recent }, settings] = await Promise.all([
    getPointsOverview(),
    getLoyaltySettings(),
  ]);
  const words = t.admin.points;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead} />

      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Coins}
          label={words.outstanding}
          value={formatMNT(totals.outstanding)}
          hint={words.holders(totals.holders)}
        />
        <StatCard
          icon={ArrowDownLeft}
          label={words.earned30}
          value={formatPoints(totals.earned30)}
        />
        <StatCard
          icon={ArrowUpRight}
          label={words.redeemed30}
          value={formatPoints(totals.redeemed30 - totals.refunded30)}
          hint={words.bookingsWithPoints(totals.bookingsWithPoints30)}
        />
        <StatCard icon={Wrench} label={words.adjusted30} value={formatPoints(totals.adjusted30)} />
      </ul>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="ledger-title">
          <h2 id="ledger-title" className="font-heading text-xl font-medium text-foreground">
            {words.ledgerTitle}
          </h2>
          <div className="mt-4">
            {recent.length === 0 ? (
              <Empty>{words.ledgerEmpty}</Empty>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {recent.map((entry) => {
                  const Icon = {
                    earn: ArrowDownLeft,
                    redeem: ArrowUpRight,
                    refund: RotateCcw,
                    adjust: Wrench,
                  }[entry.kind];
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          entry.delta > 0
                            ? "bg-success-soft text-success-foreground"
                            : "bg-surface-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/admin/accounts?q=${entry.phone}`}
                          className="block truncate text-sm font-medium text-foreground underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:underline"
                        >
                          {entry.name} · {formatPhone(entry.phone)}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.points.kinds[entry.kind]}
                          {entry.code ? ` · ${entry.code}` : ""}
                          {entry.kind === "adjust"
                            ? ` · ${entry.note} (${entry.actor ?? "—"})`
                            : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={cn(
                            "block text-sm font-semibold tabular-nums",
                            entry.delta > 0 ? "text-success-foreground" : "text-foreground",
                          )}
                        >
                          {entry.delta > 0 ? "+" : "−"}
                          {formatPoints(Math.abs(entry.delta))}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <section
            aria-labelledby="rules-title"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <h2 id="rules-title" className="font-medium text-foreground">
              {words.rulesTitle}
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">{words.rulesLead}</p>
            <LoyaltySettingsForm settings={settings} />
          </section>

          <section aria-labelledby="top-title">
            <h2
              id="top-title"
              className="flex items-center gap-2 font-heading text-xl font-medium text-foreground"
            >
              <UsersRound className="size-5 text-primary-strong" />
              {words.topTitle}
            </h2>
            {top.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{words.ledgerEmpty}</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-1.5">
                {top.map((holder, index) => (
                  <li
                    key={holder.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <span className="w-5 text-xs font-semibold text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {holder.name}
                    </span>
                    <span className="text-sm font-semibold text-primary-strong tabular-nums">
                      {formatPoints(holder.balance)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </Container>
  );
}
