"use client";

import type { JSX, ReactNode } from "react";

import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

type HeaderShellProps = {
  children: ReactNode;
  /** Preview a state regardless of scroll position (used on /design-system). */
  forceScrolled?: boolean;
  sticky?: boolean;
  className?: string;
};

/**
 * Header background. At the top of the page it is transparent; once the page
 * scrolls, a blurred translucent layer with a hairline fades in. Only the
 * layer's opacity animates.
 */
export function HeaderShell({
  children,
  forceScrolled,
  sticky = true,
  className,
}: HeaderShellProps): JSX.Element {
  const scrolled = useScrolled();
  const isScrolled = forceScrolled ?? scrolled;

  return (
    <header
      data-scrolled={isScrolled}
      className={cn(
        // z-40 on a positioned element already creates a stacking context.
        // Do not add `isolate`: in Chrome it becomes a "backdrop root" and the
        // blur below would see nothing to blur.
        "z-40",
        sticky ? "sticky top-0" : "relative",
        "before:absolute before:inset-0 before:-z-10 before:border-b before:border-border before:bg-background/80 before:opacity-0 before:backdrop-blur-md before:transition-opacity before:duration-250 before:ease-soft",
        "data-[scrolled=true]:before:opacity-100",
        className,
      )}
    >
      {children}
    </header>
  );
}
