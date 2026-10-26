"use client";

import { ArrowRight, MapPin, Star } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type JSX,
  type Ref,
} from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCountdown } from "@/features/booking/booking";
import type { BoardRow } from "@/features/business/board-data";
import { CATEGORY_GROUPS, type CategoryGroupSlug } from "@/features/business/categories";
import {
  DEFAULT_FILTERS,
  TIMES_OF_DAY,
  toClock,
  toMinutes,
  toSearchHref,
  type SearchDay,
  type SearchSort,
} from "@/features/business/search";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { formatDayLabel } from "@/i18n/format";
import { formatMNT } from "@/lib/currency";
import { getZonedParts } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Самбар нэг ажлын өдрийг харуулна, Улаанбаатарын цагаар 09:00–21:00. */
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => 9 + i);
/** Энэ цагаас хойш өнөөдөр харуулах зүйлгүй болох тул самбар маргаашаар нээгдэнэ. */
const FLIP_TO_TOMORROW = 20 * 60 + 30;
/** Нэг дор харуулах мөр; үлдсэн нь хайлт руу холбоос болно. */
const MAX_ROWS = 6;
/** Утсан дээр цөөн газар харуулна; үлдсэн нь хайлтад нэг товшилтын зайтай. */
const PHONE_ROWS = 4;
const MINUTE = 60_000;

type GroupFilter = CategoryGroupSlug | "all";

/** Зам дээрх байрлал, 09:00-өөс хойших цагаар (CSS-д --hour-оор үржүүлнэ). */
const toTrackHours = (minutes: number): number => (minutes - DAY_START) / 60;

/*
 * Бүх subscriber хуваалцдаг минутын нарийвчлалтай цаг: React хамгийн ихдээ минутад
 * нэг удаа дахин render хийнэ. Сервер дээр null тул самбар "одоо"-гүйгээр render
 * хийгдэж, hydration-ий дараа бөглөгдөнө (сервер/browser-ийн цаг зөрөхгүй).
 */
function subscribeToMinute(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 10_000);
  return () => window.clearInterval(id);
}
const getMinute = (): number => Math.floor(Date.now() / MINUTE);
const getServerMinute = (): null => null;

/** Улаанбаатарын цагаар шөнө дундаас хойш өнгөрсөн минут. */
function ubMinutes(minute: number): number {
  const { hour, minute: mins } = getZonedParts(new Date(minute * MINUTE));
  return hour * 60 + mins;
}

function dayLabel(minute: number, day: SearchDay, locale: Locale): string {
  const now = new Date(minute * MINUTE);
  return formatDayLabel(day === "today" ? now : new Date(now.getTime() + 24 * 60 * MINUTE), locale);
}

/**
 * Ойролцоох газруудын сул цагуудыг нэг нийтлэг цагийн шугам дээр, DB-д
 * захиалагдсанийг нь зураасаар дарж харуулна. Төрлөөр шүүх, хамгийн ойр, үнэлгээ
 * эсвэл үнээр эрэмбэлэх, өдрийн дундуур үсрэх, газар бүрийн дараагийн сул цаг болон
 * өдөр нь хэр дүүрснийг харах боломжтой. Сул цаг бүр radio товч тул Tab-аар самбарт
 * хүрч, сумтай товчоор цагуудаар явна.
 */
