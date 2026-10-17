import { CircleAlert } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/** Vertical stack: label → control → hint / error, 8px apart. */
function Field({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div data-slot="field" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function Label({ className, ...props }: ComponentProps<"label">): JSX.Element {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

function FieldHint({ className, ...props }: ComponentProps<"p">): JSX.Element {
  return (
    <p
      data-slot="field-hint"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Validation message. Link it to the control with `aria-describedby` and set
 * `aria-invalid` on the control so screen readers announce it.
 */
function FieldError({ className, children, ...props }: ComponentProps<"p">): JSX.Element | null {
  if (!children) return null;

  return (
    <p
      data-slot="field-error"
      className={cn("flex items-start gap-1.5 text-sm text-danger-foreground", className)}
      {...props}
    >
      {/* 2px nudge centers the 16px icon on the 20px first line of text. */}
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export { Field, FieldError, FieldHint, Label };
