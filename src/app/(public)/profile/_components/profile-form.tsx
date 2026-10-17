"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPhone, normalizePhone } from "@/features/booking/booking";
import { saveProfile, type Profile } from "@/features/profile/profile-store";
import { useT } from "@/i18n/client";

type Errors = { name?: string; phone?: string; email?: string };

type ProfileFormProps = {
  profile: Profile;
  onDone: () => void;
};

/** Name, phone and email; saved on this device and used to pre-fill bookings. */
export function ProfileForm({ profile, onDone }: ProfileFormProps): JSX.Element {
  const t = useT();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ? formatPhone(profile.phone) : "");
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<Errors>({});

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const normalized = normalizePhone(phone);
    const trimmedEmail = email.trim();
    const next: Errors = {
      name: name.trim().length < 2 ? t.book.errors.name : undefined,
      phone: normalized ? undefined : t.book.errors.phone,
      email:
        trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
          ? t.profile.emailError
          : undefined,
    };
    setErrors(next);
    if (next.name || next.phone || next.email || !normalized) return;

    saveProfile({ name: name.trim(), phone: normalized, email: trimmedEmail });
    toast.success(t.profile.saved, {
      description: t.profile.savedText,
    });
    onDone();
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex animate-in flex-col gap-4 duration-250 ease-soft fade-in"
    >
      <Field>
        <Label htmlFor="profile-name">{t.book.name}</Label>
        <Input
          id="profile-name"
          autoComplete="given-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          placeholder={t.book.namePlaceholder}
        />
        <FieldError id="profile-name-error">{errors.name}</FieldError>
      </Field>
      <Field>
        <Label htmlFor="profile-phone">{t.book.phone}</Label>
        <Input
          id="profile-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={13}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "profile-phone-error" : undefined}
          placeholder="9911 2233"
          className="tabular-nums"
        />
        <FieldError id="profile-phone-error">{errors.phone}</FieldError>
      </Field>
      <Field>
        <Label htmlFor="profile-email">
          {t.profile.email}{" "}
          <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "profile-email-error" : "profile-email-hint"}
          placeholder={t.profile.emailPlaceholder}
        />
        {errors.email ? (
          <FieldError id="profile-email-error">{errors.email}</FieldError>
        ) : (
          <FieldHint id="profile-email-hint">{t.profile.emailHint}</FieldHint>
        )}
      </Field>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-strong" />
        <span>
          {t.profile.formPrivacy}{" "}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
          >
            {t.footer.privacy}
          </Link>
        </span>
      </p>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t.common.save}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}
