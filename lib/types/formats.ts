/**
 * lib/types/formats.ts
 * Format-related type definitions
 */

import type { LucideIcon } from "lucide-react";

/** Top-level grouping of a format — drives category pages, SEO, and converter routing. */
export type FormatCategory =
  | "image"
  | "raw"
  | "vector"
  | "icon"
  | "cad"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "font"
  | "gis"
  | "email"
  | "code"
  | "ebook";

/** Processing tier for UI display */
export type FormatTier = "popular" | "standard" | "advanced" | "niche";

/** Converter page type */
export type ConverterType = "image" | "video" | "audio" | "document" | "ebook" | "archive" | "cad" | "font";

/** Processing engine identifier */
export type ProcessingEngine =
  | "canvas"
  | "ffmpeg"
  | "web-audio"
  | "pdf-lib"
  | "jszip"
  | "native"
  | "server"
  | "libreoffice"
  | "premium-api"
  | "font-engine"
  | "gis-engine"
  | "archive-engine";

/** Viewer engine identifier */
export type ViewerEngine =
  | "native-image"
  | "svg"
  | "pdf"
  | "docx"
  | "spreadsheet"
  | "text"
  | "archive"
  | "email"
  | "video"
  | "audio"
  | "psd"
  | "ebook"
  | "pptx"
  | "cad"
  | "font"
  | "gis"
  | "none";

/** Editor capability level */
export type EditorCapability = "none" | "basic" | "full";

/** Provider capability flags for formats */
export interface FormatProviderCapabilities {
  clientSide?: boolean;
  serverSide?: boolean;
  libreOffice?: boolean;
  ffmpeg?: boolean;
  premiumApi?: boolean;
  cloudProvider?: string[];
}

/** Format metadata */
export interface FormatDefinition {
  ext: string;
  name: string;
  category: FormatCategory;
  mime: string;
  altMimes?: string[];
  tier: FormatTier;
  engine: ProcessingEngine;
  browserNative?: boolean;
  description?: string;
  tags?: string[];
  maxFileSize?: number;
  premiumOnly?: boolean;

  // ── Registry-driven capabilities ─────────────────────────────────────────────
  /** Available viewer engine */
  viewerEngine?: ViewerEngine;
  /** Has dedicated viewer component */
  hasViewer?: boolean;
  /** Editor capability level */
  editorCapability?: EditorCapability;
  /** Provider capability flags */
  providers?: FormatProviderCapabilities;
  /** Supports batch conversion */
  supportsBatch?: boolean;
  /** Search priority (higher = more prominent) */
  searchPriority?: number;
  /** Estimated monthly search volume (for SEO) */
  searchVolume?: number;
  /** Related formats for recommendations */
  relatedFormats?: string[];
  /** Icon override (uses category default if not set) */
  icon?: LucideIcon;
  /** Conversion quality rating (1-5) */
  qualityRating?: number;
  /** Popular conversions from this format */
  popularConversions?: string[];
}

/** Category metadata for UI */
export interface CategoryDefinition {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  gradient: [string, string];
  seoLabel: string;
  /** Route prefix for converters */
  converterRoute?: string;
  /** Whether category has dedicated viewer */
  hasViewer?: boolean;
  /** Whether category has dedicated editor */
  hasEditor?: boolean;
}

/** Format lookup result */
export interface FormatLookupResult {
  format: FormatDefinition;
  category: CategoryDefinition;
}

/** Conversion slug parsed result */
export interface ParsedConversionSlug {
  inputFormat: string;
  outputFormat: string | null;
  inputName: string;
  outputName: string | null;
  inputCategory: FormatCategory;
  outputCategory: FormatCategory | null;
  inputMime: string;
  outputMime: string | null;
  isValid: boolean;
  isSingleFormat: boolean;
}
