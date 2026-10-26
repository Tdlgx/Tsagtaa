import { CURRENCY_SYMBOL } from "@/lib/constants";

// Тогтмол "en-US" бүлэглэл хаа сайгүй "25,000"-ыг баталгаажуулна; Node дахь "mn-MN" "₮ 25,000" гэж хэвлэдэг.
const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/**
 * Төгрөгийн дүнг харуулахаар форматлана: 25000 → "25,000₮".
 * Төгрөг бодит амьдралд бутархай нэгжгүй тул утгыг бүхэл тоо болгон тоймлоно.
 */
export function formatMNT(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Invalid amount: ${amount}`);
  }

  // `|| 0` нь -0-г (жишээ нь -0.4-ийг тоймлосноос) 0 болгох тул "-0₮" хэзээ ч хэвлэхгүй.
  const rounded = Math.round(amount) || 0;
  return `${amountFormatter.format(rounded)}${CURRENCY_SYMBOL}`;
}
