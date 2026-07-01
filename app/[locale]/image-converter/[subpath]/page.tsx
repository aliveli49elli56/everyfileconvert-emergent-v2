/**
 * app/[locale]/image-converter/[subpath]/page.tsx
 *
 * Handles two cases:
 *  1. Named tool subpages (e.g. "upscale") → custom SUBPAGE_CONFIGS layout
 *  2. Converter format subpages (e.g. "jpg-to-png", "jpg") → delegates to
 *     the same conversion engine used by [slug] and [...slug].
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UniversalDropzone from "@/components/UniversalDropzone";
import UniversalToolPageClient from "@/components/UniversalToolPageClient";
import UniversalLandingExtras from "@/components/UniversalLandingExtras";
import { getHreflangLinks, getDictionary } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getConversionPageData, getAllConversionSlugs } from "@/lib/engine/dynamic-tool-page-data";

interface PageProps {
  params: Promise<{ locale: string; subpath: string }>;
}

const SUBPAGE_CONFIGS: Record<string, { name: string; desc: string; seoTitle: string; seoDesc: string }> = {
  upscale: {
    name: "Image Upscaler",
    desc: "Increase image resolution up to 4x using AI-based super-resolution enhancement algorithms.",
    seoTitle: "Free Online Image Upscaler | EveryFileConvert",
    seoDesc: "Upscale images 2x or 4x online for free with AI. Increase photo resolution without quality loss.",
  },
};

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "In-browser processing" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export const dynamicParams = true;

export async function generateStaticParams() {
  const toolKeys  = Object.keys(SUBPAGE_CONFIGS);
  const convSlugs = getAllConversionSlugs()
    .filter(s => {
      // Include slugs whose input format is an image type
      const [inp] = s.split("-to-");
      return inp === "jpg" || inp === "png" || inp === "gif" || inp === "webp"
        || inp === "avif" || inp === "heic" || inp === "bmp" || inp === "tiff"
        || inp === "svg" || inp === "ico" || inp === "jxl";
    });
  return [...toolKeys, ...convSlugs].map(subpath => ({ subpath }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, subpath } = await params;

  // Converter route takes priority — just use the subpath slug
  const convData = getConversionPageData(subpath);
  if (convData) {
    const hreflangs = getHreflangLinks(`/image-converter/${subpath}`);
    return {
      title: convData.title,
      description: convData.description,
      keywords: convData.keywords.join(", "),
      openGraph: { title: convData.title, description: convData.description, type: "website", url: `https://everyfileconvert.com/${locale}/image-converter/${subpath}` },
      twitter: { card: "summary_large_image", title: convData.title, description: convData.description },
      alternates: { canonical: `https://everyfileconvert.com/${locale}/image-converter/${subpath}`, languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])) },
    };
  }

  const config = SUBPAGE_CONFIGS[subpath];
  if (!config) return { title: "Image Tool | EveryFileConvert" };

  const hreflangs = getHreflangLinks(`/image-converter/${subpath}`);
  return {
    title: config.seoTitle,
    description: config.seoDesc,
    openGraph: { title: config.seoTitle, description: config.seoDesc, type: "website", url: `https://everyfileconvert.com/${locale}/image-converter/${subpath}` },
    twitter: { card: "summary_large_image", title: config.seoTitle, description: config.seoDesc },
    alternates: { canonical: `https://everyfileconvert.com/${locale}/image-converter/${subpath}`, languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])) },
  };
}

export default async function ImageConverterSubPage({ params }: PageProps) {
  const { locale, subpath } = await params;

  // ── Case 1: Converter format slug (e.g. jpg-to-png, jpg) ──────────────────
  // getConversionPageData expects just the slug, not the full path
  const convData = getConversionPageData(subpath);
  if (convData?.parsedConversion) {
    const dict = await getDictionary(locale as Locale);
    const { parsedConversion, category } = convData;
    const slugString = `image-converter/${subpath}`;
    return (
      <>
        <UniversalToolPageClient pageData={convData} slug={slugString} locale={locale as Locale} dict={dict} />
        <UniversalLandingExtras
          variant="converter"
          locale={locale}
          inputExt={parsedConversion.inputFormat ?? undefined}
          outputExt={parsedConversion.outputFormat ?? undefined}
          isSingleFormat={parsedConversion.isSingleFormat}
          category={category}
        />
      </>
    );
  }

  // ── Case 2: Named tool subpage (e.g. upscale) ─────────────────────────────
  const config = SUBPAGE_CONFIGS[subpath];
  // Unknown subpath → 404
  if (!config) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-6">
            <Link href={`/${locale}/image-converter`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Image Converter
            </Link>
          </div>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-emerald-100 text-emerald-700 border-emerald-200">Image Tools</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{config.name}</h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">{config.desc}</p>
          </div>
          <UniversalDropzone mode="image" allowedTypes={["image/*"]} />
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-700">{f.label}</span>
                <span className="hidden sm:inline text-slate-400">— {f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <UniversalLandingExtras
        variant="tool"
        locale={locale}
        toolKey={subpath}
        toolName={config.name}
        toolMode="image"
        toolParentPath="image-converter"
        toolParentLabel="Image Converter"
        category="image"
      />
    </div>
  );
}
