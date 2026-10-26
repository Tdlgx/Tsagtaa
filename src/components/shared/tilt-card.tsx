"use client";

import type { JSX, ReactNode } from "react";

import { useTilt } from "@/hooks/use-tilt";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Буланд хамгийн хүчтэй хазайлт, градусаар. Удирдлага болдог картад бага. */
  maxDegrees?: number;
};

/**
 * Курсор эсвэл хуруу руу хазайдаг, түүнийг дагах гэрэлтэй карт (`useTilt` болон
 * `tilt-3d` utility-г үз). Картын өөрийн булангийн радиус, дэвсгэр, зайг
 * `className`-ээр өгнө.
 */
export function TiltCard({ children, className, maxDegrees = 8 }: TiltCardProps): JSX.Element {
  const tilt = useTilt<HTMLDivElement>(maxDegrees);
  return (
    <div
      {...tilt}
      className={cn("tilt-3d relative overflow-hidden data-tilt:shadow-lg", className)}
    >
      {children}
    </div>
  );
}
