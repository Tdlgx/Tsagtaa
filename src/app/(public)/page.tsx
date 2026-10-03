import { BadgeCheck, CalendarCheck, Search, type LucideIcon } from "lucide-react";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const STEPS: readonly Step[] = [
  {
    icon: Search,
    title: "Газраа олоорой",
    description: "Ойр байгаа үсчин, салон, барбершопоо хайж олно.",
  },
  {
    icon: CalendarCheck,
    title: "Цагаа сонгоорой",
    description: "Үйлчилгээ, ажилтан, өөрт тохирох сул цагаа сонгоно.",
  },
  {
    icon: BadgeCheck,
    title: "Баталгаажуулаарай",
    description: "Утасны дугаараараа баталгаажуулаад захиалгаа хийнэ.",
  },
];

export default function HomePage(): JSX.Element {
  return (
    <>
      <section className="border-b bg-linear-to-b from-accent/60 to-background">
        <Container className="flex flex-col items-center py-16 text-center sm:py-24">
          <span className="mb-6 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            Удахгүй нээгдэнэ
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">{APP_NAME}</h1>
          <p className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            {APP_DESCRIPTION}
          </p>
          {/* Destination is wired up in the booking step. */}
          <Button type="button" size="lg" className="mt-8 h-12 px-6 text-base shadow-lifted">
            Цаг захиалах
          </Button>
        </Container>
      </section>

      <section aria-labelledby="how-it-works">
        <Container className="py-12 sm:py-16">
          <h2 id="how-it-works" className="text-center text-2xl font-semibold tracking-tight">
            Хэрхэн ажилладаг вэ?
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <li key={title}>
                <Card className="h-full shadow-soft">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {index + 1}. {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
