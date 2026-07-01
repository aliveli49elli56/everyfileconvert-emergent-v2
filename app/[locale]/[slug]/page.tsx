import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, getHreflangLinks, pickVariant } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import UniversalToolPageClient from "@/components/UniversalToolPageClient";
import UniversalLandingExtras from "@/components/UniversalLandingExtras";
import { getConversionPageData, getAllConversionSlugs } from "@/lib/engine/dynamic-tool-page-data";

export const dynamicParams = true;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate static params for all conversion slugs
export async function generateStaticParams() {
  const slugs = getAllConversionSlugs();
  // Return params for each locale/slug combination
  const locales = ['en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'zh', 'nl', 'pl', 'ko', 'sv', 'da', 'no', 'hu', 'fi'];
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageData = getConversionPageData(slug);
  if (!pageData || !pageData.parsedConversion) return {};

  const dict = await getDictionary(locale as Locale);
  const meta = dict.meta as Record<string, string>;
  const converterTitles = (dict.converters as Record<string, string[]>)?.titles || [];
  const converterFeatures = (dict.converters as Record<string, string[]>)?.features || [];

  const inputUpper = pageData.parsedConversion.inputFormat.toUpperCase();
  const outputUpper = pageData.parsedConversion.outputFormat?.toUpperCase() || null;
  const hreflangs = getHreflangLinks(`/${slug}`);

  if (pageData.parsedConversion.isSingleFormat) {
    const titleTemplate = meta?.singleTitle || "{IN} Converter - Convert to Multiple Formats Online | EveryFileConvert";
    const descTemplate = meta?.singleDesc || "Best online {inputName} converter. 100% private, secure and free.";

    const titleVariant = pickVariant(converterTitles, slug) || "Converter";
    const featureVariant = pickVariant(converterFeatures, slug) || "Free & Online";

    const title = titleTemplate
      .replace("{IN}", inputUpper)
      .replace("{inputName}", pageData.parsedConversion.inputName)
      .replace("{converterTitle}", titleVariant)
      .replace("{feature}", featureVariant);
    const description = descTemplate
      .replace("{IN}", inputUpper)
      .replace("{inputName}", pageData.parsedConversion.inputName);

    return {
      title,
      description,
      keywords: `${inputUpper} converter, convert ${inputUpper}, ${inputUpper} online converter`,
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://everyfileconvert.com/${locale}/${slug}`,
      },
      twitter: { card: "summary_large_image", title, description },
      alternates: {
        canonical: `https://everyfileconvert.com/${locale}/${slug}`,
        languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
      },
    };
  }

  const variant = 0; // Simplified - description variant logic

  const titleVariant = pickVariant(converterTitles, slug) || "Converter";
  const featureVariant = pickVariant(converterFeatures, slug + "f") || "Free & Online";

  const descKey = `conversionDesc${variant + 1}` as keyof typeof meta;
  const descTemplate = meta?.[descKey] || meta?.conversionDesc1 || "Free online {IN} to {OUT} converter.";
  const titleTemplate = meta?.conversionTitle || "Convert {IN} to {OUT} Online - Free & Secure | EveryFileConvert";

  const title = titleTemplate
    .replace(/{IN}/g, inputUpper)
    .replace(/{OUT}/g, outputUpper || "")
    .replace("{converterTitle}", titleVariant)
    .replace("{feature}", featureVariant);

  const description = descTemplate
    .replace(/{IN}/g, inputUpper)
    .replace(/{OUT}/g, outputUpper || "")
    .replace(/{inputName}/g, pageData.parsedConversion.inputName)
    .replace(/{outputName}/g, pageData.parsedConversion.outputName || "");

  return {
    title,
    description,
    keywords: `${inputUpper} to ${outputUpper}, convert ${inputUpper} to ${outputUpper} online, free ${inputUpper} to ${outputUpper} converter`,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://everyfileconvert.com/${locale}/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/${slug}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function ConversionPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const pageData = getConversionPageData(slug);

  if (!pageData || !pageData.parsedConversion) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

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
              { "@type": "ListItem", "position": 2, "name": `${IN} Converter`, "item": `https://everyfileconvert.com/${locale}/${slug}` },
            ],
          },
          {
            "@type": "WebPage",
            "@id": `https://everyfileconvert.com/${locale}/${slug}`,
            url: `https://everyfileconvert.com/${locale}/${slug}`,
            name: `${IN} Converter - Convert to Multiple Formats Online`,
            inLanguage: locale,
            breadcrumb: { "@id": `https://everyfileconvert.com/${locale}/${slug}#breadcrumb` },
          },
          {
            "@type": "SoftwareApplication",
            name: `${IN} Converter`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web Browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: `https://everyfileconvert.com/${locale}/${slug}`,
          },
          {
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q1single || `How do I convert ${IN} files online?`).replace(/{IN}/g, IN).replace(/{inputName}/g, pageData.parsedConversion.inputName),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a1single || `Upload your ${pageData.parsedConversion.inputName} file using the drop zone. Choose your target format and the file converts instantly in your browser.`).replace(/{IN}/g, IN).replace(/{inputName}/g, pageData.parsedConversion.inputName),
                },
              },
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q2single || `Is converting ${IN} files online safe?`).replace(/{IN}/g, IN),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a2single || `Completely. Our converter runs 100% in your browser, so your ${IN} file never leaves your device or touches any external server.`).replace(/{IN}/g, IN),
                },
              },
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q3single || `What is the maximum file size for ${IN} conversion?`).replace(/{IN}/g, IN),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a3single || `Desktop: up to 500 MB. Mobile: up to 200 MB. All processing happens locally in your browser.`).replace(/{IN}/g, IN),
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
              { "@type": "ListItem", "position": 2, "name": `${IN} to ${OUT} Converter`, "item": `https://everyfileconvert.com/${locale}/${slug}` },
            ],
          },
          {
            "@type": "WebPage",
            "@id": `https://everyfileconvert.com/${locale}/${slug}`,
            url: `https://everyfileconvert.com/${locale}/${slug}`,
            name: `Convert ${IN} to ${OUT} Online - Free & Secure`,
            inLanguage: locale,
            breadcrumb: { "@id": `https://everyfileconvert.com/${locale}/${slug}#breadcrumb` },
          },
          {
            "@type": "SoftwareApplication",
            name: `${IN} to ${OUT} Online Converter`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web Browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: `https://everyfileconvert.com/${locale}/${slug}`,
          },
          {
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q1 || `How do I convert ${IN} to ${OUT} online for free?`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || "").replace(/{inputName}/g, pageData.parsedConversion.inputName).replace(/{outputName}/g, pageData.parsedConversion.outputName || ""),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a1 || `Upload your ${pageData.parsedConversion.inputName} file using the drop zone above. Your file is instantly converted to ${pageData.parsedConversion.outputName || OUT} format right inside your browser.`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || "").replace(/{inputName}/g, pageData.parsedConversion.inputName).replace(/{outputName}/g, pageData.parsedConversion.outputName || ""),
                },
              },
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q2 || `Is converting ${IN} to ${OUT} online safe and private?`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a2 || `Completely. Our converter runs 100% in your browser using local processing, so your ${IN} file never leaves your device or touches any external server.`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""),
                },
              },
              {
                "@type": "Question",
                name: ((dict.faq as Record<string, string>)?.q3 || `What is the maximum file size for ${IN} to ${OUT} conversion?`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: ((dict.faq as Record<string, string>)?.a3 || `Desktop: up to 500 MB. Mobile: up to 200 MB. All processing happens locally in your browser — your files are never uploaded to any server.`).replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""),
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
        slug={slug}
        locale={locale as Locale}
        dict={dict}
      />
      <UniversalLandingExtras
        variant="converter"
        locale={locale}
        inputExt={pageData.parsedConversion.inputFormat ?? undefined}
        outputExt={pageData.parsedConversion.outputFormat ?? undefined}
        isSingleFormat={pageData.parsedConversion.isSingleFormat}
        category={pageData.category}
      />
    </>
  );
}
