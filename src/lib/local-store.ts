"use client";

import { useSyncExternalStore } from "react";

/*
 * Энэ browser хэний өгөгдлийг харуулж байна вэ: нэвтрээгүй бол "", үгүй бол бүртгэлийн
 * id. `perAccount`-оор үүсгэсэн store-ууд бүртгэл бүрт тусдаа хуулбартай тул өөр
 * хүнээр нэвтрэхэд өмнөх хүнийх биш, хоосон профайл, захиалгын жагсаалтаас эхэлнэ.
 */
let scope = "";
const SCOPE_EVENT = "local-store:scope";

/** Render хийх үед тохирдог (эцэг нь ороосон store-уудаасаа өмнө render хийгддэг) тул эхний уншилт аль хэдийн зөв. */
export function setStorageScope(accountId: string): void {
  scope = accountId;
}

/** Бүртгэл өөрчлөгдсөний дараа: бүртгэл тус бүрийн store бүр шинэ түлхүүрээр дахин уншина. */
export function announceStorageScope(): void {
  window.dispatchEvent(new Event(SCOPE_EVENT));
}

export type LocalStore<T> = {
  /** Одоогийн утга; сервер дээр болон hydration-ий үед `null` ("хараахан мэдэгдээгүй"). */
  use: () => T | null;
  read: () => T;
  write: (value: T) => void;
  clear: () => void;
};

/**
 * localStorage дахь JSON утгыг `useSyncExternalStore`-оор гаргадаг тул бүх уншигч,
 * тэр дундаа бусад нээлттэй таб хамт шинэчлэгдэнэ. Профайл болон захиалгын жагсаалт
 * энд бүртгэл бүрээр хадгалагдана (`perAccount`-ийг үз).
 *
 * `parse` нь хадгалсан аливаа зүйлийг (хуучин эсвэл гараар засварласан байж болно)
 * хүчинтэй утга болгож, бүтэхгүй бол `fallback` руу буцна.
 */
export function createLocalStore<T>(
  baseKey: string,
  fallback: T,
  parse: (raw: unknown) => T,
  options: { perAccount?: boolean } = {},
): LocalStore<T> {
  const event = `local-store:${baseKey}`;
  const keyNow = (): string => (options.perAccount && scope ? `${baseKey}@${scope}` : baseKey);
  // Өгөгдөл (болон хэнийх) өөрчлөгдөөгүй байхад snapshot ижил reference-ээ хадгалах ёстой.
  let cachedKey = "";
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const read = (): T => {
    const key = keyNow();
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cachedValue; // storage хаалттай (private горим): санах ой дахь утгыг хадгална
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
      // Хадгалагдаагүй ч энэ таб шинэ утгыг харсаар байна.
    }
    window.dispatchEvent(new Event(event));
  };

  const clear = (): void => {
    cachedValue = fallback;
    cachedRaw = null;
    try {
      window.localStorage.removeItem(keyNow());
    } catch {
      // Устгах хадгалсан зүйл алга.
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
