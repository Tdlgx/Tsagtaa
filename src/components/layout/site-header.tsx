import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { HeaderShell } from "@/components/layout/header-shell";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type SiteHeaderProps = {
  forceScrolled?: boolean;
  sticky?: boolean;
};

export function SiteHeader({ forceScrolled, sticky }: SiteHeaderProps): JSX.Element {
  return (
    <HeaderShell forceScrolled={forceScrolled} sticky={sticky}>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-4">
          <DesktopNav className="hidden md:block" />
          <ThemeToggle />
        </div>
      </Container>
    </HeaderShell>
  );
}
