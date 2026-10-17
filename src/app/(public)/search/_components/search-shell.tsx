"use client";

import { Search, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type JSX, type ReactNode } from "react";

import { CategoryPicker } from "@/app/(public)/search/_components/category-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DISTRICTS } from "@/features/business/districts";
import {
  SEARCH_DAYS,
  SEARCH_SORTS,
  TIMES_OF_DAY,
  toClock,
  toSearchHref,
  type SearchFilters,
} from "@/features/business/search";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Choice = { value: string; label: string; hint?: string; icon?: LucideIcon };

type ChoiceGroupProps = {
  legend: string;
  name: keyof SearchFilters;
  value: string;
  choices: readonly Choice[];
  onChange: (value: string) => void;
  /** "segmented": one capsule, equal parts. "chips": separate pills that may scroll. */
  look: "segmented" | "chips";
  className?: string;
};

/**
 * A single-choice filter built from native radio buttons, so Tab enters the
 * group, the arrow keys move inside it, and the form still submits without JS.
 * A chosen filter is filled with ink; blue is kept for actions and time slots.
 */
function ChoiceGroup({
  legend,
  name,
  value,
  choices,
  onChange,
  look,
  className,
}: ChoiceGroupProps): JSX.Element {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">{legend}</legend>
      <div
        className={cn(
          look === "segmented"
            ? "grid auto-cols-fr grid-flow-col gap-0.5 rounded-full border border-border bg-surface p-1"
            : "-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0",
        )}
      >
        {choices.map(({ value: choiceValue, label, hint, icon: Icon }) => (
          <label key={choiceValue} className="relative shrink-0">
            <input
              type="radio"
              name={name}
              value={choiceValue}
              checked={value === choiceValue}
              onChange={() => onChange(choiceValue)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 ease-soft select-none is-hover:text-foreground",
                // Hover must not dim the chosen option, so its text color is restated.
                "peer-checked:bg-foreground peer-checked:text-background peer-checked:is-hover:text-background",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
                look === "segmented"
                  ? "h-9 px-3"
                  : "h-10 border border-border bg-surface px-4 peer-checked:border-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {label}
              {hint ? (
                <span className="hidden text-xs font-normal tabular-nums opacity-70 xl:inline">
                  {hint}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type SearchShellProps = {
  filters: SearchFilters;
  /** Server-rendered results; dimmed while the next search loads. */
  children: ReactNode;
};

/**
 * Search form + results. Filters live in the URL (shareable, back button
 * works). Choosing a filter navigates at once inside a transition, and
 * `useOptimistic` shows the new choice immediately while results load.
 */
export function SearchShell({ filters, children }: SearchShellProps): JSX.Element {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(filters);

  // The text box is edited freely and only applied on submit. When the URL
  // changes from outside (e.g. "clear filters"), adopt the new query.
  const [draft, setDraft] = useState(filters.q);
  const [appliedQuery, setAppliedQuery] = useState(filters.q);
  if (appliedQuery !== filters.q) {
    setAppliedQuery(filters.q);
    setDraft(filters.q);
  }

  const navigate = (next: SearchFilters): void => {
    startTransition(() => {
      setCurrent(next);
      router.replace(toSearchHref(next), { scroll: false });
    });
  };

  const dayChoices: Choice[] = SEARCH_DAYS.map(({ value }) => ({
    value,
    label: value === "today" ? t.common.today : t.common.tomorrow,
  }));
  const timeChoices: Choice[] = [
    { value: "", label: t.search.anyTime },
    ...TIMES_OF_DAY.map(({ value, from, to }) => ({
      value,
      label: t.search.parts[value],
      hint: `${toClock(from).slice(0, 2)}–${toClock(to).slice(0, 2)}`,
    })),
  ];

  const update = (key: keyof SearchFilters, value: string): void => {
    navigate({ ...current, q: draft.trim(), [key]: value });
  };

  return (
    <>
      {/* Without JavaScript this is a plain GET form to the same URL. */}
      <form
        action="/search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ ...current, q: draft.trim() });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-2">
          <div data-tour="search" className="relative min-w-0 flex-1">
            <label htmlFor="search-q" className="sr-only">
              {t.search.queryLabel}
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="search-q"
              type="search"
              name="q"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={60}
              enterKeyHint="search"
              autoComplete="off"
              placeholder={t.search.placeholder}
              className="h-11 w-full min-w-0 rounded-full border border-input bg-surface pr-5 pl-12 text-base text-foreground outline-none placeholder:text-muted-foreground sm:h-13 is-hover:border-muted-foreground is-focus:border-primary-strong is-focus:ring-3 is-focus:ring-ring"
            />
          </div>
          <Button type="submit" size="lg" className="max-sm:h-11 max-sm:px-5">
            {t.search.submit}
          </Button>
        </div>

        <CategoryPicker value={current.cat} onChange={(value) => update("cat", value)} />

        <div
          data-tour="filters"
          className="grid grid-cols-2 gap-3 md:grid-cols-[auto_1fr] lg:flex lg:items-center"
        >
          <ChoiceGroup
            legend={t.search.dayLegend}
            name="day"
            look="segmented"
            value={current.day}
            choices={dayChoices}
            onChange={(value) => update("day", value)}
            className="col-span-2 md:col-span-1"
          />
          <ChoiceGroup
            legend={t.search.partLegend}
            name="time"
            look="segmented"
            value={current.time}
            choices={timeChoices}
            onChange={(value) => update("time", value)}
            className="col-span-2 md:col-span-1"
          />
          <div className="col-span-1 lg:ml-auto lg:w-52">
            <label htmlFor="search-district" className="sr-only">
              {t.search.district}
            </label>
            <Select
              id="search-district"
              name="district"
              value={current.district}
              onChange={(event) => update("district", event.target.value)}
              className="rounded-full"
            >
              <option value="">{t.search.allDistricts}</option>
              {DISTRICTS.map(({ slug }) => (
                <option key={slug} value={slug}>
                  {t.districts[slug]}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-1 lg:w-52">
            <label htmlFor="search-sort" className="sr-only">
              {t.search.sort}
            </label>
            <Select
              id="search-sort"
              name="sort"
              value={current.sort}
              onChange={(event) => update("sort", event.target.value)}
              className="rounded-full"
            >
              {SEARCH_SORTS.map(({ value }) => (
                <option key={value} value={value}>
                  {t.search.sorts[value]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </form>

      <div
        aria-busy={isPending}
        className={cn("transition-opacity duration-250 ease-soft", isPending && "opacity-55")}
      >
        {children}
      </div>
    </>
  );
}
