import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Spreadsheet Converter — Convert XLSX, CSV, ODS & More",
    description: "Free online spreadsheet converter. Convert Excel, CSV, ODS, Numbers and more spreadsheet formats instantly in your browser.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/spreadsheet-converter` },
    openGraph: {
      title: "Free Spreadsheet Converter — No Upload Required",
      description: "Convert Excel, CSV, ODS, Numbers and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function SpreadsheetConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="spreadsheet"
      locale={params.locale}
      heroTitle="Spreadsheet Converter"
      heroDesc="Convert Excel, CSV, ODS, Numbers and more spreadsheet formats instantly. Works entirely in your browser — no signup, 100% free."
      faqs={[
        { q: "Can I convert Excel to CSV?", a: "Yes — upload your XLSX or XLS file and select CSV as the output format. All data is preserved." },
        { q: "What spreadsheet formats are supported?", a: "We support XLSX, XLS, CSV, ODS, Numbers, TSV and many more." },
        { q: "Will formulas be preserved?", a: "When converting to CSV or TSV, only cell values are exported. For format-to-format conversions, formulas are preserved." },
      ]}
    />
  );
}
