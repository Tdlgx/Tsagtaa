"use client";

import {
  Ban,
  Check,
  Coins,
  Copy,
  Download,
  KeyRound,
  LockOpen,
  LogOut,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { Switch } from "radix-ui";
import { useEffect, useState, useTransition, type FormEvent, type JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  adjustPointsAction,
  adminCancelBookingAction,
  assignMemberAction,
  endSessionsAction,
  importSamplesAction,
  loyaltySettingsAction,
  resetPasswordAction,
  reviewBusinessAction,
  setAdminAction,
  unlockAccountAction,
  type AdminResult,
} from "@/features/admin/actions";
import { field, MemberFields, reportMember } from "@/features/manage/components/manage-controls";
import type { LoyaltySettings } from "@/features/points/points";
import { useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import type { BusinessStatus } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const textareaClass =
  "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground is-focus:border-primary-strong is-focus:ring-3 is-focus:ring-ring";

function errorText(result: AdminResult, t: Dictionary): string {
  if (result.ok) return "";
  const errors = t.admin.errors as Record<string, string>;
  return errors[result.error] ?? t.manage.error;
}

/** A second tap within 4 seconds confirms. */
function useArmed(): [boolean, (value: boolean) => void] {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);
  return [armed, setArmed];
}

/* Review ----------------------------------------------------------------------------- */

/**
 * The decisions a place's status allows: approve or turn down a new one,
 * take a live one off or put it back, look again at a turned-down one.
 * Turning down and taking off need a reason, which the owner sees.
 */
export function ReviewActions({
  businessId,
  status,
}: {
  businessId: string;
  status: BusinessStatus;
}): JSX.Element {
  const t = useT();
  const words = t.admin.review;
  const [mode, setMode] = useState<"rejected" | "suspended" | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const decide = (next: BusinessStatus): void => {
    start(async () => {
      const result = await reviewBusinessAction({ businessId, status: next, note: note.trim() });
      if (!result.ok) {
        toast.error(errorText(result, t));
        return;
      }
      toast.success(words.done[next]);
      setMode(null);
      setNote("");
    });
  };

  if (mode) {
    const reasons = mode === "rejected" ? words.rejectReasons : words.suspendReasons;
    return (
      <div className="flex w-full animate-in flex-col gap-2 duration-250 fade-in">
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setNote((current) => (current ? `${current} ${reason}` : reason))}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-muted-foreground"
            >
              {reason}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          rows={2}
          autoFocus
          aria-label={words.notePlaceholder}
          placeholder={words.notePlaceholder}
          className={textareaClass}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="destructive" loading={pending} onClick={() => decide(mode)}>
            {mode === "rejected" ? <X data-icon="start" /> : <Ban data-icon="start" />}
            {mode === "rejected" ? words.reject : words.suspend}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" ? (
        <>
          <Button size="sm" loading={pending} onClick={() => decide("active")}>
            <Check data-icon="start" />
            {words.approve}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("rejected")}>
            {words.reject}
          </Button>
        </>
      ) : null}
      {status === "active" ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground is-hover:text-danger-foreground"
          onClick={() => setMode("suspended")}
        >
          <Ban data-icon="start" />
          {words.suspend}
        </Button>
      ) : null}
      {status === "suspended" ? (
        <Button size="sm" loading={pending} onClick={() => decide("active")}>
          <RotateCcw data-icon="start" />
          {words.reinstate}
        </Button>
      ) : null}
      {status === "rejected" ? (
        <Button size="sm" variant="ghost" loading={pending} onClick={() => decide("pending")}>
          <RotateCcw data-icon="start" />
          {words.reopen}
        </Button>
      ) : null}
    </div>
  );
}

