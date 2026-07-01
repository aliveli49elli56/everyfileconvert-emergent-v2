"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { popularConvertersEngine } from "@/lib/engine/popular-converters-engine";
import { expandedRecommendationEngine } from "@/lib/engine/recommendation-engine";
import { CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  category: FormatCategory;
  locale: string;
  title?: string;
  limit?: number;
}

export function RelatedConvertersSection({ ext, category, locale, title, limit = 8 }: Props) {
  const convs = ext
    ? expandedRecommendationEngine.getRelatedConverters(ext, locale, limit)
    : popularConvertersEngine.getTopForCategory(category, locale, limit);
  if (!convs.length) return null;

  const catDef  = CATEGORY_DEFINITIONS[category];
  const heading = title ?? (ext ? `Popular ${ext.toUpperCase()} Conversions` : `Popular ${catDef?.seoLabel ?? ""} Conversions`);
  const catRoute = `/${locale}${catDef?.converterRoute ?? `/${category}-converter`}`;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
              <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
            </div>
            <Link href={catRoute} className="hidden sm:flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {convs.map((conv) => (
              <Link key={`${conv.from}-${conv.to}`} href={conv.href}
                data-testid={`related-conv-${conv.from}-${conv.to}`}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all">
                <span className="text-xs font-bold text-slate-600 uppercase">{conv.from}</span>
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-blue-600 uppercase">{conv.to}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
