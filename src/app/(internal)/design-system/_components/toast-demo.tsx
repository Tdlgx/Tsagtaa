"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Design system: toast-ийн төрлүүдийг дарж туршиж үзэх товчнууд. */
export function ToastDemo(): JSX.Element {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Захиалга баталгаажлаа", {
            description: "Даваа, 10-р сарын 6 · 11:30 · Өнгө салон",
          })
        }
      >
        <CircleCheck data-icon="start" />
        Амжилттай
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Энэ цаг дүүрчихлээ", {
            description: "Өөр цаг сонгоно уу. Сул цагууд шинэчлэгдсэн.",
          })
        }
      >
        <CircleAlert data-icon="start" />
        Алдаа
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Сануулга", {
            description: "Таны цаг 1 цагийн дараа эхэлнэ.",
          })
        }
      >
        <Info data-icon="start" />
        Мэдээлэл
      </Button>
    </div>
  );
}
