"use client";

import { Star } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type JSX,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatMNT } from "@/lib/currency";
import { formatWeekday, getZonedParts } from "@/lib/date";
import { cn } from "@/lib/utils";

/** The board shows one working day, 09:00–21:00 Ulaanbaatar time. */
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => 9 + i);
/** After this time today has nothing left worth showing, so the board flips to tomorrow. */
const FLIP_TO_TOMORROW = 20 * 60 + 30;

type Venue = {
  id: string;
  name: string;
  service: string;
  district: string;
  rating: number;
  price: number;
  /** Minutes per appointment; sets the width of every slot in the row. */
  duration: number;
  /** Open start times, "HH:MM". Gaps between them are already booked. */
  open: readonly string[];
};

// Sample data until real businesses are connected.
const VENUES: readonly Venue[] = [
  {
    id: "ongo",
    name: "Өнгө салон",
    service: "Эмэгтэй үс засалт",
    district: "Сүхбаатар дүүрэг",
    rating: 4.9,
    price: 35000,
    duration: 45,
    open: ["09:30", "11:00", "12:30", "14:15", "16:00", "17:30", "19:00"],
  },
  {
    id: "khaan",
    name: "Хаан барбер",
    service: "Эрэгтэй үс засалт",
    district: "Хан-Уул дүүрэг",
    rating: 4.8,
    price: 25000,
    duration: 30,
    open: ["09:00", "10:00", "10:30", "13:00", "15:30", "16:00", "18:00", "19:30", "20:00"],
  },
  {
    id: "gerelt",
    name: "Гэрэлт маникюр",
    service: "Гель будалт",
    district: "Баянзүрх дүүрэг",
    rating: 4.7,
    price: 40000,
    duration: 60,
    open: ["10:00", "12:00", "15:00", "17:00", "19:00"],
  },
  {
    id: "amar",
    name: "Амар массаж",
    service: "Нуруу, хүзүүний массаж",
    district: "Чингэлтэй дүүрэг",
    rating: 4.9,
    price: 60000,
    duration: 60,
    open: ["09:00", "11:30", "14:00", "16:30", "18:30"],
  },
  {
    id: "tod",
    name: "Тод гоо сайхан",
    service: "Сормуус суулгалт",
    district: "Сонгинохайрхан дүүрэг",
    rating: 4.6,
    price: 55000,
    duration: 90,
    open: ["10:00", "13:00", "16:30", "19:00"],
  },
];

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/** Position on the track, in hours from 09:00 (multiplied by --hour in CSS). */
function toTrackHours(totalMinutes: number): number {
  return (totalMinutes - DAY_START) / 60;
}

/*
 * A minute-precision clock shared by every subscriber. The snapshot is the
 * current minute number, so React re-renders once a minute at most. On the
 * server it is null: the board renders without "now" and fills it in after
 * hydration, which avoids a mismatch between server and browser time.
 */
const MINUTE = 60_000;

function subscribeToMinute(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 10_000);
  return () => window.clearInterval(id);
}

function getMinute(): number {
  return Math.floor(Date.now() / MINUTE);
}

function getServerMinute(): null {
  return null;
}

type BoardDay = {
  isToday: boolean;
  /** "Мягмар, 10-р сарын 7" */
  dateLabel: string;
  /** Minutes since midnight in Ulaanbaatar, or null when "now" is off the board. */
  nowMinutes: number | null;
  clock: string;
};

function describeDay(minute: number): BoardDay {
  const now = new Date(minute * MINUTE);
  const { hour, minute: mins } = getZonedParts(now);
  const nowMinutes = hour * 60 + mins;
  const isToday = nowMinutes < FLIP_TO_TOMORROW;
  const shown = isToday ? now : new Date(now.getTime() + 24 * 60 * MINUTE);
  const { month, day } = getZonedParts(shown);

  return {
    isToday,
    dateLabel: `${formatWeekday(shown)}, ${month}-р сарын ${day}`,
    nowMinutes: isToday && nowMinutes >= DAY_START ? nowMinutes : null,
    clock: toClock(nowMinutes),
  };
}

