import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-muted-foreground",
        primary: "bg-primary-soft text-primary-strong",
        success: "bg-success-soft text-success-foreground",
        warning: "bg-warning-soft text-warning-foreground",
        danger: "bg-danger-soft text-danger-foreground",
        sun: "bg-sun-soft text-sun-strong",
        outline: "border border-border bg-surface text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** A 6px status dot in the badge's text color. */
    dot?: boolean;
  };

function Badge({ className, tone, dot = false, children, ...props }: BadgeProps): JSX.Element {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants, type BadgeProps, type BadgeTone };
