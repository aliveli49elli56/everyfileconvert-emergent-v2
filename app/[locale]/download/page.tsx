/**
 * app/[locale]/download/page.tsx
 *
 * Phase 6C-3 — Download Page (Server Component)
 *
 * The central result page for every conversion.
 * Every processor redirects here after completing.
 *
 * URL format: /{locale}/download?jobId={jobId}
 *
 * SEO: noindex (download pages are ephemeral, not for indexing)
 * Hreflang: not needed (ephemeral page)
 * Static params: generated for all 17 locales (empty shell, content is dynamic)
 */

import type { Metadata } from "next";
import { locales } from "@/lib/i18n/config";
import DownloadPageClient from "@/components/download/DownloadPageClient";

// ---------------------------------------------------------------------------
// STATIC PARAMS — pre-render shell for all 17 locales
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ---------------------------------------------------------------------------
// PAGE METADATA
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Download Your Converted File — EveryFileConvert",
    description:
      "Your file conversion is complete. Download your converted file instantly. Free online file converter — no registration required.",
    robots: {
      // Download pages are ephemeral — do not index
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/download`,
    },
    openGraph: {
      title: "Download Your File — EveryFileConvert",
      description: "Your converted file is ready to download.",
      type: "website",
    },
  };
}

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DownloadPageClient locale={locale} />;
}
