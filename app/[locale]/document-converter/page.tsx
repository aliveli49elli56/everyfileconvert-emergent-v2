import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Document Converter — Convert DOCX, PDF, TXT, ODT & More",
    description: "Free online document converter. Convert Word, PDF, TXT, HTML, ODT, RTF and 50+ document formats instantly in your browser.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/document-converter` },
    openGraph: {
      title: "Free Document Converter — No Upload Required",
      description: "Convert Word, PDF, TXT, HTML, ODT and more. Works in your browser — no signup needed.",
      type: "website",
    },
  };
}

export default function DocumentConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="document"
      locale={params.locale}
      heroTitle="Document Converter"
      heroDesc="Convert Word, PDF, TXT, HTML, ODT and 50+ document formats instantly. Works entirely in your browser — no upload, complete privacy."
      faqs={[
        { q: "Can I convert DOCX to PDF?", a: "Yes — upload your DOCX file and select PDF as the output. The conversion happens in your browser instantly." },
        { q: "What document formats are supported?", a: "We support DOCX, DOC, PDF, TXT, RTF, ODT, HTML, Markdown, EPUB and many more." },
        { q: "Will formatting be preserved?", a: "Browser-based conversion preserves the majority of formatting. Complex layouts may vary." },
      ]}
    />
  );
}
