import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageCropperUI from "@/components/Tools/image/ImageCropperUI";
import UniversalLandingExtras from "@/components/UniversalLandingExtras";
import { getHreflangLinks } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string; subpath: string }>;
}

const CROP_CONFIGS: Record<string, {
  name: string; desc: string; seoTitle: string; seoDesc: string; badge: string;
}> = {
  custom: {
    name: "Custom Image Crop",
    desc: "Drag and select any custom region to crop. Precise pixel-level control with undo/redo, rotate, and flip.",
    seoTitle: "Free Custom Image Crop Online | EveryFileConvert",
    seoDesc: "Crop images to a custom region online for free. Canvas-based editor with drag selection. 100% private.",
    badge: "Image Tools",
  },
  square: {
    name: "Square Image Crop (1:1)",
    desc: "Crop images to a perfect 1:1 square ratio. Ideal for Instagram posts and profile pictures.",
    seoTitle: "Free Square Image Crop Online (1:1) | EveryFileConvert",
    seoDesc: "Crop images to square 1:1 ratio online for free. Perfect for Instagram and profile photos. No uploads.",
    badge: "Image Tools",
  },
  landscape: {
    name: "Landscape Image Crop (16:9)",
    desc: "Crop images to landscape 16:9 or 4:3 aspect ratios. Perfect for YouTube thumbnails and web banners.",
    seoTitle: "Free Landscape Image Crop Online (16:9) | EveryFileConvert",
    seoDesc: "Crop images to landscape 16:9 or 4:3 ratio online. Perfect for YouTube thumbnails and web banners.",
    badge: "Image Tools",
  },
  portrait: {
    name: "Portrait Image Crop (9:16)",
    desc: "Crop images to portrait 9:16 or 3:4 aspect ratios. Perfect for Instagram Stories, Reels and mobile content.",
    seoTitle: "Free Portrait Image Crop Online (9:16) | EveryFileConvert",
    seoDesc: "Crop images to portrait 9:16 or 3:4 ratio online. Perfect for Instagram Stories and Reels.",
    badge: "Image Tools",
  },
  resize: {
    name: "Resize & Crop Image",
    desc: "Resize and crop your image in one step to exact pixel dimensions.",
    seoTitle: "Free Resize and Crop Image Online | EveryFileConvert",
    seoDesc: "Resize and crop images to exact pixel dimensions online for free. One-step tool, no uploads.",
    badge: "Image Tools",
  },
  circle: {
    name: "Circular Image Crop",
    desc: "Crop images into perfect circles for avatars and profile pictures. Outputs transparent PNG.",
    seoTitle: "Free Circular Image Crop Online | EveryFileConvert",
    seoDesc: "Crop images to circle shape online for free. Perfect for avatars and profile pictures. Transparent PNG.",
    badge: "Image Tools",
  },
};

export async function generateStaticParams() {
  const locales = ["en","tr","de","fr","es","it","pt","ja","zh","nl","pl","ko","sv","da","no","hu","fi"];
  const subpaths = Object.keys(CROP_CONFIGS);
  return locales.flatMap(locale => subpaths.map(subpath => ({ locale, subpath })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, subpath } = await params;
  const config = CROP_CONFIGS[subpath];
  if (!config) return { title: "Image Crop | EveryFileConvert" };

  const hreflangs = getHreflangLinks(`/image-crop/${subpath}`);
  return {
    title: config.seoTitle,
    description: config.seoDesc,
    robots: { index: true, follow: true },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDesc,
      type: "website",
      url: `https://everyfileconvert.com/${locale}/image-crop/${subpath}`,
    },
    twitter: { card: "summary_large_image", title: config.seoTitle, description: config.seoDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/image-crop/${subpath}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function ImageCropSubPage({ params }: PageProps) {
  const { locale, subpath } = await params;
  const config = CROP_CONFIGS[subpath];
  if (!config) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://everyfileconvert.com/${locale}` },
              { "@type": "ListItem", "position": 2, "name": "Image Crop", "item": `https://everyfileconvert.com/${locale}/image-crop` },
              { "@type": "ListItem", "position": 3, "name": config.name },
            ],
          }),
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <section className="py-10 lg:py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-6">
              <Link
                href={`/${locale}/image-crop`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Image Crop
              </Link>
            </div>
            <div className="max-w-4xl mx-auto text-center mb-8">
              <Badge variant="secondary" className="mb-4 px-3 py-1 bg-cyan-100 text-cyan-700 border-cyan-200">
                {config.badge}
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                {config.name}
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">{config.desc}</p>
            </div>

            {/* Canvas Crop Tool — unchanged */}
            <ImageCropperUI toolName={config.name} />
          </div>
        </section>
        <UniversalLandingExtras
          variant="tool"
          locale={locale}
          toolKey={`image-crop/${subpath}`}
          toolName={config.name}
          toolMode="image"
          toolParentPath="image-crop"
          toolParentLabel="Image Crop"
          category="image"
        />
      </div>
    </>
  );
}
