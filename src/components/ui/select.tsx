import { ChevronDown } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

/**
 * Стиль өгсөн native <select>. Утсан дээр системийн сонгогчийг нээнэ: илүү хурдан,
 * бүрэн хүртээмжтэй, JavaScript хэрэггүй.
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
