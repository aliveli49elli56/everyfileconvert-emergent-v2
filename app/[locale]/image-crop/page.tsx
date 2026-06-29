import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Crop,
  SquareIcon,
  RectangleHorizontal,
  RectangleVertical,
  Maximize2,
  Scissors,
  Shield,
  Zap,
  Lock,
} from "lucide-react";
import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const hreflangs = getHreflangLinks("/image-crop");

  return {
    title: meta?.cropTitle || "Free Online Image Cropper | EveryFileConvert",
    description: meta?.cropDesc || "Crop images online to custom dimensions or aspect ratios. Square, landscape, portrait presets. 100% private, no uploads.",
    keywords: "image crop online, crop image free, image cropper, aspect ratio crop, square crop, portrait crop",
    openGraph: {
      title: meta?.cropTitle || "Free Online Image Cropper",
      description: meta?.cropDesc || "Crop images to any dimension or aspect ratio online for free.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/image-crop`,
    },
    twitter: { card: "summary_large_image", title: meta?.cropTitle, description: meta?.cropDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/image-crop`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const cropModes = [
  { name: "Custom Crop", description: "Drag to select any region of your image", icon: Crop, href: "tools/image-crop/custom", color: "from-cyan-500 to-blue-500", popular: true },
  { name: "Square Crop", description: "Crop to perfect 1:1 square for social media", icon: SquareIcon, href: "tools/image-crop/square", color: "from-emerald-500 to-teal-500" },
  { name: "Landscape Crop", description: "16:9 or 4:3 ratio — perfect for web and video", icon: RectangleHorizontal, href: "tools/image-crop/landscape", color: "from-violet-500 to-purple-500" },
  { name: "Portrait Crop", description: "9:16 or 3:4 ratio for stories and prints", icon: RectangleVertical, href: "tools/image-crop/portrait", color: "from-rose-500 to-pink-500" },
  { name: "Resize & Crop", description: "Resize and crop in one step to exact dimensions", icon: Maximize2, href: "tools/image-crop/resize", color: "from-amber-500 to-orange-500" },
  { name: "Circular Crop", description: "Crop images into perfect circles", icon: Scissors, href: "tools/image-crop/circle", color: "from-teal-500 to-cyan-500", isNew: true },
];

const presets = [
  { name: "Instagram Post", ratio: "1:1", size: "1080 × 1080 px" },
  { name: "Instagram Story", ratio: "9:16", size: "1080 × 1920 px" },
  { name: "Facebook Cover", ratio: "2.63:1", size: "820 × 312 px" },
  { name: "YouTube Thumbnail", ratio: "16:9", size: "1280 × 720 px" },
  { name: "Twitter Card", ratio: "2:1", size: "1200 × 600 px" },
  { name: "LinkedIn Banner", ratio: "4:1", size: "1584 × 396 px" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleImageCropPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-cyan-100 text-cyan-700 border-cyan-200">
              Image Tools
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Online Image Cropper
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Crop images to any size or aspect ratio online. Custom crop, social media presets, and circular crop — all in your browser, no uploads needed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
              {trustFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                  <f.icon className="h-4 w-4 text-cyan-500" />
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className="hidden sm:inline text-slate-400">— {f.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {cropModes.map((mode) => (
              <Link key={mode.name} href={`/${locale}/${mode.href}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110`}>
                        <mode.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{mode.name}</h3>
                          {"popular" in mode && mode.popular && (
                            <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 border-cyan-200">Popular</Badge>
                          )}
                          {"isNew" in mode && mode.isNew && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{mode.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-cyan-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                      Open Tool <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Social Media Size Presets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <div key={preset.name} className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-cyan-50 hover:border-cyan-200 transition-all cursor-pointer">
                  <h3 className="font-medium text-slate-900 text-sm">{preset.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{preset.size}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{preset.ratio}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Ready to Crop?</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">Upload your image and crop it in seconds — no account needed</p>
          <Link href={`/${locale}`}>
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90">
              Start Cropping <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
