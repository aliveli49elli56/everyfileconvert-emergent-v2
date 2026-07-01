"use client";
import { CheckCircle2 } from "lucide-react";

interface Props {
  features: string[];
  title?: string;
  bg?: string;
}

export function FeaturesSection({ features, title = "Key Features", bg = "bg-white" }: Props) {
  if (!features.length) return null;
  return (
    <section className={`py-14 border-t border-slate-100 ${bg}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
