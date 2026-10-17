"use client";

import { Copy } from "lucide-react";
import { Switch } from "radix-ui";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldHint } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { updateDraft } from "@/features/business-registration/draft-store";
import {
  CATEGORY_DEFAULTS,
  HOURS_PRESETS,
  SLOT_OPTIONS,
  TIME_OPTIONS,
  toMinutes,
  weeklyMinutes,
  type DayHours,
  type HoursPreset,
  type RegistrationDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type HoursStepProps = { draft: RegistrationDraft; errors: StepErrors; t: Dictionary };

/** The week chart spans 06:00–24:00. */
const CHART_FROM = 6 * 60;
const CHART_SPAN = 18 * 60;

function setHours(hours: DayHours[]): void {
  updateDraft((draft) => ({ ...draft, hours, hoursEdited: true }));
}

function setDay(index: number, change: Partial<DayHours>): void {
  updateDraft((draft) => ({
    ...draft,
    hoursEdited: true,
    hours: draft.hours.map((item, i) => (i === index ? { ...item, ...change } : item)),
  }));
}

const sameHours = (a: readonly DayHours[], b: readonly DayHours[]): boolean =>
  a.every(
    (item, i) =>
      item.open === b[i]?.open &&
      (!item.open || (item.opens === b[i]?.opens && item.closes === b[i]?.closes)),
  );

export function HoursStep({ draft, errors, t }: HoursStepProps): JSX.Element {
  const words = t.register;
  const suggested: HoursPreset = draft.category ? CATEGORY_DEFAULTS[draft.category].hours : "daily";
  const presets: { key: string; label: string; hours: DayHours[] }[] = [
    { key: "suggested", label: words.presets.suggested, hours: HOURS_PRESETS[suggested] },
    { key: "weekdays", label: words.presets.weekdays, hours: HOURS_PRESETS.weekdays },
    { key: "daily", label: words.presets.daily, hours: HOURS_PRESETS.daily },
  ];
  const monday = draft.hours[0];

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">{words.presetsLabel}:</span>
        {presets.map((preset) => {
          const active = sameHours(draft.hours, preset.hours);
          return (
            <button
              key={preset.key}
              type="button"
              aria-pressed={active}
              onClick={() => setHours(preset.hours)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground is-hover:border-muted-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <WeekChart hours={draft.hours} t={t} />

      {/* Day rows */}
      <fieldset id="reg-hours" tabIndex={-1} className="outline-none">
        <legend className="sr-only">{words.headings.hours}</legend>
        <FieldError className="mb-3">{errors.hours ? words.errors.hoursNone : null}</FieldError>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {draft.hours.map((item, index) => {
            const dayName = words.weekdays[index] ?? "";
            const rowError = errors[`hours:${index}`];
            return (
              <li key={dayName} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label
                    htmlFor={`reg-hours-${index}-open`}
                    className="flex w-32 shrink-0 cursor-pointer items-center gap-3"
                  >
                    <Switch.Root
                      id={`reg-hours-${index}-open`}
                      checked={item.open}
                      onCheckedChange={(open) => setDay(index, { open })}
                      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-input transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring data-[state=checked]:bg-primary-strong"
                    >
                      <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-soft data-[state=checked]:translate-x-5.5" />
                    </Switch.Root>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.open ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {dayName}
                    </span>
                  </label>

                  {item.open ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Select
                        aria-label={`${dayName}: ${words.opens}`}
                        value={item.opens}
                        onChange={(event) => setDay(index, { opens: event.target.value })}
                        className="h-10 min-w-[6.5rem] tabular-nums"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                      <span aria-hidden className="text-muted-foreground">
                        –
                      </span>
                      <Select
                        id={`reg-hours-${index}`}
                        aria-label={`${dayName}: ${words.closes}`}
                        aria-invalid={Boolean(rowError)}
                        value={item.closes}
                        onChange={(event) => setDay(index, { closes: event.target.value })}
                        className="h-10 min-w-[6.5rem] tabular-nums"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{words.closedDay}</span>
                  )}
                </div>
                {rowError ? (
                  <FieldError className="mt-2">{words.errors[rowError]}</FieldError>
                ) : null}
              </li>
            );
          })}
        </ul>
        {monday?.open ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setHours(draft.hours.map(() => ({ ...monday })))}
          >
            <Copy data-icon="start" />
            {words.copyMonday}
          </Button>
        ) : null}
      </fieldset>

      {/* Booking grid */}
      <fieldset>
        <legend className="text-sm font-medium text-foreground">{words.slot}</legend>
        <FieldHint className="mt-1">{words.slotHint}</FieldHint>
        <div className="mt-3 inline-flex gap-1 rounded-full border border-border bg-surface p-1">
          {SLOT_OPTIONS.map((minutes) => (
            <label key={minutes} className="relative">
              <input
                type="radio"
                name="slotMinutes"
                checked={draft.slotMinutes === minutes}
                onChange={() => updateDraft((d) => ({ ...d, slotMinutes: minutes }))}
                className="peer sr-only"
              />
              <span className="flex h-9 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-muted-foreground tabular-nums transition-colors duration-150 ease-soft peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring is-hover:text-foreground peer-checked:is-hover:text-background">
                {words.slotOption(minutes)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** Seven bars on a 06–24 timeline: the shape of the week at a glance. */
function WeekChart({ hours, t }: { hours: readonly DayHours[]; t: Dictionary }): JSX.Element {
  const total = Math.round(weeklyMinutes(hours) / 6) / 10;

  return (
    <div aria-hidden className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
        <span>06:00</span>
        <span className="font-medium text-foreground">{t.register.weekly(total)}</span>
        <span>24:00</span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {hours.map((item, index) => {
          const start = ((toMinutes(item.opens) - CHART_FROM) / CHART_SPAN) * 100;
          const width = ((toMinutes(item.closes) - toMinutes(item.opens)) / CHART_SPAN) * 100;
          return (
            <li key={index} className="flex items-center gap-3">
              <span className="w-6 text-xs text-muted-foreground">
                {t.register.weekdaysShort[index]}
              </span>
              <span className="relative h-2.5 flex-1 rounded-full bg-surface-muted">
                {item.open && width > 0 ? (
                  <span
                    className="absolute inset-y-0 rounded-full bg-primary transition-[left,width] duration-400 ease-soft"
                    style={{ left: `${Math.max(0, start)}%`, width: `${Math.min(100, width)}%` }}
                  />
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
