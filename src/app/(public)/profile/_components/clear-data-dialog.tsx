"use client";

import { Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clearBookings } from "@/features/booking/booking-store";
import { clearProfile } from "@/features/profile/profile-store";
import { useT } from "@/i18n/client";

/** Wipes the profile and every booking stored on this device, after confirming. */
export function ClearDataDialog({ bookingCount }: { bookingCount: number }): JSX.Element {
  const t = useT();

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="outline" className="text-danger-foreground">
          <Trash2 data-icon="start" />
          {t.profile.clear}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-brand-ink/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg duration-250 ease-soft data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in">
          <AlertDialog.Title className="font-heading text-xl font-medium text-foreground">
            {t.profile.clearTitle}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {t.profile.clearBody(bookingCount)}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  clearBookings();
                  clearProfile();
                  toast(t.profile.cleared);
                }}
              >
                {t.profile.clearConfirm}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
