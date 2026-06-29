import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Scale,
  Crop,
  SquareIcon,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Shield,
  Zap,
  Lock,
  CopyPlus,
  LayoutTemplate,
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
  const hreflangs = getHreflangLinks("/image-resizer");

  return {
    title: meta?.resizerTitle || "Free Online Image Resizer | EveryFileConvert",
    description: meta?.resizerDesc || "Resize images online to any dimension. Custom size, percentage scale, presets for social media. 100% private.",
    keywords: "image resizer online, resize image, crop image, scale image online, free image resizer",
    openGraph: {
      title: meta?.resizerTitle || "Free Online Image Resizer",
      description: meta?.resizerDesc || "Resize images to any dimension online for free.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/image-resizer`,
    },
    twitter: { card: "summary_large_image", title: meta?.resizerTitle, description: meta?.resizerDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/image-resizer`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const tools = [
  { name: "Custom Resize", description: "Resize images to exact pixel dimensions", icon: Maximize2, href: "image-resizer/custom", color: "from-cyan-500 to-blue-500", popular: true },
  { name: "Batch Resize", description: "Resize multiple images at once", icon: Minimize2, href: "image-resizer/batch", color: "from-emerald-500 to-teal-500" },
  { name: "Scale by Percentage", description: "Scale images proportionally by percentage", icon: Scale, href: "image-resizer/scale", color: "from-violet-500 to-purple-500" },
  { name: "Smart Crop", description: "AI-powered cropping with content detection", icon: Crop, href: "image-resizer/smart-crop", color: "from-rose-500 to-pink-500", isNew: true },
  { name: "Square Format", description: "Convert to 1:1 aspect ratio for social media", icon: SquareIcon, href: "image-resizer/square", color: "from-amber-500 to-orange-500" },
  { name: "Landscape Format", description: "Convert to 16:9 or 4:3 aspect ratio", icon: RectangleHorizontal, href: "image-resizer/landscape", color: "from-blue-500 to-indigo-500" },
  { name: "Portrait Format", description: "Convert to 9:16 or 3:4 aspect ratio", icon: RectangleVertical, href: "image-resizer/portrait", color: "from-teal-500 to-cyan-500" },
  { name: "AI Upscaler", description: "Increase resolution with AI enhancement", icon: Sparkles, href: "image-converter/upscale", color: "from-indigo-500 to-violet-500", popular: true },
  { name: "Bulk Image Resizer", description: "Resize many images to the same size in one batch", icon: CopyPlus, href: "tools/bulk-image-resizer", color: "from-sky-500 to-cyan-500" },
  { name: "Square / Landscape / Portrait", description: "One-click social media format presets", icon: LayoutTemplate, href: "tools/image-format-preset", color: "from-emerald-500 to-teal-500" },
];

const presets = [
  { name: "Instagram Post", size: "1080 x 1080", format: "Square" },
  { name: "Facebook Cover", size: "820 x 312", format: "Landscape" },
  { name: "YouTube Thumbnail", size: "1280 x 720", format: "Landscape" },
  { name: "Twitter Header", size: "1500 x 500", format: "Landscape" },
  { name: "LinkedIn Post", size: "1200 x 627", format: "Landscape" },
  { name: "Pinterest Pin", size: "1000 x 1500", format: "Portrait" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleImageResizerPage({ params }: PageProps) {
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
              Image Resizer
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Resize images to any dimension while maintaining quality. Perfect for social media, web, and print.
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
            {tools.map((tool) => (
              <Link key={tool.name} href={`/${locale}/${tool.href}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                          {"popular" in tool && tool.popular && (
                            <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 border-cyan-200">Popular</Badge>
                          )}
                          {"isNew" in tool && tool.isNew && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{tool.description}</p>
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
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
              Popular Size Presets
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <div key={preset.name} className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer">
                  <h3 className="font-medium text-slate-900 text-sm">{preset.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{preset.size}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{preset.format}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Ready to Resize Your Image?
          </h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Upload your image and choose custom dimensions or presets
          </p>
          <Link href={`/${locale}`}>
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90">
              Start Resizing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
