"use client";

import { useSyncExternalStore } from "react";

/*
 * Whose data this browser is showing: "" when signed out, otherwise the
 * account id. Stores created with `perAccount` keep a separate copy per
 * account, so signing in as someone else starts with an empty profile and
 * booking list instead of the previous person's.
 */
let scope = "";
const SCOPE_EVENT = "local-store:scope";

/** Set while rendering (parents render before the stores they wrap), so the first read is already right. */
export function setStorageScope(accountId: string): void {
  scope = accountId;
}

/** After the account changed: every per-account store re-reads under the new key. */
export function announceStorageScope(): void {
  window.dispatchEvent(new Event(SCOPE_EVENT));
}

export type LocalStore<T> = {
  /** Current value; `null` on the server and during hydration ("not known yet"). */
  use: () => T | null;
  read: () => T;
  write: (value: T) => void;
  clear: () => void;
};

/**
 * A JSON value in localStorage exposed through `useSyncExternalStore`, so
 * every reader updates together, including other open tabs. The profile and
 * the booking list live here, per account (see `perAccount`).
 *
 * `parse` turns whatever is stored (possibly old or hand-edited) into a valid
 * value, falling back to `fallback`.
 */
export function createLocalStore<T>(
  baseKey: string,
  fallback: T,
  parse: (raw: unknown) => T,
  options: { perAccount?: boolean } = {},
): LocalStore<T> {
  const event = `local-store:${baseKey}`;
  const keyNow = (): string => (options.perAccount && scope ? `${baseKey}@${scope}` : baseKey);
  // The snapshot must keep the same reference while the data (and whose it is) is unchanged.
  let cachedKey = "";
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const read = (): T => {
    const key = keyNow();
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cachedValue; // storage blocked (private mode): keep the in-memory value
    }
    if (key === cachedKey && raw === cachedRaw) return cachedValue;
    cachedKey = key;
    cachedRaw = raw;
    try {
      cachedValue = raw === null ? fallback : parse(JSON.parse(raw));
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  };

  const write = (value: T): void => {
    cachedValue = value;
    try {
      cachedRaw = JSON.stringify(value);
      cachedKey = keyNow();
      window.localStorage.setItem(cachedKey, cachedRaw);
    } catch {
      // Not persisted, but this tab still sees the new value.
    }
    window.dispatchEvent(new Event(event));
  };

  const clear = (): void => {
    cachedValue = fallback;
    cachedRaw = null;
    try {
      window.localStorage.removeItem(keyNow());
    } catch {
      // Nothing stored to remove.
    }
    window.dispatchEvent(new Event(event));
  };

  const subscribe = (onChange: () => void): (() => void) => {
    const onStorage = (storageEvent: StorageEvent): void => {
      if (storageEvent.key === keyNow() || storageEvent.key === null) onChange();
    };
    window.addEventListener(event, onChange);
    window.addEventListener(SCOPE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener(SCOPE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  };

  const getServerSnapshot = (): null => null;

  return {
    use: () => useSyncExternalStore<T | null>(subscribe, read, getServerSnapshot),
    read,
    write,
    clear,
  };
}
