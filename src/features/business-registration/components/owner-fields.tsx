"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState, type JSX } from "react";

import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type OwnerFields = { name: string; password: string; confirm: string };
export type OwnerErrors = Partial<Record<keyof OwnerFields, string>>;

export const EMPTY_OWNER: OwnerFields = { name: "", password: "", confirm: "" };

/** Сервертэй ижил дүрэм: 8+ тэмдэгт бөгөөд зөвхөн тооноос бүрдээгүй. */
const acceptable = (password: string): boolean =>
  password.length >= 8 && password.length <= 200 && !/^\d+$/.test(password);

/** Эзэмшигчийн нэр, нууц үг, нууц үгийн давталтын алдаанууд (хоосон бол алдаагүй). */
export function getOwnerErrors(owner: OwnerFields, t: Dictionary): OwnerErrors {
  const errors: OwnerErrors = {};
  if (owner.name.trim().length < 2) errors.name = t.register.errors.ownerName;
  if (!acceptable(owner.password)) errors.password = t.register.errors.password;
  else if (owner.confirm !== owner.password) errors.confirm = t.register.errors.passwordMatch;
  return errors;
}

/** 0–3: урт, үсэг тоо холилдсон, тэмдэгт. Дүрэм биш, зөвлөмж. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!acceptable(password)) return 0;
  let score = 1;
  if (password.length >= 12 || (/\d/.test(password) && /\p{L}/u.test(password))) score += 1;
  if (/[^\p{L}\d]/u.test(password) && password.length >= 10) score += 1;
  return score as 1 | 2 | 3;
}

type OwnerSignInProps = {
  owner: OwnerFields;
  errors: OwnerErrors;
  phone: string;
  t: Dictionary;
  onChange: (change: Partial<OwnerFields>) => void;
};

/** Бүртгүүлж буй хүний нэр, самбарын нууц үг, сүүлийн алхам дээр. */
export function OwnerSignIn({ owner, errors, phone, t, onChange }: OwnerSignInProps): JSX.Element {
  const words = t.register;
  const [visible, setVisible] = useState(false);
  const score = passwordStrength(owner.password);
  const labels = [null, words.strength.weak, words.strength.fair, words.strength.strong];

  return (
    <section
      aria-labelledby="reg-owner-title"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h3
        id="reg-owner-title"
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <KeyRound className="size-4 text-primary-strong" />
        {words.ownerTitle}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{words.ownerLead(phone)}</p>

      <div className="mt-4 flex flex-col gap-4">
        <Field>
          <Label htmlFor="reg-owner-name">{words.ownerName}</Label>
          <Input
            id="reg-owner-name"
            autoComplete="name"
            value={owner.name}
            maxLength={80}
            onChange={(event) => onChange({ name: event.target.value })}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "reg-owner-name-error" : undefined}
          />
          <FieldError id="reg-owner-name-error">{errors.name}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="reg-owner-password">{words.password}</Label>
            <div className="relative">
              <Input
                id="reg-owner-password"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={owner.password}
                maxLength={200}
                onChange={(event) => onChange({ password: event.target.value })}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "reg-owner-password-error" : "reg-owner-password-hint"
                }
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setVisible((shown) => !shown)}
                aria-label={words.showPassword}
                aria-pressed={visible}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password ? (
              <FieldError id="reg-owner-password-error">{errors.password}</FieldError>
            ) : (
              <div id="reg-owner-password-hint" className="flex items-center gap-2">
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
                <FieldHint className="text-xs">{labels[score] ?? words.passwordHint}</FieldHint>
              </div>
            )}
          </Field>
          <Field>
            <Label htmlFor="reg-owner-confirm">{words.passwordConfirm}</Label>
            <Input
              id="reg-owner-confirm"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={owner.confirm}
              maxLength={200}
              onChange={(event) => onChange({ confirm: event.target.value })}
              aria-invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? "reg-owner-confirm-error" : undefined}
            />
            <FieldError id="reg-owner-confirm-error">{errors.confirm}</FieldError>
          </Field>
        </div>
      </div>
    </section>
  );
}
