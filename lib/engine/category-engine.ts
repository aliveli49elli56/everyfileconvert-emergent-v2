/**
 * lib/engine/category-engine.ts
 * Auto Category Engine - automatic category assignment from registries
 *
 * Automatically determines category for:
 * - Formats (based on extension, MIME type, capabilities)
 * - Tools (based on input/output formats)
 * - Pages (based on route patterns)
 *
 * NO manual category assignment. All derived from Format Registry.
 */

import type { FormatCategory } from '../types/formats';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { aliasEngine } from './alias-engine';
import { mimeEngine } from './mime-engine';

// ---------------------------------------------------------------------------
// CATEGORY METADATA
// ---------------------------------------------------------------------------

export interface CategoryMetadata {
  id: FormatCategory;
  name: string;
  pluralName: string;
  slug: string;
  route: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  sortPriority: number;
}

const CATEGORY_METADATA: CategoryMetadata[] = [
  {
    id: 'image',
    name: 'Image',
    pluralName: 'Images',
    slug: 'image',
    route: '/image-converter',
    description: 'Convert, edit, and process image files',
    icon: 'Image',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
    sortPriority: 10,
  },
  {
    id: 'raw',
    name: 'RAW Image',
    pluralName: 'RAW Images',
    slug: 'raw',
    route: '/raw-converter',
    description: 'Convert camera RAW files to standard formats',
    icon: 'Aperture',
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500',
    sortPriority: 11,
  },
  {
    id: 'vector',
    name: 'Vector',
    pluralName: 'Vector Graphics',
    slug: 'vector',
    route: '/vector-converter',
    description: 'Convert and edit vector graphics',
    icon: 'PenTool',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-violet-500',
    sortPriority: 12,
  },
  {
    id: 'icon',
    name: 'Icon',
    pluralName: 'Icons',
    slug: 'icon',
    route: '/icon-converter',
    description: 'Convert icon files between formats',
    icon: 'Shapes',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-teal-500',
    sortPriority: 13,
  },
  {
    id: 'video',
    name: 'Video',
    pluralName: 'Videos',
    slug: 'video',
    route: '/video-converter',
    description: 'Convert, compress, and edit video files',
    icon: 'Film',
    color: 'text-red-500',
    gradient: 'from-red-500 to-orange-500',
    sortPriority: 20,
  },
  {
    id: 'audio',
    name: 'Audio',
    pluralName: 'Audio',
    slug: 'audio',
    route: '/audio-converter',
    description: 'Convert and process audio files',
    icon: 'Music',
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-500',
    sortPriority: 30,
  },
  {
    id: 'document',
    name: 'Document',
    pluralName: 'Documents',
    slug: 'document',
    route: '/document-converter',
    description: 'Convert documents, spreadsheets, and presentations',
    icon: 'FileText',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-500',
    sortPriority: 40,
  },
  {
    id: 'archive',
    name: 'Archive',
    pluralName: 'Archives',
    slug: 'archive',
    route: '/archive-converter',
    description: 'Extract and create archive files',
    icon: 'Archive',
    color: 'text-stone-500',
    gradient: 'from-stone-500 to-gray-500',
    sortPriority: 50,
  },
  {
    id: 'cad',
    name: 'CAD',
    pluralName: 'CAD Files',
    slug: 'cad',
    route: '/cad-converter',
    description: 'Convert CAD and 3D model files',
    icon: 'Box',
    color: 'text-teal-500',
    gradient: 'from-teal-500 to-cyan-500',
    sortPriority: 60,
  },
  {
    id: 'font',
    name: 'Font',
    pluralName: 'Fonts',
    slug: 'font',
    route: '/font-converter',
    description: 'Convert font files between formats',
    icon: 'Type',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-violet-500',
    sortPriority: 70,
  },
  {
    id: 'gis',
    name: 'GIS',
    pluralName: 'GIS & Maps',
    slug: 'gis',
    route: '/gis-converter',
    description: 'Convert GIS and mapping files',
    icon: 'Map',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    sortPriority: 80,
  },
  {
    id: 'email',
    name: 'Email',
    pluralName: 'Email Files',
    slug: 'email',
    route: '/email-converter',
    description: 'Convert email files and archives',
    icon: 'Mail',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-sky-500',
    sortPriority: 90,
  },
  {
    id: 'code',
    name: 'Code',
    pluralName: 'Code & Data',
    slug: 'code',
    route: '/code-converter',
    description: 'Convert code and data files',
    icon: 'Code',
    color: 'text-slate-500',
    gradient: 'from-slate-500 to-gray-500',
    sortPriority: 100,
  },
  {
    id: 'ebook',
    name: 'eBook',
    pluralName: 'eBooks',
    slug: 'ebook',
    route: '/ebook-converter',
    description: 'Convert eBook files between formats',
    icon: 'BookOpen',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    sortPriority: 110,
  },
];

