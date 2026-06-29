/**
 * lib/registry/metadata-registry.ts
 * Shared Metadata Engine - centralized metadata for converters/viewers/editors
 *
 * Provides unified metadata access for tools across the platform.
 * Single source of truth for display names, descriptions, categories, etc.
 */

import type { FormatCategory, FormatTier } from '../types/formats';
import { formatRegistry } from './format-registry';
import { conversionRegistry } from './conversion-registry';
import { aliasEngine } from '../engine/alias-engine';
import { mimeEngine } from '../engine/mime-engine';
import { capabilityRegistry } from './capability-registry';

// ---------------------------------------------------------------------------
// METADATA TYPES
// ---------------------------------------------------------------------------

export interface FormatMetadata {
  // Basic info
  ext: string;
  canonicalExt: string;
  name: string;
  shortName: string;
  category: FormatCategory;
  tier: FormatTier;

  // MIME info
  mime: string;
  altMimes: string[];

  // Display
  displayName: string;
  lowercaseName: string;
  abbreviation: string;

  // Capabilities
  hasTransparency: boolean;
  hasAnimation: boolean;
  hasLayers: boolean;
  isVector: boolean;
  is3D: boolean;
  isLossless: boolean;

  // Browser support
  browserNative: boolean;
  browserPreview: boolean;

  // Processing
  engine: string;
  hasViewer: boolean;
  hasEditor: boolean;
  supportsBatch: boolean;

  // SEO
  searchPriority: number;
  popularConversions: string[];

  // Technical
  aliases: string[];
  family: string | null;
}

export interface ConverterMetadata {
  slug: string;
  inputFormat: string;
  outputFormat: string;
  inputName: string;
  outputName: string;
  inputCategory: FormatCategory;
  outputCategory: FormatCategory | null;
  displayName: string;
  shortTitle: string;
  longTitle: string;
  isReversible: boolean;
  reverseSlug: string | null;
  popularity: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  warnings: string[];
}

export interface ToolMetadata {
  id: string;
  slug: string;
  type: 'converter' | 'viewer' | 'editor' | 'processor';
  category: FormatCategory;
  formats: string[];
  displayName: string;
  description: string;
}

// ---------------------------------------------------------------------------
// METADATA ENGINE CLASS
// ---------------------------------------------------------------------------

class MetadataEngine {
  private formatCache: Map<string, FormatMetadata>;
  private converterCache: Map<string, ConverterMetadata>;

  constructor() {
    this.formatCache = new Map();
    this.converterCache = new Map();
  }

  /**
   * Get format metadata
   */
  getFormatMetadata(ext: string): FormatMetadata | null {
    const key = ext.toLowerCase();

    if (this.formatCache.has(key)) {
      return this.formatCache.get(key)!;
    }

    const format = formatRegistry.get(ext);
    if (!format) return null;

    const canonical = aliasEngine.resolve(ext);
    const capabilities = capabilityRegistry.getCapabilities(ext);
    const family = aliasEngine.getFamily(ext);
    const aliases = aliasEngine.getAllEquivalent(ext);

    const metadata: FormatMetadata = {
      ext: format.ext,
      canonicalExt: canonical,
      name: format.name,
      shortName: this.getShortName(format.name),
      category: format.category,
      tier: format.tier,
      mime: format.mime,
      altMimes: mimeEngine.getAllMimes(ext),
      displayName: format.name,
      lowercaseName: format.name.toLowerCase(),
      abbreviation: format.ext.toUpperCase(),
      hasTransparency: capabilities?.transparency ?? false,
      hasAnimation: capabilities?.animation ?? false,
      hasLayers: capabilities?.layers ?? false,
      isVector: capabilities?.vector ?? false,
      is3D: capabilities?.model3d ?? false,
      isLossless: capabilities?.compression === 'lossless' || capabilities?.compression === 'none',
      browserNative: format.browserNative ?? false,
      browserPreview: format.browserNative ?? false,
      engine: format.engine,
      hasViewer: format.hasViewer ?? false,
      hasEditor: format.editorCapability !== 'none',
      supportsBatch: format.supportsBatch ?? false,
      searchPriority: format.searchPriority ?? 50,
      popularConversions: format.popularConversions ?? [],
      aliases: aliases.filter(a => a !== ext),
      family: family,
    };

    this.formatCache.set(key, metadata);
    return metadata;
  }

  /**
   * Get converter metadata
   */
  getConverterMetadata(slug: string): ConverterMetadata | null {
    const key = slug.toLowerCase();

    if (this.converterCache.has(key)) {
      return this.converterCache.get(key)!;
    }

    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || parsed.isSingleFormat || !parsed.outputFormat) return null;

    const inputMeta = this.getFormatMetadata(parsed.inputFormat);
    const outputMeta = this.getFormatMetadata(parsed.outputFormat);
    if (!inputMeta || !outputMeta) return null;

