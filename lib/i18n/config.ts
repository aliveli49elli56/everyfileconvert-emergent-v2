export const locales = ["en", "tr", "de", "fr", "es", "it", "pt", "ja", "zh", "nl", "pl", "ko", "sv", "da", "no", "hu", "fi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
  zh: "中文",
  nl: "Nederlands",
  pl: "Polski",
  ko: "한국어",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  hu: "Magyar",
  fi: "Suomi",
};

export const rtlLocales: Locale[] = [];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Cache for loaded dictionaries
const dictCache = new Map<string, Record<string, unknown>>();

export async function getDictionary(locale: Locale): Promise<Record<string, unknown>> {
  if (dictCache.has(locale)) {
    return dictCache.get(locale)!;
  }
  try {
    const dict = await import(`../../locales/${locale}.json`);
    const data = dict.default || dict;
    dictCache.set(locale, data);
    return data;
  } catch {
    // Fallback to English
    if (locale !== "en") {
      return getDictionary("en");
    }
    return {};
  }
}

// Synchronous getter for server components (requires pre-loading)
export function getDictionarySync(locale: Locale): Record<string, unknown> {
  if (dictCache.has(locale)) {
    return dictCache.get(locale)!;
  }
  // Fallback: load inline
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dict = require(`../../locales/${locale}.json`);
    dictCache.set(locale, dict);
    return dict;
  } catch {
    if (locale !== "en") {
      return getDictionarySync("en");
    }
    return {};
  }
}

type NestedObject = Record<string, unknown>;

export function t(dict: NestedObject, key: string, vars?: Record<string, string>): string {
  const keys = key.split(".");
  let value: unknown = dict;
  for (const k of keys) {
    if (value && typeof value === "object") {
      value = (value as NestedObject)[k];
    } else {
      return key;
    }
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    value
  );
}

// Pick a random item from an array (deterministic based on seed for SSR consistency)
export function pickVariant<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return arr[Math.abs(hash) % arr.length];
}

export function getHreflangLinks(path: string): { locale: Locale; href: string }[] {
  return locales.map((locale) => ({
    locale,
    href: `https://everyfileconvert.com/${locale}${path}`,
  }));
}
