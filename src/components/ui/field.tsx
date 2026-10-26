import { CircleAlert } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/** Босоо дараалал: label → удирдлага → зөвлөмж / алдаа, 8px зайтай. */
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
 * Шалгалтын мессеж. Удирдлагатай `aria-describedby`-аар холбож, удирдлага дээр
 * `aria-invalid` тавьбал screen reader зарлана.
 */
function FieldError({ className, children, ...props }: ComponentProps<"p">): JSX.Element | null {
  if (!children) return null;

  return (
    <p
      data-slot="field-error"
      className={cn("flex items-start gap-1.5 text-sm text-danger-foreground", className)}
      {...props}
    >
      {/* 2px шилжүүлэлт 16px icon-ыг текстийн 20px-ийн эхний мөрөнд голлуулна. */}
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export { Field, FieldError, FieldHint, Label };
