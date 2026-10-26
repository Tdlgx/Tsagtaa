/**
 * Урамшууллын оноо. 1 оноо = захиалгаас 1 ₮ хямдрал. Сервер (шийддэг) болон
 * захиалгын маягт (зөвхөн урьдчилан харуулдаг) хуваалцана; үлдэгдлийн эцсийн
 * шийдвэрийг DB гаргана.
 */

export type LoyaltySettings = {
  enabled: boolean;
  /** Төлсөн 100 ₮ тутамд олгох оноо. */
  earnPercent: number;
  /** Нэг удаад зарцуулж болох хамгийн бага оноо. */
  minRedeem: number;
  /** Нэг захиалгын үнийн оноогоор төлж болох хамгийн их хувь. */
  maxRedeemPercent: number;
};

/** Зарцуулалт бүтэн зуугаар өөрчлөгдөнө, ингэснээр нийлбэрүүд тэгш байна. */
export const REDEEM_STEP = 100;

/** Захиалгаас олох оноо, бодитоор төлсөн дүнгээс (үнээс зарцуулсан оноог хассан). */
export function pointsToEarn(price: number, pointsUsed: number, settings: LoyaltySettings): number {
  if (!settings.enabled) return 0;
  return Math.floor(((price - pointsUsed) * settings.earnPercent) / 100);
}

/**
 * Үлдэгдлийг харгалзан энэ захиалгад зарцуулж болох хамгийн их оноо; хамгийн бага
 * зарцуулалтаас доош бол 0 (юу ч зарцуулж болохгүй).
 */
export function maxRedeemable(price: number, balance: number, settings: LoyaltySettings): number {
  if (!settings.enabled) return 0;
  const cap = Math.floor((price * settings.maxRedeemPercent) / 100);
  const most = Math.floor(Math.min(cap, balance) / REDEEM_STEP) * REDEEM_STEP;
  return most >= Math.max(settings.minRedeem, REDEEM_STEP) ? most : 0;
}

/** `points` нь энэ үнэд дүрмээр зөвшөөрөгдөх зарцуулалт мөн эсэх (үлдэгдлийг DB шалгана). */
export function isAllowedSpend(points: number, price: number, settings: LoyaltySettings): boolean {
  if (points === 0) return true;
  return (
    settings.enabled &&
    Number.isInteger(points) &&
    points % REDEEM_STEP === 0 &&
    points >= settings.minRedeem &&
    points <= Math.floor((price * settings.maxRedeemPercent) / 100)
  );
}

const pointsFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 12500 → "12,500" (үнэтэй ижил бүлэглэл). */
export function formatPoints(points: number): string {
  return pointsFormatter.format(points);
}

export type LedgerKind = "earn" | "redeem" | "refund" | "adjust";

export type LedgerEntry = {
  id: string;
  delta: number;
  kind: LedgerKind;
  note: string | null;
  createdAt: string;
  /** Захиалгын бичлэгт: хаана, юу. */
  businessSlug: string | null;
  /** Бүртгэлтэй газрын хадгалсан нэр (жишээ газрын нэрийг client орчуулж өгнө). */
  businessName: string | null;
  serviceName: string | null;
  code: string | null;
};

/** Профайлын харуулах зүйл. Огноонууд ISO string: client руу дамждаг учраас. */
export type PointsSummary = {
  balance: number;
  /** Хараахан очоогүй (эсвэл айлчлалаас хойш нэг өдөр болоогүй) захиалгуудын амласан оноо. */
  pending: number;
  earnedTotal: number;
  spentTotal: number;
  history: LedgerEntry[];
  settings: LoyaltySettings;
};
