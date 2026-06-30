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
  image:        ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "heif", "avif", "apng", "ico", "jxl", "dds", "hdr", "exr", "pnm", "tga", "xbm", "pcx"],
  raw:          ["raw", "cr2", "cr3", "nef", "arw", "dng", "raf", "rw2", "orf", "pef", "srw", "erf", "mrw", "x3f"],
  vector:       ["svg", "ai", "eps", "psd", "cdr", "indd", "sketch", "afdesign", "xd", "fig", "xcf"],
  icon:         ["ico", "icns", "cur"],
  "3d":         ["stl", "obj", "fbx", "glb", "gltf", "dae", "ply", "3ds", "usd", "usdz", "wrl", "x3d"],
  cad:          ["dwg", "dxf", "step", "stp", "iges", "igs", "skp", "fcstd"],
  video:        ["mp4", "webm", "avi", "mov", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v", "3gp", "asf", "vob", "ogv", "ts", "f4v", "hevc", "m2ts", "rm", "rmvb"],
  audio:        ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus", "ac3", "amr", "ra", "caf", "alac", "ape", "wv", "mid", "midi", "dsd"],
  pdf:          ["pdf"],
  document:     ["doc", "docx", "rtf", "odt", "txt", "html", "htm", "md", "pages", "wps", "tex", "rst", "adoc"],
  spreadsheet:  ["xls", "xlsx", "xlsm", "ods", "csv", "tsv", "numbers", "xlsb"],
  presentation: ["ppt", "pptx", "odp", "key"],
  archive:      ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "lz4", "zstd", "cab", "lzma", "lha"],
  font:         ["ttf", "otf", "woff", "woff2", "eot", "fon", "pfa", "pfb"],
  gis:          ["geojson", "kml", "kmz", "shp", "gpx", "topojson", "geopackage", "gpkg", "osm", "wkt"],
  email:        ["eml", "msg", "mbox", "emlx"],
  code:         ["json", "xml", "yaml", "yml", "toml", "csv", "tsv", "ini", "sql", "js", "ts", "html", "css", "md"],
  ebook:        ["epub", "mobi", "azw3", "fb2", "djvu", "cbz", "cbr", "lit"],
  webpage:      ["html", "htm", "xhtml", "mhtml", "url"],
  subtitle:     ["srt", "vtt", "ass", "ssa", "sub", "sbv", "lrc", "ttml", "smi"],
  certificate:  ["pem", "crt", "cer", "der", "p12", "pfx", "p7b", "csr", "p8", "jks"],
  scientific:   ["fits", "hdf5", "h5", "mat", "nc", "npy", "npz"],
  medical:      ["dcm", "nii", "nii.gz", "mgh", "nrrd", "mha", "mnc"],
  "disk-image": ["iso", "img", "bin", "vhd", "vmdk", "vdi", "qcow2", "dmg"],
  executable:   ["exe", "msi", "apk", "ipa", "deb", "rpm", "appimage", "dmg"],
  other:        [],
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
