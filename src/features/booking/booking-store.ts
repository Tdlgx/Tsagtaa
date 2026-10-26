"use client";

import type { Booking } from "@/features/booking/booking";
import { createLocalStore } from "@/lib/local-store";

/** Энэ browser-т хийсэн захиалгууд, бүртгэл бүрт нэг жагсаалт (нэвтрээгүй үед дахиад нэг). */
const store = createLocalStore<readonly Booking[]>(
  "tsagtaa.bookings.v1",
  [],
  (raw) => (Array.isArray(raw) ? (raw as Booking[]) : []),
  { perAccount: true },
);

/** Сервер дээр render / hydrate хийх үед `null`: "байхгүй" биш, "хараахан мэдэгдээгүй". */
export function useBookings(): readonly Booking[] | null {
  return store.use();
}

export function addBooking(booking: Booking): void {
  store.write([...store.read(), booking]);
}

/** Энэ төхөөрөмж дээрх захиалгыг цуцлагдсан гэж тэмдэглэнэ. */
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
