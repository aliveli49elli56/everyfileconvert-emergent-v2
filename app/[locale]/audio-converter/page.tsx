import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Music,
  Scissors,
  Minimize2,
  Volume2,
  Merge,
  Mic2,
  AudioWaveform,
  Shield,
  Zap,
  Lock,
  GaugeCircle,
  Music4,
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
  const hreflangs = getHreflangLinks("/audio-converter");

  return {
    title: meta?.audioConverterTitle || "Free Online Audio Converter | EveryFileConvert",
    description: meta?.audioConverterDesc || "Convert MP3, WAV, FLAC, AAC, OGG and 20+ audio formats online. 100% private, no upload required.",
    keywords: "audio converter online, mp3 converter, wav converter, flac to mp3, free audio converter",
    openGraph: {
      title: meta?.audioConverterTitle || "Free Online Audio Converter",
      description: meta?.audioConverterDesc || "Convert between 20+ audio formats in your browser.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/audio-converter`,
    },
    twitter: { card: "summary_large_image", title: meta?.audioConverterTitle, description: meta?.audioConverterDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/audio-converter`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const tools = [
  { name: "Audio Format Converter", description: "Convert between MP3, WAV, FLAC, AAC, OGG, M4A, WMA, AIFF", icon: Music, href: "audio-converter", color: "from-rose-500 to-pink-500", popular: true },
  { name: "Audio Trimmer", description: "Cut audio to specific start and end times", icon: Scissors, href: "tools/audio-trimmer", color: "from-orange-500 to-red-500" },
  { name: "Audio Compressor", description: "Reduce file size by adjusting bitrate", icon: Minimize2, href: "tools/audio-compressor", color: "from-amber-500 to-yellow-500" },
  { name: "Volume Normalizer", description: "Normalize audio volume to standard levels", icon: Volume2, href: "tools/volume-normalizer", color: "from-emerald-500 to-green-500" },
  { name: "Audio Merger", description: "Combine multiple audio tracks into one", icon: Merge, href: "tools/audio-merger", color: "from-blue-500 to-cyan-500", popular: true },
  { name: "Audio Recorder", description: "Record audio directly in your browser", icon: Mic2, href: "tools/audio-recorder", color: "from-indigo-500 to-blue-500" },
  { name: "Waveform Visualizer", description: "Visualize your audio as a waveform", icon: AudioWaveform, href: "tools/waveform", color: "from-violet-500 to-purple-500", isNew: true },
  { name: "Change Audio Speed", description: "Speed up or slow down audio without pitch change", icon: GaugeCircle, href: "tools/audio-speed-changer", color: "from-cyan-500 to-teal-500" },
  { name: "Audio Pitch Changer", description: "Raise or lower audio pitch without affecting speed", icon: Music4, href: "tools/audio-pitch-changer", color: "from-pink-500 to-rose-500", isNew: true },
];

const popularConversions = [
  { from: "MP3", to: "WAV" },
  { from: "WAV", to: "MP3" },
  { from: "FLAC", to: "MP3" },
  { from: "M4A", to: "MP3" },
  { from: "OGG", to: "MP3" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleAudioConverterPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-rose-100 text-rose-700 border-rose-200">
              Audio Converter
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Convert Any Audio Format
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              MP3, WAV, FLAC, AAC, OGG, M4A and 20+ more formats. Drop your audio file and convert instantly — no uploads needed.
            </p>
          </div>

          <UniversalDropzone mode="audio" allowedTypes={['audio/*']} />

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-rose-500" />
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
                <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm">
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-rose-700">.{conv.from}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-rose-700">.{conv.to}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">All Audio Tools</h2>
            <p className="text-slate-500">Convert, trim, merge, and enhance — everything for your audio files.</p>
            {/* Mobile-only infeed banner */}
            <div className="md:hidden flex justify-center mt-6" data-testid="ad-audio-tools-mobile">
              {/* <!-- REKLAM KODU BURAYA GELECEK --> */}
              <AdSlot adUnit="audio_tools_mobile-336x280" width={336} height={280} />
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
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-rose-100 text-rose-700 border-none hover:bg-rose-100">Popular</Badge>
                          )}
                          {"isNew" in tool && tool.isNew && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-none hover:bg-blue-100">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-rose-600 font-medium text-xs mt-3 group-hover:translate-x-1 transition-transform">
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
