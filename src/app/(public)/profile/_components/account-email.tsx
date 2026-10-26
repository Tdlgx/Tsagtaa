"use client";

import { CircleAlert, Mail, MailCheck } from "lucide-react";
import { useActionState, useEffect, useState, type JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setEmailAction, type EmailState } from "@/features/auth/actions";
import { useT } from "@/i18n/client";

type AccountEmailProps = {
  email: string | null;
  /** Бүртгүүлэхдээ эсвэл эндээс хүссэн ч кодыг нь хараахан оруулаагүй хаяг. */
  pendingEmail: string | null;
};

/**
 * Энэ бүртгэлийн нэвтрэх имэйл. Нэмэх эсвэл солиход эхлээд одоогийн нууц үг,
 * дараа нь шинэ хаяг руу илгээсэн код шаардана. Хасахад зөвхөн нууц үг хангалттай.
 */
export function AccountEmail({ email, pendingEmail }: AccountEmailProps): JSX.Element {
  const t = useT();
  const words = t.accountEmail;
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(setEmailAction, {
    error: null,
    done: null,
    email: pendingEmail ?? email ?? "",
    codeFor: pendingEmail,
  } satisfies EmailState);

  // Хариу бүрт `state` шинэ объект болно: хадгалагдсан бол маягтыг хааж, мэдэгдэл харуулна.
  const [answered, setAnswered] = useState(state);
  if (state !== answered) {
    setAnswered(state);
    if (state.done || (!state.codeFor && !state.error)) setEditing(false);
  }
  useEffect(() => {
    if (state.done) toast.success(words.saved[state.done]);
  }, [state, words]);

  const alert = state.error ? (
    <p
      role="alert"
      className="flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {words.errors[state.error]}
    </p>
  ) : null;

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3 text-sm">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{words.label}</span>
            <span className="block truncate font-medium text-foreground">
              {email ?? <span className="font-normal text-muted-foreground">{words.none}</span>}
            </span>
          </span>
        </span>
        {editing || state.codeFor ? null : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {email ? words.change : words.add}
          </Button>
        )}
      </div>

      {state.codeFor ? (
        <form action={action} className="mt-4 flex flex-col gap-4" noValidate>
          <input type="hidden" name="codeFor" value={state.codeFor} />
          <p className="flex items-start gap-2.5 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-primary-strong" />
            <span>{words.codeSent(state.codeFor)}</span>
          </p>
          {alert}
          <Field>
            <Label htmlFor="account-email-code">{words.code}</Label>
            <Input
              key={JSON.stringify(state)}
              id="account-email-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="123456"
              required
              className="tracking-[0.3em] tabular-nums"
            />
          </Field>
          {/* Баталгаажуулах товч эхэнд байгаа тул кодын талбарт Enter дарахад баталгаажна. */}
          <div className="flex flex-row-reverse flex-wrap justify-between gap-2">
            <Button type="submit" name="intent" value="verify" size="sm" loading={pending}>
              {words.confirm}
            </Button>
            <span className="flex gap-1">
              <Button type="submit" name="intent" value="back" variant="ghost" size="sm">
                {words.cancel}
              </Button>
              <Button type="submit" name="intent" value="resend" variant="ghost" size="sm">
                {words.resend}
              </Button>
            </span>
          </div>
        </form>
      ) : editing ? (
        <form action={action} className="mt-4 flex flex-col gap-4" noValidate>
          {alert}
          <Field>
            <Label htmlFor="account-email">{words.label}</Label>
            <Input
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={120}
              defaultValue={state.email}
              placeholder="name@gmail.com"
            />
            <FieldHint className="text-xs">{email ? words.removeHint : words.codeHint}</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="account-email-password">{words.password}</Label>
            <Input
              id="account-email-password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={200}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              {words.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {words.next}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
