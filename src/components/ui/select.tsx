import { ChevronDown } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

/**
 * Styled native <select>. On phones it opens the system picker, which is
 * faster, fully accessible and needs no JavaScript.
 */
function Select({ className, children, ...props }: ComponentProps<"select">): JSX.Element {
  return (
    <div data-slot="select" className="relative">
      <select className={cn(controlStyles, "h-11 appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { Select };
