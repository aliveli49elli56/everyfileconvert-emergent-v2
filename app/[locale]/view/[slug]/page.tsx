import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import AdSlot from "@/components/ads/ad-slot";
import FileViewer from "@/components/viewer/FileViewer";
import ViewHistory from "@/components/viewer/ViewHistory";
import { getViewerPageData, getAllViewerSlugs } from "@/lib/engine/dynamic-tool-page-data";
import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = getAllViewerSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageData = getViewerPageData(slug);
  if (!pageData) return { title: "Viewer Not Found", robots: { index: false, follow: false } };

  const ext = slug.toUpperCase();
  const inputName = pageData.parsedConversion?.inputName || `${ext} File`;
  const hreflangs = getHreflangLinks(`/view/${slug}`);
  const title = `Free Online ${ext} Viewer — Open ${inputName} Instantly | EveryFileConvert`;
  const description = `Open and view ${inputName} files directly in your browser. No installation, no account needed. 100% private — your files never leave your device.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    keywords: [`${ext} viewer`, `open ${ext} online`, `view ${ext} file`, `${ext} reader online`, `free ${ext} viewer`],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://everyfileconvert.com/${locale}/view/${slug}`,
      siteName: "EveryFileConvert",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/view/${slug}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function ViewerSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pageData = getViewerPageData(slug);
  if (!pageData) notFound();

  const { category, categoryLabel, breadcrumbs, relatedTools } = pageData;
  const ext = slug.toUpperCase();
  const inputName = pageData.parsedConversion?.inputName || `${ext} File`;

  const dict = await getDictionary(locale as Locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": crumb.label,
          ...(crumb.href ? { "item": `https://everyfileconvert.com${crumb.href}` } : {}),
        })),
      },
      {
        "@type": "WebPage",
        "@id": `https://everyfileconvert.com/${locale}/view/${slug}`,
        "url": `https://everyfileconvert.com/${locale}/view/${slug}`,
        "name": `Free Online ${ext} Viewer`,
        "inLanguage": locale,
        "breadcrumb": { "@id": `https://everyfileconvert.com/${locale}/view/${slug}#breadcrumb` },
      },
      {
        "@type": "HowTo",
        "name": `How to view ${ext} files online`,
        "description": `Step-by-step instructions to open and view ${inputName} files directly in your browser.`,
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Drop your file", "text": `Drag & drop your .${slug} file into the zone, or click to browse.` },
          { "@type": "HowToStep", "position": 2, "name": "Instant open", "text": "Your file opens instantly — no upload to any server." },
          { "@type": "HowToStep", "position": 3, "name": "Navigate", "text": "Scroll, zoom, and navigate your document directly in the browser." },
          { "@type": "HowToStep", "position": 4, "name": "Download", "text": "Download the original file anytime using the Download button." },
        ],
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `Is this ${ext} viewer free?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes, completely free. Open any ${ext} file with no limits, no sign-up, and no installation required.`,
            },
          },
          {
            "@type": "Question",
            "name": `Is it safe to open ${ext} files here?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Your ${ext} file is processed entirely inside your browser using client-side JavaScript. It never leaves your device, is never uploaded to a server, and is automatically removed when you close the tab.`,
            },
          },
          {
            "@type": "Question",
            "name": `What is the file size limit?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Up to 50 MB on desktop and 20 MB on mobile. For larger files, use the Convert tool which can process and compress files efficiently.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumb - Dynamic */}
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-blue-600 transition-colors">{crumb.label}</Link>
              ) : (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span>/</span>}
            </span>
          ))}
        </div>

        {/* Header */}
        <div className="mt-12 mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-4">
            <Eye className="h-4 w-4" />
            Free Online {ext} Viewer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Open {ext} Files Instantly
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            View {inputName} files directly in your browser. No installation, no account. 100% private — files never leave your device.
          </p>
        </div>

        {/* Viewer */}
        <div className="my-12">
          <FileViewer locale={locale} presetFormat={slug} />
          <ViewHistory locale={locale} />
        </div>

        {/* Ad */}
        <div className="relative z-0 flex justify-center my-8 py-1" data-testid="ad-drag-menu-under">
          <AdSlot adUnit="drag_menu_under-336x280" width={336} height={280} />
        </div>

        {/* How to use */}
        <div className="mb-12 rounded-2xl bg-white border border-slate-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">How to view {ext} files online</h2>
          <ol className="space-y-3 text-sm text-slate-600">
            {[
              `Drag & drop your .${slug} file into the zone above, or click to browse`,
              "Your file opens instantly — no upload to any server",
              "Scroll, zoom, and navigate your document directly in the browser",
              "Download the original file anytime using the Download button",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* FAQ */}
        <div className="mb-12 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          {[
            [`Is this ${ext} viewer free?`, `Yes, completely free. Open any ${ext} file with no limits, no sign-up, and no installation required.`],
            [`Is it safe to open ${ext} files here?`, `Your ${ext} file is processed entirely inside your browser using client-side JavaScript. It never leaves your device, is never uploaded to a server, and is automatically removed when you close the tab.`],
            [`What is the file size limit?`, `Up to 50 MB on desktop and 20 MB on mobile. For larger files, use our Convert tool which can process and compress files efficiently.`],
          ].map(([q, a]) => (
            <details key={q as string} className="rounded-xl border border-slate-100 bg-white shadow-sm">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-800 hover:text-blue-600">{q}</summary>
              <p className="px-5 pb-4 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>

        {/* Related conversions - Dynamic from Relationship Registry */}
        {relatedTools.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Convert {ext} to Other Formats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {relatedTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${locale}/${tool.slug}`}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                >
                  {tool.shortName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-8 text-center text-white shadow-xl">
          <h3 className="text-xl font-bold mb-2">Need to convert this {ext} file?</h3>
          <p className="text-sm text-blue-100 mb-5">Convert {ext} to PDF, PNG, DOCX, and many more formats.</p>
          <Link
            href={`/${locale}/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-600 shadow hover:bg-blue-50 transition-colors"
          >
            Convert {ext} Files
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
