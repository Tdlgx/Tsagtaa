import { CalendarClock } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-4" aria-hidden />
          </span>
          <span className="text-lg">{APP_NAME}</span>
        </Link>
      </Container>
    </header>
  );
}
