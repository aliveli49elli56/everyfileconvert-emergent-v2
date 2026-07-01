"use client";
import { AlertCircle } from "lucide-react";
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  category: FormatCategory;
  title?: string;
  bg?: string;
}

export function DisadvantagesSection({ ext, category, title, bg = "bg-white" }: Props) {
  const disadvantages = formatDescriptionEngine.getDisadvantages(ext ?? "", category);
  if (!disadvantages.length) return null;
  const heading = title ?? (ext ? `${ext.toUpperCase()} Format Limitations` : `Format Considerations`);

  return (
    <section className={`py-12 ${bg}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-400" />
            <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {disadvantages.map((dis, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{dis}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
