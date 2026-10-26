"use client";

import { Check } from "lucide-react";
import type { JSX } from "react";

import { TiltCard } from "@/components/shared/tilt-card";
import { FieldError } from "@/components/ui/field";
import {
  CATEGORY_DEFAULTS,
  HOURS_PRESETS,
  type RegistrationDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import { updateDraft } from "@/features/business-registration/draft-store";
import {
  BUSINESS_CATEGORIES,
  type BusinessCategory,
  type BusinessCategorySlug,
} from "@/features/business/categories";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type CategoryStepProps = { draft: RegistrationDraft; errors: StepErrors; t: Dictionary };

/**
 * Газрын төрлийг сонгоход түүнд тохирох ердийн цагийн хуваарь, захиалгын торыг
 * бэлдэнэ, эзэмшигч өөрийн цагийг аль хэдийн тохируулаагүй бол.
 */
function choose(category: BusinessCategorySlug): void {
  updateDraft((draft) => {
    const defaults = CATEGORY_DEFAULTS[category];
    return {
      ...draft,
      category,
      ...(draft.hoursEdited
        ? {}
        : { hours: HOURS_PRESETS[defaults.hours], slotMinutes: defaults.slotMinutes }),
    };
  });
}

/** Бүртгэлийн 1-р алхам: газрын төрлийг сонгох (салоны дэд ангиллууд тусдаа бүлэгт). */
export function CategoryStep({ draft, errors, t }: CategoryStepProps): JSX.Element {
  const salon = BUSINESS_CATEGORIES.filter((category) => category.group === "salon");
  const others = BUSINESS_CATEGORIES.filter((category) => category.group !== "salon");

  return (
    <fieldset
      id="reg-category"
      tabIndex={-1}
      aria-describedby={errors.category ? "reg-category-error" : undefined}
      className="mt-6 flex flex-col gap-6 outline-none"
    >
      <legend className="sr-only">{t.register.headings.category}</legend>
      <FieldError id="reg-category-error">
        {errors.category ? t.register.errors.category : null}
      </FieldError>
      {[
        { title: t.groups.salon.label, items: salon },
        { title: null, items: others },
      ].map(({ title, items }) => (
        <div key={title ?? "other"}>
          {title ? (
            <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {title}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                checked={draft.category === category.slug}
                t={t}
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

function CategoryCard({
  category,
  checked,
  t,
}: {
  category: BusinessCategory;
  checked: boolean;
  t: Dictionary;
}): JSX.Element {
  const { slug, icon: Icon } = category;

  return (
    <TiltCard maxDegrees={6} className="rounded-lg">
      <label className="block">
        <input
          type="radio"
          name="category"
          value={slug}
          checked={checked}
          onChange={() => choose(slug)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-[border-color,background-color] duration-150 ease-soft",
            "peer-focus-visible:ring-3 peer-focus-visible:ring-ring is-hover:border-muted-foreground",
            "peer-checked:border-primary-strong peer-checked:bg-primary-soft",
          )}
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ease-soft",
              checked ? "bg-brand-ink text-primary" : "bg-surface-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-foreground">{t.categories[slug].label}</span>
            <span className="block text-sm text-muted-foreground">
              {t.categories[slug].description}
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ease-soft",
              checked
                ? "border-primary-strong bg-primary text-primary-foreground"
                : "border-input text-transparent",
            )}
          >
            <Check className="size-3.5" />
          </span>
        </span>
      </label>
    </TiltCard>
  );
}
