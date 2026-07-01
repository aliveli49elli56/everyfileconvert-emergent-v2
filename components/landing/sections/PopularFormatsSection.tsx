"use client";
import Link from "next/link";
import { formatRegistry, CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  category: FormatCategory;
  locale: string;
  limit?: number;
}

export function PopularFormatsSection({ category, locale, limit = 12 }: Props) {
  const formats = formatRegistry.getByCategory(category)
    .filter(f => f.tier === "popular" || (f.searchVolume ?? 0) > 30000)
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
    .slice(0, limit);
  if (!formats.length) return null;

  const catDef   = CATEGORY_DEFINITIONS[category];
  const catRoute = catDef?.converterRoute ?? `/${category}-converter`;

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
            <h2 className="text-2xl font-bold text-slate-900">
              Popular {catDef?.seoLabel ?? ""} Formats
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {formats.map(fmt => (
              <Link key={fmt.ext}
                href={`/${locale}${catRoute}/${fmt.ext}`}
                data-testid={`popular-format-${fmt.ext}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-medium text-slate-700 hover:text-blue-700 transition-all">
                <span className="font-bold uppercase">.{fmt.ext}</span>
                <span className="text-slate-400">{fmt.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
