"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import type { JSX } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Аппын хэмжээний toast-ийн сав. Client кодын хаанаас ч "sonner"-ийн
 * `toast.success("…")`-ийг дуудна. Design token-оор стиль өгсөн, screen reader-т зарлагдана.
 */
function Toaster(props: ToasterProps): JSX.Element {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group [--border-radius:var(--radius-lg)] [--normal-bg:var(--surface)] [--normal-border:var(--border)] [--normal-text:var(--foreground)]"
      icons={{
        success: <CircleCheck className="size-5 text-success" />,
        info: <Info className="size-5 text-primary-strong" />,
        warning: <TriangleAlert className="size-5 text-warning" />,
        error: <CircleAlert className="size-5 text-danger" />,
        loading: <LoaderCircle className="size-5 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast: "font-sans shadow-lg! gap-3!",
          title: "text-sm! font-medium!",
          description: "text-sm! text-muted-foreground!",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
