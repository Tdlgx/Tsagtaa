"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { CssVar } from "@/app/(internal)/design-system/_lib/tokens";

// next-themes <html> дээр `.dark` класс солих бүрт дахин уншина.
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/**
 * <html> дээрх CSS хувьсагчийн одоогийн утгууд, жишээ нь "--primary" → "#1f4d3f".
 * Сервер дээр null буцаана (утгууд зөвхөн browser-т байдаг).
 * Модулийн түвшний тогтмол массив дамжуулна, ингэснээр identity нь тогтвортой байна.
 */
export function useTokenValues(names: readonly CssVar[]): ReadonlyMap<CssVar, string> | null {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      const styles = getComputedStyle(document.documentElement);
      return names.map((name) => styles.getPropertyValue(name).trim()).join("|");
    },
    () => "",
  );

  return useMemo(() => {
    if (!snapshot) return null;
    const values = snapshot.split("|");
    return new Map(names.map((name, index) => [name, values[index] ?? ""]));
  }, [snapshot, names]);
}
