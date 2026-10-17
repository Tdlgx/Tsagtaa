/**
 * Metadata for the color artboard. Values are NOT duplicated here: the page
 * reads the live CSS variables, so light/dark numbers are always the truth.
 * Class names are written out in full so Tailwind can find them.
 */

export type CssVar = `--${string}`;

export type ColorToken = {
  name: string;
  cssVar: CssVar;
  swatchClass: string;
  usage: string;
  /** Background the color is measured against (for text/UI colors). */
  measuredOn?: CssVar;
};

export type ColorGroup = { title: string; tokens: readonly ColorToken[] };

export const COLOR_GROUPS: readonly ColorGroup[] = [
  {
    title: "Гадаргуу",
    tokens: [
      {
        name: "background",
        cssVar: "--background",
        swatchClass: "bg-background",
        usage: "Хуудасны дэвсгэр, сэрүүн шаазан",
      },
      {
        name: "surface",
        cssVar: "--surface",
        swatchClass: "bg-surface",
        usage: "Карт, талбар, цонх",
      },
      {
        name: "surface-muted",
        cssVar: "--surface-muted",
        swatchClass: "bg-surface-muted",
        usage: "Зөөлөн дүүргэлт, skeleton",
      },
    ],
  },
  {
    title: "Бэх ба шугам",
    tokens: [
      {
        name: "foreground",
        cssVar: "--foreground",
        swatchClass: "bg-foreground",
        usage: "Үндсэн текст, цэвэр хар биш",
        measuredOn: "--background",
      },
      {
        name: "muted-foreground",
        cssVar: "--muted-foreground",
        swatchClass: "bg-muted-foreground",
        usage: "Тайлбар, хоёрдогч текст",
        measuredOn: "--background",
      },
      {
        name: "border",
        cssVar: "--border",
        swatchClass: "bg-border",
        usage: "1px hairline, чимэглэлийн шугам",
      },
      {
        name: "input",
        cssVar: "--input",
        swatchClass: "bg-input",
        usage: "Маягтын хүрээ, хоосон үед ч харагдана",
        measuredOn: "--surface",
      },
    ],
  },
  {
    title: "Брэнд",
    tokens: [
      {
        name: "primary",
        cssVar: "--primary",
        swatchClass: "bg-primary",
        usage: "Гол товч, сонгогдсон төлөв: зөвхөн дүүргэлт",
        measuredOn: "--primary-foreground",
      },
      {
        name: "primary-hover",
        cssVar: "--primary-hover",
        swatchClass: "bg-primary-hover",
        usage: "Гол товч дээр хулгана авчрахад",
        measuredOn: "--primary-foreground",
      },
      {
        name: "primary-soft",
        cssVar: "--primary-soft",
        swatchClass: "bg-primary-soft",
        usage: "Сонгогдсон зүйлийн зөөлөн дэвсгэр",
      },
      {
        name: "primary-strong",
        cssVar: "--primary-strong",
        swatchClass: "bg-primary-strong",
        usage: "Холбоос, icon, хүрээ: цайвар дэвсгэр дээрх лайм",
        measuredOn: "--background",
      },
      {
        name: "sun",
        cssVar: "--sun",
        swatchClass: "bg-sun",
        usage: "Одоогийн цагийн зүү, үнэлгээний од, бага хэрэглэнэ",
        measuredOn: "--surface",
      },
      {
        name: "sun-strong",
        cssVar: "--sun-strong",
        swatchClass: "bg-sun-strong",
        usage: "Гүргэм өнгийн текст",
        measuredOn: "--surface",
      },
      {
        name: "sun-soft",
        cssVar: "--sun-soft",
        swatchClass: "bg-sun-soft",
        usage: "Гүргэм өнгийн зөөлөн дэвсгэр",
      },
    ],
  },
  {
    title: "Төлөв",
    tokens: [
      {
        name: "success",
        cssVar: "--success",
        swatchClass: "bg-success",
        usage: "Баталгаажсан, амжилттай",
        measuredOn: "--surface",
      },
      {
        name: "warning",
        cssVar: "--warning",
        swatchClass: "bg-warning",
        usage: "Хүлээгдэж буй (icon, цэг)",
        measuredOn: "--surface",
      },
      {
        name: "warning-foreground",
        cssVar: "--warning-foreground",
        swatchClass: "bg-warning-foreground",
        usage: "Анхааруулгын текст",
        measuredOn: "--warning-soft",
      },
      {
        name: "danger",
        cssVar: "--danger",
        swatchClass: "bg-danger",
        usage: "Алдаа, цуцлах, устгах",
        measuredOn: "--surface",
      },
    ],
  },
];

export type ContrastPair = {
  label: string;
  fg: CssVar;
  bg: CssVar;
  /** Renders the sample in the real token classes. */
  sampleClass: string;
};

/** Every text/background combination used in the UI. All must reach 4.5:1. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  {
    label: "Үндсэн текст",
    fg: "--foreground",
    bg: "--background",
    sampleClass: "bg-background text-foreground",
  },
  {
    label: "Карт дээрх текст",
    fg: "--foreground",
    bg: "--surface",
    sampleClass: "bg-surface text-foreground",
  },
  {
    label: "Тайлбар текст",
    fg: "--muted-foreground",
    bg: "--background",
    sampleClass: "bg-background text-muted-foreground",
  },
  {
    label: "Тайлбар · карт",
    fg: "--muted-foreground",
    bg: "--surface",
    sampleClass: "bg-surface text-muted-foreground",
  },
  {
    label: "Тайлбар · зөөлөн дүүргэлт",
    fg: "--muted-foreground",
    bg: "--surface-muted",
    sampleClass: "bg-surface-muted text-muted-foreground",
  },
  {
    label: "Гол товч",
    fg: "--primary-foreground",
    bg: "--primary",
    sampleClass: "bg-primary text-primary-foreground",
  },
  {
    label: "Гол товч · hover",
    fg: "--primary-foreground",
    bg: "--primary-hover",
    sampleClass: "bg-primary-hover text-primary-foreground",
  },
  {
    label: "Холбоос",
    fg: "--primary-strong",
    bg: "--background",
    sampleClass: "bg-background text-primary-strong",
  },
  {
    label: "Badge · primary",
    fg: "--primary-strong",
    bg: "--primary-soft",
    sampleClass: "bg-primary-soft text-primary-strong",
  },
  {
    label: "Badge · гүргэм",
    fg: "--sun-strong",
    bg: "--sun-soft",
    sampleClass: "bg-sun-soft text-sun-strong",
  },
  {
    label: "Баталгаажсан",
    fg: "--success-foreground",
    bg: "--success-soft",
    sampleClass: "bg-success-soft text-success-foreground",
  },
  {
    label: "Хүлээгдэж буй",
    fg: "--warning-foreground",
    bg: "--warning-soft",
    sampleClass: "bg-warning-soft text-warning-foreground",
  },
  {
    label: "Цуцлагдсан",
    fg: "--danger-foreground",
    bg: "--danger-soft",
    sampleClass: "bg-danger-soft text-danger-foreground",
  },
  {
    label: "Алдааны мессеж",
    fg: "--danger-foreground",
    bg: "--surface",
    sampleClass: "bg-surface text-danger-foreground",
  },
  {
    label: "Устгах товч",
    fg: "--surface",
    bg: "--danger",
    sampleClass: "bg-danger text-surface",
  },
];
