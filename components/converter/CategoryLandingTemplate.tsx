/**
 * components/converter/CategoryLandingTemplate.tsx
 * Shared template for all category landing pages — Phase 7.1
 *
 * Owns: Hero, Upload area, Popular Conversions, Supported Formats.
 * All remaining landing sections are delegated to UniversalLandingExtras
 * for full registry-driven, zero-duplication architecture.
 */
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRegistry, CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import { popularConvertersEngine } from "@/lib/engine/popular-converters-engine";
import type { FormatCategory } from "@/lib/types/formats";
import type { Locale } from "@/lib/i18n/config";
import UniversalLandingExtras from "@/components/UniversalLandingExtras";

const UniversalDropzone = dynamic(() => import("@/components/UniversalDropzone"), { ssr: false });

// ---------------------------------------------------------------------------
// TEMPLATE PROPS
// ---------------------------------------------------------------------------

export interface CategoryLandingTemplateProps {
  category:    FormatCategory;
  locale:      Locale;
  heroTitle?:  string;
  heroDesc?:   string;
  /** @deprecated — FAQs now generated automatically via UniversalLandingExtras */
  faqs?:       Array<{ q: string; a: string }>;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function CategoryLandingTemplate({
  category,
  locale,
  heroTitle,
  heroDesc,
}: CategoryLandingTemplateProps) {
  const def          = CATEGORY_DEFINITIONS[category];
  const Icon         = def.icon;
  const [from, to]   = def.gradient;

  const formats      = formatRegistry.getByCategory(category);
  const popularConvs = popularConvertersEngine.getTopForCategory(category, locale, 12);

  const title = heroTitle ?? def.heroTitle ?? `${def.label} Converter`;
  const desc  = heroDesc  ?? def.heroDescription ??
    `Convert ${def.seoLabel} files instantly in your browser. No upload, no signup, 100% free.`;

  const keyFeatures = [
    `${formats.length} supported formats`,
    "No file size limits",
    "100% private — browser-only",
    "Free forever, no signup",
  ];

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pb-12 pt-10 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${from} ${to} shadow-lg mb-6`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{title}</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{desc}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {keyFeatures.map(f => (
                <Badge key={f} variant="secondary" className="gap-1 px-3 py-1 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {f}
                </Badge>
              ))}
            </div>
          </div>

          {/* Upload area — DO NOT MODIFY */}
          <div className="max-w-2xl mx-auto">
            <UniversalDropzone mode="all" />
          </div>
        </div>
      </section>

      {/* ── Popular Conversions ── */}
      {popularConvs.length > 0 && (
        <section className="py-14 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Popular {def.label} Conversions
            </h2>
            <p className="text-slate-500 text-center mb-8">Most-used conversion pairs, all free</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {popularConvs.map(conv => (
                <Link
                  key={`${conv.from}-${conv.to}`}
                  href={conv.href}
                  data-testid={`cat-conv-${conv.from}-${conv.to}`}
                  className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-sm font-medium text-slate-700 hover:text-blue-700"
                >
                  <span className="font-bold uppercase text-xs">{conv.from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-blue-500" />
                  <span className="font-bold uppercase text-xs text-blue-600">{conv.to}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── All Supported Formats ── */}
      <section className="py-14 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
            Supported {def.label} Formats
          </h2>
          <p className="text-slate-500 text-center mb-8">{formats.length} formats supported — click any to start converting</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {formats.map(fmt => (
              <Link
                key={fmt.ext}
                href={`/${locale}${def.converterRoute ?? `/${category}-converter`}/${fmt.ext}`}
                data-testid={`format-chip-${fmt.ext}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-medium text-slate-700 hover:text-blue-700 transition-all"
              >
                <span className="font-bold uppercase">{fmt.ext}</span>
                <span className="text-slate-400 group-hover:text-slate-500">{fmt.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Registry-driven landing sections (Features, FAQ, Links, CTA, etc.) ── */}
      <UniversalLandingExtras
        variant="category"
        locale={locale as string}
        category={category}
      />

    </div>
  );
}
