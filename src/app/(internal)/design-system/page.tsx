import type { Metadata } from "next";
import type { JSX } from "react";

import { Artboard } from "@/app/(internal)/design-system/_components/artboard";
import {
  CatalogBoard,
  FeedbackBoard,
  TimeSlotBoard,
} from "@/app/(internal)/design-system/_components/booking-boards";
import { ColorBoard } from "@/app/(internal)/design-system/_components/color-board";
import {
  ButtonBoard,
  CardBoard,
  FormBoard,
} from "@/app/(internal)/design-system/_components/component-boards";
import {
  LayoutBoard,
  MotionBoard,
  ShapeBoard,
} from "@/app/(internal)/design-system/_components/foundations-board";
import { NavigationBoard } from "@/app/(internal)/design-system/_components/navigation-board";
import { TypographyBoard } from "@/app/(internal)/design-system/_components/typography-board";
import { Container } from "@/components/layout/container";
import { HeaderShell } from "@/components/layout/header-shell";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Дизайн систем",
};

const BOARDS = [
  {
    id: "colors",
    title: "Өнгө ба контраст",
    description:
      "Шаазан суурь, хөх тэнгэрийн ultramarine брэнд, цагийг заах гүргэм шар. Бүх текст WCAG AA.",
    Board: ColorBoard,
  },
  {
    id: "typography",
    title: "Типографи",
    description: "Unbounded (гарчиг, цаг) + Onest (текст, UI). Монгол Ө, Ү бүх фонтод.",
    Board: TypographyBoard,
  },
  {
    id: "layout",
    title: "Grid ба зай",
    description: "4pt суурь, 4 / 8 / 12 багана, 1200px container.",
    Board: LayoutBoard,
  },
  {
    id: "shape",
    title: "Хэлбэр ба гүн",
    description: "Radius, хоёр давхар индиго сүүдэр, grain, өлзий хээ.",
    Board: ShapeBoard,
  },
  {
    id: "motion",
    title: "Хөдөлгөөн ба icon",
    description: "150 / 250 / 400ms, нэг easing муруй, stroke 1.5 icon.",
    Board: MotionBoard,
  },
  {
    id: "buttons",
    title: "Товч",
    description: "5 хувилбар, 3 хэмжээ, 6 төлөв.",
    Board: ButtonBoard,
  },
  {
    id: "forms",
    title: "Маягтын талбар",
    description: "Input, Select, Textarea, Label, алдааны мессеж.",
    Board: FormBoard,
  },
  {
    id: "cards",
    title: "Карт ба Badge",
    description: "Стандарт, интерактив, өргөгдсөн карт. Захиалгын төлөв.",
    Board: CardBoard,
  },
  {
    id: "time-slots",
    title: "Цаг сонголт",
    description: "Аппын хамгийн чухал компонент: TimeSlot ба Stepper.",
    Board: TimeSlotBoard,
  },
  {
    id: "catalog",
    title: "Үйлчилгээ ба бизнес",
    description: "ServiceCard, BusinessCard.",
    Board: CatalogBoard,
  },
  {
    id: "feedback",
    title: "Ачаалал ба мэдэгдэл",
    description: "Skeleton, хоосон төлөв, toast.",
    Board: FeedbackBoard,
  },
  {
    id: "navigation",
    title: "Навигаци",
    description: "Sticky header, доод навигаци, footer.",
    Board: NavigationBoard,
  },
] as const;

const BRIEF = [
  { label: "Мэдрэмж", value: "Хөх цаг: цэвэр, тодорхой, цагийг мэдэрдэг" },
  { label: "Өнгө", value: "#0E1014 бэх, #C2F41E лайм, #4A6100 чидун, #F2AE1C гүргэм" },
  { label: "Фонт", value: "Unbounded 500 гарчиг, Onest 400/500/600 текст" },
  { label: "Grid", value: "4pt · 4/8/12 багана · 1200px · 20/32px зах" },
] as const;

/**
 * Дизайн системийн бүх artboard-ыг нэг canvas дээр харуулах дотоод хуудас (зөвхөн хөгжүүлэлтэд).
 */
export default function DesignSystemPage(): JSX.Element {
  return (
    <>
      <HeaderShell>
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="sun" className="hidden sm:inline-flex">
              Дизайн систем
            </Badge>
          </div>
          <ThemeToggle />
        </Container>
      </HeaderShell>

      <main className="flex-1 bg-canvas">
        <Container className="py-10 md:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary-strong">Цагтаа, дизайн систем v2</p>
            <h1 className="mt-3 font-heading text-display font-medium text-foreground">Хөх цаг</h1>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground">
              Аппын бүх хуудас эндээс эхэлнэ: өнгө, зай, хэмжээ бүр token-оос гарч, компонент бүр
              бүх төлөвтэйгээ энд харагдана. Санамсаргүй утга нэг ч байхгүй.
            </p>
          </div>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {BRIEF.map(({ label, value }) => (
              <div key={label} className="bg-surface p-5">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="mt-2 text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 grid gap-10 lg:grid-cols-[12rem_1fr]">
            <nav aria-label="Artboard-ууд" className="hidden lg:block">
              <ol className="sticky top-24 flex flex-col gap-1 text-sm">
                {BOARDS.map(({ id, title }, index) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="flex gap-3 rounded-sm px-2 py-1.5 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface is-hover:text-foreground"
                    >
                      <span className="font-mono text-xs tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex min-w-0 flex-col gap-12">
              {BOARDS.map(({ id, title, description, Board }, index) => (
                <Artboard
                  key={id}
                  id={id}
                  number={index + 1}
                  title={title}
                  description={description}
                >
                  <Board />
                </Artboard>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
