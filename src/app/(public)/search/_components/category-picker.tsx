"use client";

import { ChevronRight, LayoutGrid, type LucideIcon } from "lucide-react";
import type { JSX } from "react";

import {
  BUSINESS_CATEGORIES,
  CATEGORY_GROUPS,
  getFilterGroup,
  type CategoryFilterSlug,
  type CategoryGroup,
} from "@/features/business/categories";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type ChipProps = {
  value: string;
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onChange: (value: string) => void;
  /** "sub": smaller pill that sits inside an unfolded group. */
  size?: "main" | "sub";
  /** The group pill while one of its subcategories is chosen: outlined, not filled. */
  parentActive?: boolean;
  trailing?: JSX.Element;
};

/** One native radio styled as a pill, so arrow keys and plain form submit still work. */
function Chip({
  value,
  label,
  icon: Icon,
  checked,
  onChange,
  size = "main",
  parentActive = false,
  trailing,
}: ChipProps): JSX.Element {
  return (
    <label className="relative shrink-0">
      <input
        type="radio"
        name="cat"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 ease-soft select-none is-hover:text-foreground",
          // Hover must not dim the chosen option, so its text color is restated.
          "peer-checked:bg-foreground peer-checked:text-background peer-checked:is-hover:text-background",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
          size === "main"
            ? "h-10 border border-border bg-surface px-4 peer-checked:border-foreground"
            : "h-8 bg-surface px-3 shadow-sm",
          parentActive && "border-foreground text-foreground",
        )}
      >
        {Icon ? <Icon className="size-4" /> : null}
        {label}
        {trailing}
      </span>
    </label>
  );
}

type BranchProps = {
  group: CategoryGroup;
  value: CategoryFilterSlug | "";
  open: boolean;
  onChange: (value: string) => void;
};

/**
 * A group with subcategories (Салон). Closed, it is a single pill. Once the
 * group or one of its children is chosen, it unfolds sideways: the children
 * slide out of the pill on a tinted track, like a branch splitting.
 */
function Branch({ group, value, open, onChange }: BranchProps): JSX.Element {
  const t = useT();
  const children = BUSINESS_CATEGORIES.filter((category) => category.group === group.slug);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-full transition-colors duration-250 ease-soft",
        open && "bg-surface-muted",
      )}
    >
      <Chip
        value={group.slug}
        label={t.groups[group.slug].label}
        icon={group.icon}
        checked={value === group.slug}
        parentActive={open && value !== group.slug}
        onChange={onChange}
        trailing={
          <ChevronRight
            className={cn(
              "-mr-1 size-4 opacity-60 transition-transform duration-250 ease-soft",
              open && "translate-x-0.5",
            )}
          />
        }
      />
      {/* 0fr → 1fr animates the width without measuring anything in JS. */}
      <div
        inert={!open}
        className={cn(
          "grid transition-[grid-template-columns,opacity] duration-250 ease-soft",
          open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
        )}
      >
        {/* Padding only while open, or the folded track would still leave a gap. */}
        <div className={cn("flex min-w-0 items-center gap-1 overflow-hidden py-1", open && "px-1")}>
          {children.map((category) => (
            <Chip
              key={category.slug}
              value={category.slug}
              label={t.categories[category.slug].label}
              icon={category.icon}
              size="sub"
              checked={value === category.slug}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type CategoryPickerProps = {
  value: CategoryFilterSlug | "";
  onChange: (value: string) => void;
};

/** "Бүгд" + one pill per category group; Салон unfolds into its subcategories. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps): JSX.Element {
  const t = useT();
  const openGroup = value === "" ? null : getFilterGroup(value).slug;

  return (
    <fieldset data-tour="categories" className="min-w-0">
      <legend className="sr-only">{t.search.categories}</legend>
      <div className="-mx-5 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        <Chip
          value=""
          label={t.search.all}
          icon={LayoutGrid}
          checked={value === ""}
          onChange={onChange}
        />
        {CATEGORY_GROUPS.map((group) =>
          group.categories.length > 1 ? (
            <Branch
              key={group.slug}
              group={group}
              value={value}
              open={openGroup === group.slug}
              onChange={onChange}
            />
          ) : (
            <Chip
              key={group.slug}
              value={group.slug}
              label={t.groups[group.slug].label}
              icon={group.icon}
              checked={value === group.slug}
              onChange={onChange}
            />
          ),
        )}
      </div>
    </fieldset>
  );
}
