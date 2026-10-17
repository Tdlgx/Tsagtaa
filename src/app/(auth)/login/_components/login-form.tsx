"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useActionState, useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/features/auth/actions";
import { useT } from "@/i18n/client";

const INITIAL: LoginState = { error: null, phone: "" };

/**
 * Phone + password. A plain <form> with a Server Action, so it works before
 * JavaScript loads; the action redirects on success.
 */
export function LoginForm({ next }: { next: string }): JSX.Element {
  const t = useT();
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p
          role="alert"
          className="flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {t.auth.errors[state.error]}
        </p>
      ) : null}
      <Field>
        <Label htmlFor="login-phone">{t.auth.phone}</Label>
        <Input
          id="login-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          defaultValue={state.phone}
          placeholder="9911 2233"
          required
          className="tabular-nums"
        />
      </Field>
      <Field>
        <Label htmlFor="login-password">{t.auth.password}</Label>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? t.auth.hide : t.auth.show}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Button type="submit" size="lg" loading={pending} className="mt-2">
        {t.auth.submit}
      </Button>
    </form>
  );
}
