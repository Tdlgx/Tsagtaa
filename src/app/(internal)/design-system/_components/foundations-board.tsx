import {
  CalendarDays,
  Clock,
  MapPin,
  Scissors,
  Search,
  Star,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { UlziiKnot, UlziiPattern } from "@/components/shared/ulzii";
import { cn } from "@/lib/utils";

const SPACING = [
  { step: 1, px: 4, className: "w-1" },
  { step: 2, px: 8, className: "w-2" },
  { step: 3, px: 12, className: "w-3" },
  { step: 4, px: 16, className: "w-4" },
  { step: 5, px: 20, className: "w-5" },
  { step: 6, px: 24, className: "w-6" },
  { step: 8, px: 32, className: "w-8" },
  { step: 10, px: 40, className: "w-10" },
  { step: 12, px: 48, className: "w-12" },
  { step: 16, px: 64, className: "w-16" },
  { step: 24, px: 96, className: "w-24" },
] as const;

const GRIDS = [
  { label: "Гар утас · 4 багана · 16px зай", cols: 4, className: "grid-cols-4 gap-4" },
  { label: "Таблет · 8 багана · 24px зай", cols: 8, className: "grid-cols-8 gap-6" },
  { label: "Desktop · 12 багана · 24px зай", cols: 12, className: "grid-cols-12 gap-6" },
] as const;

const RADII = [
  { token: "rounded-sm", px: "6px", use: "Жижиг элемент", className: "rounded-sm" },
  { token: "rounded-md", px: "10px", use: "Товч, талбар", className: "rounded-md" },
  { token: "rounded-lg", px: "16px", use: "Карт", className: "rounded-lg" },
  { token: "rounded-xl", px: "24px", use: "Том panel", className: "rounded-xl" },
  { token: "rounded-full", px: "∞", use: "Avatar, badge", className: "rounded-full" },
] as const;

const SHADOWS = [
  { token: "shadow-sm", use: "Карт, товч", className: "shadow-sm" },
  { token: "shadow-md", use: "Hover, popover", className: "shadow-md" },
  { token: "shadow-lg", use: "Modal, mockup", className: "shadow-lg" },
] as const;

const DURATIONS = [
  { ms: 150, use: "Hover, дарах", className: "duration-150" },
  { ms: 250, use: "Нээх, хаах", className: "duration-250" },
  { ms: 400, use: "Хуудасны элемент", className: "duration-400" },
] as const;

const ICON_SIZES = [
  { px: 16, use: "Текст доторх, жижиг товч", className: "size-4" },
  { px: 20, use: "Том товч, жагсаалт", className: "size-5" },
  { px: 24, use: "Навигаци, онцлох", className: "size-6" },
] as const;

const ICONS: readonly LucideIcon[] = [
  Search,
  CalendarDays,
  Clock,
  MapPin,
  Star,
  Scissors,
  UserRound,
];

export function LayoutBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Зай · 4pt суурь сүлжээ">
        <ul className="flex flex-col gap-2">
          {SPACING.map(({ step, px, className }) => (
            <li key={step} className="grid grid-cols-[5rem_4rem_1fr] items-center gap-4 text-xs">
              <span className="font-mono text-foreground">spacing-{step}</span>
              <span className="font-mono text-muted-foreground tabular-nums">{px}px</span>
              <span
                className={cn("h-4 rounded-sm bg-primary-soft ring-1 ring-primary/30", className)}
              />
            </li>
          ))}
        </ul>
        <Spec>
          Бүх зай 4-ийн үржвэр. Хэсэг доторх зай 8–24px, хэсэг хоорондох зай 64–96px. Том зай нь
          «энэ хэсэг дууслаа» гэдгийг хүрээгүйгээр ойлгуулдаг.
        </Spec>
      </BoardSection>

      <BoardSection title="Grid · container 1200px">
        <div className="flex flex-col gap-6">
          {GRIDS.map(({ label, cols, className }) => (
            <div key={cols} className="flex flex-col gap-2">
              <Spec className="font-mono">{label}</Spec>
              <div
                className={cn(
                  "grid h-16 rounded-md border border-dashed border-border bg-surface p-2",
                  className,
                )}
              >
                {Array.from({ length: cols }, (_, index) => (
                  <span key={index} className="rounded-sm bg-sun-soft" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Spec>
          Хажуугийн зай: гар утсанд 20px, 1024px-ээс дээш 32px. Агуулга 1200px-ээс өргөсөхгүй.
        </Spec>
      </BoardSection>
    </>
  );
}

export function ShapeBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Radius">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {RADII.map(({ token, px, use, className }) => (
            <li key={token} className="flex flex-col gap-3">
              <span
                className={cn("h-20 w-full border border-primary/40 bg-primary-soft", className)}
              />
              <div>
                <p className="font-mono text-xs text-foreground">
                  {token} · <span className="tabular-nums">{px}</span>
                </p>
                <Spec>{use}</Spec>
              </div>
            </li>
          ))}
        </ul>
      </BoardSection>

      <BoardSection title="Сүүдэр · дулаан хүрэн, хоёр давхарга">
        <ul className="grid gap-6 rounded-lg bg-surface-muted p-6 sm:grid-cols-3">
          {SHADOWS.map(({ token, use, className }) => (
            <li
              key={token}
              className={cn(
                "flex h-28 flex-col justify-end rounded-lg border border-border bg-surface p-4",
                className,
              )}
            >
              <p className="font-mono text-xs text-foreground">{token}</p>
              <Spec>{use}</Spec>
            </li>
          ))}
        </ul>
        <Spec>
          Ойрын 1–2px сүүдэр нь картыг гадаргуу дээр «суулгаж», холын бүдэг сүүдэр гүн өгнө. Цэвэр
          хар биш, индиго өнгөтэй тул шаазан дэвсгэр дээр саарал толбо болохгүй.
        </Spec>
      </BoardSection>

      <BoardSection title="Бүтэц · grain ба өлзий хээ">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grain flex h-36 items-end overflow-hidden rounded-lg border border-border bg-primary-soft p-4">
            <Spec>Grain · SVG noise · 2.5%</Spec>
          </div>
          <div className="relative flex h-36 items-end overflow-hidden rounded-lg border border-border bg-surface p-4">
            <UlziiPattern className="absolute inset-0 size-full text-primary opacity-5" />
            <Spec className="relative">Өлзий хээ · 5% · зөвхөн hero</Spec>
          </div>
          <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-4">
            <UlziiKnot className="size-16 text-primary" />
            <Spec>Өлзий · 48px grid</Spec>
          </div>
        </div>
      </BoardSection>
    </>
  );
}

