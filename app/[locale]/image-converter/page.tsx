import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  FileImage,
  Crop,
  Minimize2,
  Maximize2,
  RotateCcw,
  Palette,
  Sparkles,
  Layers,
  Shield,
  Zap,
  Lock,
  FlipHorizontal2,
  Pipette,
  LayoutGrid,
  Laugh,
  Stamp,
  ScanText,
  LayoutTemplate,
  ZoomIn,
  CopyPlus,
  ScanEye,
} from "lucide-react";
import UniversalDropzone from "@/components/UniversalDropzone";
import AdSlot from "@/components/ads/ad-slot";
import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const hreflangs = getHreflangLinks("/image-converter");

  return {
    title: meta?.imageConverterTitle || "Free Online Image Converter | EveryFileConvert",
    description: meta?.imageConverterDesc || "Convert PNG, JPG, WebP, HEIC and 40+ image formats online. 100% private, no upload required.",
    keywords: "image converter online, png to jpg, webp converter, heic converter, free image converter",
    openGraph: {
      title: meta?.imageConverterTitle || "Free Online Image Converter",
      description: meta?.imageConverterDesc || "Convert between 40+ image formats in your browser.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/image-converter`,
    },
    twitter: { card: "summary_large_image", title: meta?.imageConverterTitle, description: meta?.imageConverterDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/image-converter`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const tools = [
  { name: "Image Format Converter", description: "Convert between PNG, JPG, WebP, GIF, BMP, TIFF, SVG, HEIC and more", icon: FileImage, href: "image-converter", color: "from-emerald-500 to-teal-500", popular: true },
  { name: "Image Cropper", description: "Crop images to custom dimensions or predefined aspect ratios", icon: Crop, href: "tools/image-cropper", color: "from-cyan-500 to-blue-500" },
  { name: "Image Compressor", description: "Reduce file size while maintaining quality", icon: Minimize2, href: "tools/image-compressor", color: "from-violet-500 to-purple-500", popular: true },
  { name: "Image Upscaler", description: "Increase image resolution using AI enhancement", icon: Maximize2, href: "tools/image-upscaler", color: "from-rose-500 to-pink-500", isNew: true },
  { name: "Image Rotator", description: "Rotate and flip images to any angle", icon: RotateCcw, href: "tools/image-rotator", color: "from-amber-500 to-orange-500" },
  { name: "Flip Image", description: "Flip images horizontally or vertically", icon: FlipHorizontal2, href: "tools/flip-image", color: "from-amber-500 to-yellow-500" },
  { name: "Image Enlarger", description: "Enlarge small images without pixelation", icon: ZoomIn, href: "tools/image-enlarger", color: "from-rose-500 to-red-500" },
  { name: "Color Adjustments", description: "Adjust brightness, contrast, saturation, and more", icon: Palette, href: "tools/color-adjustments", color: "from-indigo-500 to-slate-500" },
  { name: "Color Picker", description: "Pick colors from any image — HEX, RGB, HSL values", icon: Pipette, href: "tools/color-picker", color: "from-pink-500 to-rose-500" },
  { name: "AI Background Remover", description: "Remove backgrounds instantly with AI", icon: Sparkles, href: "tools/background-remover", color: "from-blue-500 to-cyan-500", popular: true },
  { name: "Batch Image Processor", description: "Process multiple images at once", icon: Layers, href: "tools/batch-image-processor", color: "from-teal-500 to-emerald-500" },
  { name: "Bulk Image Resizer", description: "Resize multiple images to the same dimensions at once", icon: CopyPlus, href: "tools/bulk-image-resizer", color: "from-cyan-500 to-sky-500" },
  { name: "Collage Maker", description: "Create beautiful photo collages from multiple images", icon: LayoutGrid, href: "tools/collage-maker", color: "from-fuchsia-500 to-violet-500", isNew: true },
  { name: "Meme Generator", description: "Add text captions to images to create memes", icon: Laugh, href: "tools/meme-generator", color: "from-yellow-500 to-amber-500" },
  { name: "Add Watermark", description: "Add text or image watermarks to photos", icon: Stamp, href: "tools/add-watermark", color: "from-slate-500 to-gray-500" },
  { name: "Blur Image", description: "Apply blur or mosaic effect to images or regions", icon: ScanEye, href: "tools/blur-image", color: "from-blue-400 to-indigo-500" },
  { name: "Image to Text OCR", description: "Extract text from images with optical character recognition", icon: ScanText, href: "tools/image-to-text", color: "from-emerald-500 to-green-600", isNew: true },
  { name: "Square / Landscape / Portrait", description: "Convert images to social media preset formats", icon: LayoutTemplate, href: "tools/image-format-preset", color: "from-cyan-500 to-teal-500" },
];

const popularConversions = [
  { from: "PNG", to: "JPG" },
  { from: "HEIC", to: "JPG" },
  { from: "WEBP", to: "PNG" },
  { from: "JPG", to: "PDF" },
  { from: "SVG", to: "PNG" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleImageConverterPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-emerald-100 text-emerald-700 border-emerald-200">
              Image Converter
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Convert Any Image Format
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              PNG, JPG, WebP, HEIC, SVG, RAW and 40+ more formats. Choose your conversion and drop your file — done in seconds.
            </p>
          </div>

          <UniversalDropzone mode="image" allowedTypes={['image/*']} />

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

      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold text-slate-700 text-center mb-6">Popular Conversions</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {popularConversions.map((conv) => (
              <Link key={`${conv.from}-${conv.to}`} href={`/${locale}/${conv.from.toLowerCase()}-to-${conv.to.toLowerCase()}`}>
                <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-emerald-300 hover:bg-emerald-50 transition-all shadow-sm">
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-emerald-700">.{conv.from}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-emerald-700">.{conv.to}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">All Image Tools</h2>
            <p className="text-slate-500">Beyond format conversion — crop, compress, resize, and enhance.</p>
            {/* Mobile-only infeed banner */}
            <div className="md:hidden flex justify-center mt-6" data-testid="ad-image-tools-mobile">
              {/* <!-- REKLAM KODU BURAYA GELECEK --> */}
              <AdSlot adUnit="image_tools_mobile-336x280" width={336} height={280} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {tools.map((tool) => (
              <Link key={tool.name} href={`/${locale}/${tool.href}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-slate-200 bg-white group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                        <tool.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight">{tool.name}</h3>
                          {"popular" in tool && tool.popular && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100">Popular</Badge>
                          )}
                          {"isNew" in tool && tool.isNew && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-none hover:bg-blue-100">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-emerald-600 font-medium text-xs mt-3 group-hover:translate-x-1 transition-transform">
                      Open Tool <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
