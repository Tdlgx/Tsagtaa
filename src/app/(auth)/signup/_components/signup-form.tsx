"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupAction, type SignupState } from "@/features/auth/actions";
import { passwordStrength } from "@/features/business-registration/components/owner-fields";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const INITIAL: SignupState = { error: null, name: "", phone: "" };

/** Name, phone, password. A plain <form> with a Server Action; it works before JavaScript loads. */
export function SignupForm({ next }: { next: string }): JSX.Element {
  const t = useT();
  const words = t.signup;
  const [state, action, pending] = useActionState(signupAction, INITIAL);
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const score = passwordStrength(password);
  const labels = [
    null,
    t.register.strength.weak,
    t.register.strength.fair,
    t.register.strength.strong,
  ];

  return (
    <form action={action} className="mt-8 flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p
          role="alert"
          className="flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {words.errors[state.error]}
        </p>
      ) : null}
      <Field>
        <Label htmlFor="signup-name">{words.name}</Label>
        <Input
          id="signup-name"
          name="name"
          autoComplete="name"
          defaultValue={state.name}
          maxLength={80}
          required
          placeholder={t.book.namePlaceholder}
        />
      </Field>
      <Field>
        <Label htmlFor="signup-phone">{t.auth.phone}</Label>
        <Input
          id="signup-phone"
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
        <Label htmlFor="signup-password">{t.auth.password}</Label>
        <div className="relative">
          <Input
            id="signup-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            maxLength={200}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="signup-password-hint"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? t.auth.hide : t.auth.show}
            aria-pressed={visible}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <div id="signup-password-hint" className="flex items-center gap-2">
          <span aria-hidden className="flex flex-1 gap-1">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-250 ease-soft",
                  score >= level
                    ? score === 1
                      ? "bg-sun"
                      : score === 2
                        ? "bg-primary-strong"
                        : "bg-success"
                    : "bg-surface-muted",
                )}
              />
            ))}
          </span>
          <FieldHint className="text-xs">{labels[score] ?? t.register.passwordHint}</FieldHint>
        </div>
      </Field>
      <Field>
        <Label htmlFor="signup-confirm">{t.register.passwordConfirm}</Label>
        <Input
          id="signup-confirm"
          name="confirm"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          maxLength={200}
          required
        />
      </Field>
      {/* Consent before storing personal data (Law on Personal Data Protection); never pre-ticked. */}
      <div className="flex items-start gap-3">
        <input
          id="signup-consent"
          name="consent"
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary-strong"
        />
        <p className="text-sm text-foreground">
          <label htmlFor="signup-consent" className="cursor-pointer">
            {words.consent}
          </label>{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
          >
            {t.book.consentLink}
          </Link>
        </p>
      </div>
      <Button type="submit" size="lg" loading={pending} className="mt-2">
        {words.submit}
      </Button>
    </form>
  );
}
