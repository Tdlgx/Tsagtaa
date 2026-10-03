import { publicEnv } from "@/lib/public-env";

/** App identity. The name comes from env so staging/demo builds can be labelled differently. */
export const APP_NAME = publicEnv.NEXT_PUBLIC_APP_NAME;
export const APP_URL = publicEnv.NEXT_PUBLIC_APP_URL;
export const APP_DESCRIPTION =
  "Үсчин, гоо сайхны салон, барбершоп, маникюр, массажны цагаа онлайнаар хэдхэн алхмаар захиалаарай.";

/** Mongolia uses a single IANA time zone (UTC+8, no daylight saving time). */
export const TIME_ZONE = "Asia/Ulaanbaatar";

/** BCP 47 locale tag for Mongolian (Cyrillic) as used in Mongolia. */
export const LOCALE = "mn-MN";

/** ISO 4217 currency code and symbol for Mongolian tögrög. */
export const CURRENCY = "MNT";
export const CURRENCY_SYMBOL = "₮";
