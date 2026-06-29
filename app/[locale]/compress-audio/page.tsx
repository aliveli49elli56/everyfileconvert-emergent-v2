import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Minimize2,
  Music,
  Sliders,
  Zap,
  Volume2,
  AudioWaveform,
  Shield,
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
  const hreflangs = getHreflangLinks("/compress-audio");

  return {
    title: meta?.compressAudioTitle || "Free Online Audio Compressor | EveryFileConvert",
    description: meta?.compressAudioDesc || "Compress audio files online by reducing bitrate and file size. MP3, AAC, OGG, FLAC supported. 100% private, no uploads.",
    keywords: "audio compressor online, compress mp3, reduce audio file size, lower bitrate, free audio compressor",
    openGraph: {
      title: meta?.compressAudioTitle || "Free Online Audio Compressor",
      description: meta?.compressAudioDesc || "Compress and reduce audio file size online for free.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/compress-audio`,
    },
    twitter: { card: "summary_large_image", title: meta?.compressAudioTitle, description: meta?.compressAudioDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/compress-audio`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const compressionModes = [
  { name: "Smart Compress", description: "Automatically pick the best compression settings for your audio", icon: Minimize2, href: "tools/compress-audio/smart", color: "from-rose-500 to-pink-500", popular: true },
  { name: "Bitrate Reducer", description: "Manually set target bitrate from 32kbps to 320kbps", icon: Sliders, href: "tools/compress-audio/bitrate", color: "from-amber-500 to-orange-500" },
  { name: "MP3 Compressor", description: "Compress MP3 files while preserving audio quality", icon: Music, href: "tools/compress-audio/mp3", color: "from-blue-500 to-cyan-500", popular: true },
  { name: "AAC Compressor", description: "Compress to AAC for maximum efficiency at low bitrates", icon: Zap, href: "tools/compress-audio/aac", color: "from-emerald-500 to-teal-500" },
  { name: "Volume Normalizer", description: "Normalize loudness levels as part of compression", icon: Volume2, href: "tools/compress-audio/normalize", color: "from-violet-500 to-purple-500" },
  { name: "Batch Compress", description: "Compress multiple audio files at once", icon: AudioWaveform, href: "tools/compress-audio/batch", color: "from-cyan-500 to-teal-500", isNew: true },
];

const bitratePresets = [
  { label: "Podcast / Spoken Word", bitrate: "64 kbps", saving: "~80% smaller" },
  { label: "Music Streaming", bitrate: "128 kbps", saving: "~60% smaller" },
  { label: "High-Quality Music", bitrate: "192 kbps", saving: "~40% smaller" },
  { label: "Studio Quality", bitrate: "320 kbps", saving: "~10% smaller" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocaleCompressAudioPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-rose-100 text-rose-700 border-rose-200">
              Audio Tools
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Online Audio Compressor
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Reduce audio file size by adjusting bitrate and encoding settings. Perfect for podcasts, web streaming, and mobile apps — all in your browser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
              {trustFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                  <f.icon className="h-4 w-4 text-rose-500" />
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className="hidden sm:inline text-slate-400">— {f.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {compressionModes.map((mode) => (
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
                            <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700 border-rose-200">Popular</Badge>
                          )}
                          {"isNew" in mode && mode.isNew && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{mode.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-rose-600 font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                      Open Tool <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Bitrate Presets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bitratePresets.map((preset) => (
                <div key={preset.label} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer">
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm">{preset.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{preset.bitrate}</p>
                  </div>
                  <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 shrink-0">{preset.saving}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Ready to Compress?</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">Upload your audio file and reduce its size in seconds</p>
          <Link href={`/${locale}`}>
            <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90">
              Start Compressing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
