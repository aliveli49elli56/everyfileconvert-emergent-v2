"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Eraser,
  BookOpen,
  Film,
  Music,
  FileType,
  FileImage,
  Eye,
} from "lucide-react";
import UniversalDropzone from "@/components/UniversalDropzone";
import AdSlot from "@/components/ads/ad-slot";
import { formatRegistry } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import type { Locale } from "@/lib/i18n/config";

// FormatSelector lives below the fold — load it lazily to keep the initial bundle small
const FormatSelector = dynamic(() => import("@/components/FormatSelector"), {
  loading: () => (
    <div className="h-32 w-full rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />
  ),
  ssr: false,
});

type DictType = Record<string, unknown>;

export default function HomeClient({ dict, locale }: { dict: DictType; locale: Locale }) {
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const scrollToDropzone = () => {
    dropzoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const totalFormats = formatRegistry.getAll().length;
  const totalConversions = conversionRegistry.getAllConversions().length;

  const categories = [
    { nameKey: "imageConverter", descKey: "imageConverterDesc", icon: FileImage, href: `/${locale}/image-converter`, color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-50", features: ["Format conversion", "Batch processing", "Quality control"] },
    { nameKey: "videoConverter", descKey: "videoConverterDesc", icon: Film, href: `/${locale}/video-converter`, color: "from-violet-500 to-purple-500", bgColor: "bg-violet-50", features: ["HD support", "Fast encoding", "No quality loss"] },
    { nameKey: "audioConverter", descKey: "audioConverterDesc", icon: Music, href: `/${locale}/audio-converter`, color: "from-rose-500 to-pink-500", bgColor: "bg-rose-50", features: ["Bitrate control", "ID3 tags", "Fast processing"] },
    { nameKey: "pdfTools", descKey: "pdfToolsDesc", icon: FileType, href: `/${locale}/pdf-tools`, color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", features: ["Merge PDFs", "Split pages", "Compress files"] },
    { nameKey: "backgroundRemover", descKey: "backgroundRemoverDesc", icon: Eraser, href: `/${locale}/background-remover`, color: "from-indigo-500 to-slate-500", bgColor: "bg-indigo-50", features: ["AI-powered", "Transparent PNG", "Batch mode"] },
    { nameKey: "ebookConverter", descKey: "ebookConverterDesc", icon: BookOpen, href: `/${locale}/ebook-converter`, color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", features: ["EPUB", "MOBI", "AZW3"] },
    { nameKey: "onlineViewer", descKey: "onlineViewerDesc", icon: Eye, href: `/${locale}/view`, color: "from-cyan-500 to-sky-500", bgColor: "bg-cyan-50", features: ["75+ formats", "No install", "Instant view"] },
  ];

  const features = [
    { icon: Shield, titleKey: "private", descKey: "privateDesc" },
    { icon: Zap, titleKey: "fast", descKey: "fastDesc" },
    { icon: Lock, titleKey: "secure", descKey: "secureDesc" },
  ];

  const cats = dict.categories as Record<string, string>;
  const feats = dict.features as Record<string, string>;
  const hero = dict.hero as Record<string, string>;

  return (
    <div className="min-h-screen">
      {/* ── Hero / UniversalDropzone Section ── */}
      <section className="relative hero-gradient overflow-hidden -mt-[122px] pt-[122px]">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative mx-auto px-4 pt-4 pb-10 sm:pt-6 sm:pb-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur border border-slate-200">
                {totalFormats} {hero?.badge || "Formats - Conversions"} {totalConversions}+
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {hero?.title || "Convert Any File"}{" "}
                <span className="gradient-text">{hero?.titleHighlight || "Instantly"}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                {hero?.subtitle || "Transform videos, audio, images, and documents directly in your browser. No uploads, complete privacy."}
              </p>
            </div>

          </div>

          {/* UniversalDropzone with glassmorphism design */}
          <div ref={dropzoneRef} className="mt-6 max-w-2xl mx-auto">
            <UniversalDropzone mode="all" />
          </div>
        </div>
      </section>

      {/* ── All-In-One Tools Section ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {typeof dict.allInOne === "string" ? dict.allInOne : "All-In-One File Tools"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {typeof dict.allInOneDesc === "string" ? dict.allInOneDesc : "Choose from our comprehensive suite of file conversion and editing tools"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* First two cards: Image Converter (0) + Video Converter (1) */}
            {categories.slice(0, 2).map((category) => (
              <Link key={category.nameKey} href={category.href}>
                <div className="category-card h-full group">
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110`}>
                      <category.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {cats?.[category.nameKey] || category.nameKey}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {cats?.[category.descKey] || category.descKey}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className={`text-xs ${category.bgColor} border border-slate-200`}>
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-blue-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                      {cats?.getStarted || "Get Started"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/*
              ── AD SLOT: tools_infeed_1 ────────────────────────────────────
              Mobile-only: appears between Video Converter and Audio Converter.
              Hidden on sm+ so it never disrupts the 2- or 3-column grid.
              Safety margin: my-8 (32px top+bottom), relative z-0.
              <!-- REKLAM KODU BURAYA GELECEK -->
            */}
            <div
              className="block sm:hidden relative z-0 my-8 col-span-1"
              data-testid="ad-tools-infeed"
            >
              <div className="flex justify-center">
                <AdSlot adUnit="tools_infeed_1-300x250" width={300} height={250} />
              </div>
            </div>

            {/* Remaining cards: Audio Converter (2) onwards */}
            {categories.slice(2).map((category) => (
              <Link key={category.nameKey} href={category.href}>
                <div className="category-card h-full group">
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110`}>
                      <category.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {cats?.[category.nameKey] || category.nameKey}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {cats?.[category.descKey] || category.descKey}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className={`text-xs ${category.bgColor} border border-slate-200`}>
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-blue-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                      {cats?.getStarted || "Get Started"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.titleKey} className="text-center p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 mb-4">
                  <feature.icon className="h-7 w-7 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feats?.[feature.titleKey] || feature.titleKey}
                </h3>
                <p className="text-sm text-slate-600">{feats?.[feature.descKey] || feature.descKey}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-sky-50 via-blue-50 to-yellow-50/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              {typeof dict.supportedFormats === "string" ? dict.supportedFormats : "Supported Formats"}
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              {(typeof dict.supportedFormatsDesc === "string" ? dict.supportedFormatsDesc : "We support {count} different file formats").replace("{count}", String(totalFormats))}
            </p>
          </div>
          <FormatSelector locale={locale} />
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {typeof dict.readyToConvert === "string" ? dict.readyToConvert : "Ready to Convert?"}
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            {typeof dict.readyToConvertDesc === "string" ? dict.readyToConvertDesc : "Start converting your files now. No registration required, no limits."}
          </p>
          <button
            onClick={scrollToDropzone}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Upload className="h-5 w-5" />
            {hero?.uploadBtn || "Upload a File"}
          </button>
        </div>
      </section>
    </div>
  );
}
