/**
 * lib/registry/tool-identity-registry.ts
 * Tool Identity Engine - generates stable permanent IDs for all tools
 *
 * Generates permanent stable IDs like `image_converter_png_jpg`
 * These IDs never change even if routes or formats are reorganized.
 */

import type { FormatCategory } from '../types/formats';
import { conversionRegistry } from './conversion-registry';
import { formatRegistry } from './format-registry';
import { aliasEngine } from '../engine/alias-engine';

// ---------------------------------------------------------------------------
// ID TYPES
// ---------------------------------------------------------------------------

export type ToolType = 'converter' | 'viewer' | 'editor' | 'processor' | 'downloader';

export interface ToolIdentity {
  /** Permanent stable ID */
  id: string;
  /** URL slug */
  slug: string;
  /** Tool type */
  type: ToolType;
  /** Category */
  category: FormatCategory;
  /** Input format (if applicable) */
  inputFormat?: string;
  /** Output format (if applicable) */
  outputFormat?: string;
  /** Formats involved */
  formats: string[];
  /** Generated timestamp */
  generated: number;
  /** ID version (for future migration) */
  version: 1;
}

// ---------------------------------------------------------------------------
// ID GENERATION PATTERNS
// ---------------------------------------------------------------------------

/**
 * ID Pattern: {category}_{type}_{formats...}
 * Examples:
 *   - image_converter_png_jpg
 *   - video_converter_mp4_webm
 *   - audio_converter_mp3_wav
 *   - document_viewer_pdf
 *   - image_editor_png
 */

// ---------------------------------------------------------------------------
// TOOL IDENTITY ENGINE CLASS
// ---------------------------------------------------------------------------

class ToolIdentityEngine {
  private identityCache: Map<string, ToolIdentity>;
  private slugToIdMap: Map<string, string>;
  private idToSlugMap: Map<string, string>;

  // Category to route prefix mapping
  private categoryPrefixes: Record<FormatCategory, string> = {
    image:        'image',
    raw:          'image',
    vector:       'image',
    icon:         'image',
    "3d":         'cad',
    cad:          'cad',
    video:        'video',
    audio:        'audio',
    pdf:          'document',
    document:     'document',
    spreadsheet:  'document',
    presentation: 'document',
    archive:      'archive',
    font:         'font',
    gis:          'gis',
    email:        'email',
    code:         'code',
    ebook:        'ebook',
    webpage:      'document',
    subtitle:     'document',
    certificate:  'document',
    scientific:   'document',
    medical:      'document',
    "disk-image": 'archive',
    executable:   'archive',
    other:        'document',
  };

  constructor() {
    this.identityCache = new Map();
    this.slugToIdMap = new Map();
    this.idToSlugMap = new Map();
    this.initializeIdentities();
  }

  /**
   * Initialize all tool identities from registries
   */
  private initializeIdentities(): void {
    // Generate converter identities
    const slugs = conversionRegistry.getAllSlugs();
    for (const slug of slugs) {
      const identity = this.generateConverterIdentity(slug);
      if (identity) {
        this.identityCache.set(identity.id, identity);
        this.slugToIdMap.set(slug, identity.id);
        this.idToSlugMap.set(identity.id, slug);
      }
    }

    // Generate viewer identities
    const viewableFormats = formatRegistry.getViewableFormats();
    for (const format of viewableFormats) {
      const identity = this.generateViewerIdentity(format.ext);
      if (identity) {
        this.identityCache.set(identity.id, identity);
        this.slugToIdMap.set(`viewer-${format.ext}`, identity.id);
        this.idToSlugMap.set(identity.id, `viewer-${format.ext}`);
      }
    }

    // Generate editor identities
    const editableFormats = formatRegistry.getEditableFormats();
    for (const format of editableFormats) {
      const identity = this.generateEditorIdentity(format.ext);
      if (identity) {
        this.identityCache.set(identity.id, identity);
        this.slugToIdMap.set(`editor-${format.ext}`, identity.id);
        this.idToSlugMap.set(identity.id, `editor-${format.ext}`);
      }
    }
  }

  /**
   * Generate converter identity from slug
   */
  private generateConverterIdentity(slug: string): ToolIdentity | null {
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || parsed.isSingleFormat || !parsed.outputFormat) return null;

    const inputFormat = aliasEngine.resolve(parsed.inputFormat);
    const outputFormat = aliasEngine.resolve(parsed.outputFormat);
    const categoryName = this.categoryPrefixes[parsed.inputCategory] ?? 'other';

    const id = `${categoryName}_converter_${inputFormat}_${outputFormat}`;

