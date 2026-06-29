import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UniversalDropzone from "@/components/UniversalDropzone";
import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string; subpath: string }>;
}

const SUBPAGE_CONFIGS: Record<string, {
  name: string; desc: string; seoTitle: string; seoDesc: string;
}> = {
  custom: {
    name: "Custom Image Resize",
    desc: "Resize images to exact pixel dimensions. Enter a custom width and height and apply instantly in your browser.",
    seoTitle: "Custom Image Resizer Online | EveryFileConvert",
    seoDesc: "Resize images to custom pixel dimensions online for free. Exact width and height. No uploads needed.",
  },
  batch: {
    name: "Batch Image Resize",
    desc: "Resize multiple images at once to the same dimensions. Upload a batch and apply in one click.",
    seoTitle: "Batch Image Resizer Online | EveryFileConvert",
    seoDesc: "Resize multiple images at once online for free. Apply same dimensions to batch. 100% private.",
  },
  scale: {
    name: "Scale Image by Percentage",
    desc: "Scale images proportionally by a percentage. Enter 50% to halve or 200% to double the image size.",
    seoTitle: "Scale Image by Percentage Online | EveryFileConvert",
    seoDesc: "Scale images by percentage online for free. Proportional resize by 50%, 75%, 200% etc. No uploads.",
  },
  "smart-crop": {
    name: "Smart Crop",
    desc: "AI-powered smart crop that detects the most important subject and crops around it automatically.",
    seoTitle: "Smart AI Image Crop Online | EveryFileConvert",
    seoDesc: "AI-powered smart crop online for free. Automatically crop around the main subject. No uploads.",
  },
  square: {
    name: "Square Image Resize",
    desc: "Resize and crop images to a perfect square (1:1) format. Ideal for social media profile photos.",
    seoTitle: "Resize Image to Square (1:1) Online | EveryFileConvert",
    seoDesc: "Resize images to square 1:1 format online for free. Perfect for Instagram and profile photos.",
  },
  landscape: {
    name: "Landscape Image Resize",
    desc: "Resize images to landscape 16:9 or 4:3 aspect ratios. Perfect for YouTube and web banners.",
    seoTitle: "Resize Image to Landscape (16:9) Online | EveryFileConvert",
    seoDesc: "Resize images to landscape 16:9 or 4:3 ratio online for free. YouTube thumbnails and web banners.",
  },
  portrait: {
    name: "Portrait Image Resize",
    desc: "Resize images to portrait 9:16 or 3:4 aspect ratios. Perfect for Instagram Stories and mobile content.",
    seoTitle: "Resize Image to Portrait (9:16) Online | EveryFileConvert",
    seoDesc: "Resize images to portrait 9:16 or 3:4 ratio online for free. Instagram Stories and mobile content.",
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
  if (!config) return { title: "Image Resizer | EveryFileConvert" };

  const hreflangs = getHreflangLinks(`/image-resizer/${subpath}`);
  return {
    title: config.seoTitle,
    description: config.seoDesc,
    openGraph: { title: config.seoTitle, description: config.seoDesc, type: "website", url: `https://everyfileconvert.com/${locale}/image-resizer/${subpath}` },
    twitter: { card: "summary_large_image", title: config.seoTitle, description: config.seoDesc },
    alternates: { canonical: `https://everyfileconvert.com/${locale}/image-resizer/${subpath}`, languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])) },
  };
}

export default async function ImageResizerSubPage({ params }: PageProps) {
  const { locale, subpath } = await params;
  const config = SUBPAGE_CONFIGS[subpath] ?? {
    name: "Image Resizer",
    desc: "Resize images to any dimension while maintaining quality.",
    seoTitle: "Image Resizer | EveryFileConvert",
    seoDesc: "Resize images online for free.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-6">
            <Link href={`/${locale}/image-resizer`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Image Resizer
            </Link>
          </div>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-cyan-100 text-cyan-700 border-cyan-200">Image Tools</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{config.name}</h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">{config.desc}</p>
          </div>
          <UniversalDropzone mode="image" allowedTypes={["image/*"]} />
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-cyan-500" />
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
