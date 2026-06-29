import type { Metadata } from "next";
import Link from "next/link";
import EbookConverterClient from "@/components/EbookConverterClient";
import { BookOpen } from "lucide-react";
import { locales, getHreflangLinks } from "@/lib/i18n/config";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const hreflangs = getHreflangLinks('/ebook-converter');
  return {
    title: "Free Online Ebook Converter | EveryFileConvert",
    description:
      "Convert EPUB, MOBI, AZW3, FB2, PDF to any ebook format instantly in your browser — free, private, no account needed.",
    keywords: "ebook converter, epub to mobi, mobi to epub, epub to pdf, pdf to epub, free ebook converter",
    robots: { index: true, follow: true },
    openGraph: {
      title: "Free Online Ebook Converter | EveryFileConvert",
      description: "Convert EPUB, MOBI, AZW3, FB2, PDF to any ebook format instantly in your browser.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/ebook-converter`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Free Online Ebook Converter | EveryFileConvert",
      description: "Convert EPUB, MOBI, AZW3, FB2, PDF to any ebook format — free, private, no account needed.",
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/ebook-converter`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

const EBOOK_FORMATS = ["EPUB", "MOBI", "AZW3", "FB2", "TXT", "PDF"];

const POPULAR_CONVERSIONS = [
  { from: "PDF",  to: "EPUB" },
  { from: "EPUB", to: "MOBI" },
  { from: "MOBI", to: "EPUB" },
  { from: "EPUB", to: "PDF"  },
  { from: "AZW3", to: "EPUB" },
  { from: "FB2",  to: "EPUB" },
  { from: "PDF",  to: "MOBI" },
  { from: "EPUB", to: "AZW3" },
  { from: "MOBI", to: "PDF"  },
  { from: "EPUB", to: "TXT"  },
];

export default async function EbookConverterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialFrom = typeof sp.from === 'string' ? sp.from.toLowerCase() : undefined;
  const initialTo   = typeof sp.to   === 'string' ? sp.to.toLowerCase()   : undefined;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://everyfileconvert.com/${locale}` },
      { "@type": "ListItem", "position": 2, "name": "Ebook Converter", "item": `https://everyfileconvert.com/${locale}/ebook-converter` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Hero */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <BookOpen className="h-3.5 w-3.5" />
          E-Book Converter
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">Free E-Book Converter</h1>
        <p className="text-base text-slate-500">
          Convert between EPUB, MOBI, AZW3, FB2, TXT &amp; PDF — 100% in your browser
        </p>
      </div>

      {/* Supported formats */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {EBOOK_FORMATS.map((f) => (
          <span key={f}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
            {f}
          </span>
        ))}
      </div>

      {/* Converter — client component */}
      <EbookConverterClient initialFrom={initialFrom} initialTo={initialTo} />

      {/* Popular conversions */}
      <section className="mt-12">
        <h2 className="mb-4 text-base font-bold text-slate-700">Popular E-Book Conversions</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {POPULAR_CONVERSIONS.map(({ from, to }) => (
            <Link
              key={`${from}-${to}`}
              href={`/${locale}/ebook-converter?from=${from.toLowerCase()}&to=${to.toLowerCase()}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all"
            >
              <span>{from}</span>
              <span className="text-slate-300">→</span>
              <span>{to}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
