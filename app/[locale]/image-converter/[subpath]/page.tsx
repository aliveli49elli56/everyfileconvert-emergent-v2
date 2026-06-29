import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UniversalDropzone from "@/components/UniversalDropzone";
import { getHreflangLinks } from "@/lib/i18n/config";

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, subpath } = await params;
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
  const config = SUBPAGE_CONFIGS[subpath] ?? {
    name: "Image Tool",
    desc: "Process and convert images online for free.",
    seoTitle: "Image Tool | EveryFileConvert",
    seoDesc: "Process images online for free.",
  };

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
    </div>
  );
}
