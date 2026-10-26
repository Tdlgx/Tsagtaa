import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Цагтаагийн брэндийн тэмдэг: хоёр шилжүүлсэн гурвалжинд хуваагдсан элсэн цаг. Доод
 * хагас нь дээд хагасыг 180° эргүүлсэн хэлбэр тул тэдгээрийн хоорондох зай унаж буй
 * элс шиг ташуу явна. 48×48 тор дээр зурсан; ижил өнгийн бөөрөнхий холбоостой
 * зураас нь зөөлөн булангуудыг өгнө. Өнгө нь currentColor.
 *
 * Хагаснууд нь тусдаа path (`data-part="top" | "bottom"`) тул логоны анимэйшн
 * тус бүрийг тусад нь хөдөлгөж чадна.
 */
const TOP_PATH = "M4 2 H44.5 L16.8 22.5 Z";
const BOTTOM_PATH = "M44 46 H3.5 L31.2 25.5 Z";

type BrandMarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox">;

/** Цагтаагийн элсэн цагны тэмдэг (SVG), өнгө нь currentColor. */
export function BrandMark({ className, ...props }: BrandMarkProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    >
      <path data-part="top" d={TOP_PATH} />
      <path data-part="bottom" d={BOTTOM_PATH} />
    </svg>
  );
}
