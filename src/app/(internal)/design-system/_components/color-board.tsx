"use client";

import type { JSX } from "react";

import { BoardSection, Spec } from "@/app/(internal)/design-system/_components/artboard";
import { useTokenValues } from "@/app/(internal)/design-system/_components/use-token-values";
import {
  contrastLevel,
  contrastRatio,
  type ContrastLevel,
} from "@/app/(internal)/design-system/_lib/contrast";
import {
  COLOR_GROUPS,
  CONTRAST_PAIRS,
  type CssVar,
} from "@/app/(internal)/design-system/_lib/tokens";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ALL_VARS: readonly CssVar[] = Array.from(
  new Set<CssVar>([
    ...COLOR_GROUPS.flatMap((group) =>
      group.tokens.flatMap((token) =>
        token.measuredOn ? [token.cssVar, token.measuredOn] : [token.cssVar],
      ),
    ),
    ...CONTRAST_PAIRS.flatMap((pair) => [pair.fg, pair.bg]),
  ]),
);

const LEVEL_TONE: Record<ContrastLevel, BadgeTone> = {
  AAA: "success",
  AA: "success",
  "AA UI": "neutral",
  Fail: "danger",
};

function RatioBadge({ ratio }: { ratio: number | null }): JSX.Element {
  if (ratio === null) return <Badge tone="outline">—</Badge>;
  const level = contrastLevel(ratio);

  return (
    <Badge tone={LEVEL_TONE[level]}>
      <span className="tabular-nums">{ratio.toFixed(2)}</span> · {level}
    </Badge>
  );
}

export function ColorBoard(): JSX.Element {
  const values = useTokenValues(ALL_VARS);
  const read = (name: CssVar): string => values?.get(name) ?? "";

  return (
    <>
      {COLOR_GROUPS.map((group) => (
        <BoardSection key={group.title} title={group.title}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map((token) => {
              const hex = read(token.cssVar);
              const ratio = token.measuredOn ? contrastRatio(hex, read(token.measuredOn)) : null;

              return (
                <li
                  key={token.name}
                  className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-14 shrink-0 rounded-md border border-foreground/10",
                      token.swatchClass,
                    )}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-mono text-sm font-medium text-foreground">{token.name}</p>
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      {hex || "…"}
                    </p>
                    <p className="text-xs text-muted-foreground">{token.usage}</p>
                    {token.measuredOn ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RatioBadge ratio={ratio} />
                        <Spec>{token.measuredOn.slice(2)} дээр</Spec>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </BoardSection>
      ))}

      <BoardSection title="Контраст · текст ба дэвсгэр (WCAG AA ≥ 4.5)">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-xl text-left text-sm">
            <thead className="bg-surface-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Хэрэглээ
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Жишээ
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Token
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Харьцаа
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {CONTRAST_PAIRS.map((pair) => (
                <tr key={pair.label}>
                  <td className="px-4 py-3 text-foreground">{pair.label}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex h-8 items-center rounded-sm border border-border px-3 font-medium",
                        pair.sampleClass,
                      )}
                    >
                      Өө Үү 10:30
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {pair.fg.slice(2)} / {pair.bg.slice(2)}
                  </td>
                  <td className="px-4 py-3">
                    <RatioBadge ratio={contrastRatio(read(pair.fg), read(pair.bg))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Spec>
          Тоонууд нь хуудсан дээрх бодит CSS хувьсагчаас тооцоологдоно. Header дээрх горим солигчоор
          dark болгоход шууд шинэчлэгдэнэ.
        </Spec>
      </BoardSection>
    </>
  );
}
