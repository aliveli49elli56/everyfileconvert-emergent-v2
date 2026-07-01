"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { internalLinkEngine } from "@/lib/engine/internal-link-engine";
import type { FormatCategory } from "@/lib/types/formats";

interface Props {
  inputExt?: string;
  outputExt?: string;
  category: FormatCategory;
  locale: string;
  title?: string;
}

export function InternalLinksSection({ inputExt, outputExt, category, locale, title }: Props) {
  const isConversionPair = !!(inputExt && outputExt);

  const groups = isConversionPair
    ? internalLinkEngine.getLinksForConversion(inputExt!, outputExt!, locale)
    : [];

  const flatLinks = !isConversionPair
    ? (inputExt
      ? internalLinkEngine.getLinksForFormat(inputExt, locale, 14)
      : internalLinkEngine.getLinksForCategory(category, locale, 24))
    : [];

  if (!groups.length && !flatLinks.length) return null;

  const heading = title ?? (inputExt ? `More ${inputExt.toUpperCase()} Conversions` : `All Conversions`);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
          </div>

          {groups.length > 0 ? (
            <div className="space-y-6">
              {groups.map(group => (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{group.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.links.map(link => (
                      <Link key={link.href} href={link.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all">
                        {link.label}
                        <ExternalLink className="h-2.5 w-2.5 text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {flatLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
