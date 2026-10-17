import type { ComponentProps, JSX } from "react";

import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">): JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(controlStyles, "h-11", className)}
      {...props}
    />
  );
}

export { Input };
