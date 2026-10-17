import { useSyncExternalStore } from "react";

const subscribe = (): (() => void) => () => {};

/**
 * `false` during server rendering and hydration, `true` afterwards.
 * Use it for UI that depends on browser-only state (e.g. the saved theme)
 * to avoid hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
