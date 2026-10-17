import { toStartInstant } from "@/features/booking/booking";
import type { SearchDay } from "@/features/business/search";

const DAY_MINUTES = 24 * 60;

/** A confirmed booking's time, in minutes from midnight (Ulaanbaatar) of today or tomorrow. */
export type TakenSlot = { staffId: string; day: SearchDay; start: number; end: number };

/** Today and tomorrow in Ulaanbaatar: the 48 hours the booking page offers. */
export function getBookableWindow(now: Date): { from: Date; to: Date } {
  const from = toStartInstant("today", "00:00", now);
  return { from, to: new Date(from.getTime() + 2 * DAY_MINUTES * 60_000) };
}

/** Stored bookings → minutes on the booking page's two days. */
export function toTakenSlots(
  ranges: readonly { staffId: string; startsAt: Date; endsAt: Date }[],
  now: Date,
): TakenSlot[] {
  const midnight = getBookableWindow(now).from.getTime();
  return ranges.map(({ staffId, startsAt, endsAt }) => {
    const start = (startsAt.getTime() - midnight) / 60_000;
    const end = (endsAt.getTime() - midnight) / 60_000;
    const shift = start >= DAY_MINUTES ? DAY_MINUTES : 0;
    return { staffId, day: shift ? "tomorrow" : "today", start: start - shift, end: end - shift };
  });
}

/**
 * Would `duration` minutes from `start` overlap one of this person's bookings?
 * Only for showing times: the database's overlap constraint has the final say.
 */
export function isTaken(
  taken: readonly TakenSlot[],
  staffId: string,
  day: SearchDay,
  start: number,
  duration: number,
): boolean {
  const end = start + Math.max(duration, 1);
  return taken.some(
    (slot) => slot.staffId === staffId && slot.day === day && slot.start < end && start < slot.end,
  );
}
