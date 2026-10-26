/**
 * `cn(...)` класс нэрсийг нэгтгэж, Tailwind-ийн зөрчлийг шийддэг тул сүүлийнх нь давамгайлна:
 *   cn("px-2 py-1", isActive && "bg-primary", "px-4") → "py-1 bg-primary px-4"
 * Энэ нь shadcn-ий `cn` package-аас ирдэг (clsx + tailwind-merge-ийн хурдан орлуулагч).
 * Хэрэгжүүлэлтийг нэг газраас солихын тулд эндээс (`@/lib/utils`) import хийнэ.
 */
export { cn } from "cn";
