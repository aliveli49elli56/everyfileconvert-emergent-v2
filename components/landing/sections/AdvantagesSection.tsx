"use client";
import { CheckCircle2 } from "lucide-react";
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  ext?: string;
  category: FormatCategory;
  title?: string;
  bg?: string;
  advantages?: string[]; // Optional override (e.g. conversion benefits)
}

export function AdvantagesSection({ ext, category, title, bg = "bg-slate-50", advantages: override }: Props) {
  const advantages = override ?? formatDescriptionEngine.getAdvantages(ext ?? "", category);
  if (!advantages.length) return null;
  const heading = title ?? (ext ? `Why Use ${ext.toUpperCase()} Format` : `${category} Format Benefits`);

  return (
    <section className={`py-12 ${bg}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500" />
            <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {advantages.map((adv, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{adv}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
