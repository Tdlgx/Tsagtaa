"use client";

import type { Booking } from "@/features/booking/booking";
import { createLocalStore } from "@/lib/local-store";

/** Bookings made in this browser, one list per account (and one for signed out). */
const store = createLocalStore<readonly Booking[]>(
  "tsagtaa.bookings.v1",
  [],
  (raw) => (Array.isArray(raw) ? (raw as Booking[]) : []),
  { perAccount: true },
);

/** `null` while rendering on the server / hydrating: "not known yet", not "none". */
export function useBookings(): readonly Booking[] | null {
  return store.use();
}

export function addBooking(booking: Booking): void {
  store.write([...store.read(), booking]);
}

export function cancelBooking(id: string): void {
  store.write(
    store
      .read()
      .map((booking) =>
        booking.id === id ? { ...booking, status: "cancelled" as const } : booking,
      ),
  );
}

export function removeBooking(id: string): void {
  store.write(store.read().filter((booking) => booking.id !== id));
}

export function clearBookings(): void {
  store.clear();
}
