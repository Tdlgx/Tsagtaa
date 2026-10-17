"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { CssVar } from "@/app/(internal)/design-system/_lib/tokens";

// Re-read when next-themes toggles the `.dark` class on <html>.
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/**
 * Live values of CSS custom properties on <html>, e.g. "--primary" → "#1f4d3f".
 * Returns null on the server (values exist only in the browser).
 * Pass a module-level constant array so its identity stays stable.
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
