import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Хуудас олдсонгүй",
};

export default function NotFound(): JSX.Element {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Хуудас олдсонгүй</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Уучлаарай, таны хайсан хуудас байхгүй эсвэл өөр хаяг руу шилжсэн байна.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Нүүр хуудас руу буцах</Link>
      </Button>
    </main>
  );
}
