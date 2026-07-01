"use client";
import { CheckCircle2 } from "lucide-react";
import { formatRegistry } from "@/lib/registry/format-registry";
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";

interface Props {
  inputExt: string;
  outputExt?: string;
  isSingleFormat?: boolean;
}

export function FormatInfoSection({ inputExt, outputExt, isSingleFormat }: Props) {
  const inputFmt = formatRegistry.get(inputExt.toLowerCase());
  const outputFmt = (outputExt && !isSingleFormat) ? formatRegistry.get(outputExt.toLowerCase()) : null;
  if (!inputFmt && !outputFmt) return null;

  const inputH  = formatDescriptionEngine.getFormatHighlights(inputExt);
  const outputH = (outputExt && !isSingleFormat) ? formatDescriptionEngine.getFormatHighlights(outputExt) : [];
  const IN  = inputExt.toUpperCase();
  const OUT = outputExt?.toUpperCase() ?? "";

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
            <h2 className="text-2xl font-bold text-slate-900">
              About {IN}{!isSingleFormat && OUT ? ` and ${OUT}` : ""}
            </h2>
          </div>
          <div className={`grid gap-6 ${outputFmt ? "sm:grid-cols-2" : "max-w-2xl"}`}>
            {inputFmt && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 font-mono uppercase shadow-sm">.{inputExt}</span>
                  <h3 className="font-bold text-slate-900">{inputFmt.name}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{inputFmt.description ?? `A ${inputFmt.category} file format.`}</p>
                <ul className="space-y-2">
                  {inputH.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {outputFmt && (
              <div className="rounded-2xl border border-slate-200 bg-blue-50/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 font-mono uppercase shadow-sm">.{outputExt}</span>
                  <h3 className="font-bold text-slate-900">{outputFmt.name}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{outputFmt.description ?? `A ${outputFmt.category} file format.`}</p>
                <ul className="space-y-2">
                  {outputH.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
