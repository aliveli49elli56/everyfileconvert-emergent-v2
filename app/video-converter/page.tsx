"use client";

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
} from "lucide-react";
import UniversalDropzone from "@/components/UniversalDropzone";

const tools = [
  {
    name: "Video Format Converter",
    description: "Convert between MP4, WebM, AVI, MOV, MKV, WMV, FLV and more",
    icon: Film,
    href: "/video-converter",
    color: "from-violet-500 to-purple-500",
    popular: true,
  },
  {
    name: "Video Trimmer",
    description: "Cut and trim video clips to any length",
    icon: Scissors,
    href: "/tools/video-trimmer",
    color: "from-blue-500 to-cyan-500",
    popular: true,
  },
  {
    name: "Video Compressor",
    description: "Reduce video file size without quality loss",
    icon: Minimize2,
    href: "/tools/video-compressor",
    color: "from-rose-500 to-pink-500",
  },
  {
    name: "Audio Extractor",
    description: "Extract audio from video as MP3, WAV, AAC",
    icon: Volume2,
    href: "/tools/audio-extractor",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Video Rotator",
    description: "Rotate videos 90, 180, or 270 degrees",
    icon: RotateCw,
    href: "/tools/video-rotator",
    color: "from-cyan-500 to-teal-500",
  },
  {
    name: "GIF Maker",
    description: "Convert video clips to animated GIFs",
    icon: Sparkles,
    href: "/tools/gif-maker",
    color: "from-emerald-500 to-green-500",
  },
  {
    name: "Video Merger",
    description: "Combine multiple videos into one",
    icon: Layers,
    href: "/tools/video-merger",
    color: "from-indigo-500 to-slate-500",
  },
];

const popularConversions = [
  { from: "MP4", to: "WEBM", count: "1.5M" },
  { from: "MOV", to: "MP4", count: "1.2M" },
  { from: "AVI", to: "MP4", count: "890K" },
  { from: "MKV", to: "MP4", count: "750K" },
  { from: "MP4", to: "GIF", count: "620K" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default function VideoConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Hero + Selection Hub ── */}
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge
              variant="secondary"
              className="mb-4 px-3 py-1 bg-violet-100 text-violet-700 border-violet-200"
            >
              Video Converter
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Convert Any Video Format
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              MP4, WebM, AVI, MOV, MKV and more. Select your formats and drop
              your file — instant in-browser conversion.
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

      {/* ── Popular Conversions ── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold text-slate-700 text-center mb-6">
            Popular Conversions
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {popularConversions.map((conv) => (
              <Link
                key={`${conv.from}-${conv.to}`}
                href={`/${conv.from.toLowerCase()}-to-${conv.to.toLowerCase()}`}
              >
                <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm">
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-violet-700">
                    .{conv.from}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-violet-700">
                    .{conv.to}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">{conv.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              All Video Tools
            </h2>
            <p className="text-slate-500">
              Trim, compress, extract audio, create GIFs and more.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {tools.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-slate-200 bg-white group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}
                      >
                        <tool.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                            {tool.name}
                          </h3>
                          {tool.popular && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 border-none hover:bg-violet-100">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-violet-600 font-medium text-xs mt-3 group-hover:translate-x-1 transition-transform">
                      Open Tool
                      <ArrowRight className="ml-1 h-3 w-3" />
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
