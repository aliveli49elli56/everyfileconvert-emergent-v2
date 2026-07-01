"use client";
import { Lightbulb } from "lucide-react";
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  category: FormatCategory;
}

export function TipsSection({ ext, category }: Props) {
  const tips = formatDescriptionEngine.getProfessionalTips(ext ?? "", category);
  if (!tips.length) return null;

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" />
            <h2 className="text-2xl font-bold text-slate-900">Professional Tips</h2>
          </div>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center mt-0.5">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
