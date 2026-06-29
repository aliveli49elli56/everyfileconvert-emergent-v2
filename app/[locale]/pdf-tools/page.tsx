import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  FileType,
  Merge,
  Scissors,
  Minimize2,
  Lock,
  Unlock,
  RotateCcw,
  Shield,
  Zap,
  FileOutput,
  FileInput,
  Hash,
  Stamp,
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
  const hreflangs = getHreflangLinks("/pdf-tools");

  return {
    title: meta?.pdfToolsTitle || "Free Online PDF Tools & Document Converter | EveryFileConvert",
    description: meta?.pdfToolsDesc || "Convert, merge, split, compress and protect PDF files online. 100% private, no upload required.",
    keywords: "pdf converter online, pdf to docx, docx to pdf, pdf merger, pdf compressor, free pdf tools",
    openGraph: {
      title: meta?.pdfToolsTitle || "Free Online PDF Tools & Document Converter",
      description: meta?.pdfToolsDesc || "Complete PDF toolkit — convert, merge, split, compress.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/pdf-tools`,
    },
    twitter: { card: "summary_large_image", title: meta?.pdfToolsTitle, description: meta?.pdfToolsDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/pdf-tools`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  return locales.map((locale) => ({ locale }));
}

const tools = [
  { name: "PDF Converter", description: "Convert PDF to DOCX, TXT, HTML, JPG, PNG and vice versa", icon: FileType, href: "pdf-tools", color: "from-amber-500 to-orange-500", popular: true },
  { name: "PDF Merger", description: "Combine multiple PDF files into a single document", icon: Merge, href: "tools/pdf-merger", color: "from-emerald-500 to-green-500", popular: true },
  { name: "PDF Splitter", description: "Split PDF into individual pages or sections", icon: Scissors, href: "tools/pdf-splitter", color: "from-blue-500 to-cyan-500" },
  { name: "PDF Compressor", description: "Reduce PDF file size while maintaining quality", icon: Minimize2, href: "tools/pdf-compressor", color: "from-rose-500 to-pink-500" },
  { name: "PDF Protect", description: "Add password protection to PDF documents", icon: Lock, href: "tools/pdf-protect", color: "from-violet-500 to-purple-500" },
  { name: "PDF Unlock", description: "Remove password from protected PDFs", icon: Unlock, href: "tools/pdf-unlock", color: "from-cyan-500 to-teal-500" },
  { name: "PDF Rotator", description: "Rotate PDF pages 90, 180, or 270 degrees", icon: RotateCcw, href: "tools/pdf-rotator", color: "from-indigo-500 to-blue-500" },
  { name: "PDF to Word", description: "Convert PDF to editable Word (DOCX) documents", icon: FileOutput, href: "tools/pdf-to-word", color: "from-blue-500 to-indigo-500", popular: true },
  { name: "Word to PDF", description: "Convert Word (DOCX/DOC) documents to PDF", icon: FileInput, href: "tools/word-to-pdf", color: "from-amber-500 to-yellow-500" },
  { name: "Add Page Numbers", description: "Add automatic page numbers to any PDF", icon: Hash, href: "tools/pdf-page-numbers", color: "from-teal-500 to-emerald-500", isNew: true },
  { name: "Watermark PDF", description: "Add text or image watermarks to PDF documents", icon: Stamp, href: "tools/pdf-watermark", color: "from-slate-500 to-gray-600" },
];

const popularConversions = [
  { from: "PDF", to: "DOCX" },
  { from: "DOCX", to: "PDF" },
  { from: "JPG", to: "PDF" },
  { from: "PNG", to: "PDF" },
  { from: "PDF", to: "JPG" },
];

const trustFeatures = [
  { icon: Shield, label: "100% Private", desc: "Files never leave your device" },
  { icon: Zap, label: "Instant", desc: "No upload wait time" },
  { icon: Lock, label: "No Account", desc: "No sign-up required" },
];

export default async function LocalePDFToolsPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-amber-100 text-amber-700 border-amber-200">
              PDF & Document Tools
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Convert Any Document Format
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              PDF, DOCX, XLSX, EPUB, HTML and 17+ more formats. Full document toolkit — conversion, merge, split, compress.
            </p>
          </div>

          <UniversalDropzone mode="pdf" allowedTypes={['application/pdf']} />

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {trustFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
                <f.icon className="h-4 w-4 text-amber-500" />
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
                <div className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-amber-300 hover:bg-amber-50 transition-all shadow-sm">
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-amber-700">.{conv.from}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-mono font-semibold text-slate-600 group-hover:text-amber-700">.{conv.to}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">All PDF & Document Tools</h2>
            <p className="text-slate-500">Merge, split, protect, unlock and rotate — complete PDF toolkit.</p>
            {/* Mobile-only infeed banner */}
            <div className="md:hidden flex justify-center mt-6" data-testid="ad-pdf-tools-mobile">
              {/* <!-- REKLAM KODU BURAYA GELECEK --> */}
              <AdSlot adUnit="pdf_tools_mobile-336x280" width={336} height={280} />
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
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-none hover:bg-amber-100">Popular</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-600 font-medium text-xs mt-3 group-hover:translate-x-1 transition-transform">
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
