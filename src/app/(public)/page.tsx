import { ArrowDown } from "lucide-react";
import type { JSX } from "react";

import { TodayBoard } from "@/app/(public)/_components/today-board";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { BUSINESS_CATEGORIES } from "@/features/business/categories";

const STEPS = [
  {
    title: "Газраа сонгоно",
    description: "Ойр байгаа үсчин, салон, барбершопоо үнэлгээ, үнээр нь харьцуулна.",
  },
  {
    title: "Сул цагаа товлоно",
    description: "Үйлчилгээ, ажилтнаа сонгоход тухайн өдрийн сул цагууд шууд харагдана.",
  },
  {
    title: "Цагтаа ирнэ",
    description: "Утасны дугаараараа баталгаажуулна. Таны цаг хадгалагдсан тул дараалал хүлээхгүй.",
  },
] as const;

const OWNER_POINTS = [
  "Утсаар цаг тохирох дуудлага багасна",
  "Ажилтан бүрийн хуваарь нэг дор харагдана",
  "Захиалга бүр утасны дугаараар баталгаажсан ирнэ",
] as const;

export default function HomePage(): JSX.Element {
  return (
    <>
      {/* Hero: the promise, then the day itself ------------------------- */}
      <section className="border-b border-border">
        <Container className="pt-10 pb-12 md:pt-16 md:pb-20">
          <div className="layout-grid items-end gap-y-6">
            <h1 className="col-span-4 font-heading text-display font-medium text-foreground md:col-span-8 lg:col-span-7">
              Цагаа сонгоод, цагтаа ирээрэй.
            </h1>
            <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:pb-2">
              <p className="max-w-md text-lg text-muted-foreground">
                Улаанбаатарын үсчин, барбершоп, маникюр, массажны газруудын сул цагийг нэг дороос
                хараад, хэдхэн алхмаар баталгаажуулаарай.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Button asChild size="lg">
                  <a href="#today">
                    Сул цаг харах
                    <ArrowDown data-icon="end" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a href="#how-it-works">Хэрхэн ажилладаг вэ</a>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 md:mt-14">
            <TodayBoard id="today" />
            <p className="mt-3 text-sm text-muted-foreground">
              Жишээ хуваарь. Бодит газрууд удахгүй нэмэгдэнэ.
            </p>
          </div>
        </Container>
      </section>

      {/* How it works: a real sequence, so it is numbered -------------- */}
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-16">
        <Container className="layout-grid gap-y-10 py-16 md:py-24">
          <SectionHeading
            className="col-span-4 md:col-span-8 lg:col-span-4"
            title={<span id="how-it-works-title">Гурван алхам, хэдхэн минут</span>}
            description="Утсаар залгаж, хариу хүлээх шаардлагагүй. Сул цагийг шууд харж, өөрт тохирохыг нь сонгоно."
          />
          <ol className="col-span-4 flex flex-col md:col-span-8 lg:col-span-7 lg:col-start-6">
            {STEPS.map(({ title, description }, index) => (
              <li
                key={title}
                className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-border py-6 last:border-b sm:grid-cols-[5rem_1fr]"
              >
                <span className="font-heading text-2xl leading-none font-medium text-primary tabular-nums sm:text-3xl">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 max-w-prose text-base text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Categories: what can be booked --------------------------------- */}
      <section aria-labelledby="categories-title" className="border-t border-border bg-surface">
        <Container className="py-16 md:py-24">
          <SectionHeading title={<span id="categories-title">Юу захиалж болох вэ?</span>} />
          <ul className="mt-10 grid grid-cols-1 border-t border-border sm:grid-cols-2 lg:grid-cols-5">
            {BUSINESS_CATEGORIES.map(({ slug, label, description, icon: Icon }) => (
              <li
                key={slug}
                className="flex items-start gap-4 border-b border-border py-6 sm:pr-6 lg:flex-col lg:border-b-0 lg:border-l lg:px-5 lg:py-2 lg:first:border-l-0 lg:first:pl-0"
              >
                <Icon className="size-7 shrink-0 text-primary" />
                <span className="flex flex-col gap-1.5">
                  <span className="font-heading text-lg font-medium tracking-tight text-foreground">
                    {label}
                  </span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* For owners: the one inverted band ------------------------------ */}
      <section aria-labelledby="owners-title" className="bg-primary text-primary-foreground">
        <Container className="layout-grid gap-y-8 py-16 md:py-20">
          <div className="col-span-4 md:col-span-8 lg:col-span-6">
            <h2
              id="owners-title"
              className="font-heading text-heading font-medium text-primary-foreground"
            >
              Салон, барбершопоо Цагтаад нэмээрэй
            </h2>
            <p className="mt-4 max-w-prose text-base opacity-85">
              Захиалга, ажилтны хуваарь, үйлчилгээ, үнээ нэг газраас удирдана.
            </p>
            {/* Destination is wired up with the business dashboard step. */}
            <Button size="lg" variant="inverse" className="mt-8">
              Бизнесээ бүртгүүлэх
            </Button>
          </div>
          <ul className="col-span-4 flex flex-col self-end md:col-span-8 lg:col-span-5 lg:col-start-8">
            {OWNER_POINTS.map((point) => (
              <li
                key={point}
                className="border-t border-primary-foreground/25 py-4 text-base last:border-b"
              >
                {point}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
