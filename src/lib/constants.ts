import { publicEnv } from "@/lib/public-env";

/** Аппын таних тэмдэг. Нэр env-ээс ирдэг тул staging/demo build-ийг өөрөөр нэрлэж болно. */
export const APP_NAME = publicEnv.NEXT_PUBLIC_APP_NAME;
export const APP_URL = publicEnv.NEXT_PUBLIC_APP_URL;
export const APP_DESCRIPTION =
  "Салон, эмнэлэг, шүдний эмнэлэг, авто засвар, мал эмнэлгийн цагаа онлайнаар хэдхэн алхмаар захиалаарай.";

/** Монгол нэг IANA цагийн бүстэй (UTC+8, зуны цаг байхгүй). */
export const TIME_ZONE = "Asia/Ulaanbaatar";

/** Монголд хэрэглэгддэг Монгол (кирилл) хэлний BCP 47 locale tag. */
export const LOCALE = "mn-MN";

/** Монгол төгрөгийн ISO 4217 валютын код, тэмдэгт. */
export const CURRENCY = "MNT";
export const CURRENCY_SYMBOL = "₮";
