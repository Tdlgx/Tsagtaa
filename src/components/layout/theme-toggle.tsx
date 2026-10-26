"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useId, type JSX } from "react";

import { useT } from "@/i18n/client";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type ThemeOption = { value: "system" | "light" | "dark"; icon: LucideIcon };

const OPTIONS: readonly ThemeOption[] = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

/**
 * Native radio товчнуудаар хийсэн segmented control: Tab бүлэгт focus хийж, сумтай
 * товч theme-ийг солино — тусгай гарын код хэрэггүй.
 */
export function ThemeToggle({ className }: { className?: string }): JSX.Element {
  const { theme, setTheme } = useTheme();
  const t = useT();
  // Хадгалсан theme зөвхөн browser-т мэдэгддэг; тэр болтол юуг ч сонгосон гэж харуулахгүй.
  const mounted = useMounted();
  // Radio бүлгийн давтагдашгүй нэр, ингэснээр нэг хуудсан дээрх хоёр солигч нэг бүлэг болж нийлэхгүй.
  const name = useId();

  return (
    <fieldset
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5",
        className,
      )}
    >
      <legend className="sr-only">{t.theme.legend}</legend>
      {OPTIONS.map(({ value, icon: Icon }) => {
        const label = t.theme[value];
        return (
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
        );
      })}
    </fieldset>
  );
}

/**
 * Утасны header-т зориулсан нэг товшилтын light/dark солигч, тэнд гурван сонголттой
 * удирдлага багтахгүй. Шилжих горимыг нь харуулна.
 */
export function ThemeSwitch({ className }: { className?: string }): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t.theme.toggle}
      title={isDark ? t.theme.light : t.theme.dark}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground",
        className,
      )}
    >
      {/* Хадгалсан theme мэдэгдэх хүртэл ижил хэмжээтэй орлуулагч, ингэснээр юу ч үсрэхгүй. */}
      {mounted ? (
        <Icon className="size-4 animate-in duration-250 ease-soft fade-in spin-in-45" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
