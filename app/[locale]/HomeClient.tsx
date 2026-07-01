"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Upload, ArrowRight, Shield, Zap, Lock, Eye, Layers } from "lucide-react";
import UniversalDropzone from "@/components/UniversalDropzone";
import AdSlot from "@/components/ads/ad-slot";
import { formatRegistry, CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import { popularConvertersEngine } from "@/lib/engine/popular-converters-engine";
import { relatedToolEngine } from "@/lib/engine/related-tool-engine";
import type { Locale } from "@/lib/i18n/config";
import type { FormatCategory } from "@/lib/types/formats";

// FormatSelector lives below the fold — load it lazily
const FormatSelector = dynamic(() => import("@/components/FormatSelector"), {
  loading: () => (
    <div className="h-32 w-full rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />
  ),
  ssr: false,
});

type DictType = Record<string, unknown>;

// ---------------------------------------------------------------------------
// CATEGORIES TO FEATURE ON HOMEPAGE (ordered by traffic importance)
// Derived from CATEGORY_DEFINITIONS — no hardcoded routes
// ---------------------------------------------------------------------------

const FEATURED_CATEGORIES: FormatCategory[] = [
  "image", "video", "audio", "pdf", "document",
  "ebook", "archive", "spreadsheet", "presentation",
  "cad", "font", "code",
];

export default function HomeClient({ dict, locale }: { dict: DictType; locale: Locale }) {
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const scrollToDropzone = () => {
    dropzoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const totalFormats    = formatRegistry.getAll().length;
  const totalConversions = conversionRegistry.getAllConversions().length;

  // ── Registry-driven categories ────────────────────────────────────────────
  const categories = FEATURED_CATEGORIES
    .map(cat => {
      const def    = CATEGORY_DEFINITIONS[cat];
      const route  = def?.converterRoute ?? `/${cat}-converter`;
      const count  = formatRegistry.getByCategory(cat).length;
      return def ? { cat, def, route: `/${locale}${route}`, count } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ── Popular conversions (engine-driven) ───────────────────────────────────
  const popularConversions = popularConvertersEngine.getPopularConversions(locale, 12);

  // ── Trending conversions (engine-driven) ──────────────────────────────────
  const trendingConversions = popularConvertersEngine.getTrendingConversions(locale, 8);

  // ── Featured tools (engine-driven) ────────────────────────────────────────
  const featuredTools = popularConvertersEngine.getFeaturedTools(6);

  // ── Popular viewers (registry-driven) ─────────────────────────────────────
  const popularViewers = formatRegistry.getAll()
    .filter(f => f.hasViewer)
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
    .slice(0, 12);

  // ── Popular formats by category (registry-driven) ─────────────────────────
  const popularFormatsByCategory = FEATURED_CATEGORIES.slice(0, 4).map(cat => ({
    cat,
    def: CATEGORY_DEFINITIONS[cat],
    formats: formatRegistry.getByCategory(cat)
      .filter(f => f.tier === "popular" || (f.searchVolume ?? 0) > 30000)
      .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
      .slice(0, 6),
  })).filter(g => g.def && g.formats.length > 0);

  const features = [
    { icon: Shield, titleKey: "private",  descKey: "privateDesc" },
    { icon: Zap,    titleKey: "fast",     descKey: "fastDesc"    },
    { icon: Lock,   titleKey: "secure",   descKey: "secureDesc"  },
  ];

  const cats  = dict.categories as Record<string, string> | undefined;
  const feats = dict.features   as Record<string, string> | undefined;
  const hero  = dict.hero       as Record<string, string> | undefined;

  return (
    <div className="min-h-screen">

      {/* ── Hero / UniversalDropzone ── */}
      <section className="relative hero-gradient overflow-hidden -mt-[122px] pt-[122px]">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative mx-auto px-4 pt-4 pb-10 sm:pt-6 sm:pb-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur border border-slate-200">
                {totalFormats} {hero?.badge || "Formats"} · {totalConversions}+ Conversions
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {hero?.title || "Convert Any File"}{" "}
                <span className="gradient-text">{hero?.titleHighlight || "Instantly"}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                {hero?.subtitle ||
                  "Transform videos, audio, images, and documents directly in your browser. No uploads, complete privacy."}
              </p>
            </div>
          </div>

          <div ref={dropzoneRef} className="mt-6 max-w-2xl mx-auto">
            <UniversalDropzone mode="all" />
          </div>
        </div>
      </section>

      {/* ── Quick Navigation strip (registry-driven) ── */}
      <section className="py-4 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Jump to:</span>
            {categories.map(({ cat, def, route }) => {
              const Icon = def.icon;
              const [from, to] = def.gradient;
              return (
                <Link key={cat} href={route}
                  data-testid={`quicknav-${cat}`}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs font-medium text-slate-600 hover:text-blue-700 transition-all shrink-0">
                  <div className={`w-4 h-4 rounded-sm bg-gradient-to-br ${from} ${to} flex items-center justify-center`}>
                    <Icon className="h-2.5 w-2.5 text-white" />
                  </div>
                  {def.seoLabel}
                </Link>
              );
            })}
            <Link href={`/${locale}/view`}
              data-testid="quicknav-viewers"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 text-xs font-medium text-slate-600 hover:text-violet-700 transition-all shrink-0">
              <Eye className="h-3 w-3" /> File Viewers
            </Link>
          </div>
        </div>
      </section>

      {/* ── All-In-One Tools Section (registry-driven 12 categories) ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {typeof dict.allInOne === "string" ? dict.allInOne : "All-In-One File Tools"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {typeof dict.allInOneDesc === "string"
                ? dict.allInOneDesc
                : "Choose from our comprehensive suite of file conversion and editing tools"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories.slice(0, 2).map(({ cat, def, route, count }) => (
              <CategoryCard
                key={cat}
                cat={cat}
                def={def}
                route={route}
                count={count}
                cats={cats}
                locale={locale}
              />
            ))}

            {/* Mobile ad slot */}
            <div className="block sm:hidden relative z-0 my-8 col-span-1" data-testid="ad-tools-infeed">
              <div className="flex justify-center">
                <AdSlot adUnit="tools_infeed_1-300x250" width={300} height={250} />
              </div>
            </div>

            {categories.slice(2).map(({ cat, def, route, count }) => (
              <CategoryCard
                key={cat}
                cat={def.seoLabel}
                def={def}
                route={route}
                count={count}
                cats={cats}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Conversions ── */}
      {popularConversions.length > 0 && (
        <section className="py-14 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Most Popular Conversions
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                The most frequently used file conversions, all free and instant.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
              {popularConversions.map(conv => (
                <Link
                  key={`${conv.from}-${conv.to}`}
                  href={conv.href}
                  data-testid={`popular-conv-${conv.from}-${conv.to}`}
                  className="group flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-700 uppercase">{conv.from}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-blue-600 uppercase">{conv.to}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href={`/${locale}${CATEGORY_DEFINITIONS[FEATURED_CATEGORIES[0]]?.converterRoute ?? `/${FEATURED_CATEGORIES[0]}-converter`}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                data-testid="browse-all-converters"
              >
                Browse all converters <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Trending Conversions ── */}
      {trendingConversions.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Trending Conversions</h2>
                <p className="text-slate-500 text-sm mt-1">Modern formats with growing adoption</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 max-w-5xl mx-auto">
              {trendingConversions.map(conv => (
                <Link
                  key={`${conv.from}-${conv.to}`}
                  href={conv.href}
                  data-testid={`trending-conv-${conv.from}-${conv.to}`}
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 text-sm font-medium text-slate-700 hover:text-blue-700 transition-all duration-200"
                >
                  <span className="uppercase text-xs font-bold">{conv.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="uppercase text-xs font-bold">{conv.to}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Popular Viewers (registry-driven) ── */}
      {popularViewers.length > 0 && (
        <section className="py-14 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Popular File Viewers</h2>
                <p className="text-slate-500 text-sm mt-1">Open and preview files directly in your browser — no install needed</p>
              </div>
              <Link href={`/${locale}/view`} data-testid="view-all-viewers"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                All Viewers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
              {popularViewers.map(fmt => (
                <Link key={fmt.ext} href={`/${locale}/view/${fmt.ext}`}
                  data-testid={`home-viewer-${fmt.ext}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all text-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase">.{fmt.ext}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{fmt.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Tools ── */}
      {featuredTools.length > 0 && (
        <section className="py-14 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Featured Tools
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                The most-used tools, powered by your browser — no install needed.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {featuredTools.map(({ tool }) => (
                <Link
                  key={tool.id}
                  href={`/${locale}${tool.route}`}
                  data-testid={`featured-tool-${tool.id}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-white text-xs font-bold">
                      {(tool.inputFormat?.toUpperCase() ?? tool.shortName).slice(0, 3)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{tool.shortName}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Popular Formats by Category (registry-driven discovery) ── */}
      {popularFormatsByCategory.length > 0 && (
        <section className="py-14 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Popular Formats
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Browse the most popular file formats and convert them instantly.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {popularFormatsByCategory.map(({ cat, def, formats }) => {
                if (!def) return null;
                const Icon    = def.icon;
                const [from, to] = def.gradient;
                const catRoute   = `/${locale}${def.converterRoute ?? `/${cat}-converter`}`;
                return (
                  <div key={cat} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r ${from} ${to}`}>
                      <Icon className="h-4 w-4 text-white" />
                      <span className="text-sm font-semibold text-white">{def.seoLabel}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {formats.map(fmt => (
                          <Link key={fmt.ext}
                            href={`/${locale}${def.converterRoute ?? `/${cat}-converter`}/${fmt.ext}`}
                            data-testid={`home-format-${fmt.ext}`}
                            className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all uppercase">
                            .{fmt.ext}
                          </Link>
                        ))}
                      </div>
                      <Link href={catRoute} data-testid={`home-cat-all-${cat}`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
                        All {def.seoLabel} formats <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust / Feature cards ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map(feature => (
              <div key={feature.titleKey} className="text-center p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 mb-4">
                  <feature.icon className="h-7 w-7 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feats?.[feature.titleKey] || feature.titleKey}
                </h3>
                <p className="text-sm text-slate-600">{feats?.[feature.descKey] || feature.descKey}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported Formats ── */}
      <section className="py-12 bg-gradient-to-br from-sky-50 via-blue-50 to-yellow-50/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              {typeof dict.supportedFormats === "string" ? dict.supportedFormats : "Supported Formats"}
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              {(typeof dict.supportedFormatsDesc === "string"
                ? dict.supportedFormatsDesc
                : "We support {count} different file formats"
              ).replace("{count}", String(totalFormats))}
            </p>
          </div>
          <FormatSelector locale={locale} />
        </div>
      </section>

      {/* ── Category Spotlights ── */}
      <CategorySpotlights locale={locale} />

      {/* ── Emerging Formats (registry-driven) ── */}
      <EmergingFormats locale={locale} />

      {/* ── CTA ── */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {typeof dict.readyToConvert === "string" ? dict.readyToConvert : "Ready to Convert?"}
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            {typeof dict.readyToConvertDesc === "string"
              ? dict.readyToConvertDesc
              : "Start converting your files now. No registration required, no limits."}
          </p>
          <button
            onClick={scrollToDropzone}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Upload className="h-5 w-5" />
            {hero?.uploadBtn || "Upload a File"}
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EMERGING FORMATS — modern formats gaining traction (registry-driven)
// ---------------------------------------------------------------------------

function EmergingFormats({ locale }: { locale: string }) {
  const emerging = formatRegistry.getAll()
    .filter(f =>
      f.tier === "standard" &&
      (f.searchVolume ?? 0) > 10000
    )
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
    .slice(0, 18);

  if (!emerging.length) return null;

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8 max-w-5xl mx-auto">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Emerging Formats</h2>
            <p className="text-slate-500 text-sm mt-1">Modern file formats with growing browser support and adoption</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 max-w-5xl mx-auto">
          {emerging.map(fmt => {
            const def      = CATEGORY_DEFINITIONS[fmt.category];
            const catRoute = def?.converterRoute ?? `/${fmt.category}-converter`;
            return (
              <Link key={fmt.ext}
                href={`/${locale}${catRoute}/${fmt.ext}`}
                data-testid={`emerging-format-${fmt.ext}`}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all">
                <Layers className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase">.{fmt.ext}</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">{fmt.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CATEGORY SPOTLIGHT — per-category sections with conversions + tools
// ---------------------------------------------------------------------------

const SPOTLIGHT_CATEGORIES: FormatCategory[] = ["image", "video", "document", "pdf"];

function CategorySpotlights({ locale }: { locale: string }) {
  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Explore by Category</h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Every format, every converter, every tool — organized by file type
          </p>
        </div>
        <div className="space-y-10 max-w-5xl mx-auto">
          {SPOTLIGHT_CATEGORIES.map(cat => (
            <CategorySpotlight key={cat} category={cat} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategorySpotlight({ category, locale }: { category: FormatCategory; locale: string }) {
  const def = CATEGORY_DEFINITIONS[category];
  if (!def) return null;

  const Icon = def.icon;
  const [fromColor, toColor] = def.gradient;
  const catRoute = `/${locale}${def.converterRoute}`;

  const popularConvs = popularConvertersEngine.getTopForCategory(category, locale, 6);
  const tools        = relatedToolEngine.getToolsForCategory(category, 4);
  const formats      = formatRegistry.getByCategory(category);
  const recentFmts   = formats.slice(-4);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      {/* Category header */}
      <div className={`flex items-center justify-between px-6 py-4 bg-gradient-to-r ${fromColor} ${toColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{def.label} Converter</h3>
            <p className="text-white/80 text-xs">{formats.length} formats supported</p>
          </div>
        </div>
        <Link
          href={catRoute}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
          data-testid={`category-spotlight-view-all-${category}`}
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Popular Conversions */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Popular Conversions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularConvs.map(conv => (
                <Link
                  key={`${conv.from}-${conv.to}`}
                  href={conv.href}
                  data-testid={`spotlight-conv-${category}-${conv.from}-${conv.to}`}
                  className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
                >
                  <span className="text-xs font-bold text-slate-600 uppercase">{conv.from}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                  <span className="text-xs font-bold text-blue-600 uppercase">{conv.to}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Tools */}
          {tools.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Featured Tools</p>
              <div className="space-y-2">
                {tools.slice(0, 3).map(tool => (
                  <Link
                    key={tool.slug}
                    href={`/${locale}${tool.route}`}
                    data-testid={`spotlight-tool-${category}-${tool.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 transition-all"
                  >
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${fromColor} ${toColor} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[9px] font-bold">{tool.shortName.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">{tool.shortName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recently Added Formats */}
        {recentFmts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supported Formats</p>
            <div className="flex flex-wrap gap-1.5">
              {recentFmts.map(fmt => (
                <span key={fmt.ext} className="inline-flex px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-600 uppercase">
                  .{fmt.ext}
                </span>
              ))}
              <Link href={catRoute} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                +{formats.length - 4} more <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CATEGORY CARD — registry-driven
// ---------------------------------------------------------------------------

interface CategoryCardProps {
  cat:    string;
  def:    import("@/lib/types/formats").CategoryDefinition;
  route:  string;
  count:  number;
  cats?:  Record<string, string>;
  locale: string;
}

function CategoryCard({ def, route, count }: CategoryCardProps) {
  const Icon = def.icon;
  const [fromColor, toColor] = def.gradient;

  return (
    <Link href={route} data-testid={`category-card-${def.seoLabel.toLowerCase()}`}>
      <div className="category-card h-full group">
        <div className="relative z-10">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${fromColor} ${toColor} flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {def.label} Converter
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            {def.heroDescription ?? `Convert ${def.seoLabel} files instantly in your browser`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={`text-xs ${def.bgColor} border border-slate-200`}>
              {count} formats
            </Badge>
            <Badge variant="secondary" className={`text-xs ${def.bgColor} border border-slate-200`}>
              Free
            </Badge>
            <Badge variant="secondary" className={`text-xs ${def.bgColor} border border-slate-200`}>
              No signup
            </Badge>
          </div>
          <div className="flex items-center text-blue-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
            Get Started
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
