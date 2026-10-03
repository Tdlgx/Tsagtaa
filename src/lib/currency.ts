import { CURRENCY_SYMBOL } from "@/lib/constants";

// Fixed "en-US" grouping guarantees "25,000" everywhere; "mn-MN" in Node prints "₮ 25,000".
const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/**
 * Formats a tögrög amount for display: 25000 → "25,000₮".
 * Tögrög has no subunits in practice, so the value is rounded to a whole number.
 */
export function formatMNT(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Invalid amount: ${amount}`);
  }

  // `|| 0` turns -0 (e.g. from rounding -0.4) into 0 so we never print "-0₮".
  const rounded = Math.round(amount) || 0;
  return `${amountFormatter.format(rounded)}${CURRENCY_SYMBOL}`;
}
