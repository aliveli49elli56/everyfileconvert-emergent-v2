import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Presentation Converter — Convert PPTX, ODP, PDF & More",
    description: "Free online presentation converter. Convert PowerPoint, ODP, PDF, KEY and more presentation formats instantly.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/presentation-converter` },
    openGraph: {
      title: "Free Presentation Converter — No Upload Required",
      description: "Convert PowerPoint PPTX, ODP, PDF, KEY and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function PresentationConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="presentation"
      locale={params.locale}
      heroTitle="Presentation Converter"
      heroDesc="Convert PowerPoint, ODP, PDF, KEY and more presentation formats. No PowerPoint needed — works entirely in your browser."
      faqs={[
        { q: "Can I convert PPTX to PDF?", a: "Yes — upload your PowerPoint file and select PDF. Slides are converted with layout preserved." },
        { q: "What presentation formats are supported?", a: "We support PPTX, PPT, ODP, KEY, PDF and more." },
        { q: "Will transitions and animations be preserved?", a: "Static conversions (to PDF) preserve layout. Animated exports require format-to-format conversions." },
      ]}
    />
  );
}
