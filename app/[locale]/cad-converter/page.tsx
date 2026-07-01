import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { CategoryLandingTemplate } from "@/components/converter/CategoryLandingTemplate";

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "CAD Converter — Convert DWG, DXF, STEP, STL, OBJ & More",
    description: "Free online CAD & 3D model converter. Convert DWG, DXF, STEP, STL, OBJ, FBX and more CAD formats instantly.",
    alternates: { canonical: `https://everyfileconvert.com/${params.locale}/cad-converter` },
    openGraph: {
      title: "Free CAD Converter — No Upload Required",
      description: "Convert DWG, DXF, STEP, STL, OBJ, FBX and more. Works in your browser.",
      type: "website",
    },
  };
}

export default function CADConverterPage({ params }: Props) {
  return (
    <CategoryLandingTemplate
      category="cad"
      locale={params.locale}
      heroTitle="CAD & 3D Model Converter"
      heroDesc="Convert DWG, DXF, STEP, STL, OBJ, FBX and more CAD and 3D model formats. Works entirely in your browser — no AutoCAD required."
      faqs={[
        { q: "Can I convert STL to OBJ?", a: "Yes — upload your STL file and select OBJ as the output format. 3D geometry is preserved." },
        { q: "What CAD formats are supported?", a: "We support DWG, DXF, STEP, STP, STL, OBJ, FBX, IGES, 3DS, PLY and more." },
        { q: "Do I need AutoCAD installed?", a: "No — all conversions happen in your browser without any software installation." },
      ]}
    />
  );
}
