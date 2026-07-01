/**
 * app/[locale]/pricing/page.tsx
 *
 * Phase 6C-2 — Pricing Page (Server Component)
 *
 * Renders the full pricing page with plan cards and feature comparison.
 * All prices, limits, and features come from subscription-config.ts.
 *
 * To change ANY pricing detail: edit lib/config/subscription-config.ts only.
 * No UI code changes required.
 *
 * Coming Soon mode: PREMIUM_ENABLED = false in subscription-config.ts.
 * Activate purchasing: set PREMIUM_ENABLED = true — no code change needed.
 */

import type { Metadata } from "next";
import { locales, getHreflangLinks } from "@/lib/i18n/config";
import { PricingPageClient } from "@/components/pricing/PricingPageClient";
import { FEATURE_FLAGS } from "@/lib/config/subscription-config";

// ---------------------------------------------------------------------------
// STATIC PARAMS (pre-render for all locales)
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
  const hreflangs = getHreflangLinks("/pricing");

  return {
    title: "Pricing — EveryFileConvert",
    description:
      "Simple, transparent pricing for EveryFileConvert. Start free with browser-based conversions. Upgrade for server processing, larger files, and advanced features.",
    robots: {
      index:  FEATURE_FLAGS.SHOW_PRICING_PAGE,
      follow: FEATURE_FLAGS.SHOW_PRICING_PAGE,
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/pricing`,
      languages: Object.fromEntries(
        hreflangs.map(({ locale: l, href }) => [l, href])
      ),
    },
    openGraph: {
      title: "Pricing — EveryFileConvert",
      description:
        "Start free. Upgrade when you need more. All plans include our full format library.",
      type: "website",
      url: `https://everyfileconvert.com/${locale}/pricing`,
    },
  };
}

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

export default function PricingPage() {
  return <PricingPageClient />;
}
