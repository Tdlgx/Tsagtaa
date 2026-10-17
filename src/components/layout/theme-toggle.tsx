"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useId, type JSX } from "react";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type ThemeOption = { value: "system" | "light" | "dark"; label: string; icon: LucideIcon };

const OPTIONS: readonly ThemeOption[] = [
  { value: "system", label: "Системийн горим", icon: Monitor },
  { value: "light", label: "Цайвар горим", icon: Sun },
  { value: "dark", label: "Бараан горим", icon: Moon },
];

/**
 * Segmented control built from native radio buttons: Tab focuses the group,
 * arrow keys switch the theme — no custom keyboard code needed.
 */
export function ThemeToggle({ className }: { className?: string }): JSX.Element {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; render nothing selected until then.
  const mounted = useMounted();
  // Unique radio group name, so two toggles on one page never merge into one group.
  const name = useId();

  return (
    <fieldset
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5",
        className,
      )}
    >
      <legend className="sr-only">Өнгөний горим</legend>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <label key={value} title={label} className="relative">
          <input
            type="radio"
            name={name}
            value={value}
            checked={mounted && theme === value}
            onChange={() => setTheme(value)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground",
              "peer-checked:bg-surface-muted peer-checked:text-foreground is-hover:text-foreground",
              "peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
