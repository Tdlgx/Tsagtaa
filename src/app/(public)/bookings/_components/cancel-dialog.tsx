"use client";

import { AlertDialog } from "radix-ui";
import { useState, type JSX, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelBookingAction } from "@/features/booking/actions";
import { type Booking } from "@/features/booking/booking";
import { cancelBooking } from "@/features/booking/booking-store";
import { useT } from "@/i18n/client";
import { formatTime } from "@/lib/date";

type CancelDialogProps = {
  booking: Booking;
  dayLabel: string;
  /** The button that opens the dialog. */
  children: ReactNode;
};

/**
 * Confirms before cancelling; cancelling cannot be undone. The booking is
 * cancelled in the database first, which frees the time for others; only then
 * on this device. Bookings the database does not know (made before it, or the
 * guide's sample) are cancelled on this device only.
 */
export function CancelDialog({ booking, dayLabel, children }: CancelDialogProps): JSX.Element {
  const t = useT();
  const when = `${dayLabel.toLowerCase()} ${formatTime(booking.startsAt)}`;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = async (): Promise<void> => {
    setPending(true);
    const result = await cancelBookingAction({ id: booking.id, phone: booking.phone });
    setPending(false);
    if (!result.ok && result.error === "server") {
      toast.error(t.cancel.error);
      return;
    }
    cancelBooking(booking.id);
    setOpen(false);
    toast(t.cancel.done, {
      description: `${booking.businessName}, ${formatTime(booking.startsAt)}`,
    });
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-brand-ink/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg duration-250 ease-soft data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in">
          <AlertDialog.Title className="font-heading text-xl font-medium text-foreground">
            {t.cancel.title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground tabular-nums">
            {t.cancel.body(booking.businessName, when, booking.serviceName.toLowerCase())}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{t.cancel.keep}</Button>
            </AlertDialog.Cancel>
            {/* Not an AlertDialog.Action: that would close the dialog before the server answers. */}
            <Button variant="destructive" loading={pending} onClick={() => void confirm()}>
              {t.cancel.confirm}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
