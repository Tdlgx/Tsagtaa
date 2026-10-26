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
  /** "sub": задарсан бүлэг дотор байрлах жижиг товч. */
  size?: "main" | "sub";
  /** Дэд ангиллын аль нэг нь сонгогдсон үеийн бүлгийн товч: дүүргэлтгүй, хүрээтэй. */
  parentActive?: boolean;
  trailing?: JSX.Element;
};

/** Товч хэлбэрээр зурсан нэг native radio, ингэснээр сумтай товч болон энгийн form submit ажилласаар байна. */
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
          // Hover сонгосон сонголтыг бүдгэрүүлэх ёсгүй тул текстийн өнгийг дахин зааж өгнө.
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
 * Дэд ангилалтай бүлэг (Салон). Хаалттай үедээ нэг товч. Бүлэг эсвэл түүний
 * хүүхдүүдийн аль нэг сонгогдмогц хажуу тийш задарна: хүүхдүүд нь өнгөтэй зам
 * дээгүүр товчноос гулсаж гарна, мөчир салаалах мэт.
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
      {/* 0fr → 1fr нь JS-д юу ч хэмжилгүйгээр өргөнийг анимэйшн хийнэ. */}
      <div
        inert={!open}
        className={cn(
          "grid transition-[grid-template-columns,opacity] duration-250 ease-soft",
          open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
        )}
      >
        {/* Зөвхөн нээлттэй үед зай, эс бөгөөс эвхэгдсэн зам ч завсар үлдээх байсан. */}
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

/** "Бүгд" + ангиллын бүлэг бүрт нэг товч; Салон дэд ангиллууд руугаа задарна. */
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