export function MotionBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Хугацаа · заагч эсвэл Tab-аар идэвхжүүлнэ">
        <ul className="grid gap-4 sm:grid-cols-3">
          {DURATIONS.map(({ ms, use, className }) => (
            <li key={ms}>
              <div
                tabIndex={0}
                className={cn(
                  "flex h-28 flex-col justify-between rounded-lg border border-border bg-surface p-4 outline-none",
                  "transition-transform ease-soft focus-visible:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring is-hover:-translate-y-1",
                  className,
                )}
              >
                <p className="font-mono text-sm text-foreground tabular-nums">{ms}ms</p>
                <Spec>{use}</Spec>
              </div>
            </li>
          ))}
        </ul>
      </BoardSection>

      <BoardSection title="Easing · cubic-bezier(0.2, 0.8, 0.2, 1)">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <svg
            viewBox="0 0 100 100"
            className="size-32 shrink-0 rounded-md border border-border bg-surface p-3"
            aria-hidden
          >
            <path d="M0 100 L100 0" className="stroke-border" strokeDasharray="2 3" fill="none" />
            <path
              d="M0 100 C20 20 20 0 100 0"
              className="stroke-primary"
              strokeWidth={2}
              fill="none"
            />
          </svg>
          <Spec className="max-w-prose">
            Хурдан эхэлж, зөөлөн зогсдог муруй. Элемент «шидэгдэж» биш, «байрандаа очиж суух» мэт
            харагдана. Зөвхөн transform ба opacity хөдөлнө: тэдгээрийг GPU шууд зурдаг тул хуудас
            гацдаггүй. Төхөөрөмж дээр «reduce motion» асаалттай бол хөдөлгөөн унтарна.
          </Spec>
        </div>
      </BoardSection>

      <BoardSection title="Icon · lucide · stroke 1.5 · 16 / 20 / 24">
        <ul className="flex flex-col gap-4">
          {ICON_SIZES.map(({ px, use, className }) => (
            <li key={px} className="flex flex-wrap items-center gap-5">
              <span className="w-28 font-mono text-xs text-foreground tabular-nums">{px}px</span>
              <span className="flex items-center gap-4 text-foreground">
                {ICONS.map((Icon, index) => (
                  <Icon key={index} className={className} />
                ))}
              </span>
              <Spec>{use}</Spec>
            </li>
          ))}
        </ul>
      </BoardSection>
    </>
  );
}
