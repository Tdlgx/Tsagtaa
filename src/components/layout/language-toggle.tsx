"use client";

import { useRouter } from "next/navigation";
import { useId, useOptimistic, useTransition, type JSX } from "react";

import { setLocaleAction } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/client";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * MN / EN солигч. Native radio товчнууд (Tab-аар орж, сумаар солино), theme
 * солигчтой ижил загвартай. Сонголт cookie-д хадгалагдаж, хуудас бүтэн дахин
 * ачаалахгүйгээр сервер дээр шинэ хэлээр дахин render хийгдэнэ.
 */
export function LanguageToggle({ className }: { className?: string }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const name = useId();
  const [isPending, startTransition] = useTransition();
  // Хуудас дахин render хийгдэх зуур шинэ сонголтыг шууд харуулна.
  const [shown, setShown] = useOptimistic(locale);

  const choose = (next: Locale): void => {
    startTransition(async () => {
      setShown(next);
      await setLocaleAction(next);
      document.documentElement.lang = next;
      router.refresh();
    });
  };

  return (
    <fieldset
      aria-busy={isPending}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5",
        className,
      )}
    >
      <legend className="sr-only">{t.language.legend}</legend>
      {LOCALES.map((option) => (
        <label key={option} title={LOCALE_LABELS[option].name} className="relative">
          <input
            type="radio"
            name={name}
            value={option}
            checked={shown === option}
            onChange={() => choose(option)}
            className="peer sr-only"
          />
          <span
            lang={option}
            className={cn(
              "flex h-8 min-w-9 cursor-pointer items-center justify-center rounded-full px-2 text-xs font-semibold tracking-wide text-muted-foreground transition-colors duration-150 ease-soft",
              "peer-checked:bg-foreground peer-checked:text-background is-hover:text-foreground peer-checked:is-hover:text-background",
              "peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
            )}
          >
            {LOCALE_LABELS[option].short}
          </span>
          <span className="sr-only" lang={option}>
            {LOCALE_LABELS[option].name}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
