import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Developer Tools — Convert JSON, XML, YAML, CSV & More",
    description: "Free online developer tools. Convert JSON, XML, YAML, CSV, SQL and more data formats instantly in your browser.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/developer-tools` },
    openGraph: {
      title: "Free Developer Tools — JSON, XML, YAML, CSV Converter",
      description: "Convert JSON, XML, YAML, CSV, SQL and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function DeveloperToolsPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="code"
      locale={params.locale}
      heroTitle="Developer Tools"
      heroDesc="Convert JSON, XML, YAML, CSV, SQL and more data formats. Format, validate, and transform developer files instantly in your browser."
      faqs={[
        { q: "Can I convert JSON to XML?", a: "Yes — upload your JSON file and select XML. The data structure is preserved in the conversion." },
        { q: "What developer formats are supported?", a: "We support JSON, XML, YAML, CSV, TSV, SQL, TOML, INI and more." },
        { q: "Can I format/prettify JSON?", a: "Yes — use our JSON Formatter tool to prettify, minify or validate JSON without any conversion." },
      ]}
    />
  );
}
