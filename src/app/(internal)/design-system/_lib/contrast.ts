/** WCAG 2.x contrast math for #rgb / #rrggbb colors. */

type Rgb = readonly [number, number, number];

export function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  const hex = match?.[1];
  if (!hex) return null;

  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  const read = (start: number): number => parseInt(full.slice(start, start + 2), 16);
  return [read(0), read(2), read(4)];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio (1–21) between two hex colors, or null if either is not hex. */
export function contrastRatio(foreground: string, background: string): number | null {
  const a = parseHex(foreground);
  const b = parseHex(background);
  if (!a || !b) return null;

  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

export type ContrastLevel = "AAA" | "AA" | "AA UI" | "Fail";

/** Text needs 4.5:1 (AA) or 7:1 (AAA); UI outlines and icons need 3:1. */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA UI";
  return "Fail";
}
