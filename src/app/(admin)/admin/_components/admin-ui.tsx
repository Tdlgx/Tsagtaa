import { Search, Store, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { JSX, ReactNode } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import type { AuditEntry, BusinessListItem } from "@/features/admin/admin-db";
import { formatPhone } from "@/features/booking/booking";
import { getBusinessCategory, type BusinessCategorySlug } from "@/features/business/categories";
import type { DistrictSlug } from "@/features/business/districts";
import { StatusBadge } from "@/features/manage/components/status-badge";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Админы хуудасны гарчиг, тайлбар, баруун талд нь нэмэлт товчнууд. */
export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-heading text-heading font-medium text-foreground">{title}</h1>
        {lead ? <p className="mt-2 max-w-2xl text-base text-muted-foreground">{lead}</p> : null}
      </div>
      {children}
    </header>
  );
}

/**
 * Тоон үзүүлэлтийн карт; `href` өгвөл бүхэлдээ холбоос болж, `highlight` анхаарал татахаар тодорно.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  highlight = false,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  href?: string;
}): JSX.Element {
  const body = (
    <TiltCard
      maxDegrees={6}
      className={cn(
        "h-full rounded-xl border p-4 sm:p-5",
        highlight ? "border-sun/60 bg-sun-soft" : "border-border bg-surface",
      )}
    >
      <Icon className={cn("size-5", highlight ? "text-sun-strong" : "text-primary-strong")} />
      <p className="mt-3 font-heading text-2xl font-medium text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs font-medium text-sun-strong">{hint}</p> : null}
    </TiltCard>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/** Энгийн GET маягт, ингэснээр хайлт нь хуваалцаж, дахин ачаалж болох холбоос болно. */
export function SearchBar({
  action,
  value,
  placeholder,
  keep = {},
}: {
  action: string;
  value: string;
  placeholder: string;
  /** Хамт дамжуулах бусад query параметрүүд (одоогийн шүүлтүүр). */
  keep?: Record<string, string>;
}): JSX.Element {
  return (
    <form action={action} role="search" className="relative w-full md:w-80">
      {Object.entries(keep).map(([name, keptValue]) => (
        <input key={name} type="hidden" name={name} value={keptValue} />
      ))}
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        role="searchbox"
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-full border border-input bg-surface pr-4 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground is-focus:border-primary-strong is-focus:ring-3 is-focus:ring-ring"
      />
    </form>
  );
}

/**
 * Шүүлтүүрийн сонголтуудыг холбоос болгон харуулна; сонгосон нь `aria-current`-тэй, тоо байвал
 * хажууд нь.
 */
export function FilterLinks<T extends string>({
  options,
  current,
  hrefFor,
}: {
  options: readonly { value: T; label: string; count?: number }[];
  current: T;
  hrefFor: (value: T) => string;
}): JSX.Element {
  return (
    <nav className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(option.value)}
          aria-current={current === option.value ? "page" : undefined}
          scroll={false}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
            current === option.value
              ? "border-primary-strong bg-primary-soft text-primary-strong"
              : "border-border bg-surface text-foreground is-hover:border-muted-foreground",
          )}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="text-muted-foreground tabular-nums">{option.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/** Жагсаалт хоосон үед харуулах тасархай хүрээтэй мэдэгдэл. */
export function Empty({ children }: { children: ReactNode }): JSX.Element {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Газрын товч мэдээлэл: ангиллын icon, нэр (сонголтоор шалгах хуудас руу холбоос), хаяг, тоонууд.
 */
export function PlaceSummary({
  place,
  t,
  link = false,
}: {
  place: BusinessListItem;
  t: Dictionary;
  /** Нэр дээр дарахад газрын шалгах хуудас нээгдэнэ. */
  link?: boolean;
}): JSX.Element {
  const category = place.category as BusinessCategorySlug;
  const Icon = getBusinessCategory(category)?.icon ?? Store;

  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          {link ? (
            <Link
              href={`/admin/places/${place.slug}`}
              className="font-medium text-foreground underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring is-hover:underline"
            >
              {place.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{place.name}</span>
          )}
          <StatusBadge status={place.status} t={t} />
        </p>
        <p className="text-sm text-muted-foreground">
          {t.categories[category]?.label ?? place.category} ·{" "}
          {t.districts[place.district as DistrictSlug] ?? place.district}
        </p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {formatPhone(place.phone)}
          {place.registerNumber ? ` · ${place.registerNumber}` : ""} ·{" "}
          {t.admin.servicesCount(place.services)} · {t.admin.staffCount(place.staff)} ·{" "}
          {place.owner ? `${t.admin.owner} ${formatPhone(place.owner)}` : t.admin.noOwner} ·{" "}
          {t.admin.bookings30(place.bookings30)}
        </p>
        {(place.status === "rejected" || place.status === "suspended") && place.reviewNote ? (
          <p className="mt-1 text-xs text-danger-foreground">{place.reviewNote}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Үйлдлийн түүхийн бичлэгүүд: хэзээ, хэн, юу хийсэн, хэнд/юунд, нэмэлт тайлбартай. */
export function AuditList({ entries, t }: { entries: AuditEntry[]; t: Dictionary }): JSX.Element {
  const words = t.admin.activity;
  if (entries.length === 0) return <Empty>{words.empty}</Empty>;
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
          <span className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatDateTime(entry.createdAt)}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="font-medium text-foreground">{entry.actor ?? words.someone}</span>{" "}
            <span className="text-muted-foreground">{words.actions[entry.action]}</span>{" "}
            <span className="font-medium text-foreground">{entry.target}</span>
            {entry.detail ? (
              <span className="block text-xs text-muted-foreground">{entry.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
