"use client";

import { Clock, Lightbulb, MapPin, Store, UsersRound } from "lucide-react";
import type { JSX } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import { Badge } from "@/components/ui/badge";
import {
  getCompleteness,
  toMinutes,
  type RegistrationDraft,
} from "@/features/business-registration/registration";
import { getBusinessCategory } from "@/features/business/categories";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { getZonedParts } from "@/lib/date";
import { cn } from "@/lib/utils";

const clock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Today's weekday in Ulaanbaatar, Monday = 0. */
function todayIndex(): number {
  return (getZonedParts(new Date()).weekday + 6) % 7;
}

/**
 * The listing as customers will meet it in search, redrawn as the owner
 * types: name, kind, place, today's hours, first services and a few start
 * times on the chosen grid.
 */
export function ListingPreview({
  draft,
  t,
}: {
  draft: RegistrationDraft;
  t: Dictionary;
}): JSX.Element {
  const words = t.register;
  const Icon = draft.category ? getBusinessCategory(draft.category).icon : Store;
  const today = draft.hours[todayIndex()];
  const opens = today?.open ? toMinutes(today.opens) : null;
  const closes = today?.open ? toMinutes(today.closes) : null;
  const shortest = Math.min(...draft.services.map((service) => service.duration), 30);
  const times =
    opens !== null && closes !== null
      ? Array.from({ length: 4 }, (_, i) => opens + i * draft.slotMinutes).filter(
          (start) => start + shortest <= closes,
        )
      : [];
  const shown = draft.services.filter((service) => service.name.trim()).slice(0, 3);
  const more = draft.services.length - shown.length;

  return (
    <TiltCard className="rounded-xl border border-border bg-surface shadow-md">
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-primary">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-heading text-lg leading-snug font-medium tracking-tight",
              draft.name.trim() ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {draft.name.trim() || words.previewName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {draft.category ? t.categories[draft.category].label : "—"}
            {draft.district ? ` · ${t.districts[draft.district]}` : ""}
          </p>
        </div>
        <Badge tone="primary">{words.previewNew}</Badge>
      </div>

      <ul className="flex flex-col gap-1.5 px-5 text-sm text-muted-foreground">
        {draft.address.trim() ? (
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{draft.address}</span>
          </li>
        ) : null}
        <li className="flex items-center gap-2 tabular-nums">
          <Clock className="size-4 shrink-0" />
          {opens !== null && closes !== null
            ? words.previewToday(`${clock(opens)}–${clock(closes)}`)
            : words.previewClosedToday}
        </li>
        {draft.staff.length > 0 ? (
          <li className="flex items-center gap-2">
            <UsersRound className="size-4 shrink-0" />
            {words.staffCount(draft.staff.length)}
          </li>
        ) : null}
      </ul>

      <div className="mt-4 border-t border-border px-5 py-4">
        {shown.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {shown.map((service) => (
              <li key={service.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-foreground">{service.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {service.duration} {words.minutesShort} · {formatMNT(service.price)}
                </span>
              </li>
            ))}
            {more > 0 ? (
              <li className="text-xs text-muted-foreground">{words.previewMore(more)}</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{words.previewNoServices}</p>
        )}
        {times.length > 0 ? (
          <ul aria-hidden className="mt-4 flex flex-wrap gap-1.5">
            {times.map((start) => (
              <li
                key={start}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground tabular-nums"
              >
                {clock(start)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </TiltCard>
  );
}

/** Score bar plus the two tips that would raise it most. */
export function Completeness({
  draft,
  t,
  compact = false,
}: {
  draft: RegistrationDraft;
  t: Dictionary;
  compact?: boolean;
}): JSX.Element {
  const { score, tips } = getCompleteness(draft);
  const tone = score >= 80 ? "bg-success" : score >= 50 ? "bg-primary-strong" : "bg-sun";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{t.register.completeness}</p>
        <p className="font-heading text-lg font-medium text-foreground tabular-nums">{score}%</p>
      </div>
      <div
        role="progressbar"
        aria-label={t.register.completeness}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-400 ease-soft", tone)}
          style={{ width: `${score}%` }}
        />
      </div>
      {!compact && tips.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {tips.slice(0, 2).map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lightbulb className="mt-px size-3.5 shrink-0 text-sun-strong" />
              {t.register.tips[tip]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