// ---------------------------------------------------------------------------
// MIME TO CATEGORY MAPPING
// ---------------------------------------------------------------------------

const MIME_CATEGORY_MAP: Record<string, FormatCategory> = {
  // Images
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  'image/svg+xml': 'vector',
  'image/avif': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
  'image/x-icon': 'icon',
  'image/vnd.microsoft.icon': 'icon',

  // RAW Images
  'image/x-raw': 'raw',
  'image/x-canon-cr2': 'raw',
  'image/x-nikon-nef': 'raw',
  'image/x-sony-arw': 'raw',
  'image/x-adobe-dng': 'raw',

  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/avi': 'video',
  'video/quicktime': 'video',
  'video/x-matroska': 'video',
  'video/x-msvideo': 'video',
  'video/x-ms-wmv': 'video',
  'video/x-flv': 'video',
  'video/mpeg': 'video',

  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
  'audio/x-m4a': 'audio',
  'audio/x-wma': 'audio',
  'audio/aiff': 'audio',

  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'text/plain': 'document',
  'text/rtf': 'document',
  'application/rtf': 'document',

  // Archives
  'application/zip': 'archive',
  'application/x-zip-compressed': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/x-tar': 'archive',
  'application/gzip': 'archive',

  // CAD
  'application/dwg': 'cad',
  'application/dxf': 'cad',
  'model/stl': 'cad',
  'model/obj': 'cad',
  'model/fbx': 'cad',

  // Fonts
  'font/ttf': 'font',
  'font/otf': 'font',
  'font/woff': 'font',
  'font/woff2': 'font',
  'application/x-font-ttf': 'font',
  'application/x-font-otf': 'font',

  // GIS
  'application/geo+json': 'gis',
  'application/gpx+xml': 'gis',
  'application/x-shapefile': 'gis',

  // Email
  'message/rfc822': 'email',
  'application/vnd.ms-outlook': 'email',

  // Code
  'application/json': 'code',
  'application/xml': 'code',
  'text/xml': 'code',
  'text/html': 'code',
  'text/css': 'code',
  'text/javascript': 'code',
  'application/javascript': 'code',
  'application/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java-source': 'code',
  'text/x-c': 'code',
  'text/x-c++': 'code',
  'text/x-ruby': 'code',
  'text/x-php': 'code',
  'text/markdown': 'code',
  'text/yaml': 'code',
  'application/x-yaml': 'code',
  'text/x-sql': 'code',

  // eBooks
  'application/epub+zip': 'ebook',
  'application/x-mobipocket-ebook': 'ebook',
  'application/vnd.amazon.ebook': 'ebook',
};

// ---------------------------------------------------------------------------
// CATEGORY ENGINE CLASS
// ---------------------------------------------------------------------------

class CategoryEngine {
  private categoryMap: Map<FormatCategory, CategoryMetadata>;
  private slugMap: Map<string, FormatCategory>;
  private initialized: boolean = false;

  constructor() {
    this.categoryMap = new Map();
    this.slugMap = new Map();
    this.initializeCategories();
  }

  /**
   * Initialize categories from metadata
   */
  private initializeCategories(): void {
    for (const meta of CATEGORY_METADATA) {
      this.categoryMap.set(meta.id, meta);
      this.slugMap.set(meta.slug, meta.id);
    }
    this.initialized = true;
  }

  /**
   * Get category for extension - AUTO from Format Registry
   */
  getCategory(ext: string): FormatCategory | null {
    const canonical = aliasEngine.resolve(ext);
    const format = formatRegistry.get(canonical);
    return format?.category || null;
  }

  /**
   * Get category for MIME type - AUTO from MIME mapping
   */
  getCategoryFromMime(mime: string): FormatCategory | null {
    const normalized = mimeEngine.normalizeMime(mime);
    return MIME_CATEGORY_MAP[normalized] || null;
  }

