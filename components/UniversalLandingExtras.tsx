"use client";
/**
 * UniversalLandingExtras — Phase 7.1
 *
 * Single registry-driven landing extras assembler for ALL page types:
 * converter | viewer | tool | category
 *
 * Import and render below the main tool/upload UI on any page.
 * Add a registry entry → automatically gets landing content, SEO, links, FAQ.
 */
import { formatDescriptionEngine } from "@/lib/engine/format-description-engine";
import { CATEGORY_DEFINITIONS, formatRegistry } from "@/lib/registry/format-registry";
import type { FormatCategory } from "@/lib/types/formats";

import { FeaturesSection }          from "./landing/sections/FeaturesSection";
import { FormatInfoSection }         from "./landing/sections/FormatInfoSection";
import { AdvantagesSection }         from "./landing/sections/AdvantagesSection";
import { DisadvantagesSection }      from "./landing/sections/DisadvantagesSection";
import { UseCasesSection }           from "./landing/sections/UseCasesSection";
import { TipsSection }               from "./landing/sections/TipsSection";
import { HowToSection }              from "./landing/sections/HowToSection";
import { FAQSection }                from "./landing/sections/FAQSection";
import { RelatedConvertersSection }  from "./landing/sections/RelatedConvertersSection";
import { RelatedViewersSection }     from "./landing/sections/RelatedViewersSection";
import { RelatedToolsSection }       from "./landing/sections/RelatedToolsSection";
import { RelatedCategoriesSection }  from "./landing/sections/RelatedCategoriesSection";
import { PopularFormatsSection }     from "./landing/sections/PopularFormatsSection";
import { InternalLinksSection }      from "./landing/sections/InternalLinksSection";
import { BottomCTASection }          from "./landing/sections/BottomCTASection";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type LandingVariant = "converter" | "viewer" | "tool" | "category";