export function AssignMemberForm({ slug }: { slug: string }): JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const idPrefix = `assign-${slug}`;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await assignMemberAction({
        slug,
        name: field(data, "name"),
        phone: field(data, "phone"),
        password: field(data, "password"),
        role: field(data, "role"),
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
        {t.admin.assign}
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid animate-in gap-3 rounded-lg border border-border bg-background p-4 duration-250 ease-soft fade-in sm:grid-cols-2"
    >
      <MemberFields idPrefix={idPrefix} t={t} />
      <Field>
        <Label htmlFor={`${idPrefix}-role`}>{t.admin.role}</Label>
        <Select id={`${idPrefix}-role`} name="role" defaultValue="owner" className="h-10">
          <option value="owner">{t.manage.roles.owner}</option>
          <option value="manager">{t.manage.roles.manager}</option>
        </Select>
      </Field>
      <div className="flex items-end gap-2">
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

export function ImportSamplesButton(): JSX.Element {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          const result = await importSamplesAction();
          if (result.ok) toast.success(t.admin.imported(Number(result.message ?? 0)));
          else toast.error(t.manage.error);
        })
      }
    >
      <Download data-icon="start" />
      {t.admin.importButton}
    </Button>
  );
}

/* Accounts ----------------------------------------------------------------------------- */

type AccountActionsProps = {
  accountId: string;
  isAdmin: boolean;
  isLocked: boolean;
  isSelf: boolean;
  sessions: number;
};

