/**
 * lib/types/formats.ts
 * Format-related type definitions
 */

import type { LucideIcon } from "lucide-react";

/** Top-level grouping of a format — drives category pages, SEO, and converter routing. */
export type FormatCategory =
  // ── Visual ───────────────────────────────────────────────────────────────
  | "image"
  | "raw"
  | "vector"
  | "icon"
  // ── 3D / Engineering ─────────────────────────────────────────────────────
  | "3d"
  | "cad"
  // ── Media ────────────────────────────────────────────────────────────────
  | "video"
  | "audio"
  // ── Documents ────────────────────────────────────────────────────────────
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  // ── Publishing ───────────────────────────────────────────────────────────
  | "ebook"
  // ── Utility ──────────────────────────────────────────────────────────────
  | "archive"
  | "font"
  // ── Geospatial ───────────────────────────────────────────────────────────
  | "gis"
  // ── Communication ────────────────────────────────────────────────────────
  | "email"
  // ── Developer ────────────────────────────────────────────────────────────
  | "code"
  // ── Web ──────────────────────────────────────────────────────────────────
  | "webpage"
  // ── Media Accessibility ──────────────────────────────────────────────────
  | "subtitle"
  // ── Security ─────────────────────────────────────────────────────────────
  | "certificate"
  // ── Specialised ──────────────────────────────────────────────────────────
  | "scientific"
  | "medical"
  | "disk-image"
  | "executable"
  | "other";

/** Processing tier for UI display */
export type FormatTier = "popular" | "standard" | "advanced" | "niche" | "legacy";

/** Converter page type */
export type ConverterType =
  | "image" | "raw" | "vector" | "icon"
  | "3d" | "cad"
  | "video" | "audio"
  | "pdf" | "document" | "spreadsheet" | "presentation"
  | "ebook" | "archive" | "font"
  | "gis" | "email" | "code"
  | "webpage" | "subtitle" | "certificate"
  | "scientific" | "medical" | "disk-image" | "executable";

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
  | "archive-engine"
  | "ebook-engine"
  | "email-engine"
  | "cad-engine"
  | "design-tool"
  // ── New engines (Phase 6A) ────────────────────────────────────────────────
  | "3d-engine"
  | "webpage-engine"
  | "subtitle-engine"
  | "certificate-engine"
  | "scientific-engine"
  | "medical-engine"
  | "disk-image-engine"
  | "spreadsheet-engine"
  | "ocr-engine"
  | "vector-engine"
  | "raw-engine"
  | "executable-engine";

/** Viewer engine identifier */
export type ViewerEngine =
  | "native-image"
  | "image"
  | "svg"
  | "pdf"
  | "docx"
  | "document"
  | "spreadsheet"
  | "text"
  | "code"
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
  | "design"
  // ── New viewer engines (Phase 6A) ─────────────────────────────────────────
  | "3d"
  | "subtitle"
  | "certificate"
  | "medical"
  | "scientific"
  | "disk-image"
  | "webpage"
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

  // ── Phase 6A: Tool capability metadata ───────────────────────────────────────
  /** List of supported tool operations for this format (from Processor Registry) */
  supportedTools?: string[];
  /** Viewer metadata */
  viewerMetadata?: ViewerMetadata;
  /** Performance hints for browser processing */
  performanceHints?: PerformanceHints;
  /** Worker support */
  workerSupported?: boolean;
  /** Long-tail SEO aliases */
  seoAliases?: string[];

  // ── Phase 7: Extended metadata ────────────────────────────────────────────────
  /** Search aliases for improved discovery (used by search engine & AI factory) */
  searchAliases?: string[];
  /** Human-readable feature list for converter pages */
  supportedFeatures?: string[];
  /** SEO-optimised meta description for format/converter pages */
  seoDescription?: string;
  /** Hero section title override for category landing pages */
  heroTitle?: string;
  /** Hero section description override for category landing pages */
  heroDescription?: string;
  /** Related format categories for internal linking */
  relatedCategories?: FormatCategory[];
}

// ── Phase 6A: New Interfaces ──────────────────────────────────────────────────

/** Tool capability metadata (from Processor Registry) */
export interface ToolCapability {
  processorId: string;
  operationId: string;
  label: string;
  description: string;
  premium: boolean;
  browserSupported: boolean;
  workerSupported: boolean;
}

/** Viewer metadata */
export interface ViewerMetadata {
  component?: string;
  renderer?: string;
  supportsZoom?: boolean;
  supportsThumbnails?: boolean;
  supportsSearch?: boolean;
  supportsAnnotations?: boolean;
  supportsPageNavigation?: boolean;
  supportedBrowsers?: string[];
}

/** Performance hints for browser processing */
export interface PerformanceHints {
  estimatedMemoryMB?: number;
  estimatedCPU?: 'low' | 'medium' | 'high' | 'very-high';
  supportsStreaming?: boolean;
  supportsChunking?: boolean;
  supportsWorker?: boolean;
  requiresGPU?: boolean;
  lazyLoadLibrary?: boolean;
  chunkSizeMB?: number;
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

  // ── Phase 7: Extended metadata ────────────────────────────────────────────────
  /** SEO meta description for the category landing page */
  seoDescription?: string;
  /** Hero section title for the category landing page */
  heroTitle?: string;
  /** Hero section description for the category landing page */
  heroDescription?: string;
  /** Key feature list shown on landing pages */
  supportedFeatures?: string[];
  /** Related categories for cross-linking */
  relatedCategories?: FormatCategory[];
  /** Slug for the dedicated category landing page */
  landingRoute?: string;
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
