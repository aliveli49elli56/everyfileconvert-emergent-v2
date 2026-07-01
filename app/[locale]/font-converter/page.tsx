import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Font Converter — Convert TTF, OTF, WOFF, WOFF2, EOT & More",
    description: "Free online font converter. Convert TTF, OTF, WOFF, WOFF2, EOT and more font formats instantly in your browser.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/font-converter` },
    openGraph: {
      title: "Free Font Converter — No Upload Required",
      description: "Convert TTF, OTF, WOFF, WOFF2, EOT and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function FontConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="font"
      locale={params.locale}
      heroTitle="Font Converter"
      heroDesc="Convert TTF, OTF, WOFF, WOFF2, EOT and more font formats instantly. Perfect for web developers needing cross-browser compatible fonts."
      faqs={[
        { q: "Can I convert TTF to WOFF2?", a: "Yes — upload your TTF file and select WOFF2. WOFF2 is the modern web font format with the best compression." },
        { q: "What font formats are supported?", a: "We support TTF, OTF, WOFF, WOFF2, EOT, SVG fonts and more." },
        { q: "Will the font glyphs be preserved?", a: "Yes — all glyph data is preserved during font format conversion." },
      ]}
    />
  );
}
