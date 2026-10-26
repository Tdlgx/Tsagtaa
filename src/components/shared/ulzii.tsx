import { useId, type ComponentProps, type JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Хялбаршуулсан "өлзий" хээ: булан бүрт гогцоотой нэхмэл ромбо тор. 48×48 тор дээр
 * зурсан тул icon хэмжээний тэмдэг, чимэглэл эсвэл давтагдах хээ болгон ашиглаж
 * болно. Зөвхөн зураас, өнгө нь currentColor.
 */
const ULZII_PATH = [
  // Гадна цагираг: ромбын ирмэгүүд дөрвөн булангийн гогцоогоор холбогдоно.
  "M21 9 A4.25 4.25 0 1 1 27 9 L39 21 A4.25 4.25 0 1 1 39 27",
  "L27 39 A4.25 4.25 0 1 1 21 39 L9 27 A4.25 4.25 0 1 1 9 21 Z",
  // Дотор тор: диагональ чиглэл бүрт хоёр утас.
  "M12 18 L30 36 M18 12 L36 30 M12 30 L30 12 M18 36 L36 18",
].join(" ");

type UlziiKnotProps = Omit<ComponentProps<"svg">, "children" | "viewBox">;

/** Өлзий хээ (SVG), өнгө нь currentColor. */
export function UlziiKnot({
  className,
  strokeWidth = 1.25,
  ...props
}: UlziiKnotProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={ULZII_PATH} />
    </svg>
  );
}

type UlziiPatternProps = {
  className?: string;
  /** Хавтангийн хэмжээ px-ээр; хээ хавтан бүрийн голд байрлана. */
  tile?: number;
};

/**
 * Давтагдах өлзий хээ. Арай ядан харагдахаар (тунгалаг байдал 4–6%) байлгаж, зөвхөн
 * hero болон хоосон төлөвийн зурагт ашиглана, ерөнхий дэвсгэр болгож хэзээ ч болохгүй.
 */
export function UlziiPattern({ className, tile = 72 }: UlziiPatternProps): JSX.Element {
  const id = useId();
  const offset = (tile - 48) / 2;

  return (
    <svg aria-hidden className={cn("pointer-events-none", className)}>
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <path
            d={ULZII_PATH}
            transform={`translate(${offset} ${offset})`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