  /**
   * Get category for conversion - AUTO from formats
   */
  getCategoryForConversion(inputExt: string, outputExt: string): FormatCategory {
    const inputCategory = this.getCategory(inputExt);
    const outputCategory = this.getCategory(outputExt);

    // Primary category is input format's category
    return inputCategory || outputCategory || 'document';
  }

  /**
   * Get category for slug (conversion slug like 'png-to-jpg')
   */
  getCategoryForSlug(slug: string): FormatCategory | null {
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed) return null;
    return parsed.inputCategory;
  }

  /**
   * Get category metadata
   */
  getMetadata(category: FormatCategory): CategoryMetadata | undefined {
    return this.categoryMap.get(category);
  }

  /**
   * Get category by slug
   */
  getBySlug(slug: string): CategoryMetadata | undefined {
    const categoryId = this.slugMap.get(slug);
    return categoryId ? this.categoryMap.get(categoryId) : undefined;
  }

  /**
   * Get all categories
   */
  getAllCategories(): CategoryMetadata[] {
    return CATEGORY_METADATA.slice().sort((a, b) => a.sortPriority - b.sortPriority);
  }

  /**
   * Get all category IDs
   */
  getAllCategoryIds(): FormatCategory[] {
    return CATEGORY_METADATA.map(m => m.id);
  }

  /**
   * Get categories that have tools
   */
  getCategoriesWithTools(): CategoryMetadata[] {
    const categories = new Set<FormatCategory>();
    const formats = formatRegistry.getAll();

    for (const format of formats) {
      categories.add(format.category);
    }

    return Array.from(categories)
      .map(id => this.categoryMap.get(id))
      .filter((m): m is CategoryMetadata => m !== undefined)
      .sort((a, b) => a.sortPriority - b.sortPriority);
  }

  /**
   * Check if category exists
   */
  isValid(category: string): category is FormatCategory {
    return this.categoryMap.has(category as FormatCategory);
  }

  /**
   * Infer category from file properties
   */
  inferCategory(options: {
    ext?: string;
    mime?: string;
    name?: string;
  }): FormatCategory | null {
    // Try extension first
    if (options.ext) {
      const category = this.getCategory(options.ext);
      if (category) return category;
    }

    // Try MIME type
    if (options.mime) {
      const category = this.getCategoryFromMime(options.mime);
      if (category) return category;
    }

    // Try filename pattern
    if (options.name) {
      const ext = options.name.split('.').pop()?.toLowerCase();
      if (ext) {
        const category = this.getCategory(ext);
        if (category) return category;
      }
    }

    return null;
  }

  /**
   * Get route for category
   */
  getRoute(categoryOrExt: string): string {
    // Check if it's a category
    const meta = this.categoryMap.get(categoryOrExt as FormatCategory);
    if (meta) return meta.route;

    // Check if it's a slug
    const category = this.getCategoryForSlug(categoryOrExt);
    if (category) {
      const catMeta = this.categoryMap.get(category);
      return catMeta?.route || '/tools';
    }

    // Check if it's an extension
    const extCategory = this.getCategory(categoryOrExt);
    if (extCategory) {
      const catMeta = this.categoryMap.get(extCategory);
      return catMeta?.route || '/tools';
    }

    return '/tools';
  }

  /**
   * Get category statistics
   */
  getStats(): Record<FormatCategory, { formats: number; converters: number }> {
    const stats: Record<string, { formats: number; converters: number }> = {};

    // Initialize all categories
    for (const category of this.getAllCategoryIds()) {
      stats[category] = { formats: 0, converters: 0 };
    }

    // Count formats
    const formats = formatRegistry.getAll();
    for (const format of formats) {
      if (stats[format.category]) {
        stats[format.category].formats++;
      }
    }

    // Count converters
    const slugs = conversionRegistry.getAllSlugs();
    for (const slug of slugs) {
      const parsed = conversionRegistry.parseSlug(slug);
      if (parsed && stats[parsed.inputCategory]) {
        stats[parsed.inputCategory].converters++;
      }
    }

    return stats;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const categoryEngine = new CategoryEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getCategory(ext: string): FormatCategory | null {
  return categoryEngine.getCategory(ext);
}

export function getCategoryFromMime(mime: string): FormatCategory | null {
  return categoryEngine.getCategoryFromMime(mime);
}

export function getCategoryMetadata(category: FormatCategory): CategoryMetadata | undefined {
  return categoryEngine.getMetadata(category);
}

export function getAllCategories(): CategoryMetadata[] {
  return categoryEngine.getAllCategories();
}
