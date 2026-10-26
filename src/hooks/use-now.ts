import { useSyncExternalStore } from "react";

type Clock = {
  now: number;
  listeners: Set<() => void>;
  timer?: number;
  /** Интервал бүрт тогтвортой: render бүрт шинэ функц бол React дахин дахин subscribe хийнэ. */
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
};

/** Хэдэн компонент уншсан ч интервал бүрт нэг нийтлэг timer. */
const clocks = new Map<number, Clock>();

function getClock(intervalMs: number): Clock {
  const existing = clocks.get(intervalMs);
  if (existing) return existing;

  const clock: Clock = {
    now: Date.now(),
    listeners: new Set(),
    subscribe: (onChange) => {
      clock.listeners.add(onChange);
      if (clock.timer === undefined) {
        // Уншигчгүй үед цаг унтсан байж магадгүй; дахин цохихоос өмнө гүйцнэ.
        clock.now = Date.now();
        clock.timer = window.setInterval(() => {
          clock.now = Date.now();
          clock.listeners.forEach((listener) => listener());
        }, intervalMs);
      }
      return () => {
        clock.listeners.delete(onChange);
        if (clock.listeners.size === 0) {
          window.clearInterval(clock.timer);
          clock.timer = undefined;
        }
      };
    },
    getSnapshot: () => clock.now,
  };
  clocks.set(intervalMs, clock);
  return clock;
}

const getServerSnapshot = (): null => null;

/**
 * Одоогийн цаг ms-ээр, `intervalMs` тутамд шинэчлэгдэнэ. Сервер дээр болон
 * hydration-ий үед `null`, ингэснээр цагаас хамаарах юу ч ялгаатай утгатайгаар хоёр удаа render хийгдэхгүй.
 */
export function useNow(intervalMs = 30_000): number | null {
  const clock = getClock(intervalMs);
  return useSyncExternalStore<number | null>(clock.subscribe, clock.getSnapshot, getServerSnapshot);
}
