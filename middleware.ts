import { NextRequest, NextResponse } from "next/server";

export const locales = ["en", "tr", "de", "fr", "es", "it", "pt", "ja", "zh", "nl", "pl", "ko", "sv", "da", "no", "hu", "fi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// ── Accept-Language → Locale map ─────────────────────────────────────────────
const localeLanguageMap: Record<string, Locale> = {
  en: "en", "en-US": "en", "en-GB": "en", "en-AU": "en", "en-CA": "en",
  tr: "tr", "tr-TR": "tr",
  de: "de", "de-DE": "de", "de-AT": "de", "de-CH": "de",
  fr: "fr", "fr-FR": "fr", "fr-BE": "fr", "fr-CA": "fr", "fr-CH": "fr",
  es: "es", "es-ES": "es", "es-MX": "es", "es-AR": "es", "es-CO": "es", "es-CL": "es",
  it: "it", "it-IT": "it", "it-CH": "it",
  pt: "pt", "pt-BR": "pt", "pt-PT": "pt",
  ja: "ja", "ja-JP": "ja",
  zh: "zh", "zh-CN": "zh", "zh-TW": "zh", "zh-HK": "zh",
  nl: "nl", "nl-NL": "nl", "nl-BE": "nl",
  pl: "pl", "pl-PL": "pl",
  ko: "ko", "ko-KR": "ko",
  sv: "sv", "sv-SE": "sv",
  da: "da", "da-DK": "da",
  no: "no", "nb": "no", "nn": "no", "nb-NO": "no", "nn-NO": "no",
  hu: "hu", "hu-HU": "hu",
  fi: "fi", "fi-FI": "fi",
};

// ── Country code → Locale map (for Cloudflare/Vercel IP detection) ───────────
const countryLocaleMap: Record<string, Locale> = {
  // Danish-speaking
  DK: "da",
  // Norwegian-speaking
  NO: "no",
  // Hungarian-speaking
  HU: "hu",
  // Finnish-speaking
  FI: "fi",
  // German-speaking
  DE: "de", AT: "de", CH: "de", LI: "de",
  // French-speaking
  FR: "fr", BE: "fr", MC: "fr", LU: "fr",
  // Spanish-speaking
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  VE: "es", EC: "es", BO: "es", PY: "es", UY: "es",
  // Italian-speaking
  IT: "it", SM: "it", VA: "it",
  // Portuguese-speaking
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  // Japanese-speaking
  JP: "ja",
  // Chinese-speaking
  CN: "zh", TW: "zh", HK: "zh", MO: "zh",
  // Dutch-speaking
  NL: "nl",
  // Polish-speaking
  PL: "pl",
  // Korean-speaking
  KR: "ko",
  // Swedish-speaking
  SE: "sv",
  // Turkish-speaking
  TR: "tr",
};

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const tags = acceptLanguage
    .split(",")
    .map((tag) => {
      const [lang, q] = tag.trim().split(";q=");
      return { lang: lang.trim(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of tags) {
    if (localeLanguageMap[lang]) return localeLanguageMap[lang];
    const base = lang.split("-")[0];
    if (localeLanguageMap[base]) return localeLanguageMap[base];
  }

  return null;
}

function getLocaleFromCountry(country: string | null): Locale | null {
  if (!country) return null;
  return countryLocaleMap[country.toUpperCase()] ?? null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, _next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // If the path already starts with a locale prefix → no redirect
  // This ensures Google can index locale-specific URLs directly
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  if (locales.includes(firstSegment as Locale)) {
    return NextResponse.next();
  }

  // 1. Try browser/device language (Accept-Language header)
  const acceptLanguage = request.headers.get("Accept-Language");
  const localeFromLang = getLocaleFromAcceptLanguage(acceptLanguage);

  if (localeFromLang) {
    // Browser language detected → redirect to that locale
    const url = request.nextUrl.clone();
    url.pathname = `/${localeFromLang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, { status: 307 });
  }

  // 2. Try IP/Country detection (Cloudflare or Vercel headers)
  const country =
    request.headers.get("cf-ipcountry") ||      // Cloudflare
    request.headers.get("x-vercel-ip-country") || // Vercel
    request.headers.get("x-country");             // Generic proxy

  const localeFromCountry = getLocaleFromCountry(country);

  if (localeFromCountry) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeFromCountry}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, { status: 307 });
  }

  // 3. Fallback to default locale (English)
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, { status: 307 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
