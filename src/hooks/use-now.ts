import { useSyncExternalStore } from "react";

type Clock = {
  now: number;
  listeners: Set<() => void>;
  timer?: number;
  /** Stable per interval: a new function each render would make React resubscribe forever. */
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => number;
};

/** One shared timer per interval, however many components read it. */
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
        // The clock may have slept with no readers; catch up before ticking again.
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
 * Current time in ms, refreshed every `intervalMs`. `null` on the server and
 * during hydration, so nothing time-dependent renders twice with different values.
 */
export function useNow(intervalMs = 30_000): number | null {
  const clock = getClock(intervalMs);
  return useSyncExternalStore<number | null>(clock.subscribe, clock.getSnapshot, getServerSnapshot);
}
