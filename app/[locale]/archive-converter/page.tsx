import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Archive Converter — Convert ZIP, RAR, 7Z, TAR & More",
    description: "Free online archive converter. Convert ZIP, RAR, 7Z, TAR, GZ, BZIP2 and more archive formats instantly.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/archive-converter` },
    openGraph: {
      title: "Free Archive Converter — No Upload Required",
      description: "Convert ZIP, RAR, 7Z, TAR, GZ and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function ArchiveConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="archive"
      locale={params.locale}
      heroTitle="Archive Converter"
      heroDesc="Convert ZIP, RAR, 7Z, TAR, GZ and more archive formats instantly. Compress and extract without installing any software."
      faqs={[
        { q: "Can I convert ZIP to 7Z?", a: "Yes — upload your ZIP and select 7Z for better compression. The conversion happens in your browser." },
        { q: "What archive formats are supported?", a: "We support ZIP, RAR, 7Z, TAR, GZ, BZIP2, XZ, LZ4, ZST and more." },
        { q: "Can I extract files from an archive?", a: "Yes — upload your archive file and select the desired output format to extract its contents." },
      ]}
    />
  );
}
