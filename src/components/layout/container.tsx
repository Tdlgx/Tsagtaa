import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/** Хуудасны өргөн: хамгийн ихдээ 1200px, утсан дээр хажуугаар 20px, 1024px-ээс 32px зай. */
export function Container({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("mx-auto w-full max-w-page px-5 lg:px-8", className)} {...props} />;
}