/**
 * Today's open times across nearby places, laid out on one shared clock.
 * Every open time is a radio button, so Tab reaches the board and the arrow
 * keys walk through slots without any custom keyboard code.
 */
export function TodayBoard({ id }: { id?: string }): JSX.Element {
  const minute = useSyncExternalStore(subscribeToMinute, getMinute, getServerMinute);
  const day = minute === null ? null : describeDay(minute);
  const nowMinutes = day?.nowMinutes ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  // Once the time is known, scroll the board so "now" sits near the left edge.
  useEffect(() => {
    if (didScroll.current || nowMinutes === null) return;
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    didScroll.current = true;
    const hourWidth = track.offsetWidth / HOURS.length;
    scroller.scrollLeft = Math.max(0, (toTrackHours(nowMinutes) - 0.75) * hourWidth);
  }, [nowMinutes]);

  const isPast = (start: number): boolean => nowMinutes !== null && start < nowMinutes;
  const nearNow = (minutes: number): boolean =>
    nowMinutes !== null && nowMinutes - minutes > -15 && nowMinutes - minutes < 45;
  const isBeforeOpening = day?.isToday === true && nowMinutes === null;

  const selected = (() => {
    if (!selectedId) return null;
    const [venueId, time] = selectedId.split("@");
    const venue = VENUES.find((item) => item.id === venueId);
    if (!venue || !time || isPast(toMinutes(time))) return null;
    return { venue, start: toMinutes(time) };
  })();

  const openCount = VENUES.reduce(
    (count, venue) => count + venue.open.filter((time) => !isPast(toMinutes(time))).length,
    0,
  );

  return (
    <section
      id={id}
      aria-labelledby="today-board-title"
      className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-surface shadow-md"
    >
      {/* Header: which day, and the live Ulaanbaatar time --------------- */}
      <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {/* Non-breaking space keeps the line height before hydration. */}
            {day ? day.dateLabel : " "}
          </p>
          <h2
            id="today-board-title"
            className="mt-1 font-heading text-lg font-medium tracking-tight text-foreground sm:text-xl"
          >
            {day && !day.isToday ? "Маргаашийн сул цагууд" : "Өнөөдрийн сул цагууд"}
          </h2>
        </div>
        <p className="shrink-0 text-right">
          <span className="sr-only">Улаанбаатарын цаг: </span>
          <span
            className={cn(
              "block font-heading text-2xl leading-none font-medium tabular-nums sm:text-3xl",
              !day && "invisible",
            )}
          >
            {day ? day.clock : "00:00"}
          </span>
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {day ? `${openCount} сул цаг үлдсэн` : " "}
          </span>
        </p>
      </div>

      {/* Schedule: names stay pinned on the left, the day scrolls -------- */}
      <fieldset className="min-w-0">
        <legend className="sr-only">Сул цаг сонгох</legend>
        <div
          ref={scrollerRef}
          className="relative scroll-pl-(--names) overflow-x-auto overscroll-x-contain [--hour:5rem] [--names:8.5rem] sm:[--hour:6rem] sm:[--names:13rem]"
        >
          <div className="relative w-max">
            {/* Hour ruler */}
            <div aria-hidden className="flex border-b border-border">
              <div className="sticky left-0 z-20 w-(--names) shrink-0 bg-surface" />
              <div className="relative h-9 w-[calc(var(--hour)*12)]">
                {HOURS.map((hour, index) => (
                  <span
                    key={hour}
                    style={{ "--at": index } as CSSProperties}
                    className="absolute top-0 bottom-0 left-[calc(var(--hour)*var(--at))] flex items-center border-l border-border pl-2 text-xs text-muted-foreground tabular-nums first:border-l-0"
                  >
                    {/* The needle carries its own time label; hide the hour it would cover. */}
                    <span className={cn(nearNow(hour * 60) && "invisible")}>
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {VENUES.map((venue) => (
              <div key={venue.id} className="flex border-b border-border last:border-b-0">
                <div className="sticky left-0 z-20 flex w-(--names) shrink-0 flex-col justify-center gap-0.5 border-r border-border bg-surface py-3 pr-2 pl-4 sm:pr-3 sm:pl-6">
                  <span className="truncate text-sm font-medium text-foreground">{venue.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{venue.service}</span>
                </div>
                <div
                  ref={venue === VENUES[0] ? trackRef : undefined}
                  className="relative h-16 w-[calc(var(--hour)*12)] bg-hours"
                >
                  {/* Time that has already gone today */}
                  {nowMinutes !== null ? (
                    <div
                      aria-hidden
                      style={{ "--at": toTrackHours(nowMinutes) } as CSSProperties}
                      className="absolute inset-y-0 left-0 w-[calc(var(--hour)*var(--at))] bg-background/60"
                    />
                  ) : null}

                  {venue.open.map((time) => {
                    const start = toMinutes(time);
                    const slotId = `${venue.id}@${time}`;
                    const past = isPast(start);

                    return (
                      <label
                        key={time}
                        style={
                          {
                            "--at": toTrackHours(start),
                            "--len": venue.duration / 60,
                          } as CSSProperties
                        }
                        className="absolute inset-y-3 left-[calc(var(--hour)*var(--at)+2px)] w-[calc(var(--hour)*var(--len)-4px)]"
                      >
                        <input
                          type="radio"
                          name="today-slot"
                          value={slotId}
                          checked={selected !== null && selectedId === slotId}
                          disabled={past}
                          onChange={() => setSelectedId(slotId)}
                          className="peer sr-only"
                        />
                        <span
                          className={cn(
                            "flex size-full items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-150 ease-soft select-none",
                            past
                              ? "border-transparent text-muted-foreground line-through decoration-1"
                              : "cursor-pointer border-primary/35 bg-primary-soft text-primary is-hover:border-primary",
                            "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-sm",
                            "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
                          )}
                        >
                          {time}
                        </span>
                        <span className="sr-only">
                          {`, ${venue.name}, ${venue.service}`}
                          {past ? ", өнгөрсөн" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* The now-line: one saffron needle across every row */}
            {nowMinutes !== null ? (
              <div
                aria-hidden
                style={{ "--at": toTrackHours(nowMinutes) } as CSSProperties}
                className="pointer-events-none absolute top-0 bottom-0 left-[calc(var(--names)+var(--hour)*var(--at))] z-10 w-0.5 -translate-x-1/2 animate-in bg-sun duration-700 ease-soft fade-in slide-in-from-left-8"
              >
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-sun-foreground tabular-nums">
                  {day?.clock}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </fieldset>

      {/* Footer: what is selected, and the one action ------------------ */}
      <div
        aria-live="polite"
        className="flex min-h-20 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        {selected ? (
          <>
            <div
              key={`${selected.venue.id}-${selected.start}`}
              className="min-w-0 animate-in duration-250 ease-soft fade-in"
            >
              <p className="flex flex-wrap items-center gap-x-2 text-base font-medium text-foreground">
                {selected.venue.name}
                <span className="inline-flex items-center gap-1 text-sm font-normal text-muted-foreground tabular-nums">
                  <Star className="size-4 fill-sun text-sun" />
                  <span className="sr-only">Үнэлгээ:</span>
                  {selected.venue.rating.toFixed(1)}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground tabular-nums">
                  {day && !day.isToday ? "Маргааш" : "Өнөөдөр"} {toClock(selected.start)}–
                  {toClock(selected.start + selected.venue.duration)}
                </span>
                , {selected.venue.service.toLowerCase()}, {formatMNT(selected.venue.price)}
              </p>
            </div>
            <Button
              size="md"
              className="sm:shrink-0"
              onClick={() =>
                toast("Энэ бол жишээ хуваарь", {
                  description: "Бодит газрууд нэмэгдсэний дараа энэ товч захиалгыг шууд үүсгэнэ.",
                })
              }
            >
              Захиалах
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isBeforeOpening
              ? "Газрууд 09:00-аас нээгдэнэ. Одооноос цагаа сонгоод захиалж болно."
              : "Тохирох цаг дээр дарахад үнэ, үргэлжлэх хугацаа нь энд гарна."}
          </p>
        )}
      </div>
    </section>
  );
}
