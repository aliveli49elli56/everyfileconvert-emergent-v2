"use client";
import { Lightbulb } from "lucide-react";
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  outputExt?: string;
  category: FormatCategory;
}

export function UseCasesSection({ ext, outputExt, category }: Props) {
  const useCases = formatDescriptionEngine.getUseCases(ext ?? category, outputExt);
  if (!useCases.length) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900">Common Use Cases</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((uc, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-violet-50/30 transition-colors">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center mt-0.5">
                  <Lightbulb className="h-4 w-4 text-violet-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{uc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