    const isReversible = conversionRegistry.isValid(parsed.outputFormat, parsed.inputFormat);
    const reverseSlug = isReversible
      ? `${parsed.outputFormat}-to-${parsed.inputFormat}`
      : null;

    const warnings = capabilityRegistry.getConversionWarnings(
      parsed.inputFormat,
      parsed.outputFormat
    );

    const metadata: ConverterMetadata = {
      slug,
      inputFormat: parsed.inputFormat,
      outputFormat: parsed.outputFormat,
      inputName: parsed.inputName,
      outputName: parsed.outputName,
      inputCategory: parsed.inputCategory,
      outputCategory: parsed.outputCategory,
      displayName: `${inputMeta.displayName} → ${outputMeta.displayName}`,
      shortTitle: `${inputMeta.abbreviation} to ${outputMeta.abbreviation}`,
      longTitle: `Convert ${inputMeta.displayName} to ${outputMeta.displayName}`,
      isReversible,
      reverseSlug,
      popularity: this.calculatePopularity(inputMeta, outputMeta),
      difficulty: this.determineDifficulty(inputMeta, outputMeta),
      warnings,
    } as ConverterMetadata;

    this.converterCache.set(key, metadata);
    return metadata;
  }

  /**
   * Get short name from full name
   */
  private getShortName(name: string): string {
    return name
      .replace(' Image', '')
      .replace(' Video', '')
      .replace(' Audio', '')
      .replace(' Document', '')
      .replace(' Format', '')
      .trim();
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularity(input: FormatMetadata, output: FormatMetadata): number {
    const inputPriority = input.searchPriority;
    const outputPriority = output.searchPriority;
    const inputVolume = formatRegistry.get(input.ext)?.searchVolume ?? 0;
    const outputVolume = formatRegistry.get(output.ext)?.searchVolume ?? 0;

    // Combined score
    const priorityScore = (inputPriority + outputPriority) / 2;
    const volumeScore = Math.log10(inputVolume + outputVolume + 1) * 10;

    return Math.round(priorityScore + volumeScore);
  }

  /**
   * Determine conversion difficulty
   */
  private determineDifficulty(input: FormatMetadata, output: FormatMetadata): 'easy' | 'medium' | 'advanced' {
    // Cross-category conversions are typically advanced
    if (input.category !== output.category) {
      if (['cad', 'raw', 'vector'].includes(input.category)) {
        return 'advanced';
      }
      return 'medium';
    }

    // Lossy to lossless is easy
    if (!input.isLossless && output.isLossless) {
      return 'easy';
    }

    // Lossless to lossy has quality implications
    if (input.isLossless && !output.isLossless) {
      return 'medium';
    }

    // Animation loss is medium
    if (input.hasAnimation && !output.hasAnimation) {
      return 'medium';
    }

    // Transparency loss is easy (handled automatically)
    if (input.hasTransparency && !output.hasTransparency) {
      return 'easy';
    }

    return 'easy';
  }

  /**
   * Get metadata for multiple formats
   */
  getFormatsMetadata(extensions: string[]): FormatMetadata[] {
    return extensions
      .map(ext => this.getFormatMetadata(ext))
      .filter((m): m is FormatMetadata => m !== null);
  }

  /**
   * Get metadata for all formats in category
   */
  getCategoryMetadata(category: FormatCategory): FormatMetadata[] {
    const formats = formatRegistry.getByCategory(category);
    return formats.map(f => this.getFormatMetadata(f.ext)!).filter(Boolean);
  }

  /**
   * Get all converter slugs with metadata
   */
  getAllConvertersMetadata(): ConverterMetadata[] {
    const slugs = conversionRegistry.getAllSlugs();
    return slugs
      .map(slug => this.getConverterMetadata(slug))
      .filter((m): m is ConverterMetadata => m !== null);
  }

  /**
   * Get popular converters
   */
  getPopularConverters(limit: number = 20): ConverterMetadata[] {
    return this.getAllConvertersMetadata()
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get converters by input format
   */
  getConvertersByInput(inputFormat: string): ConverterMetadata[] {
    const targets = conversionRegistry.getTargets(inputFormat);
    return targets
      .map(target => this.getConverterMetadata(`${inputFormat}-to-${target}`))
      .filter((m): m is ConverterMetadata => m !== null);
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.formatCache.clear();
    this.converterCache.clear();
  }
}

export const metadataEngine = new MetadataEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getFormatMeta(ext: string): FormatMetadata | null {
  return metadataEngine.getFormatMetadata(ext);
}

export function getConverterMeta(slug: string): ConverterMetadata | null {
  return metadataEngine.getConverterMetadata(slug);
}

export function getPopularConverters(limit?: number): ConverterMetadata[] {
  return metadataEngine.getPopularConverters(limit);
}