export function AccountActions({
  accountId,
  isAdmin,
  isLocked,
  isSelf,
  sessions,
}: AccountActionsProps): JSX.Element {
  const t = useT();
  const words = t.admin.accounts;
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [armedReset, setArmedReset] = useArmed();
  const [armedAdmin, setArmedAdmin] = useArmed();

  const run = (key: string, action: () => Promise<AdminResult>, success: string): void => {
    setBusy(key);
    start(async () => {
      const result = await action();
      if (!result.ok) toast.error(errorText(result, t));
      else if (key === "reset") setPassword(result.message ?? null);
      else toast.success(success);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {isLocked ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            loading={pending && busy === "unlock"}
            onClick={() => run("unlock", () => unlockAccountAction({ accountId }), words.unlocked)}
          >
            <LockOpen data-icon="start" />
            {words.unlock}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={armedReset ? "destructive" : "ghost"}
          className="h-8"
          loading={pending && busy === "reset"}
          onClick={() => {
            if (!armedReset) return setArmedReset(true);
            setArmedReset(false);
            run("reset", () => resetPasswordAction({ accountId }), "");
          }}
        >
          <KeyRound data-icon="start" />
          {armedReset ? words.resetSure : words.reset}
        </Button>
        {sessions > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            loading={pending && busy === "sessions"}
            onClick={() => run("sessions", () => endSessionsAction({ accountId }), words.signedOut)}
          >
            <LogOut data-icon="start" />
            {words.signOut}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" className="h-8" onClick={() => setAdjusting(true)}>
          <Coins data-icon="start" />
          {words.adjust}
        </Button>
        {!isSelf ? (
          <Button
            size="sm"
            variant={armedAdmin ? (isAdmin ? "destructive" : "primary") : "ghost"}
            className="h-8"
            loading={pending && busy === "admin"}
            onClick={() => {
              if (!armedAdmin) return setArmedAdmin(true);
              setArmedAdmin(false);
              run(
                "admin",
                () => setAdminAction({ accountId, value: !isAdmin }),
                isAdmin ? words.adminRevoked : words.adminGranted,
              );
            }}
          >
            {isAdmin ? <ShieldOff data-icon="start" /> : <ShieldCheck data-icon="start" />}
            {armedAdmin ? words.adminSure : isAdmin ? words.revokeAdmin : words.grantAdmin}
          </Button>
        ) : null}
      </div>

      {password ? (
        <div
          role="status"
          className="flex animate-in flex-wrap items-center gap-3 rounded-lg border border-sun/50 bg-sun-soft px-3 py-2 text-sm duration-250 fade-in"
        >
          <span className="text-sun-strong">{words.newPassword}</span>
          <code className="rounded bg-surface px-2 py-0.5 font-mono text-foreground select-all">
            {password}
          </code>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => {
              void navigator.clipboard?.writeText(password);
              toast.success(words.copied);
            }}
          >
            <Copy data-icon="start" />
            {words.copy}
          </Button>
          <span className="w-full text-xs text-muted-foreground">{words.passwordOnce}</span>
        </div>
      ) : null}

      {adjusting ? (
        <AdjustPointsForm accountId={accountId} onDone={() => setAdjusting(false)} t={t} />
      ) : null}
    </div>
  );
}

function AdjustPointsForm({
  accountId,
  onDone,
  t,
}: {
  accountId: string;
  onDone: () => void;
  t: Dictionary;
}): JSX.Element {
  const words = t.admin.accounts;
  const [pending, start] = useTransition();
  const id = `adjust-${accountId}`;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      const result = await adjustPointsAction({
        accountId,
        delta: Number(field(data, "delta")),
        note: field(data, "note"),
      });
      if (!result.ok) {
        toast.error(errorText(result, t));
        return;
      }
      toast.success(words.adjusted);
      onDone();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="grid animate-in gap-3 rounded-lg border border-border bg-background p-3 duration-250 fade-in sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
    >
      <Field>
        <Label htmlFor={`${id}-delta`}>{words.delta}</Label>
        <Input
          id={`${id}-delta`}
          name="delta"
          type="number"
          step={1}
          required
          placeholder="+1000"
          className="h-10 tabular-nums"
        />
      </Field>
      <Field>
        <Label htmlFor={`${id}-note`}>{words.reason}</Label>
        <Input
          id={`${id}-note`}
          name="note"
          required
          minLength={3}
          maxLength={200}
          placeholder={words.reasonPlaceholder}
          className="h-10"
        />
      </Field>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {words.apply}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

/* Bookings ------------------------------------------------------------------------------- */

export function AdminCancelBookingButton({ bookingId }: { bookingId: string }): JSX.Element {
  const t = useT();
  const [armed, setArmed] = useArmed();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={armed ? "destructive" : "ghost"}
      loading={pending}
      className={cn("h-8", !armed && "text-muted-foreground is-hover:text-danger-foreground")}
      onClick={() => {
        if (!armed) return setArmed(true);
        start(async () => {
          const result = await adminCancelBookingAction({ bookingId });
          setArmed(false);
          if (result.ok) toast(t.admin.bookings.cancelled);
          else toast.error(errorText(result, t));
        });
      }}
    >
      {armed ? t.dashboard.cancelSure : t.dashboard.cancel}
    </Button>
  );
}

/* Points rules ----------------------------------------------------------------------------- */

export function LoyaltySettingsForm({ settings }: { settings: LoyaltySettings }): JSX.Element {
  const t = useT();
  const words = t.admin.points;
  const [enabled, setEnabled] = useState(settings.enabled);
  const [pending, start] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      const result = await loyaltySettingsAction({
        enabled,
        earnPercent: Number(field(data, "earnPercent")),
        minRedeem: Number(field(data, "minRedeem")),
        maxRedeemPercent: Number(field(data, "maxRedeemPercent")),
      });
      if (result.ok) toast.success(words.saved);
      else toast.error(errorText(result, t));
    });
  };

  const inputs = [
    {
      name: "earnPercent",
      label: words.earnPercent,
      hint: words.earnHint,
      min: 0,
      max: 30,
      value: settings.earnPercent,
    },
    {
      name: "minRedeem",
      label: words.minRedeem,
      hint: words.minHint,
      min: 0,
      max: 1_000_000,
      value: settings.minRedeem,
    },
    {
      name: "maxRedeemPercent",
      label: words.maxRedeem,
      hint: words.maxHint,
      min: 0,
      max: 100,
      value: settings.maxRedeemPercent,
    },
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="points-enabled" className="cursor-pointer">
          <span className="block text-sm font-medium text-foreground">{words.enabled}</span>
          <span className="block text-xs text-muted-foreground">{words.enabledHint}</span>
        </label>
        <Switch.Root
          id="points-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-input transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring data-[state=checked]:bg-primary-strong"
        >
          <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-soft data-[state=checked]:translate-x-5.5" />
        </Switch.Root>
      </div>
      {inputs.map((input) => (
        <Field key={input.name}>
          <Label htmlFor={`points-${input.name}`}>{input.label}</Label>
          <Input
            id={`points-${input.name}`}
            name={input.name}
            type="number"
            min={input.min}
            max={input.max}
            step={1}
            required
            defaultValue={input.value}
            className="h-10 tabular-nums"
          />
          <FieldHint>{input.hint}</FieldHint>
        </Field>
      ))}
      <Button type="submit" loading={pending} className="self-start">
        {words.save}
      </Button>
    </form>
  );
}
