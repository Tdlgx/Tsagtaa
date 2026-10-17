import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { getZonedParts } from "@/lib/date";

export function SiteFooter(): JSX.Element {
  const { year } = getZonedParts(new Date());

  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © <span className="tabular-nums">{year}</span> {APP_NAME}, Улаанбаатар
        </p>
      </Container>
    </footer>
  );
}
