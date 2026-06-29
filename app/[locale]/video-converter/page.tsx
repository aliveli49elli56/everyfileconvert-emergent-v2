import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Film,
  Scissors,
  Minimize2,
  Volume2,
  RotateCw,
  Sparkles,
  Layers,
  Shield,
  Zap,
  Lock,
  Crop,
  Subtitles,
  Rewind,
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
  const hreflangs = getHreflangLinks("/video-converter");

  return {
    title: meta?.videoConverterTitle || "Free Online Video Converter | EveryFileConvert",
    description: meta?.videoConverterDesc || "Convert MP4, WebM, AVI, MOV, MKV and 30+ video formats online. 100% private, no upload required.",
    keywords: "video converter online, mp4 converter, webm converter, avi to mp4, free video converter",
    openGraph: {
      title: meta?.videoConverterTitle || "Free Online Video Converter",
      description: meta?.videoConverterDesc || "Convert between 30+ video formats in your browser.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/video-converter`,
    },
    twitter: { card: "summary_large_image", title: meta?.videoConverterTitle, description: meta?.videoConverterDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/video-converter`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const tools = [
  { name: "Video Format Converter", description: "Convert between MP4, WebM, AVI, MOV, MKV, WMV, FLV and more", icon: Film, href: "video-converter", color: "from-violet-500 to-purple-500", popular: true },
  { name: "Video Trimmer", description: "Cut and trim video clips to any length", icon: Scissors, href: "tools/video-trimmer", color: "from-blue-500 to-cyan-500", popular: true },
  { name: "Video Compressor", description: "Reduce video file size without quality loss", icon: Minimize2, href: "tools/video-compressor", color: "from-rose-500 to-pink-500" },
  { name: "Audio Extractor", description: "Extract audio from video as MP3, WAV, AAC", icon: Volume2, href: "tools/audio-extractor", color: "from-amber-500 to-orange-500" },
  { name: "Video Rotator", description: "Rotate video 90°, 180°, 270°", icon: RotateCw, href: "tools/video-rotator", color: "from-teal-500 to-emerald-500" },
  { name: "GIF Creator", description: "Convert video clips to animated GIF", icon: Sparkles, href: "tools/gif-creator", color: "from-fuchsia-500 to-violet-500", isNew: true },
  { name: "Batch Video Converter", description: "Convert multiple videos simultaneously", icon: Layers, href: "tools/batch-video", color: "from-cyan-500 to-teal-500" },
  { name: "Video Cropper", description: "Crop the frame of a video to remove unwanted borders", icon: Crop, href: "tools/video-cropper", color: "from-emerald-500 to-green-600" },
  { name: "Add Subtitle", description: "Add SRT subtitles or text captions to your video", icon: Subtitles, href: "tools/add-subtitle", color: "from-indigo-500 to-blue-500", isNew: true },
  { name: "Reverse Video", description: "Play any video clip in reverse", icon: Rewind, href: "tools/reverse-video", color: "from-pink-500 to-rose-500" },
];

const popularConversions = [
  { from: "MP4", to: "WEBM" },
  { from: "MOV", to: "MP4" },
  { from: "AVI", to: "MP4" },
  { from: "MKV", to: "MP4" },
  { from: "MP4", to: "GIF" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleVideoConverterPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-violet-100 text-violet-700 border-violet-200">
              Video Converter
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Convert Any Video Format
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              MP4, WebM, AVI, MOV, MKV and 30+ more formats. Drop your video and convert instantly — no uploads needed.
            </p>
          </div>

          <UniversalDropzone mode="video" allowedTypes={['video/*']} />

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-violet-500" />
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
                <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm">
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-violet-700">.{conv.from}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-violet-700">.{conv.to}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">All Video Tools</h2>
            <p className="text-slate-500">Convert, trim, compress, and extract — everything for your video files.</p>
            {/* Mobile-only infeed banner */}
            <div className="md:hidden flex justify-center mt-6" data-testid="ad-video-tools-mobile">
              {/* <!-- REKLAM KODU BURAYA GELECEK --> */}
              <AdSlot adUnit="video_tools_mobile-336x280" width={336} height={280} />
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
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 border-none hover:bg-violet-100">Popular</Badge>
                          )}
                          {"isNew" in tool && tool.isNew && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-none hover:bg-blue-100">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-violet-600 font-medium text-xs mt-3 group-hover:translate-x-1 transition-transform">
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
