"use client";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { relatedToolEngine } from "@/lib/engine/related-tool-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  category: FormatCategory;
  locale: string;
  excludeSlug?: string;
  title?: string;
  limit?: number;
}

export function RelatedToolsSection({ category, locale, excludeSlug, title, limit = 6 }: Props) {
  const tools = relatedToolEngine.getToolsForCategory(category, limit)
    .filter(t => t.slug !== excludeSlug);
  if (!tools.length) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-500" />
            <h2 className="text-2xl font-bold text-slate-900">{title ?? "Related Tools"}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tools.map(tool => (
              <Link key={tool.slug} href={`/${locale}${tool.route}`}
                data-testid={`related-tool-${tool.slug}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 leading-tight">{tool.shortName}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
