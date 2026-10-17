import type { LucideIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { UlziiKnot } from "@/components/shared/ulzii";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Usually one Button that helps the user move forward. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {/* Illustration: a faint өлзий knot behind the icon, framed by a soft disc. */}
      <div aria-hidden className="relative flex size-24 items-center justify-center">
        <span className="absolute inset-2 rounded-full bg-surface-muted" />
        <UlziiKnot className="absolute inset-0 size-24 text-primary opacity-15" strokeWidth={1} />
        <span className="relative flex size-12 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-sm">
          <Icon className="size-6" />
        </span>
      </div>
      <h3 className="mt-6 font-heading text-xl font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
