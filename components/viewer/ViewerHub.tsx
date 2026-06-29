"use client";
import { Fragment } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import AdSlot from "@/components/ads/ad-slot";
import { VIEWER_CATEGORIES, getViewerCategories, type ViewerCategory } from "@/lib/registry/viewer-registry";

const VIEWER_CATEGORY_META: Record<ViewerCategory, { label: string; color: string; gradient: string }> = {
  document: { label: 'Documents', color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
  spreadsheet: { label: 'Spreadsheets', color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
  presentation: { label: 'Presentations', color: 'text-orange-600', gradient: 'from-orange-500 to-amber-500' },
  image: { label: 'Images', color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
  video: { label: 'Video', color: 'text-red-600', gradient: 'from-red-500 to-orange-500' },
  audio: { label: 'Audio', color: 'text-violet-600', gradient: 'from-violet-500 to-purple-500' },
  archive: { label: 'Archives', color: 'text-amber-600', gradient: 'from-amber-500 to-yellow-500' },
  email: { label: 'Email', color: 'text-cyan-600', gradient: 'from-cyan-500 to-sky-500' },
  design: { label: 'Design', color: 'text-indigo-600', gradient: 'from-indigo-500 to-blue-500' },
  code: { label: 'Code & Data', color: 'text-slate-600', gradient: 'from-slate-500 to-gray-500' },
  cad: { label: 'CAD & Vector', color: 'text-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  ebook: { label: 'eBooks', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
  font: { label: 'Fonts', color: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
  gis: { label: 'GIS', color: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
};

const CATEGORY_ORDER: ViewerCategory[] = [
  "document", "spreadsheet", "presentation", "image",
  "design", "video", "audio", "archive", "email", "ebook", "code", "cad",
];

// Mobile-only banners are injected AFTER these categories
const MOBILE_AD_AFTER: ViewerCategory[] = ["spreadsheet", "video"];

export default function ViewerHub({ locale }: { locale: string }) {
  const grouped = getViewerCategories();

  return (
    <div className="w-full">
      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map((cat) => {
        const meta = VIEWER_CATEGORY_META[cat];
        const formats = grouped[cat];
        return (
          <Fragment key={cat}>
            <div className="mb-10">
              <h2 className={`text-sm font-bold uppercase tracking-widest mb-4 ${meta.color}`}>
                {meta.label}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {formats.map((f) => (
                  <Link
                    key={f.ext}
                    href={`/${locale}/view/${f.ext}`}
                    data-testid={`viewer-card-${f.ext}`}
                    className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-3 text-center hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} shadow-sm`}>
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                      .{f.ext.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">{f.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            {MOBILE_AD_AFTER.includes(cat) && (
              /* <!-- REKLAM KODU BURAYA GELECEK --> */
              <div
                className="md:hidden flex justify-center my-6"
                data-testid={`ad-viewer-mobile-after-${cat}`}
              >
                <AdSlot adUnit={`viewer_mobile_after_${cat}-336x280`} width={336} height={280} />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
