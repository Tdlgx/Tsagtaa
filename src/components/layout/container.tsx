import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/** Page width: max 1200px, 20px side gutters on phones, 32px from 1024px. */
export function Container({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("mx-auto w-full max-w-page px-5 lg:px-8", className)} {...props} />;
}
