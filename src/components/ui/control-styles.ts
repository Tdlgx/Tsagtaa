/**
 * Текст төрлийн маягтын удирдлагуудын (Input, Textarea, Select) нийтлэг харагдац.
 * Бүх дэлгэцэнд 16px текст: iOS Safari фонт нь 16px-ээс жижиг талбар руу хуудсыг
 * томруулдаг тул утсан дээр layout эвдэрнэ.
 */
export const controlStyles = [
  "w-full min-w-0 rounded-md border border-input bg-surface px-4 text-base text-foreground",
  "placeholder:text-muted-foreground",
  "outline-none is-hover:border-muted-foreground",
  "is-focus:border-primary-strong is-focus:ring-3 is-focus:ring-ring",
  "aria-invalid:border-danger aria-invalid:is-focus:ring-danger/25",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
].join(" ");
