import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import UniversalToolPageClient from "@/components/UniversalToolPageClient";
import { getConversionPageData, getAllConversionSlugs } from "@/lib/engine/dynamic-tool-page-data";
import { conversionRegistry } from "@/lib/registry/conversion-registry";

export const dynamicParams = true;

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

// Generate static params for all conversion slugs
export async function generateStaticParams() {
  const slugs = getAllConversionSlugs();
  return slugs.map(slug => ({ slug: slug.split('/') }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const slugString = Array.isArray(slug) ? slug.join('/') : slug;

  const pageData = getConversionPageData(slugString);
  if (!pageData) return {};

  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;

  const IN = pageData.parsedConversion?.inputFormat.toUpperCase() || '';
  const OUT = pageData.parsedConversion?.outputFormat?.toUpperCase() || null;

  const hreflangs = getHreflangLinks(`/${slugString}`);

  let title: string;
  let description: string;

  if (pageData.parsedConversion?.isSingleFormat) {
    title = pageData.title;
    description = pageData.description;
  } else {
    title = pageData.title;
    description = pageData.description;
  }

  return {
    title,
    description,
    keywords: pageData.keywords.join(', '),
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://everyfileconvert.com/${locale}/${slugString}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/${slugString}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function DynamicToolPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugString = Array.isArray(slug) ? slug.join('/') : slug;

  const pageData = getConversionPageData(slugString);

  if (!pageData || !pageData.parsedConversion) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  // Build JSON-LD structured data
  const IN = pageData.parsedConversion.inputFormat.toUpperCase();
  const OUT = pageData.parsedConversion.outputFormat?.toUpperCase() || null;

  const jsonLd = pageData.parsedConversion.isSingleFormat
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://everyfileconvert.com/${locale}` },
              { "@type": "ListItem", "position": 2, "name": `${IN} Converter`, "item": `https://everyfileconvert.com/${locale}/${slugString}` },
            ],
          },
          {
            "@type": "WebPage",
            "@id": `https://everyfileconvert.com/${locale}/${slugString}`,
            url: `https://everyfileconvert.com/${locale}/${slugString}`,
            name: `${IN} Converter - Convert to Multiple Formats Online`,
            inLanguage: locale,
          },
          {
            "@type": "SoftwareApplication",
            name: `${IN} Converter`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web Browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: `https://everyfileconvert.com/${locale}/${slugString}`,
          },
          {
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `How do I convert ${IN} files online?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Upload your ${IN} file using the drop zone. Choose your target format and the file converts instantly in your browser. Files are processed locally — no uploads to any server.`,
                },
              },
              {
                "@type": "Question",
                name: `Is converting ${IN} files online safe?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Completely. Our converter runs 100% in your browser, so your ${IN} file never leaves your device or touches any external server. We do not store, access, or transmit your files.`,
                },
              },
              {
                "@type": "Question",
                name: `What is the maximum file size for ${IN} conversion?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Desktop: up to 500 MB. Mobile: up to 200 MB. All processing happens locally in your browser — your files are never uploaded to any server.`,
                },
              },
            ],
          },
        ],
      }
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://everyfileconvert.com/${locale}` },
              { "@type": "ListItem", "position": 2, "name": `${IN} to ${OUT} Converter`, "item": `https://everyfileconvert.com/${locale}/${slugString}` },
            ],
          },
          {
            "@type": "WebPage",
            "@id": `https://everyfileconvert.com/${locale}/${slugString}`,
            url: `https://everyfileconvert.com/${locale}/${slugString}`,
            name: `Convert ${IN} to ${OUT} Online - Free & Secure`,
            inLanguage: locale,
          },
          {
            "@type": "SoftwareApplication",
            name: `${IN} to ${OUT} Online Converter`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web Browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: `https://everyfileconvert.com/${locale}/${slugString}`,
          },
          {
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `How do I convert ${IN} to ${OUT} online for free?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Upload your ${IN} file, and it will automatically convert to ${OUT} format. Files are processed locally in your browser — no account, no software, and no cost. Click Download to save your ${OUT} file.`,
                },
              },
              {
                "@type": "Question",
                name: `Is converting ${IN} to ${OUT} online safe and private?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Completely. Our converter runs 100% in your browser, so your ${IN} file never leaves your device or touches any external server. We do not store, access, or transmit your files at any point.`,
                },
              },
              {
                "@type": "Question",
                name: `What is the maximum file size for ${IN} to ${OUT} conversion?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Desktop: up to 500 MB. Mobile: up to 200 MB. All processing happens locally in your browser — your files are never uploaded to any server.`,
                },
              },
            ],
          },
        ],
      };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UniversalToolPageClient
        pageData={pageData}
        slug={slugString}
        locale={locale as Locale}
        dict={dict}
      />
    </>
  );
}
