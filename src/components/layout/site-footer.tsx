import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { APP_NAME } from "@/lib/constants";
import { getZonedParts } from "@/lib/date";

export function SiteFooter(): JSX.Element {
  const { year } = getZonedParts(new Date());

  return (
    <footer className="border-t">
      <Container className="py-6 text-center text-sm text-muted-foreground">
        © {year} {APP_NAME}. Бүх эрх хуулиар хамгаалагдсан.
      </Container>
    </footer>
  );
}
