/**
 * `cn(...)` joins class names and resolves Tailwind conflicts, so the last one wins:
 *   cn("px-2 py-1", isActive && "bg-primary", "px-4") → "py-1 bg-primary px-4"
 * It comes from the `cn` package by shadcn (a faster drop-in for clsx + tailwind-merge).
 * Import it from here (`@/lib/utils`) so the implementation can change in one place.
 */
export { cn } from "cn";
