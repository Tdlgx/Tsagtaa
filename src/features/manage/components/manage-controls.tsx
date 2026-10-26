"use client";

import { Check, Plus, UserMinus, X } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent, type JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  addManagerAction,
  cancelBookingAsManager,
  markAttendanceAction,
  removeManagerAction,
  type ActionResult,
} from "@/features/manage/actions";
import { useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type MemberError = keyof Dictionary["dashboard"]["memberErrors"];

/** Багийн үйлдлийн toast; хуудас өөрөө action-оор шинэчлэгдэнэ. */
export function reportMember(result: ActionResult, t: Dictionary): boolean {
  if (result.ok) {
    toast.success(
      result.message === "created" ? t.dashboard.memberAdded : t.dashboard.memberLinked,
    );
    return true;
  }
  const error = result.error as MemberError;
  toast.error(t.dashboard.memberErrors[error] ?? t.manage.error);
  return false;
}

/* Захиалгууд ------------------------------------------------------------------------- */

/** Хоёр товшилт: "Цуцлах" 4 секунд бэлэн болгоно, "Тийм, цуцлах" хэрэгжүүлнэ. */
export function CancelBookingButton({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId: string;
}): JSX.Element {
  const t = useT();
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      size="sm"
      variant={armed ? "destructive" : "ghost"}
      loading={pending}
      className={cn("h-8", !armed && "text-muted-foreground is-hover:text-danger-foreground")}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        start(async () => {
          const result = await cancelBookingAsManager({ slug, bookingId });
          setArmed(false);
          if (result.ok) toast(t.dashboard.cancelled, { description: t.dashboard.cancelledHint });
          else toast.error(t.manage.error);
        });
      }}
    >
      {armed ? t.dashboard.cancelSure : t.dashboard.cancel}
    </Button>
  );
}

/* Баг ----------------------------------------------------------------------------- */

export function MemberFields({ idPrefix, t }: { idPrefix: string; t: Dictionary }): JSX.Element {
  return (
    <>
      <Field>
        <Label htmlFor={`${idPrefix}-name`}>{t.dashboard.name}</Label>
        <Input id={`${idPrefix}-name`} name="name" required maxLength={80} className="h-10" />
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-phone`}>{t.dashboard.phone}</Label>
        <Input
          id={`${idPrefix}-phone`}
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          placeholder="9911 2233"
          className="h-10 tabular-nums"
        />
      </Field>
      <Field className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-password`}>{t.dashboard.tempPassword}</Label>
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type="text"
          autoComplete="off"
          maxLength={200}
          className="h-10"
        />
        <FieldHint>{t.dashboard.tempPasswordHint}</FieldHint>
      </Field>
    </>
  );
}

export const field = (form: FormData, name: string): string => String(form.get(name) ?? "");

/** Эзэмшигчид зориулсан менежер нэмэх маягт (нэр, утас, шинэ утсанд анхны нууц үг). */
export function AddManagerForm({ slug }: { slug: string }): JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await addManagerAction({
        slug,
        name: field(data, "name"),
        phone: field(data, "phone"),
        password: field(data, "password"),
      });
      if (reportMember(result, t)) {
        form.reset();
        setOpen(false);
      }
    });
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="start" />
        {t.dashboard.addManager}
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid animate-in gap-3 rounded-lg border border-border bg-background p-4 duration-250 ease-soft fade-in sm:grid-cols-2"
    >
      <MemberFields idPrefix="add-manager" t={t} />
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" loading={pending}>
          {t.dashboard.add}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

/** Менежерийг багаас хасах товч. */
export function RemoveManagerButton({
  slug,
  accountId,
}: {
  slug: string;
  accountId: string;
}): JSX.Element {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      className="h-8 text-muted-foreground is-hover:text-danger-foreground"
      onClick={() =>
        start(async () => {
          const result = await removeManagerAction({ slug, accountId });
          if (result.ok) toast(t.dashboard.memberRemoved);
          else toast.error(t.manage.error);
        })
      }
    >
      <UserMinus data-icon="start" />
      {t.dashboard.remove}
    </Button>
  );
}

/* Ирц ------------------------------------------------------------------------ */

/** "Ирсэн" үйлчлүүлэгчийн оноог одоо шийднэ; "Ирээгүй" зарцуулсан оноог нь буцаана. */
export function AttendanceButtons({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId: string;
}): JSX.Element {
  const t = useT();
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState<"attended" | "no_show" | null>(null);

  const mark = (attendance: "attended" | "no_show"): void => {
    setChoice(attendance);
    start(async () => {
      const result = await markAttendanceAction({ slug, bookingId, attendance });
      if (result.ok) {
        toast.success(
          attendance === "attended" ? t.dashboard.markedCame : t.dashboard.markedNoShow,
        );
      } else toast.error(t.manage.error);
    });
  };

  return (
    <span className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        loading={pending && choice === "attended"}
        disabled={pending}
        onClick={() => mark("attended")}
      >
        <Check data-icon="start" />
        {t.dashboard.came}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 text-muted-foreground is-hover:text-danger-foreground"
        loading={pending && choice === "no_show"}
        disabled={pending}
        onClick={() => mark("no_show")}
      >
        <X data-icon="start" />
        {t.dashboard.noShow}
      </Button>
    </span>
  );
}
