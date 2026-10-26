"use client";

import { Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { JSX, ReactNode } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { ListingPreview } from "@/features/business-registration/components/listing-preview";
import {
  OwnerSignIn,
  type OwnerErrors,
  type OwnerFields,
} from "@/features/business-registration/components/owner-fields";
import {
  detectRegisterNumber,
  getWarnings,
  STEPS,
  type RegistrationDraft,
} from "@/features/business-registration/registration";
import { getBusinessCategory } from "@/features/business/categories";
import type { Dictionary } from "@/i18n/dictionaries";
import { APP_URL } from "@/lib/constants";
import { formatMNT } from "@/lib/currency";

type ReviewStepProps = {
  draft: RegistrationDraft;
  t: Dictionary;
  consent: boolean;
  consentError: boolean;
  onConsentChange: (checked: boolean) => void;
  onEdit: (step: number) => void;
  owner: OwnerFields;
  ownerErrors: OwnerErrors;
  onOwnerChange: (change: Partial<OwnerFields>) => void;
};

const hoursText = (minutes: number): string =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * Бүртгэлийн сүүлийн алхам: бүх мэдээллийн хураангуй, анхааруулга, эзэмшигчийн нэвтрэх мэдээлэл,
 * зөвшөөрөл.
 */
export function ReviewStep({
  draft,
  t,
  consent,
  consentError,
  onConsentChange,
  onEdit,
  owner,
  ownerErrors,
  onOwnerChange,
}: ReviewStepProps): JSX.Element {
  const words = t.register;
  const warnings = getWarnings(draft);
  const CategoryIcon = draft.category ? getBusinessCategory(draft.category).icon : null;
  const registerKind = detectRegisterNumber(draft.registerNumber);
  const host = new URL(APP_URL).host;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {warnings.length > 0 ? (
        <div className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" />
            {words.reviewWarnings}
          </p>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-10">
            {warnings.map((warning) => (
              <li key={warning.service}>
                {words.serviceTooLong(warning.service, hoursText(warning.minutes))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Өргөн дэлгэцэнд урьдчилсан харагдац аль хэдийн маягтын хажууд байна. */}
      <div className="lg:hidden">
        <ListingPreview draft={draft} t={t} />
      </div>

      <SummaryCard title={words.steps.basics} onEdit={() => onEdit(STEPS.indexOf("basics"))} t={t}>
        <div className="flex items-center gap-3">
          {CategoryIcon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-ink text-primary">
              <CategoryIcon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{draft.name}</p>
            <p className="text-sm text-muted-foreground">
              {draft.category ? t.categories[draft.category].label : ""}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label={words.slug}>
            <span className="break-all">
              {host}/book/<span className="font-medium text-foreground">{draft.slug}</span>
            </span>
          </Row>
          <Row label={words.address}>
            {draft.district ? `${t.districts[draft.district]}, ` : ""}
            {draft.address}
          </Row>
          <Row label={words.phone}>{draft.phone}</Row>
          {draft.email.trim() ? <Row label={words.email}>{draft.email}</Row> : null}
          {registerKind ? (
            <Row label={words.registerNumber}>
              {draft.registerNumber} ·{" "}
              {registerKind === "company" ? words.registerCompany : words.registerPerson}
            </Row>
          ) : null}
        </dl>
        {draft.description.trim() ? (
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            {draft.description}
          </p>
        ) : null}
      </SummaryCard>

      <SummaryCard title={words.steps.hours} onEdit={() => onEdit(STEPS.indexOf("hours"))} t={t}>
        <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4">
          {draft.hours.map((item, index) => (
            <li key={index} className="flex justify-between gap-4 tabular-nums">
              <span className="text-muted-foreground">{words.weekdays[index]}</span>
              <span className={item.open ? "text-foreground" : "text-muted-foreground"}>
                {item.open ? `${item.opens}–${item.closes}` : words.closedLabel}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {words.slot}: {words.slotOption(draft.slotMinutes)}
        </p>
      </SummaryCard>

      <SummaryCard
        title={`${words.steps.services} · ${draft.services.length}`}
        onEdit={() => onEdit(STEPS.indexOf("services"))}
        t={t}
      >
        <ul className="flex flex-col gap-1.5 text-sm">
          {draft.services.map((service) => (
            <li key={service.id} className="flex items-baseline justify-between gap-4">
              <span className="text-foreground">{service.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {service.duration} {words.minutesShort} · {formatMNT(service.price)}
              </span>
            </li>
          ))}
        </ul>
      </SummaryCard>

      <SummaryCard
        title={`${draft.category ? t.staff[draft.category].stepLabel : words.steps.staff} · ${draft.staff.length}`}
        onEdit={() => onEdit(STEPS.indexOf("staff"))}
        t={t}
      >
        <p className="text-sm text-foreground">
          {draft.staff.map((member) => member.name).join(", ")}
        </p>
      </SummaryCard>

      <OwnerSignIn
        owner={owner}
        errors={ownerErrors}
        phone={draft.phone}
        t={t}
        onChange={onOwnerChange}
      />

      {/* Эзэмшигчийн мэдэгдэл, урьдчилан чагтлахгүй. */}
      <div className="mt-2">
        <div className="flex items-start gap-3">
          <input
            id="reg-consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => onConsentChange(event.target.checked)}
            aria-invalid={consentError}
            aria-describedby={consentError ? "reg-consent-error" : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary-strong"
          />
          <p className="text-sm text-foreground">
            <label htmlFor="reg-consent" className="cursor-pointer">
              {words.consent}
            </label>{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
            >
              {words.consentLink}
            </Link>
          </p>
        </div>
        <FieldError id="reg-consent-error" className="mt-2">
          {consentError ? words.errors.consent : null}
        </FieldError>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  onEdit,
  t,
  children,
}: {
  title: string;
  onEdit: () => void;
  t: Dictionary;
  children: ReactNode;
}): JSX.Element {
  return (
    <TiltCard maxDegrees={4} className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        <Button variant="ghost" size="sm" onClick={onEdit} className="-my-1.5 -mr-2">
          <Pencil data-icon="start" />
          {t.register.edit}
        </Button>
      </div>
      {children}
    </TiltCard>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
