import { useSyncExternalStore } from "react";

const subscribe = (): (() => void) => () => {};

/**
 * Сервер дээр render болон hydration-ий үед `false`, дараа нь `true`.
 * Зөвхөн browser-т байдаг төлөвөөс (жишээ нь хадгалсан theme) хамаарах UI-д
 * hydration-ий зөрүүнээс зайлсхийхэд ашиглана.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
