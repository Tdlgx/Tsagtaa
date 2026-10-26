/**
 * Монгол кирилл → латин, өдөр тутмын түгээмэл галиглалаар
 * (Өнгө → Ongo, Хулан → Khulan). Хүний нэрэнд хэрэглэнэ: тэдгээрийг орчуулдаггүй,
 * зөвхөн латин үсгээр бичдэг.
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

/** Нэр биш, үг болох цолууд: үсэглэхийн оронд орчуулна. */
const PREFIXES: readonly [RegExp, string][] = [
  [/^Др\.\s*/, "Dr. "],
  [/^Бокс\s*/, "Bay "],
];

/** Монгол кирилл текстийг латин болгоно ("Өнгө" → "Ongo"); "Др." мэт цолыг орчуулна. */
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
      // Том үсгийг хадгална: "Х" → "Kh", "KH" биш.
      return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join("");

  return prefix + latin;
}
