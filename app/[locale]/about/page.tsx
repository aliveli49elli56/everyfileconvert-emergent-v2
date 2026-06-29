import type { Metadata } from "next";
import { Shield, Zap, Globe, Lock, Cpu, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - EveryFileConvert",
  description:
    "Learn about EveryFileConvert — the 100% free, browser-based file converter that never uploads your files to any server.",
};

const pillars = [
  {
    icon: Lock,
    title: "Privacy by Design",
    description:
      "Every conversion runs entirely inside your browser. Your files never leave your device — no uploads, no logs, no history.",
  },
  {
    icon: Cpu,
    title: "Powered by WebAssembly",
    description:
      "We use cutting-edge WebAssembly runtimes (FFmpeg.wasm, LibreOffice WASM, and more) to bring desktop-grade conversion power online.",
  },
  {
    icon: Zap,
    title: "Instant & Free",
    description:
      "No account required. No file size caps imposed by a server queue. Start converting immediately at no cost, ever.",
  },
  {
    icon: Globe,
    title: "Available Everywhere",
    description:
      "EveryFileConvert works on any modern browser on any device — desktop, tablet, or mobile — in 18+ languages.",
  },
  {
    icon: Shield,
    title: "Zero Data Risk",
    description:
      "Because processing is entirely client-side, there is nothing to breach, leak, or misuse. Your sensitive documents stay yours.",
  },
  {
    icon: Heart,
    title: "Built for Everyone",
    description:
      "Whether you are a student, professional, or creator, our tools are designed to be intuitive and accessible to all skill levels.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            100% Browser-Based
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Convert Files Without <br className="hidden md:block" />
            <span className="text-cyan-400">Giving Up Your Privacy</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            EveryFileConvert is a free, online file conversion platform built on a simple promise: your files stay on
            your device. Always. No exceptions.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-400 leading-relaxed mb-4">
            The file conversion landscape has long been dominated by services that require you to upload your
            documents, images, videos, and audio files to remote servers — creating unnecessary privacy risks and
            dependency on third-party infrastructure. We built EveryFileConvert to change that.
          </p>
          <p className="text-slate-400 leading-relaxed mb-4">
            Using modern browser technologies like <strong className="text-slate-200">WebAssembly</strong>,{" "}
            <strong className="text-slate-200">Web Workers</strong>, and{" "}
            <strong className="text-slate-200">the File System Access API</strong>, EveryFileConvert brings
            powerful conversion capabilities directly into your browser. The result is a tool that is simultaneously
            faster, safer, and more respectful of your data than any server-based alternative.
          </p>
          <p className="text-slate-400 leading-relaxed">
            We support conversions across video, audio, image, document, PDF, and e-book formats — all processed
            in-browser, all completely free, with no account or sign-up required.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">Why EveryFileConvert?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 mb-4">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-2xl font-bold text-white mb-4">The Technology</h2>
        <p className="text-slate-400 leading-relaxed mb-4">
          Our platform is built on a stack of proven open-source WebAssembly libraries compiled to run natively in
          the browser. When you select a file and choose an output format, the conversion engine — whether it is
          FFmpeg for video and audio, Sharp or a Canvas API pipeline for images, or a document engine for PDFs —
          executes directly on your CPU, sandboxed inside the browser tab.
        </p>
        <p className="text-slate-400 leading-relaxed mb-4">
          This architecture means conversion speed scales with your device hardware rather than a shared server
          queue. A powerful desktop machine will process a 1 GB video file faster than a basic server; your files
          are never waiting in line behind other users.
        </p>
        <p className="text-slate-400 leading-relaxed">
          Because every operation is in-browser, EveryFileConvert works even in low-connectivity environments and
          delivers results instantly — no waiting for file uploads, no waiting for server processing, no waiting for
          download links.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-slate-900/50 to-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Convert?</h2>
          <p className="text-slate-400 mb-8">
            No sign-up. No payment. No uploads. Just fast, private, browser-based file conversion.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            Start Converting for Free
          </a>
        </div>
      </section>
    </main>
  );
}
