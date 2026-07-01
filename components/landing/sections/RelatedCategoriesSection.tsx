"use client";
import Link from "next/link";
import { CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  category: FormatCategory;
  locale: string;
  limit?: number;
}

export function RelatedCategoriesSection({ category, locale, limit = 5 }: Props) {
  const siblings = (Object.keys(CATEGORY_DEFINITIONS) as FormatCategory[])
    .filter(c => c !== category && !!CATEGORY_DEFINITIONS[c]?.converterRoute)
    .slice(0, limit);
  if (!siblings.length) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" />
            <h2 className="text-2xl font-bold text-slate-900">More Converters</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {siblings.map(cat => {
              const def = CATEGORY_DEFINITIONS[cat];
              if (!def) return null;
              const Icon  = def.icon;
              const [from, to] = def.gradient;
              const href = `/${locale}${def.converterRoute ?? `/${cat}-converter`}`;
              return (
                <Link key={cat} href={href} data-testid={`related-cat-${cat}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-center">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{def.seoLabel}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
