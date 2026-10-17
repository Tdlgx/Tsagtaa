import { Coins, Lock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import {
  Empty,
  FilterLinks,
  PageHeader,
  SearchBar,
} from "@/app/(admin)/admin/_components/admin-ui";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { listAccounts, type AccountFilter } from "@/features/admin/admin-db";
import { AccountActions } from "@/features/admin/components/admin-controls";
import { formatPhone } from "@/features/booking/booking";
import { formatPoints } from "@/features/points/points";
import { getI18n } from "@/i18n/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/date";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.nav.accounts, robots: { index: false } };
}

const FILTERS: readonly AccountFilter[] = ["all", "customers", "staff", "admins", "locked"];

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Everyone who can sign in: customers, the people who run places, the Цагтаа team. */
export default async function AccountsPage(
  props: PageProps<"/admin/accounts">,
): Promise<JSX.Element> {
  const admin = await requirePlatformAdmin("/admin/accounts");
  const { t } = await getI18n();
  const params = await props.searchParams;
  const filter = FILTERS.find((item) => item === first(params.filter)) ?? "all";
  const query = first(params.q).slice(0, 80);
  const accounts = await listAccounts(filter, query);
  const now = new Date();
  const words = t.admin.accounts;

  const hrefFor = (value: AccountFilter): string => {
    const search = new URLSearchParams();
    if (value !== "all") search.set("filter", value);
    if (query) search.set("q", query);
    const text = search.toString();
    return text ? `/admin/accounts?${text}` : "/admin/accounts";
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={words.title} lead={words.lead}>
        <SearchBar
          action="/admin/accounts"
          value={query}
          placeholder={words.search}
          keep={filter === "all" ? {} : { filter }}
        />
      </PageHeader>

      <div className="mt-6">
        <FilterLinks
          options={FILTERS.map((value) => ({ value, label: words.filters[value] }))}
          current={filter}
          hrefFor={hrefFor}
        />
      </div>

      <div className="mt-4">
        {accounts.length === 0 ? (
          <Empty>{words.empty}</Empty>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {accounts.map((account) => {
              const locked = account.lockedUntil !== null && account.lockedUntil > now;
              return (
                <li key={account.id} className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-strong">
                        {account.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{account.name}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatPhone(account.phone)}
                          </span>
                          {account.isPlatformAdmin ? (
                            <Badge tone="primary">
                              <ShieldCheck className="size-3" />
                              {words.admin}
                            </Badge>
                          ) : null}
                          {account.id === admin.id ? (
                            <Badge tone="outline">{t.dashboard.you}</Badge>
                          ) : null}
                          {locked ? (
                            <Badge tone="danger">
                              <Lock className="size-3" />
                              {words.lockedUntil(formatDateTime(account.lockedUntil!))}
                            </Badge>
                          ) : account.failedLogins > 0 ? (
                            <Badge tone="warning">{words.failed(account.failedLogins)}</Badge>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                          {[
                            words.joined(formatDate(account.createdAt)),
                            account.lastSeen
                              ? words.lastSeen(formatDateTime(account.lastSeen))
                              : null,
                            words.sessions(account.sessions),
                            words.bookings(account.bookings),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {account.memberships.length > 0 ? (
                          <p className="mt-1 flex flex-wrap gap-1.5">
                            {account.memberships.map((membership) => (
                              <Link
                                key={membership.slug}
                                href={`/admin/places/${membership.slug}`}
                                className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-muted-foreground"
                              >
                                {t.manage.roles[membership.role]} · {membership.name}
                              </Link>
                            ))}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-brand-ink px-3 py-1 text-sm font-medium text-primary tabular-nums">
                      <Coins className="size-4" />
                      {formatPoints(account.pointsBalance)}
                    </span>
                  </div>
                  <AccountActions
                    accountId={account.id}
                    isAdmin={account.isPlatformAdmin}
                    isLocked={locked}
                    isSelf={account.id === admin.id}
                    sessions={account.sessions}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
