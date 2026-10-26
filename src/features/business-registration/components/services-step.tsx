"use client";

import { Check, Plus, Sparkles, Trash2 } from "lucide-react";
import type { JSX } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  MAX_SERVICES,
  type DraftUpdate,
  type RegistrationDraft,
  type ServiceDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import { SERVICE_TEMPLATES } from "@/features/business-registration/templates";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { cn } from "@/lib/utils";

type ServicesStepProps = {
  draft: RegistrationDraft;
  update: DraftUpdate;
  errors: StepErrors;
  t: Dictionary;
  locale: Locale;
};

/** Сонгогчид санал болгох хугацаанууд; загвараас ирсэн өөр утга ч хадгалагдана. */
const DURATIONS = [
  10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 240, 300, 360, 420, 480,
];

const sameName = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

function addServices(update: DraftUpdate, services: Omit<ServiceDraft, "id">[]): void {
  update((draft) => ({
    ...draft,
    services: [
      ...draft.services,
      ...services.map((service) => ({ ...service, id: crypto.randomUUID() })),
    ].slice(0, MAX_SERVICES),
  }));
}

function setService(update: DraftUpdate, id: string, change: Partial<ServiceDraft>): void {
  update((draft) => ({
    ...draft,
    services: draft.services.map((service) =>
      service.id === id ? { ...service, ...change } : service,
    ),
  }));
}

function removeService(update: DraftUpdate, id: string): void {
  update((draft) => ({
    ...draft,
    services: draft.services.filter((service) => service.id !== id),
  }));
}

/** "35 000", "35,000₮" → 35000; бусад бүх зүйл → 0. */
function parsePrice(text: string): number {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return digits ? Number(digits) : 0;
}

/** Бүртгэлийн үйлчилгээний алхам: ангиллын загвараас нэмэх, нэр/хугацаа/үнийг засах. */
export function ServicesStep({ draft, update, errors, t, locale }: ServicesStepProps): JSX.Element {
  const words = t.register;
  const templates = draft.category ? SERVICE_TEMPLATES[draft.category] : [];
  const fresh = templates.filter(
    (template) => !draft.services.some((service) => sameName(service.name, template[locale])),
  );
  const full = draft.services.length >= MAX_SERVICES;

  return (
    <div className="mt-6 flex flex-col gap-6">
      {templates.length > 0 ? (
        <section
          id="reg-services"
          tabIndex={-1}
          aria-labelledby="reg-suggestions-title"
          className="outline-none"
        >
          <div className="flex items-center justify-between gap-4">
            <h3
              id="reg-suggestions-title"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Sparkles className="size-4 text-primary-strong" />
              {words.suggestionsLabel}
            </h3>
            {fresh.length > 1 && !full ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  addServices(
                    update,
                    fresh.map((template) => ({
                      name: template[locale],
                      duration: template.duration,
                      price: template.price,
                    })),
                  )
                }
              >
                {words.addAll}
              </Button>
            ) : null}
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {templates.map((template) => {
              const added = !fresh.includes(template);
              return (
                <li key={template.mn}>
                  <TiltCard maxDegrees={6} className="rounded-lg">
                    <button
                      type="button"
                      disabled={added || full}
                      onClick={() =>
                        addServices(update, [
                          {
                            name: template[locale],
                            duration: template.duration,
                            price: template.price,
                          },
                        ])
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring",
                        added
                          ? "border-primary-strong/40 bg-primary-soft"
                          : "border-dashed border-border bg-surface is-hover:border-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          added
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-muted text-muted-foreground",
                        )}
                      >
                        {added ? <Check className="size-4" /> : <Plus className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {template[locale]}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {template.duration} {words.minutesShort} · {formatMNT(template.price)}
                        </span>
                      </span>
                      {added ? (
                        <span className="text-xs font-medium text-primary-strong">
                          {words.added}
                        </span>
                      ) : null}
                    </button>
                  </TiltCard>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-medium text-foreground">{words.steps.services}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {words.servicesCount(draft.services.length, MAX_SERVICES)}
          </span>
        </div>
        <FieldError className="mt-2">
          {errors.services ? words.errors.servicesNone : null}
        </FieldError>

        <ul className="mt-3 flex flex-col gap-3">
          {draft.services.map((service, index) => (
            <ServiceRow
              key={service.id}
              service={service}
              index={index}
              update={update}
              errors={errors}
              t={t}
            />
          ))}
        </ul>

        <Button
          id="reg-add-service"
          variant="outline"
          className="mt-3 w-full border-dashed"
          disabled={full}
          onClick={() => {
            addServices(update, [{ name: "", duration: 30, price: 0 }]);
            // Шинэ мөр дэлгэцэнд гармагц түүний нэрийн талбарт focus хийнэ.
            requestAnimationFrame(() => {
              const inputs = document.querySelectorAll<HTMLInputElement>("[data-service-name]");
              inputs[inputs.length - 1]?.focus();
            });
          }}
        >
          <Plus data-icon="start" />
          {words.addService}
        </Button>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  index,
  update,
  errors,
  t,
}: {
  service: ServiceDraft;
  index: number;
  update: DraftUpdate;
  errors: StepErrors;
  t: Dictionary;
}): JSX.Element {
  const words = t.register;
  const key = `service:${service.id}`;
  const nameError = errors[`${key}:name`];
  const durationError = errors[`${key}:duration`];
  const priceError = errors[`${key}:price`];
  const durations = DURATIONS.includes(service.duration)
    ? DURATIONS
    : [...DURATIONS, service.duration].sort((a, b) => a - b);

  return (
    <li className="animate-in rounded-lg border border-border bg-surface p-3 duration-250 ease-soft fade-in slide-in-from-top-1 sm:p-4">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 gap-y-3 sm:grid-cols-[minmax(0,1fr)_8.75rem_9rem_auto]">
        <div className="col-span-3 sm:col-span-1">
          <label htmlFor={`reg-service-${service.id}-name`} className="sr-only">
            {words.serviceName} {index + 1}
          </label>
          <Input
            id={`reg-service-${service.id}-name`}
            data-service-name
            value={service.name}
            maxLength={80}
            onChange={(event) => setService(update, service.id, { name: event.target.value })}
            aria-invalid={Boolean(nameError)}
            placeholder={words.serviceNamePlaceholder}
            className="h-10"
          />
        </div>
        <div>
          <Select
            id={`reg-service-${service.id}-duration`}
            aria-label={words.duration}
            aria-invalid={Boolean(durationError)}
            value={service.duration}
            onChange={(event) =>
              setService(update, service.id, { duration: Number(event.target.value) })
            }
            className="h-10 tabular-nums"
          >
            {durations.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} {words.minutesShort}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative">
          <Input
            id={`reg-service-${service.id}-price`}
            aria-label={words.price}
            aria-invalid={Boolean(priceError)}
            inputMode="numeric"
            value={service.price ? service.price.toLocaleString("en-US") : ""}
            onChange={(event) =>
              setService(update, service.id, { price: parsePrice(event.target.value) })
            }
            placeholder="0"
            className="h-10 pr-8 text-right tabular-nums"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
          >
            ₮
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${words.remove}: ${service.name || index + 1}`}
          onClick={() => removeService(update, service.id)}
          className="self-center text-muted-foreground is-hover:text-danger-foreground"
        >
          <Trash2 />
        </Button>
      </div>
      {nameError || durationError || priceError ? (
        <FieldError className="mt-2">
          {[nameError, durationError, priceError]
            .flatMap((code) => (code ? [words.errors[code]] : []))
            .join(" ")}
        </FieldError>
      ) : null}
    </li>
  );
}
