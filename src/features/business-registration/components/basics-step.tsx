"use client";

import { BadgeCheck, CircleCheck, CircleX, LoaderCircle, Wand2 } from "lucide-react";
import { useEffect, useState, type JSX } from "react";

import { LocationPicker } from "@/components/shared/map/location-picker";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPhone, normalizePhone } from "@/features/booking/booking";
import { checkSlugAction, type SlugCheck } from "@/features/business-registration/actions";
import { updateDraft } from "@/features/business-registration/draft-store";
import {
  DESCRIPTION_MAX,
  detectRegisterNumber,
  isValidSlug,
  normalizeRegisterNumber,
  slugify,
  suggestEmail,
  type RegistrationDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import { DISTRICTS } from "@/features/business/districts";
import type { Dictionary } from "@/i18n/dictionaries";
import { APP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BasicsStepProps = { draft: RegistrationDraft; errors: StepErrors; t: Dictionary };

const set = (change: Partial<RegistrationDraft>): void =>
  updateDraft((draft) => ({ ...draft, ...change }));

/** "tsagtaa.mn/book/" in front of the address field. */
const BOOK_PREFIX = `${new URL(APP_URL).host}/book/`;

/** While typing an address: keep only what an address may contain. */
function cleanSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

type SlugStatus = SlugCheck | { slug: string; status: "checking" };

/** Asks the server whether the address is free, 400 ms after typing stops. */
function useSlugCheck(slug: string): SlugStatus {
  const [result, setResult] = useState<SlugCheck | null>(null);

  useEffect(() => {
    if (!isValidSlug(slug)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkSlugAction(slug).then((answer) => {
        if (!cancelled) setResult(answer);
      });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug]);

  if (!isValidSlug(slug)) return { slug, status: "invalid" };
  if (!result || result.slug !== slug) return { slug, status: "checking" };
  return result;
}

export function BasicsStep({ draft, errors, t }: BasicsStepProps): JSX.Element {
  const words = t.register;
  const slugStatus = useSlugCheck(draft.slug);
  const registerKind = detectRegisterNumber(draft.registerNumber);
  const emailFix = suggestEmail(draft.email);
  const error = (key: string): string | null => {
    const code = errors[key];
    return code ? words.errors[code] : null;
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <Field>
        <Label htmlFor="reg-name">{words.name}</Label>
        <Input
          id="reg-name"
          autoComplete="organization"
          value={draft.name}
          maxLength={80}
          onChange={(event) => {
            const name = event.target.value;
            // The address follows the name until the owner edits it.
            set(draft.slugEdited ? { name } : { name, slug: slugify(name) });
          }}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "reg-name-error" : undefined}
        />
        <FieldError id="reg-name-error">{error("name")}</FieldError>
      </Field>

      <Field>
        <Label htmlFor="reg-slug">{words.slug}</Label>
        <div
          className={cn(
            "flex h-11 items-center overflow-hidden rounded-md border border-input bg-surface transition-colors duration-150 ease-soft has-focus:border-primary-strong has-focus:ring-3 has-focus:ring-ring",
            errors.slug && "border-danger",
          )}
        >
          <span className="flex h-full shrink-0 items-center border-r border-border bg-surface-muted px-3 text-sm text-muted-foreground max-sm:hidden">
            {BOOK_PREFIX}
          </span>
          <input
            id="reg-slug"
            value={draft.slug}
            onChange={(event) =>
              set({ slug: cleanSlugInput(event.target.value), slugEdited: true })
            }
            onBlur={() => set({ slug: draft.slug.replace(/^-+|-+$/g, "") })}
            spellCheck={false}
            autoCapitalize="none"
            aria-invalid={Boolean(errors.slug)}
            aria-describedby="reg-slug-status"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none"
          />
        </div>
        <SlugStatusLine status={slugStatus} draft={draft} t={t} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="reg-district">{words.district}</Label>
          <Select
            id="reg-district"
            value={draft.district}
            onChange={(event) =>
              set({ district: event.target.value as RegistrationDraft["district"] })
            }
            aria-invalid={Boolean(errors.district)}
            aria-describedby={errors.district ? "reg-district-error" : undefined}
          >
            <option value="" disabled>
              {words.districtPlaceholder}
            </option>
            {DISTRICTS.map((district) => (
              <option key={district.slug} value={district.slug}>
                {t.districts[district.slug]}
              </option>
            ))}
          </Select>
          <FieldError id="reg-district-error">{error("district")}</FieldError>
        </Field>
        <Field>
          <Label htmlFor="reg-address">{words.address}</Label>
          <Input
            id="reg-address"
            autoComplete="street-address"
            value={draft.address}
            maxLength={160}
            onChange={(event) => set({ address: event.target.value })}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "reg-address-error" : undefined}
            placeholder={words.addressPlaceholder}
          />
          <FieldError id="reg-address-error">{error("address")}</FieldError>
        </Field>
      </div>

      {/* Optional, but a place with a pin shows up on the map. */}
      <Field>
        <Label id="reg-location-label">
          {words.location}{" "}
          <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <LocationPicker
          value={draft.location}
          onChange={(location) => set({ location })}
          labelId="reg-location-label"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="reg-phone">{words.phone}</Label>
          <Input
            id="reg-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={13}
            value={draft.phone}
            onChange={(event) => set({ phone: event.target.value })}
            onBlur={() => {
              const normalized = normalizePhone(draft.phone);
              if (normalized) set({ phone: formatPhone(normalized) });
            }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "reg-phone-error" : "reg-phone-hint"}
            placeholder="9911 2233"
            className="tabular-nums"
          />
          {errors.phone ? (
            <FieldError id="reg-phone-error">{error("phone")}</FieldError>
          ) : (
            <FieldHint id="reg-phone-hint">{words.phoneHint}</FieldHint>
          )}
        </Field>
        <Field>
          <Label htmlFor="reg-email">
            {words.email}{" "}
            <span className="font-normal text-muted-foreground">{t.common.optional}</span>
          </Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={draft.email}
            maxLength={120}
            onChange={(event) => set({ email: event.target.value })}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reg-email-error" : "reg-email-hint"}
            placeholder="info@example.mn"
          />
          {errors.email ? (
            <FieldError id="reg-email-error">{error("email")}</FieldError>
          ) : emailFix ? (
            <button
              type="button"
              onClick={() => set({ email: emailFix })}
              className="flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary-strong underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:underline"
            >
              <Wand2 className="size-4" />
              {words.emailSuggest(emailFix)}
            </button>
          ) : (
            <FieldHint id="reg-email-hint">{words.emailHint}</FieldHint>
          )}
        </Field>
      </div>

      <Field>
        <Label htmlFor="reg-registerNumber">
          {words.registerNumber}{" "}
          <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <div className="relative">
          <Input
            id="reg-registerNumber"
            value={draft.registerNumber}
            maxLength={14}
            onChange={(event) =>
              set({ registerNumber: normalizeRegisterNumber(event.target.value) })
            }
            aria-invalid={Boolean(errors.registerNumber)}
            aria-describedby={
              errors.registerNumber ? "reg-registerNumber-error" : "reg-registerNumber-hint"
            }
            placeholder="1234567 / УБ99112233"
            className={cn("uppercase tabular-nums", registerKind && "pr-36")}
          />
          {registerKind ? (
            <span className="absolute top-1/2 right-3 flex -translate-y-1/2 animate-in items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-foreground duration-250 zoom-in-95 fade-in">
              <BadgeCheck className="size-3.5" />
              {registerKind === "company" ? words.registerCompany : words.registerPerson}
            </span>
          ) : null}
        </div>
        {errors.registerNumber ? (
          <FieldError id="reg-registerNumber-error">{error("registerNumber")}</FieldError>
        ) : (
          <FieldHint id="reg-registerNumber-hint">{words.registerHint}</FieldHint>
        )}
      </Field>

      <Field>
        <div className="flex items-baseline justify-between gap-4">
          <Label htmlFor="reg-description">
            {words.description}{" "}
            <span className="font-normal text-muted-foreground">{t.common.optional}</span>
          </Label>
          <span
            aria-hidden
            className={cn(
              "text-xs tabular-nums",
              draft.description.length > DESCRIPTION_MAX - 30
                ? "text-warning-foreground"
                : "text-muted-foreground",
            )}
          >
            {words.descriptionCount(draft.description.length, DESCRIPTION_MAX)}
          </span>
        </div>
        <Textarea
          id="reg-description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={draft.description}
          onChange={(event) => set({ description: event.target.value })}
          placeholder={words.descriptionPlaceholder}
        />
      </Field>
    </div>
  );
}

function SlugStatusLine({
  status,
  draft,
  t,
}: {
  status: SlugStatus;
  draft: RegistrationDraft;
  t: Dictionary;
}): JSX.Element {
  const words = t.register;
  const base = "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm";

  return (
    <div id="reg-slug-status" aria-live="polite" className={base}>
      {status.status === "checking" ? (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {words.slugChecking}
        </span>
      ) : status.status === "available" ? (
        <span className="flex items-center gap-1.5 text-success-foreground">
          <CircleCheck className="size-4" />
          {words.slugAvailable}
          {!draft.slugEdited ? (
            <span className="text-muted-foreground">· {words.slugFromName}</span>
          ) : null}
        </span>
      ) : status.status === "taken" ? (
        <>
          <span className="flex items-center gap-1.5 text-danger-foreground">
            <CircleX className="size-4" />
            {words.slugTaken}
          </span>
          <button
            type="button"
            onClick={() => set({ slug: status.suggestion, slugEdited: true })}
            className="rounded-sm font-medium text-primary-strong underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            {words.slugUse(status.suggestion)}
          </button>
        </>
      ) : status.status === "unknown" ? (
        <span className="text-muted-foreground">{words.slugUnknown}</span>
      ) : (
        <span className={draft.slug ? "text-danger-foreground" : "text-muted-foreground"}>
          {draft.slug ? words.slugInvalid : words.slugHint}
        </span>
      )}
    </div>
  );
}
