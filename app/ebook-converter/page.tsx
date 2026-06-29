import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Shield, Zap, Lock } from "lucide-react";
import UniversalDropzone from "@/components/UniversalDropzone";
import LeaderboardAd from "@/components/ads/leaderboard-ad";

export const metadata: Metadata = {
  title:
    "Free Online E-Book Converter — EPUB, MOBI, AZW3, PDF | EveryFileConvert",
  description:
    "Convert eBooks Online for free. Transform EPUB, MOBI, AZW3 to PDF, TXT, HTML and more directly in your browser. 100% private — files never leave your device.",
  keywords:
    "ebook converter online, epub to pdf online, mobi to epub online, azw3 converter online, kindle converter online, free ebook converter",
  openGraph: {
    title: "Free Online E-Book Converter — EPUB, MOBI, AZW3, PDF",
    description:
      "Convert eBooks Online for free. Transform EPUB, MOBI, AZW3 to PDF, TXT, HTML and more directly in your browser.",
    type: "website",
    url: "https://everyfileconvert.com/ebook-converter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online E-Book Converter",
    description: "Convert EPUB, MOBI, AZW3 to PDF Online — 100% private.",
  },
  alternates: {
    canonical: "https://everyfileconvert.com/ebook-converter",
    languages: {
      "en": "https://everyfileconvert.com/ebook-converter",
      "tr": "https://everyfileconvert.com/ebook-converter",
      "de": "https://everyfileconvert.com/ebook-converter",
      "fr": "https://everyfileconvert.com/ebook-converter",
      "es": "https://everyfileconvert.com/ebook-converter",
      "pt": "https://everyfileconvert.com/ebook-converter",
      "it": "https://everyfileconvert.com/ebook-converter",
      "nl": "https://everyfileconvert.com/ebook-converter",
      "pl": "https://everyfileconvert.com/ebook-converter",
      "ja": "https://everyfileconvert.com/ebook-converter",
      "zh": "https://everyfileconvert.com/ebook-converter",
      "ko": "https://everyfileconvert.com/ebook-converter",
      "ar": "https://everyfileconvert.com/ebook-converter",
      "ru": "https://everyfileconvert.com/ebook-converter",
      "x-default": "https://everyfileconvert.com/ebook-converter",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://everyfileconvert.com/ebook-converter",
      url: "https://everyfileconvert.com/ebook-converter",
      name: "Free Online E-Book Converter — EPUB, MOBI, AZW3, PDF",
      description:
        "Convert eBooks Online for free. Transform EPUB, MOBI, AZW3 to PDF, TXT, HTML and more directly in your browser.",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://everyfileconvert.com/#website",
        url: "https://everyfileconvert.com",
        name: "EveryFileConvert",
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://everyfileconvert.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "E-Book Converter",
            item: "https://everyfileconvert.com/ebook-converter",
          },
        ],
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Online E-Book Converter",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web Browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Convert EPUB, MOBI, AZW3 eBooks to PDF, TXT, HTML Online for free. No installation, works in any modern browser.",
      url: "https://everyfileconvert.com/ebook-converter",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is this eBook converter free to use Online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. There are no usage limits, no account required, and all conversion happens directly in your browser.",
          },
        },
        {
          "@type": "Question",
          name: "Are my eBook files safe when converting Online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. All conversions happen 100% client-side in your browser. Your files never leave your device or get uploaded to any server.",
          },
        },
        {
          "@type": "Question",
          name: "What file size is supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Desktop users can convert files up to 500 MB. Mobile users have a 200 MB limit to ensure smooth performance on mobile browsers.",
          },
        },
      ],
    },
  ],
};

const popularConversions = [
  { from: "epub", to: "pdf", label: "EPUB to PDF" },
  { from: "epub", to: "mobi", label: "EPUB to MOBI" },
  { from: "mobi", to: "epub", label: "MOBI to EPUB" },
  { from: "azw3", to: "epub", label: "AZW3 to EPUB" },
  { from: "epub", to: "txt", label: "EPUB to TXT" },
  { from: "txt", to: "epub", label: "TXT to EPUB" },
];

const features = [
  {
    icon: Shield,
    title: "100% Private",
    description: "Your eBooks never leave your device. All conversion happens locally in your browser.",
  },
  {
    icon: Zap,
    title: "Instant Online",
    description: "No upload delays. Convert eBooks instantly using browser-native WebAssembly technology.",
  },
  {
    icon: Lock,
    title: "No Account Needed",
    description: "Start converting right away. No registration, no email, no subscription required.",
  },
];

export default function EbookConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        {/* Hero */}
        <section className="py-14 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <Badge
                variant="secondary"
                className="mb-4 px-3 py-1 bg-amber-100 text-amber-700 border-amber-200"
              >
                E-Book Tools
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                Online E-Book Converter
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Convert EPUB, MOBI, AZW3 and more Online — free, instant, and
                100% private. Files never leave your browser.
              </p>
            </div>

            {/* Converter card */}
            <div className="max-w-2xl mx-auto">
              <UniversalDropzone mode="all" allowedTypes={['.epub', '.mobi', '.azw3', '.pdf', '.txt', '.html']} />
            </div>
          </div>
        </section>

        {/* Popular conversions */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Popular Online E-Book Conversions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {popularConversions.map((conv) => (
                <Link
                  key={`${conv.from}-${conv.to}`}
                  href={`/${conv.from}-to-${conv.to}`}
                >
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md transition-all text-center group">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 font-mono uppercase border-amber-200 text-amber-700"
                      >
                        {conv.from}
                      </Badge>
                      <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 font-mono uppercase border-amber-200 text-amber-700"
                      >
                        {conv.to}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 group-hover:text-amber-700 font-medium">
                      {conv.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-14 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="text-center p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 mb-4">
                    <f.icon className="h-7 w-7 text-amber-600" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formats grid */}
        <section className="py-14 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
              Supported eBook Formats Online
            </h2>
            <p className="text-slate-600 text-center mb-8 max-w-xl mx-auto">
              All conversions run directly in your browser — no software to
              install.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-3xl mx-auto">
              {["EPUB", "MOBI", "AZW3", "PDF", "TXT", "HTML"].map((fmt) => (
                <div
                  key={fmt}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-center hover:border-amber-300 hover:bg-amber-50 transition-all"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    .{fmt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard ad */}
        <div className="mt-12 mb-12 min-h-[250px] flex items-start justify-center bg-slate-50">
          <LeaderboardAd />
        </div>
      </div>
    </>
  );
}
