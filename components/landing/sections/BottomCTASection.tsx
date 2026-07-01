"use client";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  primaryLabel: string;
  primaryOnClick?: boolean;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function BottomCTASection({
  title, subtitle, badge,
  primaryLabel, primaryOnClick, primaryHref,
  secondaryLabel, secondaryHref,
}: Props) {
  return (
    <section className="py-14 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 text-center">
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-5 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" />
            {badge}
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
        {subtitle && (
          <p className="text-slate-300 text-base mb-8 max-w-2xl mx-auto">{subtitle}</p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {primaryOnClick ? (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </button>
          ) : primaryHref ? (
            <Link href={primaryHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:border-slate-400 hover:text-white transition-all">
              {secondaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
