"use client";

import { createLocalStore } from "@/lib/local-store";

export type Profile = {
  name: string;
  /** 8 digits, already normalized. */
  phone: string;
  email: string;
  /** Square JPEG as a data URL (about 20–40 KB), or "" for none. Never leaves the device. */
  avatar: string;
  reminders: { dayBefore: boolean; hourBefore: boolean };
  createdAt: string;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  phone: "",
  email: "",
  avatar: "",
  reminders: { dayBefore: true, hourBefore: true },
  createdAt: "",
};

function parseProfile(raw: unknown): Profile {
  if (typeof raw !== "object" || raw === null) return EMPTY_PROFILE;
  const value = raw as Partial<Profile>;
  const text = (input: unknown): string => (typeof input === "string" ? input : "");
  return {
    name: text(value.name),
    phone: text(value.phone),
    email: text(value.email),
    // Only an image we made ourselves; anything else is dropped.
    avatar: text(value.avatar).startsWith("data:image/") ? text(value.avatar) : "",
    reminders: {
      dayBefore: value.reminders?.dayBefore ?? true,
      hourBefore: value.reminders?.hourBefore ?? true,
    },
    createdAt: text(value.createdAt),
  };
}

/** The customer's details on this device, one copy per account; they pre-fill the booking form. */
const store = createLocalStore<Profile>("tsagtaa.profile.v1", EMPTY_PROFILE, parseProfile, {
  perAccount: true,
});

export function useProfile(): Profile | null {
  return store.use();
}

export function readProfile(): Profile {
  return store.read();
}

export function saveProfile(changes: Partial<Omit<Profile, "createdAt">>): void {
  const current = store.read();
  store.write({
    ...current,
    ...changes,
    createdAt: current.createdAt || new Date().toISOString(),
  });
}

export function clearProfile(): void {
  store.clear();
}
