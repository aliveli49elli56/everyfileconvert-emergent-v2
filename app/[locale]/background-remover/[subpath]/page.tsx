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
  remove: {
    name: "AI Background Remover",
    desc: "Remove image backgrounds instantly with AI. Perfect for product photos, portraits, and graphic design.",
    seoTitle: "Free AI Background Remover | EveryFileConvert",
    seoDesc: "Remove image backgrounds instantly with AI. Free, no signup required. Creates transparent PNG output.",
  },
  replace: {
    name: "Background Replacer",
    desc: "Replace image backgrounds with solid colors, gradients, or custom background images.",
    seoTitle: "Free Online Background Replacer | EveryFileConvert",
    seoDesc: "Replace image backgrounds online for free. Solid colors, gradients or custom images. No uploads.",
  },
  batch: {
    name: "Batch Background Remover",
    desc: "Remove backgrounds from multiple images at once. Upload a batch and process all images simultaneously.",
    seoTitle: "Free Batch Background Remover Online | EveryFileConvert",
    seoDesc: "Remove backgrounds from multiple images at once online for free. Batch processing, no uploads.",
  },
  transparent: {
    name: "Transparent PNG Maker",
    desc: "Convert any image to transparent PNG format by removing the background automatically.",
    seoTitle: "Free Transparent PNG Maker Online | EveryFileConvert",
    seoDesc: "Create transparent PNG images online for free. Remove background and save as transparent PNG.",
  },
  portrait: {
    name: "Portrait Mode",
    desc: "Add a beautiful portrait mode blur effect to your photos. Blur the background while keeping the subject sharp.",
    seoTitle: "Free Portrait Mode Photo Effect Online | EveryFileConvert",
    seoDesc: "Add portrait mode background blur to photos online for free. Keep subject sharp, blur background.",
  },
};

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "AI processes in seconds" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, subpath } = await params;
  const config = SUBPAGE_CONFIGS[subpath];
  if (!config) return { title: "Background Remover | EveryFileConvert" };

  const hreflangs = getHreflangLinks(`/background-remover/${subpath}`);
  return {
    title: config.seoTitle,
    description: config.seoDesc,
    openGraph: { title: config.seoTitle, description: config.seoDesc, type: "website", url: `https://everyfileconvert.com/${locale}/background-remover/${subpath}` },
    twitter: { card: "summary_large_image", title: config.seoTitle, description: config.seoDesc },
    alternates: { canonical: `https://everyfileconvert.com/${locale}/background-remover/${subpath}`, languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])) },
  };
}

export default async function BackgroundRemoverSubPage({ params }: PageProps) {
  const { locale, subpath } = await params;
  const config = SUBPAGE_CONFIGS[subpath] ?? {
    name: "Background Remover",
    desc: "Remove image backgrounds instantly with AI.",
    seoTitle: "Background Remover | EveryFileConvert",
    seoDesc: "Remove image backgrounds online for free.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-6">
            <Link href={`/${locale}/background-remover`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Background Remover
            </Link>
          </div>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-indigo-100 text-indigo-700 border-indigo-200">AI-Powered</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{config.name}</h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">{config.desc}</p>
          </div>
          <UniversalDropzone mode="image" allowedTypes={["image/*"]} />
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-indigo-500" />
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
