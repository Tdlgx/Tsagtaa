"use client";

import type { JSX } from "react";
import { toast } from "sonner";

type SlotButtonProps = {
  time: string;
  businessName: string;
};

/** One open start time in a search result. Booking itself arrives with the business page. */
export function SlotButton({ time, businessName }: SlotButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() =>
        toast("Энэ бол жишээ хуваарь", {
          description: `${businessName}, ${time}. Бодит газрууд нэмэгдсэний дараа энэ товч захиалгыг шууд эхлүүлнэ.`,
        })
      }
      className="flex h-10 min-w-16 items-center justify-center rounded-full border border-primary/35 bg-primary-soft px-3 text-sm font-medium text-primary tabular-nums transition-colors duration-150 ease-soft outline-none select-none is-hover:border-primary is-focus:ring-3 is-focus:ring-ring"
    >
      {time}
      <span className="sr-only">, {businessName}</span>
    </button>
  );
}
