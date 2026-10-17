"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { Accordion } from "radix-ui";
import { useState, type JSX } from "react";

import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Lowercase, and Mongolian Ө/Ү match О/У, so "уйлчилгээ" still finds "үйлчилгээ". */
function fold(text: string): string {
  return text.toLowerCase().replaceAll("ө", "о").replaceAll("ү", "у");
}

/**
 * The questions by topic, with a search that filters as you type (matching
 * both questions and answers) and jump chips for each topic. Every answer is
 * a disclosure, so it works with the keyboard and screen readers.
 */
export function FaqList(): JSX.Element {
  const t = useT();
  const [query, setQuery] = useState("");
  const needle = fold(query.trim());

  const sections = t.help.sections
    .map((section) => ({
      ...section,
      items: needle
        ? section.items.filter((item) => fold(`${item.q} ${item.a}`).includes(needle))
        : section.items,
    }))
    .filter((section) => section.items.length > 0);
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <div>
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          {t.help.searchLabel}
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="faq-search"
          type="text"
          role="searchbox"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.help.searchPlaceholder}
          className="h-13 w-full rounded-full border border-input bg-surface pr-12 pl-12 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground is-hover:border-muted-foreground is-focus:border-primary-strong is-focus:ring-3 is-focus:ring-ring"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t.help.clear}
            className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-surface-muted is-hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground tabular-nums">
        {total > 0 ? t.help.count(total) : t.help.noResults(query.trim())}
      </p>

      {!needle ? (
        <nav aria-label={t.help.title} className="mt-4 flex flex-wrap gap-2">
          {t.help.sections.map((section) => (
            <a
              key={section.id}
              href={`#faq-${section.id}`}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-muted-foreground"
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 flex flex-col gap-10">
        {sections.map((section) => (
          <section
            key={section.id}
            id={`faq-${section.id}`}
            aria-labelledby={`faq-${section.id}-title`}
            className="scroll-mt-24"
          >
            <h2
              id={`faq-${section.id}-title`}
              className="font-heading text-xl font-medium text-foreground"
            >
              {section.title}
            </h2>
            {/* While searching, open every match so the answer is right there. */}
            <Accordion.Root
              key={needle ? `search-${needle}` : "browse"}
              type="multiple"
              defaultValue={needle ? section.items.map((item) => item.q) : []}
              className="mt-3 border-t border-border"
            >
              {section.items.map((item) => (
                <Accordion.Item key={item.q} value={item.q} className="border-b border-border">
                  <Accordion.Header>
                    <Accordion.Trigger className="group/faq flex w-full items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring">
                      {item.q}
                      <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-250 ease-soft group-data-[state=open]/faq:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content
                    className={cn(
                      "overflow-hidden text-sm text-muted-foreground",
                      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                    )}
                  >
                    <p className="max-w-prose pb-4">{item.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>
        ))}
      </div>
    </div>
  );
}
