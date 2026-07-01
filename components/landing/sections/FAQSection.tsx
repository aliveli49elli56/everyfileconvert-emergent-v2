"use client";
import { HelpCircle } from "lucide-react";
import type { FAQItem } from "@/lib/engine/format-description-engine";

interface Props {
  faqs: FAQItem[];
  title?: string;
  bg?: string;
}

export function FAQSection({ faqs, title = "Frequently Asked Questions", bg = "bg-slate-50" }: Props) {
  if (!faqs.length) return null;
  return (
    <section className={`py-14 ${bg}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm group">
                <summary className="cursor-pointer flex items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-800 hover:text-blue-600 list-none">
                  <HelpCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  {faq.q}
                </summary>
                <p className="px-5 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