export function TodayBoard({ id, rows }: { id?: string; rows: readonly BoardRow[] }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const minute = useSyncExternalStore(subscribeToMinute, getMinute, getServerMinute);
  const nowRaw = minute === null ? null : ubMinutes(minute);

  const [chosenDay, setChosenDay] = useState<SearchDay | null>(null);
  const [group, setGroup] = useState<GroupFilter>("all");
  const [sort, setSort] = useState<SearchSort>("soonest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string | null>(null);

  const day: SearchDay =
    chosenDay ?? (nowRaw !== null && nowRaw >= FLIP_TO_TOMORROW ? "tomorrow" : "today");
  const isToday = day === "today";
  const nowMinutes = isToday ? nowRaw : null;
  const needle = nowMinutes !== null && nowMinutes >= DAY_START && nowMinutes <= DAY_END;

  const isPast = (start: number): boolean => nowMinutes !== null && start < nowMinutes;
  const freeTimes = (row: BoardRow): string[] =>
    row.slots[day]
      .filter((slot) => !slot.taken && !isPast(toMinutes(slot.time)))
      .map((slot) => slot.time);

  // Самбар дээрх газрын төрлүүд, тус бүр хэдэн сул цагтай.
  const groups = CATEGORY_GROUPS.filter((item) => rows.some((row) => row.group === item.slug));
  const freeIn = (filter: GroupFilter): number =>
    rows
      .filter((row) => filter === "all" || row.group === filter)
      .reduce((sum, row) => sum + freeTimes(row).length, 0);

  const firstFree = (row: BoardRow): number => {
    const first = freeTimes(row)[0];
    return first ? toMinutes(first) : Number.POSITIVE_INFINITY;
  };
  const sorted = [...rows.filter((row) => group === "all" || row.group === group)].sort((a, b) =>
    sort === "rating"
      ? b.rating - a.rating
      : sort === "price"
        ? a.price - b.price
        : firstFree(a) - firstFree(b) || b.rating - a.rating,
  );
  const visible = sorted.slice(0, MAX_ROWS);
  const hiddenCount = sorted.length - visible.length;
  const hiddenOnPhone = sorted.length - Math.min(visible.length, PHONE_ROWS);
  const openCount = freeIn(group);

  // Харагдаж буй газруудын хамгийн ойрын сул цаг лугшиж харагдана.
  const soonest = visible.reduce<{ row: BoardRow; start: number } | null>((best, row) => {
    const start = firstFree(row);
    return Number.isFinite(start) && (!best || start < best.start) ? { row, start } : best;
  }, null);

  const until = (start: number): string | null =>
    isToday && minute !== null && nowMinutes !== null
      ? t.board.inTime(
          formatCountdown(
            new Date((minute + start - nowMinutes) * MINUTE),
            minute * MINUTE,
            locale,
          ),
        )
      : null;

  const selected = (() => {
    if (!selectedId) return null;
    const [slug, time] = selectedId.split("@");
    const row = visible.find((item) => item.slug === slug);
    if (!row || !time || !freeTimes(row).includes(time)) return null;
    return { row, start: toMinutes(time) };
  })();

  const scrollTo = (minutes: number, smooth = true): void => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    const hourWidth = track.offsetWidth / HOURS.length;
    scroller.scrollTo({
      left: Math.max(0, (toTrackHours(minutes) - 0.75) * hourWidth),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Цаг тодорхой болмогц (мөн өдөр солигдох бүрт) хэрэгтэй хэсгийг харагдах хүрээнд оруулна.
  useEffect(() => {
    const key = `${day}:${needle ? "now" : "start"}`;
    if (minute === null || scrolledFor.current === key) return;
    scrolledFor.current = key;
    scrollTo(needle && nowMinutes !== null ? nowMinutes : DAY_START, false);
  });

  const chooseDay = (next: SearchDay): void => {
    setChosenDay(next);
    setSelectedId(null);
  };

  const searchHref = toSearchHref({
    ...DEFAULT_FILTERS,
    cat: group === "all" ? "" : group,
    day,
  });

  return (
    <section
      id={id}
      aria-labelledby="today-board-title"
      className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-surface shadow-md"
    >
      {/* Толгой: аль өдөр, Улаанбаатарын амьд цаг, хамгийн ойрын сул цаг */}
      <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {/* Тасардаггүй зай hydration-оос өмнө мөрийн өндрийг хадгална. */}
            {minute !== null ? dayLabel(minute, day, locale) : " "}
          </p>
          <h2
            id="today-board-title"
            className="mt-1 font-heading text-lg font-medium tracking-tight text-foreground sm:text-xl"
          >
            {isToday ? t.board.todayTitle : t.board.tomorrowTitle}
          </h2>
          {soonest && minute !== null ? (
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-primary-strong" />
              </span>
              <span className="truncate">
                {t.board.soonest(
                  soonest.row.name,
                  toClock(soonest.start),
                  until(soonest.start) ?? t.common.tomorrowWord,
                )}
              </span>
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-right">
          <span className="sr-only">{t.board.clockSr} </span>
          <span
            className={cn(
              "block font-heading text-2xl leading-none font-medium tabular-nums sm:text-3xl",
              nowRaw === null && "invisible",
            )}
          >
            {nowRaw === null ? "00:00" : toClock(nowRaw)}
          </span>
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {minute !== null ? t.board.openLeft(openCount) : " "}
          </span>
        </p>
      </div>

      {/* Удирдлага: өдөр, газрын төрөл, үсрэх, эрэмбэлэх */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex min-w-0 scrollbar-none items-center gap-2 overflow-x-auto mask-[linear-gradient(to_right,black_calc(100%-2rem),transparent)] px-1 py-0.5 pr-8">
          <fieldset className="flex shrink-0 rounded-full border border-border bg-background p-0.5">
            <legend className="sr-only">{t.board.dayLegend}</legend>
            {(["today", "tomorrow"] as const).map((option) => (
              <label key={option} className="relative">
                <input
                  type="radio"
                  name="board-day"
                  checked={day === option}
                  onChange={() => chooseDay(option)}
                  className="peer sr-only"
                />
                <span className="flex h-8 cursor-pointer items-center rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors duration-150 ease-soft peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring is-hover:text-foreground peer-checked:is-hover:text-background">
                  {option === "today" ? t.common.today : t.common.tomorrow}
                </span>
              </label>
            ))}
          </fieldset>
          <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
          <fieldset className="flex shrink-0 items-center gap-1.5">
            <legend className="sr-only">{t.board.filterLegend}</legend>
            {[{ slug: "all" as const, icon: null }, ...groups].map((item) => {
              const Icon = item.icon;
              const count = freeIn(item.slug);
              return (
                <label key={item.slug} className="relative shrink-0">
                  <input
                    type="radio"
                    name="board-group"
                    checked={group === item.slug}
                    onChange={() => {
                      setGroup(item.slug);
                      setSelectedId(null);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors duration-150 ease-soft peer-checked:border-primary-strong peer-checked:bg-primary-soft peer-checked:text-primary-strong peer-focus-visible:ring-3 peer-focus-visible:ring-ring is-hover:border-muted-foreground">
                    {Icon ? <Icon className="size-3.5" /> : null}
                    {item.slug === "all" ? t.board.all : t.groups[item.slug].label}
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label={t.board.jumpLegend} className="flex items-center gap-0.5">
            {needle ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => nowMinutes !== null && scrollTo(nowMinutes)}
              >
                {t.board.now}
              </Button>
            ) : null}
            {TIMES_OF_DAY.map((part) => (
              <Button
                key={part.value}
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground max-sm:hidden"
                onClick={() => scrollTo(part.from + 30)}
              >
                {t.search.parts[part.value]}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 max-sm:hidden">
            <span className="sr-only">{t.board.sortLabel}</span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SearchSort)}
              className="h-8 w-auto rounded-full py-0 pr-9 pl-3 text-xs font-medium"
            >
              {(["soonest", "rating", "price"] as const).map((option) => (
                <option key={option} value={option}>
                  {t.search.sorts[option]}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      {/* Хуваарь: нэрс зүүн талд наалттай үлдэж, өдөр гүйлгэгдэнэ */}
      <fieldset className="min-w-0">
        <legend className="sr-only">{t.board.legend}</legend>
        <div
          ref={scrollerRef}
          className="relative scroll-pl-(--names) overflow-x-auto overscroll-x-contain [--hour:5rem] [--names:10.5rem] sm:[--hour:6rem] sm:[--names:15rem]"
        >
          <div
            key={`${day}-${group}-${sort}`}
            className="relative w-max animate-in duration-300 ease-soft fade-in"
          >
            {/* Цагийн шугам */}
            <div aria-hidden className="flex border-b border-border">
              <div className="sticky left-0 z-20 w-(--names) shrink-0 bg-surface" />
              <div className="relative h-9 w-[calc(var(--hour)*12)]">
                {HOURS.map((hour, index) => (
                  <span
                    key={hour}
                    style={{ "--at": index } as CSSProperties}
                    className="absolute top-0 bottom-0 left-[calc(var(--hour)*var(--at))] flex items-center border-l border-border pl-2 text-xs text-muted-foreground tabular-nums first:border-l-0"
                  >
                    {/* Зүү өөрийн цагийн шошготой; түүний халхлах цагийг нууна. */}
                    <span
                      className={cn(
                        needle &&
                          nowMinutes !== null &&
                          nowMinutes - hour * 60 > -15 &&
                          nowMinutes - hour * 60 < 45 &&
                          "invisible",
                      )}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {visible.map((row, rowIndex) => (
              <BoardRowView
                key={row.slug}
                row={row}
                phoneHidden={rowIndex >= PHONE_ROWS}
                day={day}
                trackRef={rowIndex === 0 ? trackRef : undefined}
                nowMinutes={nowMinutes}
                needle={needle}
                isPast={isPast}
                free={freeTimes(row)}
                soonestId={soonest ? `${soonest.row.slug}@${toClock(soonest.start)}` : null}
                selectedId={selected ? selectedId : null}
                onSelect={setSelectedId}
              />
            ))}

            {/* Одоогийн шугам: бүх мөрийг дайрсан гүргэм өнгийн нэг зүү */}
            {needle && nowMinutes !== null ? (
              <div
                aria-hidden
                style={{ "--at": toTrackHours(nowMinutes) } as CSSProperties}
                className="pointer-events-none absolute top-0 bottom-0 left-[calc(var(--names)+var(--hour)*var(--at))] z-10 w-0.5 -translate-x-1/2 bg-sun"
              >
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-sun-foreground tabular-nums">
                  {toClock(nowMinutes)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </fieldset>

      {hiddenOnPhone > 0 ? (
        <Link
          href={searchHref}
          className={cn(
            hiddenCount === 0 && "sm:hidden",
            "flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 is-hover:bg-surface-muted",
          )}
        >
          <span>
            <span className="sm:hidden">{t.board.more(hiddenOnPhone)}</span>
            <span className="max-sm:hidden">{t.board.more(hiddenCount)}</span>{" "}
            <span className="font-normal text-muted-foreground">· {t.board.seeAll}</span>
          </span>
          <ArrowRight className="size-4" />
        </Link>
      ) : null}

      {/* Доод хэсэг: юу сонгогдсон, мөн цорын ганц үйлдэл */}
      <div
        aria-live="polite"
        className="flex min-h-20 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        {selected ? (
          <SelectedDetails
            key={`${selected.row.slug}-${selected.start}`}
            row={selected.row}
            start={selected.start}
            day={day}
            until={until(selected.start)}
            others={freeTimes(selected.row)
              .filter((time) => toMinutes(time) !== selected.start)
              .slice(0, 3)}
            onPick={(time) => setSelectedId(`${selected.row.slug}@${time}`)}
          />
        ) : openCount === 0 && minute !== null ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{t.board.empty}</p>
            {isToday ? (
              <Button variant="outline" size="sm" onClick={() => chooseDay("tomorrow")}>
                {t.book.seeTomorrow}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-sm text-muted-foreground">
              {isToday && nowRaw !== null && nowRaw < DAY_START
                ? t.board.beforeOpening
                : t.board.hint}
            </p>
            <ul
              aria-hidden
              className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground"
            >
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-full border border-primary-strong/35 bg-primary-soft" />
                {t.book.slotLegend.open}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-full border border-border bg-hatch" />
                {t.book.slotLegend.booked}
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

type BoardRowViewProps = {
  row: BoardRow;
  day: SearchDay;
  trackRef?: Ref<HTMLDivElement> | undefined;
  nowMinutes: number | null;
  needle: boolean;
  isPast: (start: number) => boolean;
  free: readonly string[];
  soonestId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Утасны мөрийн хязгаараас цаашхи. */
  phoneHidden?: boolean;
};

function BoardRowView({
  row,
  phoneHidden = false,
  day,
  trackRef,
  nowMinutes,
  needle,
  isPast,
  free,
  soonestId,
  selectedId,
  onSelect,
}: BoardRowViewProps): JSX.Element {
  const t = useT();
  const slots = row.slots[day];
  // Өдөр хэр дүүрсэн бэ: ажлын цагийн сул цаг болгон санал болгоогүй хувь.
  const freeMinutes = slots.filter((slot) => !slot.taken).length * row.duration;
  const load = Math.round(
    Math.min(98, Math.max(5, (1 - freeMinutes / (DAY_END - DAY_START)) * 100)),
  );
  const next = free[0];

  return (
    <div
      className={cn("flex border-b border-border last:border-b-0", phoneHidden && "max-sm:hidden")}
    >
      <div className="sticky left-0 z-20 flex w-(--names) shrink-0 flex-col justify-center gap-0.5 border-r border-border bg-surface py-2.5 pr-2 pl-4 sm:pr-3 sm:pl-6">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
          {row.reviewCount === 0 ? (
            <span className="shrink-0 rounded-full bg-sun-soft px-1.5 text-[10px] font-semibold text-sun-strong max-sm:hidden">
              {t.common.newPlace}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground tabular-nums max-sm:hidden">
              <Star className="size-3 fill-sun text-sun" />
              {row.rating.toFixed(1)}
            </span>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground max-sm:hidden">
          {row.service} · <span className="tabular-nums">{formatMNT(row.price)}</span>
        </span>
        <span
          className={cn(
            "truncate text-xs font-medium tabular-nums",
            next ? "text-primary-strong" : "text-muted-foreground",
          )}
        >
          {next ? t.board.next(next) : t.board.noneLeft}
        </span>
        <span
          title={t.board.load(load)}
          className="mt-1 flex h-1 w-full max-w-28 overflow-hidden rounded-full bg-surface-muted max-sm:hidden"
        >
          <span
            className={cn("h-full rounded-full", load >= 80 ? "bg-sun" : "bg-primary-strong/60")}
            style={{ width: `${load}%` }}
          />
          <span className="sr-only">{t.board.load(load)}</span>
        </span>
      </div>
      <div ref={trackRef} className="relative h-20 w-[calc(var(--hour)*12)] bg-hours">
        {/* Өнөөдөр аль хэдийн өнгөрсөн цаг */}
        {needle && nowMinutes !== null ? (
          <div
            aria-hidden
            style={{ "--at": toTrackHours(nowMinutes) } as CSSProperties}
            className="absolute inset-y-0 left-0 w-[calc(var(--hour)*var(--at))] bg-background/60"
          />
        ) : null}

        {slots.map((slot, index) => {
          const start = toMinutes(slot.time);
          const nextStart = slots[index + 1] ? toMinutes(slots[index + 1]!.time) : DAY_END;
          // Цаг нь үйлчилгээний урттай ижил өргөн, гэхдээ дараагийн эхлэх цаг руу хэзээ ч орохгүй.
          const length = Math.min(row.duration, nextStart - start);
          const slotId = `${row.slug}@${slot.time}`;
          const past = isPast(start);
          const unavailable = past || slot.taken;
          const isSoonest = slotId === soonestId;

          return (
            <label
              key={slot.time}
              style={{ "--at": toTrackHours(start), "--len": length / 60 } as CSSProperties}
              className="absolute inset-y-5 left-[calc(var(--hour)*var(--at)+2px)] w-[max(calc(var(--hour)*var(--len)-4px),2.75rem)]"
            >
              <input
                type="radio"
                name="today-slot"
                value={slotId}
                checked={selectedId === slotId}
                disabled={unavailable}
                onChange={() => onSelect(slotId)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex size-full items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-150 ease-soft select-none",
                  past
                    ? "border-transparent text-muted-foreground line-through decoration-1"
                    : slot.taken
                      ? "border-border bg-hatch text-muted-foreground"
                      : "cursor-pointer border-primary-strong/35 bg-primary-soft text-primary-strong is-hover:border-primary-strong",
                  isSoonest && "border-primary-strong sm:animate-beacon",
                  "peer-checked:animate-none peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-sm",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
                )}
              >
                {slot.time}
              </span>
              <span className="sr-only">
                {`, ${row.name}, ${row.service}`}
                {past ? `, ${t.board.pastSr}` : slot.taken ? `, ${t.board.takenSr}` : ""}
                {isSoonest ? `, ${t.board.soonestBadge}` : ""}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SelectedDetails({
  row,
  start,
  day,
  until,
  others,
  onPick,
}: {
  row: BoardRow;
  start: number;
  day: SearchDay;
  until: string | null;
  others: readonly string[];
  onPick: (time: string) => void;
}): JSX.Element {
  const t = useT();

  return (
    <>
      <div className="min-w-0 animate-in duration-250 ease-soft fade-in">
        <p className="flex flex-wrap items-center gap-x-2 text-base font-medium text-foreground">
          {row.name}
          {row.reviewCount === 0 ? (
            <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-semibold text-sun-strong">
              {t.common.newPlace}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-normal text-muted-foreground tabular-nums">
              <Star className="size-4 fill-sun text-sun" />
              <span className="sr-only">{t.common.ratingSr}</span>
              {row.rating.toFixed(1)}
              <span className="max-sm:hidden">· {t.board.reviews(row.reviewCount)}</span>
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {day === "today" ? t.common.today : t.common.tomorrow} {toClock(start)}–
            {toClock(start + row.duration)}
          </span>
          {until ? <span className="text-primary-strong"> · {until}</span> : null}
          {" · "}
          {row.service.toLowerCase()}, {formatMNT(row.price)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {t.districts[row.district]}, {row.area}
          </span>
        </p>
        {others.length > 0 ? (
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {t.board.alsoOpen}
            {others.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onPick(time)}
                className="rounded-full border border-primary-strong/35 bg-primary-soft px-2 py-0.5 font-medium text-primary-strong tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-primary-strong"
              >
                {time}
              </button>
            ))}
          </p>
        ) : null}
      </div>
      <Button asChild size="md" className="sm:shrink-0">
        <Link
          href={`/book/${row.slug}?${new URLSearchParams({
            day,
            time: toClock(start),
            service: String(row.serviceIndex),
          }).toString()}`}
        >
          {t.board.book}
          <ArrowRight data-icon="end" />
        </Link>
      </Button>
    </>
  );
}
