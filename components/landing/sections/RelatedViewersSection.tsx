"use client";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { formatRegistry } from "@/lib/registry/format-registry";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  category: FormatCategory;
  locale: string;
  limit?: number;
}

export function RelatedViewersSection({ ext, category, locale, limit = 6 }: Props) {
  const fmtDef         = ext ? formatRegistry.get(ext.toLowerCase()) : null;
  const targetCategory = fmtDef?.category ?? category;

  const viewers = formatRegistry.getAll()
    .filter(f => f.hasViewer && f.category === targetCategory && f.ext !== ext?.toLowerCase())
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
    .slice(0, limit)
    .map(f => ({ ext: f.ext, name: `${f.ext.toUpperCase()} Viewer`, href: `/${locale}/view/${f.ext}` }));

  if (!viewers.length) return null;

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" />
              <h2 className="text-2xl font-bold text-slate-900">File Viewers</h2>
            </div>
            <Link href={`/${locale}/view`} className="hidden sm:flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              All Viewers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {viewers.map(v => (
              <Link key={v.ext} href={v.href} data-testid={`related-viewer-${v.ext}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{v.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
