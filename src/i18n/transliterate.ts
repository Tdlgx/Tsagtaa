/**
 * Mongolian Cyrillic → Latin, following the common everyday romanization
 * (Өнгө → Ongo, Хулан → Khulan). Used for people's names, which are not
 * translated, only written in Latin letters.
 */
const MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "ye",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "i",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Titles that are words, not names: translated rather than spelled out. */
const PREFIXES: readonly [RegExp, string][] = [
  [/^Др\.\s*/, "Dr. "],
  [/^Бокс\s*/, "Bay "],
];

export function transliterate(text: string): string {
  let prefix = "";
  let rest = text;
  for (const [pattern, replacement] of PREFIXES) {
    if (pattern.test(rest)) {
      prefix = replacement;
      rest = rest.replace(pattern, "");
      break;
    }
  }

  const latin = [...rest]
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = MAP[lower];
      if (mapped === undefined) return char;
      // Keep capitals: "Х" → "Kh", not "KH".
      return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join("");

  return prefix + latin;
}
