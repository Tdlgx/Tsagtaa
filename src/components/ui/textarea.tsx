import type { ComponentProps, JSX } from "react";

import { controlStyles } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">): JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(controlStyles, "min-h-28 resize-y py-3 leading-normal", className)}
      {...props}
    />
  );
}

export { Textarea };
