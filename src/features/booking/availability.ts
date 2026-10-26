import { toStartInstant } from "@/features/booking/booking";
import type { SearchDay } from "@/features/business/search";

const DAY_MINUTES = 24 * 60;

/** Баталгаажсан захиалгын цаг, өнөөдөр эсвэл маргаашийн шөнө дундаас (Улаанбаатар) хойших минутаар. */
export type TakenSlot = { staffId: string; day: SearchDay; start: number; end: number };

/** Улаанбаатарын өнөөдөр ба маргааш: захиалгын хуудасны санал болгодог 48 цаг. */
export function getBookableWindow(now: Date): { from: Date; to: Date } {
  const from = toStartInstant("today", "00:00", now);
  return { from, to: new Date(from.getTime() + 2 * DAY_MINUTES * 60_000) };
}

/** Хадгалсан захиалгууд → захиалгын хуудасны хоёр өдөр дээрх минутууд. */
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
 * `start`-аас эхлэх `duration` минут энэ хүний захиалгын аль нэгтэй давхцах уу?
 * Зөвхөн цаг харуулахад: эцсийн шийдвэрийг DB-ийн давхцлын constraint гаргана.
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
