import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const hreflangs = getHreflangLinks("");

  return {
    title: meta?.homeTitle,
    description: meta?.homeDesc,
    robots: { index: true, follow: true },
    openGraph: {
      url: `https://everyfileconvert.com/${locale}`,
      images: [{
        url: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200',
        width: 1200,
        height: 630,
        alt: 'EveryFileConvert - Free Online File Converter',
      }],
    },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function LocaleHome({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EveryFileConvert",
    "url": "https://everyfileconvert.com",
    "description": "Free online file converter — convert video, audio, image and document files directly in your browser",
    "inLanguage": locale,
    "potentialAction": [{
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://everyfileconvert.com/${locale}/{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <HomeClient dict={dict} locale={locale as Locale} />
    </>
  );
}
