import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { JSX } from "react";

import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Хуудас олдсонгүй",
};

export default function NotFound(): JSX.Element {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-16">
      <Logo />
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-sm">
        <EmptyState
          icon={Search}
          title="Хуудас олдсонгүй"
          description="Уучлаарай, таны хайсан хуудас байхгүй эсвэл өөр хаяг руу шилжсэн байна."
          action={
            <Button asChild>
              <Link href="/">Нүүр хуудас руу буцах</Link>
            </Button>
          }
        />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">Алдааны код: 404</p>
    </main>
  );
}
