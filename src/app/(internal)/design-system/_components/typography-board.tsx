import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { cn } from "@/lib/utils";

const SAMPLE = "Өглөөний үйлчилгээ — Үсчин, Өнгө";
const ALPHABET_UPPER = "А Б В Г Д Е Ё Ж З И Й К Л М Н О Ө П Р С Т У Ү Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я";
const ALPHABET_LOWER = "а б в г д е ё ж з и й к л м н о ө п р с т у ү ф х ц ч ш щ ъ ы ь э ю я";

const SCALE = [
  {
    token: "text-4xl",
    px: 49,
    lineHeight: "1.15",
    role: "Display",
    className: "font-heading text-4xl font-medium",
  },
  {
    token: "text-3xl",
    px: 39,
    lineHeight: "1.15",
    role: "Хуудасны гарчиг",
    className: "font-heading text-3xl font-medium",
  },
  {
    token: "text-2xl",
    px: 31,
    lineHeight: "1.2",
    role: "Хэсгийн гарчиг",
    className: "font-heading text-2xl font-medium",
  },
  {
    token: "text-xl",
    px: 25,
    lineHeight: "1.25",
    role: "Дэд гарчиг",
    className: "font-heading text-xl font-medium",
  },
  {
    token: "text-lg",
    px: 20,
    lineHeight: "1.4",
    role: "Онцлох текст",
    className: "text-lg font-medium",
  },
  { token: "text-base", px: 16, lineHeight: "1.6", role: "Үндсэн текст", className: "text-base" },
  { token: "text-sm", px: 14, lineHeight: "20px", role: "UI, тайлбар", className: "text-sm" },
  { token: "text-xs", px: 12, lineHeight: "16px", role: "Шошго, badge", className: "text-xs" },
] as const;

const SPECIMENS = [
  { name: "Unbounded · 500", use: "Гарчиг, том цаг", className: "font-heading font-medium" },
  { name: "Unbounded · 400", use: "Жижиг гарчиг", className: "font-heading font-normal" },
  { name: "Onest · 400", use: "Үндсэн текст", className: "font-sans font-normal" },
  { name: "Onest · 500", use: "Товч, шошго", className: "font-sans font-medium" },
  { name: "Onest · 600", use: "Үнэ, онцлох", className: "font-sans font-semibold" },
] as const;

const TIMES = ["09:00", "10:30", "11:15", "14:00", "17:45"] as const;

/** Design system: фонтын модуляр хэмжүүр (1.25), жин, гарчгийн жишээнүүд. */
export function TypographyBoard(): JSX.Element {
  return (
    <>
      <BoardSection title="Модуль масштаб · 1.25">
        <ul className="flex flex-col divide-y divide-border">
          {SCALE.map((step) => (
            <li
              key={step.token}
              className="grid grid-cols-1 gap-2 py-4 first:pt-0 md:grid-cols-[10rem_1fr] md:items-baseline md:gap-6"
            >
              <div className="flex gap-3 font-mono text-xs text-muted-foreground md:flex-col md:gap-1">
                <span className="text-foreground">{step.token}</span>
                <span className="tabular-nums">
                  {step.px}px · {step.lineHeight}
                </span>
                <span className="font-sans">{step.role}</span>
              </div>
              <p className={cn("min-w-0 text-foreground", step.className)}>{SAMPLE}</p>
            </li>
          ))}
        </ul>
      </BoardSection>

      <BoardSection title="Уян хатан гарчиг · clamp()">
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-5">
          <div>
            <p className="font-heading text-display font-medium">Цагаа тайван товлоорой</p>
            <Spec className="mt-2 font-mono">
              text-display · clamp(31px → 49px), 360px-ээс 1280px хүртэл жигд томорно
            </Spec>
          </div>
          <div>
            <p className="font-heading text-heading font-medium">Танд юу хэрэгтэй вэ?</p>
            <Spec className="mt-2 font-mono">text-heading · clamp(25px → 39px)</Spec>
          </div>
        </div>
      </BoardSection>

      <BoardSection title="Фонт · Монгол кирилл бүрэн (cyrillic-ext)">
        <ul className="grid gap-4 lg:grid-cols-2">
          {SPECIMENS.map((specimen) => (
            <li key={specimen.name} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-foreground">{specimen.name}</p>
                <Spec>{specimen.use}</Spec>
              </div>
              <p className={cn("mt-4 text-2xl text-foreground", specimen.className)}>Өө Үү Аа</p>
              <p className={cn("mt-3 text-sm break-words text-foreground", specimen.className)}>
                {ALPHABET_UPPER}
              </p>
              <p
                className={cn("mt-1 text-sm break-words text-muted-foreground", specimen.className)}
              >
                {ALPHABET_LOWER}
              </p>
            </li>
          ))}
        </ul>
      </BoardSection>

      <BoardSection title="Тоо · tabular-nums">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <Spec>Энгийн (proportional): тоо бүр өөр өргөнтэй</Spec>
            <ul className="mt-3 flex flex-col gap-1 text-lg">
              {TIMES.map((time) => (
                <li key={time} className="proportional-nums">
                  {time}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <Spec>tabular-nums: баганаар яг зэрэгцэнэ, цаг, үнэ, огноонд</Spec>
            <ul className="mt-3 flex flex-col gap-1 text-lg">
              {TIMES.map((time) => (
                <li key={time} className="tabular-nums">
                  {time}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="max-w-prose text-base text-muted-foreground">
          Нэг мөрийн урт 65 тэмдэгтээс (max-w-prose) хэтрэхгүй. Ингэснээр нүд мөрийн төгсгөлөөс
          дараагийн мөрийн эхэнд төөрөлгүй шилждэг тул урт текст ядаргаагүй уншигдана.
        </p>
      </BoardSection>
    </>
  );
}