    return {
      id,
      slug,
      type: 'converter',
      category: parsed.inputCategory,
      inputFormat,
      outputFormat,
      formats: [inputFormat, outputFormat],
      generated: Date.now(),
      version: 1,
    };
  }

  /**
   * Generate viewer identity for format
   */
  private generateViewerIdentity(ext: string): ToolIdentity | null {
    const format = formatRegistry.get(ext);
    if (!format) return null;

    const categoryName = this.categoryPrefixes[format.category] ?? 'other';
    const id = `${categoryName}_viewer_${ext}`;

    return {
      id,
      slug: `viewer-${ext}`,
      type: 'viewer',
      category: format.category,
      inputFormat: ext,
      formats: [ext],
      generated: Date.now(),
      version: 1,
    };
  }

  /**
   * Generate editor identity for format
   */
  private generateEditorIdentity(ext: string): ToolIdentity | null {
    const format = formatRegistry.get(ext);
    if (!format) return null;

    const categoryName = this.categoryPrefixes[format.category] ?? 'other';
    const id = `${categoryName}_editor_${ext}`;

    return {
      id,
      slug: `editor-${ext}`,
      type: 'editor',
      category: format.category,
      inputFormat: ext,
      formats: [ext],
      generated: Date.now(),
      version: 1,
    };
  }

  /**
   * Get identity by ID
   */
  getById(id: string): ToolIdentity | undefined {
    return this.identityCache.get(id);
  }

  /**
   * Get identity by slug
   */
  getBySlug(slug: string): ToolIdentity | undefined {
    const id = this.slugToIdMap.get(slug);
    return id ? this.identityCache.get(id) : undefined;
  }

  /**
   * Get ID from slug
   */
  slugToId(slug: string): string | undefined {
    return this.slugToIdMap.get(slug);
  }

  /**
   * Get slug from ID
   */
  idToSlug(id: string): string | undefined {
    return this.idToSlugMap.get(id);
  }

  /**
   * Generate a stable ID for any tool combination
   */
  generateId(
    type: ToolType,
    category: FormatCategory,
    formats: string[]
  ): string {
    const categoryPrefix = this.categoryPrefixes[category] ?? 'other';
    const normalizedFormats = formats.map(f => aliasEngine.resolve(f));

    switch (type) {
      case 'converter':
        if (normalizedFormats.length !== 2) {
          throw new Error('Converter requires exactly 2 formats');
        }
        return `${categoryPrefix}_converter_${normalizedFormats[0]}_${normalizedFormats[1]}`;

      case 'viewer':
        return `${categoryPrefix}_viewer_${normalizedFormats[0]}`;

      case 'editor':
        return `${categoryPrefix}_editor_${normalizedFormats[0]}`;

      case 'processor':
        return `${categoryPrefix}_processor_${normalizedFormats.join('_')}`;

      case 'downloader':
        return `${categoryPrefix}_downloader_${normalizedFormats[0]}`;

      default:
        return `${categoryPrefix}_${type}_${normalizedFormats.join('_')}`;
    }
  }

  /**
   * Get all identities
   */
  getAll(): ToolIdentity[] {
    return Array.from(this.identityCache.values());
  }

  /**
   * Get identities by type
   */
  getByType(type: ToolType): ToolIdentity[] {
    return this.getAll().filter(identity => identity.type === type);
  }

  /**
   * Get identities by category
   */
  getByCategory(category: FormatCategory): ToolIdentity[] {
    return this.getAll().filter(identity => identity.category === category);
  }

  /**
   * Get identities by input format
   */
  getByInputFormat(format: string): ToolIdentity[] {
    const canonical = aliasEngine.resolve(format);
    return this.getAll().filter(identity => identity.inputFormat === canonical);
  }

  /**
   * Check if ID is valid
   */
  isValidId(id: string): boolean {
    const parts = id.split('_');
    return parts.length >= 3;
  }

  /**
   * Parse ID into components
   */
  parseId(id: string): {
    category: string;
    type: ToolType;
    formats: string[];
  } | null {
    const parts = id.split('_');
    if (parts.length < 3) return null;

    const [category, type, ...formats] = parts;
    return {
      category,
      type: type as ToolType,
      formats,
    };
  }

  /**
   * Get ID statistics
   */
  getStats(): {
    total: number;
    byType: Record<ToolType, number>;
    byCategory: Record<string, number>;
  } {
    const all = this.getAll();

    const byType: Record<ToolType, number> = {
      converter: 0,
      viewer: 0,
      editor: 0,
      processor: 0,
      downloader: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const identity of all) {
      byType[identity.type]++;
      byCategory[identity.category] = (byCategory[identity.category] || 0) + 1;
    }

    return {
      total: all.length,
      byType,
      byCategory,
    };
  }
}

export const toolIdentityEngine = new ToolIdentityEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getToolId(slug: string): string | undefined {
  return toolIdentityEngine.slugToId(slug);
}

export function getToolSlug(id: string): string | undefined {
  return toolIdentityEngine.idToSlug(id);
}

export function getToolIdentity(idOrSlug: string): ToolIdentity | undefined {
  const byId = toolIdentityEngine.getById(idOrSlug);
  if (byId) return byId;
  return toolIdentityEngine.getBySlug(idOrSlug);
}

export function generateToolId(
  type: ToolType,
  category: FormatCategory,
  formats: string[]
): string {
  return toolIdentityEngine.generateId(type, category, formats);
}

export function getAllToolsByType(type: ToolType): ToolIdentity[] {
  return toolIdentityEngine.getByType(type);
}
