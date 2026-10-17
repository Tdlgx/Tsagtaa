/**
 * Shared look of text-like form controls (Input, Textarea, Select).
 * 16px text on every screen: iOS Safari zooms the page into any field whose
 * font is smaller than 16px, which breaks the layout on phones.
 */
export const controlStyles = [
  "w-full min-w-0 rounded-md border border-input bg-surface px-4 text-base text-foreground",
  "placeholder:text-muted-foreground",
  "outline-none is-hover:border-muted-foreground",
  "is-focus:border-primary is-focus:ring-3 is-focus:ring-ring",
  "aria-invalid:border-danger aria-invalid:is-focus:ring-danger/25",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
].join(" ");