export interface UniversalLandingExtrasProps {
  variant:        LandingVariant;
  locale:         string;
  // Converter
  inputExt?:      string;
  outputExt?:     string;
  isSingleFormat?: boolean;
  // Viewer
  viewerExt?:     string;
  // Tool
  toolKey?:       string;
  toolName?:      string;
  toolMode?:      "image" | "video" | "audio" | "pdf" | "all";
  toolParentPath?: string;
  toolParentLabel?: string;
  // Category override
  category?:      FormatCategory;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function UniversalLandingExtras({
  variant, locale,
  inputExt, outputExt, isSingleFormat,
  viewerExt,
  toolKey, toolName, toolMode, toolParentPath, toolParentLabel,
  category: categoryProp,
}: UniversalLandingExtrasProps) {

  // ── Resolve primary extension & category ──────────────────────────────────
  const ext         = (inputExt || viewerExt || "").toLowerCase();
  const fmtDef      = ext ? formatRegistry.get(ext) : null;
  const category: FormatCategory =
    categoryProp ??
    fmtDef?.category ??
    ((toolMode === "all" || !toolMode) ? "document" : toolMode as FormatCategory);

  const catDef      = CATEGORY_DEFINITIONS[category];
  const catLabel    = catDef?.seoLabel ?? category;
  const catRoute    = `/${locale}${catDef?.converterRoute ?? `/${category}-converter`}`;
  const IN          = (ext || category).toUpperCase();
  const OUT         = outputExt?.toUpperCase() ?? "";

  // ── Features ──────────────────────────────────────────────────────────────
  const features: string[] =
    variant === "tool"
      ? formatDescriptionEngine.getToolFeatures(toolKey ?? "", toolMode ?? "all")
      : variant === "viewer"
      ? formatDescriptionEngine.getViewerFeatures(ext)
      : [
          "100% browser-based — files never leave your device",
          "Free forever — no account or subscription required",
          "Supports batch conversion for multiple files at once",
          "Works on all devices — desktop, tablet, and mobile",
          "No file size limits — process large files instantly",
          "Results available in seconds with no server queue",
        ];

  const featureTitle =
    variant === "viewer"   ? `${IN} Viewer Features`
    : variant === "tool"   ? `${toolName ?? "Tool"} Features`
    : variant === "category" ? `${catLabel} Converter Features`
    : !isSingleFormat && OUT ? `${IN} to ${OUT} Converter Features`
    : `${IN} Converter Features`;

  // ── Conversion benefits (for converter variant) ───────────────────────────
  const convBenefits =
    variant === "converter" && outputExt
      ? formatDescriptionEngine.getConversionAdvantages(ext, outputExt)
      : undefined;

  const advTitle =
    variant === "converter"
      ? (isSingleFormat ? `Why Convert ${IN} Files` : `Why Convert ${IN} to ${OUT}`)
      : variant === "viewer" ? `${IN} Format Highlights`
      : variant === "category" ? `${catLabel} Format Benefits`
      : undefined;

  // ── FAQs ──────────────────────────────────────────────────────────────────
  const faqs = formatDescriptionEngine.getFAQs({
    variant,
    inputExt:  ext || undefined,
    outputExt,
    category,
    toolName,
    toolMode,
  });

  // ── HowTo steps ───────────────────────────────────────────────────────────
  const howToSteps =
    variant === "viewer"
      ? [
          { label: "Open",     desc: `Drag & drop your ${ext ? "." + ext : ""} file, or click to browse` },
          { label: "View",     desc: "Your file opens instantly — no upload or server" },
          { label: "Download", desc: "Save the original file anytime with one click" },
        ]
      : [
          { label: "Upload",   desc: "Drag & drop your file or click to browse" },
          { label: "Process",  desc: "Files are processed instantly in your browser" },
          { label: "Download", desc: "Save your converted or processed file" },
        ];

  const howToTitle =
    variant === "viewer"   ? `How to View ${IN} Files Online`
    : variant === "tool"   ? `How to Use ${toolName ?? "This Tool"}`
    : variant === "category" ? `How to Convert ${catLabel} Files`
    : !isSingleFormat && OUT ? `How to Convert ${IN} to ${OUT}`
    : `How to Convert ${IN} Files`;

  // ── CTA content ───────────────────────────────────────────────────────────
  let ctaTitle: string;
  let ctaPrimary: string;
  let ctaSecondaryLabel: string | undefined;
  let ctaSecondaryHref: string | undefined;
  let ctaBadge: string;

  if (variant === "converter") {
    ctaTitle          = isSingleFormat ? `Ready to Convert Your ${IN} File?` : `Convert ${IN} to ${OUT} Now`;
    ctaPrimary        = isSingleFormat ? `Convert ${IN} Files` : `Convert ${IN} to ${OUT}`;
    ctaSecondaryLabel = `More ${catLabel} Converters`;
    ctaSecondaryHref  = catRoute;
    ctaBadge          = `${catLabel} Converter`;
  } else if (variant === "viewer") {
    ctaTitle          = `Open a ${IN} File Now`;
    ctaPrimary        = `Open ${IN} File`;
    ctaSecondaryLabel = "All File Viewers";
    ctaSecondaryHref  = `/${locale}/view`;
    ctaBadge          = `${IN} Viewer`;
  } else if (variant === "tool") {
    ctaTitle          = `Try ${toolName ?? IN} Now`;
    ctaPrimary        = `Open ${toolName ?? IN}`;
    ctaSecondaryLabel = toolParentLabel ? `Back to ${toolParentLabel}` : undefined;
    ctaSecondaryHref  = toolParentPath ? `/${locale}/${toolParentPath}` : catRoute;
    ctaBadge          = toolName ?? `${catLabel} Tool`;
  } else {
    ctaTitle          = `Start Converting ${catLabel} Files Now`;
    ctaPrimary        = `Convert a ${catLabel} File`;
    ctaSecondaryLabel = undefined;
    ctaSecondaryHref  = undefined;
    ctaBadge          = `${catLabel} Converter`;
  }

  const isConverter = variant === "converter";
  const isViewer    = variant === "viewer";
  const isTool      = variant === "tool";
  const isCategory  = variant === "category";

  return (
    <div className="bg-white">

      {/* 1 — Features */}
      <FeaturesSection features={features} title={featureTitle} />

      {/* 2 — Format Information (converter + viewer only) */}
      {(isConverter || isViewer) && ext && (
        <FormatInfoSection inputExt={ext} outputExt={outputExt} isSingleFormat={isSingleFormat} />
      )}

      {/* 3 — Benefits / Advantages */}
      {(isConverter || isViewer || isCategory) && (
        <AdvantagesSection
          ext={isConverter ? (outputExt ?? ext) : ext || undefined}
          category={category}
          title={advTitle}
          advantages={convBenefits}
        />
      )}

      {/* 4 — Disadvantages (converter + viewer, excluding category overview) */}
      {(isConverter || isViewer) && (
        <DisadvantagesSection ext={ext || undefined} category={category} />
      )}

      {/* 5 — Use Cases */}
      <UseCasesSection ext={ext || undefined} outputExt={outputExt} category={category} />

      {/* 6 — Professional Tips */}
      <TipsSection ext={ext || undefined} category={category} />

      {/* 7 — How To Use */}
      <HowToSection steps={howToSteps} title={howToTitle} />

      {/* 8 — FAQ */}
      <FAQSection faqs={faqs} />

      {/* 9 — Related Converters */}
      <RelatedConvertersSection ext={ext || undefined} category={category} locale={locale} />

      {/* 10 — Related Viewers */}
      <RelatedViewersSection ext={ext || undefined} category={category} locale={locale} />

      {/* 11 — Related Tools */}
      <RelatedToolsSection category={category} locale={locale} excludeSlug={toolKey} />

      {/* 12 — Related Categories */}
      <RelatedCategoriesSection category={category} locale={locale} />

      {/* 13 — Popular Formats */}
      <PopularFormatsSection category={category} locale={locale} />

      {/* 14 — Internal Links (converter + viewer + category; not tool) */}
      {!isTool && (
        <InternalLinksSection
          inputExt={ext || undefined}
          outputExt={outputExt}
          category={category}
          locale={locale}
        />
      )}

      {/* 15 — Bottom CTA */}
      <BottomCTASection
        title={ctaTitle}
        subtitle="Free, instant, and 100% private. Your files are processed locally in your browser."
        badge={ctaBadge}
        primaryLabel={ctaPrimary}
        primaryOnClick={!isCategory}
        primaryHref={isCategory ? catRoute : undefined}
        secondaryLabel={ctaSecondaryLabel}
        secondaryHref={ctaSecondaryHref}
      />
    </div>
  );
}
