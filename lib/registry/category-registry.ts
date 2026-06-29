/**
 * lib/registry/category-registry.ts
 * Category metadata and utilities
 */

import { CATEGORY_DEFINITIONS, formatRegistry } from './format-registry';
import type { FormatCategory, CategoryDefinition } from '../types/formats';

// Re-export category definitions
export { CATEGORY_DEFINITIONS };

// ---------------------------------------------------------------------------
// CATEGORY GROUPINGS
// ---------------------------------------------------------------------------

/** Format groupings by category */
export const FORMAT_GROUPS: Record<FormatCategory, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "heif", "avif"],
  raw: ["raw", "cr2", "nef", "arw", "dng"],
  vector: ["svg", "ai", "eps", "psd", "cdr", "indd"],
  icon: ["ico", "icns"],
  cad: ["dwg", "dxf", "step", "stp", "stl", "obj", "fbx"],
  video: ["mp4", "webm", "avi", "mov", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v", "3gp", "asf", "vob", "ogv", "ts", "f4v"],
  audio: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus", "ac3", "amr", "ra", "caf"],
  document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "odt", "ods", "odp", "html", "md"],
  archive: ["zip", "rar", "7z", "tar", "gz"],
  font: ["ttf", "otf", "woff", "woff2"],
  gis: ["geojson", "kml", "shp"],
  email: ["eml", "msg"],
  code: ["json", "xml", "csv", "yaml", "sql"],
  ebook: ["epub", "mobi", "azw3"],
};

/** Converter page to category mapping */
export const CONVERTER_CATEGORIES: Record<string, FormatCategory[]> = {
  image: ["image", "raw", "vector", "icon", "cad"],
  video: ["video"],
  audio: ["audio"],
  document: ["document"],
  ebook: ["document"],
};

// ---------------------------------------------------------------------------
// REGISTRY CLASS
// ---------------------------------------------------------------------------

class CategoryRegistry {
  /** Get category definition */
  get(category: FormatCategory): CategoryDefinition {
    return CATEGORY_DEFINITIONS[category];
  }

  /** Get all categories */
  getAll(): FormatCategory[] {
    return Object.keys(CATEGORY_DEFINITIONS) as FormatCategory[];
  }

  /** Get formats for category */
  getFormats(category: FormatCategory): string[] {
    return FORMAT_GROUPS[category] || [];
  }

  /** Get category for converter */
  getConverterCategories(converter: string): FormatCategory[] {
    return CONVERTER_CATEGORIES[converter] || [];
  }

  /** Determine category from extension */
  inferCategory(ext: string): FormatCategory | null {
    const format = formatRegistry.get(ext);
    return format?.category ?? null;
  }
}

export const categoryRegistry = new CategoryRegistry();
