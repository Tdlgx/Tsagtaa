"use client";

import { Plus, Trash2 } from "lucide-react";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateDraft } from "@/features/business-registration/draft-store";
import {
  MAX_STAFF,
  type RegistrationDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import { getInitial } from "@/features/staff/sample-staff";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type StaffStepProps = {
  draft: RegistrationDraft;
  errors: StepErrors;
  t: Dictionary;
};

/** Avatar tints, cycled so people are told apart at a glance. */
const TONES = [
  "bg-primary-soft text-primary-strong",
  "bg-sun-soft text-sun-strong",
  "bg-success-soft text-success-foreground",
] as const;

export function addStaff(name = ""): void {
  updateDraft((draft) => ({
    ...draft,
    staff: [...draft.staff, { id: crypto.randomUUID(), name }].slice(0, MAX_STAFF),
  }));
}

function setStaffName(id: string, name: string): void {
  updateDraft((draft) => ({
    ...draft,
    staff: draft.staff.map((member) => (member.id === id ? { ...member, name } : member)),
  }));
}

function removeStaff(id: string): void {
  updateDraft((draft) => ({ ...draft, staff: draft.staff.filter((member) => member.id !== id) }));
}

/** A car wash books bays, not people: "Бокс 3" is the next free number. */
export function nextBayName(draft: RegistrationDraft, t: Dictionary): string {
  for (let number = 1; ; number += 1) {
    const name = t.register.bayName(number);
    if (!draft.staff.some((member) => member.name.trim() === name)) return name;
  }
}

export function StaffStep({ draft, errors, t }: StaffStepProps): JSX.Element {
  const words = t.register;
  const category = draft.category ?? "hair";
  const role = t.staff[category].role;
  const isWash = category === "car-wash";
  const full = draft.staff.length >= MAX_STAFF;

  const focusLast = (): void => {
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>("[data-staff-name]");
      inputs[inputs.length - 1]?.focus();
    });
  };

  return (
    <div id="reg-staff" tabIndex={-1} className="mt-6 flex flex-col gap-3 outline-none">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium text-foreground">{t.staff[category].stepLabel}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {words.staffCount(draft.staff.length)}
        </span>
      </div>
      <FieldError>{errors.staff ? words.errors.staffNone : null}</FieldError>

      <ul className="flex flex-col gap-2">
        {draft.staff.map((member, index) => {
          const error = errors[`staff:${member.id}`];
          return (
            <li
              key={member.id}
              className="animate-in duration-250 ease-soft fade-in slide-in-from-top-1"
            >
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2 pl-3">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    TONES[index % TONES.length],
                  )}
                >
                  {getInitial(member.name) || index + 1}
                </span>
                <label htmlFor={`reg-staff-${member.id}`} className="sr-only">
                  {words.staffName(role)} {index + 1}
                </label>
                <Input
                  id={`reg-staff-${member.id}`}
                  data-staff-name
                  value={member.name}
                  maxLength={60}
                  onChange={(event) => setStaffName(member.id, event.target.value)}
                  aria-invalid={Boolean(error)}
                  // Bays get a numbered hint; people's names are left blank.
                  placeholder={
                    isWash ? words.staffPlaceholder(words.bayName(index + 1)) : undefined
                  }
                  className="h-10 flex-1 border-transparent bg-transparent px-1 is-hover:border-transparent"
                />
                <span className="text-sm text-muted-foreground max-sm:hidden">{role}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${words.remove}: ${member.name || index + 1}`}
                  onClick={() => removeStaff(member.id)}
                  className="text-muted-foreground is-hover:text-danger-foreground"
                >
                  <Trash2 />
                </Button>
              </div>
              {error ? (
                <FieldError className="mt-1.5 pl-1">{words.errors[error]}</FieldError>
              ) : null}
            </li>
          );
        })}
      </ul>

      <Button
        variant="outline"
        className="w-full border-dashed"
        disabled={full}
        onClick={() => {
          addStaff(isWash ? nextBayName(draft, t) : "");
          if (!isWash) focusLast();
        }}
      >
        <Plus data-icon="start" />
        {isWash ? words.addBay : words.addStaff}
      </Button>
    </div>
  );
}
