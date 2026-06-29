/**
 * lib/engine/dynamic-tool-engine.ts
 * Dynamic Tool Engine - auto-generates all tools from registries
 *
 * THE CORE PRINCIPLE: Every tool is generated from registries.
 * NO hardcoded converter definitions. NO duplicated tool definitions.
 * Single source of truth: Format Registry + Conversion Registry.
 *
 * Generates:
 * - Converters from Format Registry + Conversion Registry
 * - Viewers from Format Registry + Viewer Registry
 * - Editors from Format Registry + Editor Registry
 * - Processors from Format Registry + Capability Registry
 *
 * Integrates:
 * - Format Registry (formats, capabilities, metadata)
 * - Conversion Registry (valid conversions)
 * - Capability Registry (format capabilities)
 * - Relationship Registry (tool relationships)
 * - Provider Registry (processing providers)
 * - Viewer Registry (viewer engines)
 * - Editor Registry (editor definitions)
 * - Metadata Registry (display metadata)
 * - Tool Identity Registry (stable IDs)
 * - Knowledge Registry (technical knowledge)
 */

import type { FormatCategory, FormatTier } from '../types/formats';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { capabilityRegistry } from '../registry/capability-registry';
import { relationshipEngine, type RelationshipType } from '../registry/relationship-registry';
import { providerRegistry } from '../registry/provider-registry';
import { viewerRegistry } from '../registry/viewer-registry';
import { editorRegistry } from '../registry/editor-registry';
import { metadataEngine, type FormatMetadata, type ConverterMetadata } from '../registry/metadata-registry';
import { toolIdentityEngine, type ToolIdentity, type ToolType } from '../registry/tool-identity-registry';
import { aliasEngine } from './alias-engine';
import { mimeEngine } from './mime-engine';

// ---------------------------------------------------------------------------
// DYNAMIC TOOL TYPES
// ---------------------------------------------------------------------------

export interface DynamicTool {
  // Identity
  id: string;                    // Permanent stable ID (image_converter_png_jpg)
  slug: string;                  // URL slug (png-to-jpg)
  type: ToolType;                 // converter | viewer | editor | processor

  // Formats
  inputFormat?: string;          // Input format extension
  outputFormat?: string;         // Output format extension (converters)
  formats: string[];              // All formats involved

  // Category
  category: FormatCategory;
  categorySlug: string;          // Category route slug (image, video, document)

  // Display
  name: string;                  // Display name (PNG to JPG)
  shortName: string;             // Short name for navigation
  description: string;           // Tool description
  icon: string;                   // Icon identifier

  // Technical
  engine: string;                // Processing engine (canvas, ffmpeg, pdf-lib)
  provider: string;             // Provider ID (canvas, ffmpeg)
  operation: string;             // Operation type (image:convert)

  // Capabilities
  capabilities: DynamicToolCapabilities;

  // Metadata
  metadata: DynamicToolMetadata;

  // Relationships
  related: DynamicRelatedTool[];

  // Route
  route: string;                 // Full route path

  // Search
  searchKeywords: string[];
  searchPriority: number;

  // Status
  isPremium: boolean;
  isAvailable: boolean;
}

export interface DynamicToolCapabilities {
  hasTransparency: boolean;
  hasAnimation: boolean;
  hasLayers: boolean;
  isLossless: boolean;
  maxFileSize: number;
  maxFiles: number;
  supportsBatch: boolean;
  supportsOptions: string[];
}

export interface DynamicToolMetadata {
  // From Format Metadata
  inputMime: string;
  outputMime?: string;
  inputExt: string;
  outputExt?: string;
  inputName: string;
  outputName?: string;
  inputTier: FormatTier;
  outputTier?: FormatTier;

  // Warnings
  warnings: string[];

  // Reversibility
  isReversible: boolean;
  reverseSlug?: string;
  reverseId?: string;

  // Difficulty
  difficulty: 'easy' | 'medium' | 'advanced';

  // Popularity
  popularity: number;
}

export interface DynamicRelatedTool {
  id: string;
  slug: string;
  name: string;
  type: ToolType;
  relationshipType: RelationshipType;
  relationshipLabel: string;
  score: number;
}

export interface ToolGenerationOptions {
  includeDisabled?: boolean;
  includePremium?: boolean;
  limit?: number;
  category?: FormatCategory;
  type?: ToolType;
}

// ---------------------------------------------------------------------------
// CATEGORY TO ROUTE MAPPING
// ---------------------------------------------------------------------------

const CATEGORY_ROUTES: Record<FormatCategory, string> = {
  image: '/image-converter',
  raw: '/image-converter',
  vector: '/image-converter',
  icon: '/image-converter',
  cad: '/cad-converter',
  video: '/video-converter',
  audio: '/audio-converter',
  document: '/document-converter',
  archive: '/archive-converter',
  font: '/font-converter',
  gis: '/gis-converter',
  email: '/email-converter',
  code: '/code-converter',
  ebook: '/ebook-converter',
};

const CATEGORY_SLUGS: Record<FormatCategory, string> = {
  image: 'image',
  raw: 'image',
  vector: 'image',
  icon: 'image',
  cad: 'cad',
  video: 'video',
  audio: 'audio',
  document: 'document',
  archive: 'archive',
  font: 'font',
  gis: 'gis',
  email: 'email',
  code: 'code',
  ebook: 'ebook',
};

const TOOL_ICONS: Record<ToolType, string> = {
  converter: 'ArrowRightLeft',
  viewer: 'Eye',
  editor: 'Edit3',
  processor: 'Wand2',
  downloader: 'Download',
};

// ---------------------------------------------------------------------------
// DYNAMIC TOOL ENGINE CLASS
// ---------------------------------------------------------------------------

class DynamicToolEngine {
  private toolCache: Map<string, DynamicTool>;
  private slugCache: Map<string, DynamicTool>;
  private byTypeCache: Map<ToolType, DynamicTool[]>;
  private byCategoryCache: Map<FormatCategory, DynamicTool[]>;
  private initialized: boolean = false;

  constructor() {
    this.toolCache = new Map();
    this.slugCache = new Map();
    this.byTypeCache = new Map();
    this.byCategoryCache = new Map();
  }

  /**
   * Initialize the engine - generate all tools from registries
   */
  initialize(): void {
    if (this.initialized) return;

    // Generate converters from conversion registry
    this.generateConverters();

    // Generate viewers from format registry + viewer registry
    this.generateViewers();

    // Generate editors from format registry + editor registry
    this.generateEditors();

    // Generate processors from format registry
    this.generateProcessors();

    // Build indexes
    this.buildIndexes();

    this.initialized = true;
  }

  /**
   * Generate all converter tools from registries
   */
  private generateConverters(): void {
    const slugs = conversionRegistry.getAllSlugs();

    for (const slug of slugs) {
      const tool = this.generateConverterTool(slug);
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }
  }

  /**
   * Generate a single converter tool from slug
   */
  private generateConverterTool(slug: string): DynamicTool | null {
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || parsed.isSingleFormat || !parsed.outputFormat) return null;

    // Resolve canonical extensions
    const inputExt = aliasEngine.resolve(parsed.inputFormat);
    const outputExt = aliasEngine.resolve(parsed.outputFormat);

    // Get tool identity
    const identity = toolIdentityEngine.getBySlug(slug);
    if (!identity) return null;

    // Get format metadata
    const inputMeta = metadataEngine.getFormatMetadata(inputExt);
    const outputMeta = metadataEngine.getFormatMetadata(outputExt);
    if (!inputMeta || !outputMeta) return null;

    // Get converter metadata
    const converterMeta = metadataEngine.getConverterMetadata(slug);

    // Get provider
    const provider = this.selectProvider(inputExt, outputExt);

    // Get capabilities
    const capabilities = this.getToolCapabilities(inputExt, outputExt);

    // Get related tools
    const related = this.getRelatedTools(slug);

    // Get warnings
    const warnings = capabilityRegistry.getConversionWarnings(inputExt, outputExt);

    // Check reversibility
    const isReversible = conversionRegistry.isValid(outputExt, inputExt);
    const reverseSlug = isReversible ? `${outputExt}-to-${inputExt}` : null;
    const reverseId = isReversible ? toolIdentityEngine.slugToId(reverseSlug!) : null;

    // Build search keywords
    const searchKeywords = this.buildSearchKeywords(inputMeta, outputMeta);

    // Build route
    const categoryRoute = CATEGORY_ROUTES[parsed.inputCategory] || '/tools';
    const route = `${categoryRoute}/${slug}`;

    // Determine difficulty
    const difficulty = converterMeta?.difficulty || this.determineDifficulty(inputMeta, outputMeta);

    // Calculate popularity
    const popularity = converterMeta?.popularity || this.calculatePopularity(inputMeta, outputMeta);

    const tool: DynamicTool = {
      id: identity.id,
      slug: identity.slug,
      type: 'converter',
      inputFormat: inputExt,
      outputFormat: outputExt,
      formats: [inputExt, outputExt],
      category: parsed.inputCategory,
      categorySlug: CATEGORY_SLUGS[parsed.inputCategory] || 'other',
      name: converterMeta?.displayName || `${inputMeta.displayName} to ${outputMeta.displayName}`,
      shortName: converterMeta?.shortTitle || `${inputMeta.abbreviation} to ${outputMeta.abbreviation}`,
      description: `Convert ${inputMeta.displayName} files to ${outputMeta.displayName} format. Free online ${inputMeta.displayName.toLowerCase()} converter with no upload limits.`,
      icon: TOOL_ICONS.converter,
      engine: this.getEngine(inputExt, outputExt),
      provider: provider?.id || 'unknown',
      operation: conversionRegistry.inferOperation(inputExt, outputExt),
      capabilities,
      metadata: {
        inputMime: inputMeta.mime,
        outputMime: outputMeta.mime,
        inputExt: inputMeta.ext,
        outputExt: outputMeta.ext,
        inputName: inputMeta.name,
        outputName: outputMeta.name,
        inputTier: inputMeta.tier,
        outputTier: outputMeta.tier,
        warnings,
        isReversible,
        reverseSlug: reverseSlug || undefined,
        reverseId: reverseId || undefined,
        difficulty,
        popularity,
      },
      related,
      route,
      searchKeywords,
      searchPriority: Math.round((inputMeta.searchPriority + outputMeta.searchPriority) / 2 + popularity / 10),
      isPremium: false, // Premium determined by provider, not format tier
      isAvailable: !!provider,
    };

    return tool;
  }

  /**
   * Generate all viewer tools from registries
   */
  private generateViewers(): void {
    const viewableFormats = formatRegistry.getViewableFormats();

    for (const fmt of viewableFormats) {
      const tool = this.generateViewerTool(fmt.ext);
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }
  }

  /**
   * Generate a single viewer tool
   */
  private generateViewerTool(ext: string): DynamicTool | null {
    const canonical = aliasEngine.resolve(ext);
    const format = formatRegistry.get(canonical);
    if (!format || !format.viewerEngine || format.viewerEngine === 'none') return null;

    const identity = toolIdentityEngine.getBySlug(`viewer-${canonical}`);
    if (!identity) return null;

    const meta = metadataEngine.getFormatMetadata(canonical);
    if (!meta) return null;

    const viewerCap = viewerRegistry.getEngine(format.viewerEngine);
    if (!viewerCap) return null;

    const capabilities = this.getViewerCapabilities(canonical, viewerCap);
    const related = this.getRelatedToolsForFormat(canonical);
    const searchKeywords = this.buildFormatSearchKeywords(meta);

    const route = `/view/${canonical}`;

    const tool: DynamicTool = {
      id: identity.id,
      slug: identity.slug,
      type: 'viewer',
      inputFormat: canonical,
      formats: [canonical],
      category: format.category,
      categorySlug: CATEGORY_SLUGS[format.category] || 'other',
      name: `${meta.displayName} Viewer`,
      shortName: `View ${meta.abbreviation}`,
      description: `View ${meta.displayName} files online. No download required. Free online viewer.`,
      icon: TOOL_ICONS.viewer,
      engine: format.viewerEngine,
      provider: 'native',
      operation: 'view',
      capabilities,
      metadata: {
        inputMime: meta.mime,
        inputExt: meta.ext,
        inputName: meta.name,
        inputTier: meta.tier,
        warnings: [],
        isReversible: false,
        difficulty: 'easy',
        popularity: meta.searchPriority,
      },
      related,
      route,
      searchKeywords,
      searchPriority: meta.searchPriority - 10,
      isPremium: false, // Premium determined by viewer engine requirements
      isAvailable: true,
    };

    return tool;
  }

  /**
   * Generate all editor tools from registries
   */
  private generateEditors(): void {
    const editableFormats = formatRegistry.getEditableFormats();

    for (const fmt of editableFormats) {
      const tool = this.generateEditorTool(fmt.ext);
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }
  }

  /**
   * Generate a single editor tool
   */
  private generateEditorTool(ext: string): DynamicTool | null {
    const canonical = aliasEngine.resolve(ext);
    const format = formatRegistry.get(canonical);
    if (!format || format.editorCapability === 'none') return null;

    const identity = toolIdentityEngine.getBySlug(`editor-${canonical}`);
    if (!identity) return null;

    const meta = metadataEngine.getFormatMetadata(canonical);
    if (!meta) return null;

    const editorDef = editorRegistry.getEditorForFormat(canonical);
    if (!editorDef) return null;

    const capabilities = this.getEditorCapabilities(canonical, editorDef);
    const related = this.getRelatedToolsForFormat(canonical);
    const searchKeywords = this.buildFormatSearchKeywords(meta);

    const route = `/edit/${canonical}`;

    const tool: DynamicTool = {
      id: identity.id,
      slug: identity.slug,
      type: 'editor',
      inputFormat: canonical,
      formats: [canonical],
      category: format.category,
      categorySlug: CATEGORY_SLUGS[format.category] || 'other',
      name: `${meta.displayName} Editor`,
      shortName: `Edit ${meta.abbreviation}`,
      description: `Edit ${meta.displayName} files online. Crop, resize, rotate, and more.`,
      icon: TOOL_ICONS.editor,
      engine: editorDef.engine,
      provider: editorDef.engine,
      operation: 'edit',
      capabilities,
      metadata: {
        inputMime: meta.mime,
        inputExt: meta.ext,
        inputName: meta.name,
        inputTier: meta.tier,
        warnings: [],
        isReversible: false,
        difficulty: 'easy',
        popularity: meta.searchPriority - 20,
      },
      related,
      route,
      searchKeywords,
      searchPriority: meta.searchPriority - 20,
      isPremium: editorDef.premiumOnly ?? false,
      isAvailable: true,
    };

    return tool;
  }

  /**
   * Generate processor tools
   */
  private generateProcessors(): void {
    // Image processors
    const imageProcessors = [
      { id: 'image-cropper', name: 'Image Cropper', operation: 'image:crop' },
      { id: 'image-resizer', name: 'Image Resizer', operation: 'image:resize' },
      { id: 'image-compressor', name: 'Image Compressor', operation: 'image:compress' },
      { id: 'image-rotator', name: 'Image Rotator', operation: 'image:rotate' },
      { id: 'image-flip', name: 'Image Flipper', operation: 'image:flip' },
    ];

    for (const proc of imageProcessors) {
      const tool = this.generateProcessorTool(proc.id, proc.name, proc.operation, 'image', 'png');
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }

    // Video processors
    const videoProcessors = [
      { id: 'video-trimmer', name: 'Video Trimmer', operation: 'video:trim' },
      { id: 'video-compressor', name: 'Video Compressor', operation: 'video:compress' },
      { id: 'video-rotator', name: 'Video Rotator', operation: 'video:rotate' },
      { id: 'audio-extractor', name: 'Audio Extractor', operation: 'video:extract-audio' },
      { id: 'gif-maker', name: 'GIF Maker', operation: 'video:gif' },
    ];

    for (const proc of videoProcessors) {
      const tool = this.generateProcessorTool(proc.id, proc.name, proc.operation, 'video', 'mp4');
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }

    // Audio processors
    const audioProcessors = [
      { id: 'audio-trimmer', name: 'Audio Trimmer', operation: 'audio:trim' },
      { id: 'audio-compressor', name: 'Audio Compressor', operation: 'audio:compress' },
      { id: 'audio-normalizer', name: 'Audio Normalizer', operation: 'audio:normalize' },
    ];

    for (const proc of audioProcessors) {
      const tool = this.generateProcessorTool(proc.id, proc.name, proc.operation, 'audio', 'mp3');
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }

    // PDF processors
    const pdfProcessors = [
      { id: 'pdf-merger', name: 'PDF Merger', operation: 'pdf:merge' },
      { id: 'pdf-splitter', name: 'PDF Splitter', operation: 'pdf:split' },
      { id: 'pdf-compressor', name: 'PDF Compressor', operation: 'pdf:compress' },
      { id: 'pdf-protector', name: 'PDF Protector', operation: 'pdf:protect' },
      { id: 'pdf-unlocker', name: 'PDF Unlocker', operation: 'pdf:unlock' },
    ];

    for (const proc of pdfProcessors) {
      const tool = this.generateProcessorTool(proc.id, proc.name, proc.operation, 'document', 'pdf');
      if (tool) {
        this.toolCache.set(tool.id, tool);
        this.slugCache.set(tool.slug, tool);
      }
    }
  }

  /**
   * Generate a single processor tool
   */
  private generateProcessorTool(
    id: string,
    name: string,
    operation: string,
    category: FormatCategory,
    primaryFormat: string
  ): DynamicTool | null {
    const meta = metadataEngine.getFormatMetadata(primaryFormat);
    if (!meta) return null;

    const provider = this.selectProcessorProvider(operation);
    const categorySlug = CATEGORY_SLUGS[category] || 'other';

    const tool: DynamicTool = {
      id: `${categorySlug}_processor_${id}`,
      slug: id,
      type: 'processor',
      inputFormat: primaryFormat,
      formats: [primaryFormat],
      category,
      categorySlug,
      name,
      shortName: name,
      description: `${name} tool. Process ${meta.displayName} files online for free.`,
      icon: TOOL_ICONS.processor,
      engine: provider?.id || 'canvas',
      provider: provider?.id || 'canvas',
      operation,
      capabilities: {
        hasTransparency: meta.hasTransparency,
        hasAnimation: meta.hasAnimation,
        hasLayers: meta.hasLayers,
        isLossless: meta.isLossless,
        maxFileSize: provider?.capabilities.maxFileSize || 100 * 1024 * 1024,
        maxFiles: provider?.capabilities.maxFiles || 10,
        supportsBatch: true,
        supportsOptions: [],
      },
      metadata: {
        inputMime: meta.mime,
        inputExt: meta.ext,
        inputName: meta.name,
        inputTier: meta.tier,
        warnings: [],
        isReversible: false,
        difficulty: 'easy',
        popularity: 80,
      },
      related: [],
      route: `/tools/${id}`,
      searchKeywords: [name.toLowerCase(), operation.split(':')[1], category, primaryFormat],
      searchPriority: 85,
      isPremium: false,
      isAvailable: !!provider,
    };

    return tool;
  }

  /**
   * Build indexes for fast lookups
   */
  private buildIndexes(): void {
    // By type index
    for (const tool of Array.from(this.toolCache.values())) {
      if (!this.byTypeCache.has(tool.type)) {
        this.byTypeCache.set(tool.type, []);
      }
      this.byTypeCache.get(tool.type)!.push(tool);

      if (!this.byCategoryCache.has(tool.category)) {
        this.byCategoryCache.set(tool.category, []);
      }
      this.byCategoryCache.get(tool.category)!.push(tool);
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Get tool by ID
   */
  getById(id: string): DynamicTool | undefined {
    this.initialize();
    return this.toolCache.get(id);
  }

  /**
   * Get tool by slug
   */
  getBySlug(slug: string): DynamicTool | undefined {
    this.initialize();
    return this.slugCache.get(slug);
  }

  /**
   * Get tool by ID or slug
   */
  get(idOrSlug: string): DynamicTool | undefined {
    this.initialize();
    return this.toolCache.get(idOrSlug) || this.slugCache.get(idOrSlug);
  }

  /**
   * Check if tool exists
   */
  has(idOrSlug: string): boolean {
    this.initialize();
    return this.toolCache.has(idOrSlug) || this.slugCache.has(idOrSlug);
  }

  /**
   * Get all tools
   */
  getAll(options?: ToolGenerationOptions): DynamicTool[] {
    this.initialize();
    let tools = Array.from(this.toolCache.values());

    if (options) {
      if (options.type) {
        tools = tools.filter(t => t.type === options.type);
      }
      if (options.category) {
        tools = tools.filter(t => t.category === options.category);
      }
      if (!options.includePremium) {
        tools = tools.filter(t => !t.isPremium);
      }
      if (!options.includeDisabled) {
        tools = tools.filter(t => t.isAvailable);
      }
      if (options.limit) {
        tools = tools.slice(0, options.limit);
      }
    }

    return tools;
  }

  /**
   * Get tools by type
   */
  getByType(type: ToolType): DynamicTool[] {
    this.initialize();
    return this.byTypeCache.get(type) || [];
  }

  /**
   * Get tools by category
   */
  getByCategory(category: FormatCategory): DynamicTool[] {
    this.initialize();
    return this.byCategoryCache.get(category) || [];
  }

  /**
   * Get tools by input format
   */
  getByInputFormat(ext: string): DynamicTool[] {
    this.initialize();
    const canonical = aliasEngine.resolve(ext);
    return Array.from(this.toolCache.values())
      .filter(t => t.inputFormat === canonical);
  }

  /**
   * Get converter tools
   */
  getConverters(): DynamicTool[] {
    return this.getByType('converter');
  }

  /**
   * Get viewer tools
   */
  getViewers(): DynamicTool[] {
    return this.getByType('viewer');
  }

  /**
   * Get editor tools
   */
  getEditors(): DynamicTool[] {
    return this.getByType('editor');
  }

  /**
   * Get processor tools
   */
  getProcessors(): DynamicTool[] {
    return this.getByType('processor');
  }

  /**
   * Get popular tools
   */
  getPopular(limit: number = 20): DynamicTool[] {
    this.initialize();
    return Array.from(this.toolCache.values())
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, limit);
  }

  /**
   * Search tools
   */
  search(query: string, limit: number = 50): DynamicTool[] {
    this.initialize();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return Array.from(this.toolCache.values())
      .filter(t => {
        // Search in name, description, keywords
        if (t.name.toLowerCase().includes(q)) return true;
        if (t.description.toLowerCase().includes(q)) return true;
        if (t.searchKeywords.some(k => k.toLowerCase().includes(q))) return true;
        if (t.inputFormat?.includes(q)) return true;
        if (t.outputFormat?.includes(q)) return true;
        return false;
      })
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, limit);
  }

  /**
   * Get tool statistics
   */
  getStats(): {
    total: number;
    byType: Record<ToolType, number>;
    byCategory: Record<string, number>;
    available: number;
    premium: number;
  } {
    this.initialize();

    const byType: Record<ToolType, number> = {
      converter: 0,
      viewer: 0,
      editor: 0,
      processor: 0,
      downloader: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const tool of Array.from(this.toolCache.values())) {
      byType[tool.type] = (byType[tool.type] || 0) + 1;
      byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
    }

    return {
      total: this.toolCache.size,
      byType,
      byCategory,
      available: Array.from(this.toolCache.values()).filter(t => t.isAvailable).length,
      premium: Array.from(this.toolCache.values()).filter(t => t.isPremium).length,
    };
  }

  /**
   * Get all routes
   */
  getAllRoutes(): string[] {
    this.initialize();
    return Array.from(this.toolCache.values()).map(t => t.route);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.toolCache.clear();
    this.slugCache.clear();
    this.byTypeCache.clear();
    this.byCategoryCache.clear();
    this.initialized = false;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Select provider for conversion
   */
  private selectProvider(inputExt: string, outputExt: string) {
    const enabledProviders = providerRegistry.getEnabled();

    // Find provider that supports this conversion
    for (const provider of enabledProviders) {
      const caps = provider.capabilities;
      const inputSupported = caps.supportsFormats.includes(inputExt);
      const outputSupported = caps.supportsFormats.includes(outputExt);

      if (inputSupported || outputSupported) {
        return provider;
      }
    }

    // Fallback to canvas for images
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(inputExt)) {
      return providerRegistry.getConfig('canvas');
    }

    // Fallback to ffmpeg for video/audio
    if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'ogg'].includes(inputExt)) {
      return providerRegistry.getConfig('ffmpeg');
    }

    return null;
  }

  /**
   * Select provider for processor operation
   */
  private selectProcessorProvider(operation: string) {
    const enabledProviders = providerRegistry.getEnabled();
    const domain = operation.split(':')[0];

    for (const provider of enabledProviders) {
      if (provider.capabilities.supportsOperations.some(op => op.startsWith(domain))) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Get tool capabilities
   */
  private getToolCapabilities(inputExt: string, outputExt: string): DynamicToolCapabilities {
    const inputCaps = capabilityRegistry.getCapabilities(inputExt);
    const outputCaps = capabilityRegistry.getCapabilities(outputExt);
    const provider = this.selectProvider(inputExt, outputExt);

    return {
      hasTransparency: inputCaps?.transparency ?? false,
      hasAnimation: inputCaps?.animation ?? false,
      hasLayers: inputCaps?.layers ?? false,
      isLossless: outputCaps?.compression === 'lossless' || outputCaps?.compression === 'none',
      maxFileSize: provider?.capabilities.maxFileSize || 100 * 1024 * 1024,
      maxFiles: provider?.capabilities.maxFiles || 10,
      supportsBatch: true,
      supportsOptions: this.getSupportedOptions(inputExt, outputExt),
    };
  }

  /**
   * Get viewer capabilities
   */
  private getViewerCapabilities(ext: string, viewerCap: { maxFileSize?: number; supportedFeatures: string[] }): DynamicToolCapabilities {
    const caps = capabilityRegistry.getCapabilities(ext);

    return {
      hasTransparency: caps?.transparency ?? false,
      hasAnimation: caps?.animation ?? false,
      hasLayers: caps?.layers ?? false,
      isLossless: true,
      maxFileSize: viewerCap.maxFileSize || 100 * 1024 * 1024,
      maxFiles: 1,
      supportsBatch: false,
      supportsOptions: viewerCap.supportedFeatures,
    };
  }

  /**
   * Get editor capabilities
   */
  private getEditorCapabilities(ext: string, editorDef: { supportedFeatures: string[] }): DynamicToolCapabilities {
    const caps = capabilityRegistry.getCapabilities(ext);

    return {
      hasTransparency: caps?.transparency ?? false,
      hasAnimation: caps?.animation ?? false,
      hasLayers: caps?.layers ?? false,
      isLossless: true,
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 1,
      supportsBatch: false,
      supportsOptions: editorDef.supportedFeatures,
    };
  }

  /**
   * Get supported options for conversion
   */
  private getSupportedOptions(inputExt: string, outputExt: string): string[] {
    const options: string[] = [];

    // Quality option for lossy formats
    const outputCaps = capabilityRegistry.getCapabilities(outputExt);
    if (outputCaps?.compression === 'lossy') {
      options.push('quality');
    }

    // Resize option for images
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(inputExt)) {
      options.push('width', 'height', 'maintainAspect');
    }

    return options;
  }

  /**
   * Get related tools
   */
  private getRelatedTools(slug: string): DynamicRelatedTool[] {
    const related = relationshipEngine.getRelated(slug, 10);

    return related.map(r => ({
      id: toolIdentityEngine.slugToId(r.slug) || r.slug,
      slug: r.slug,
      name: `${r.inputName} to ${r.outputName}`,
      type: 'converter' as ToolType,
      relationshipType: r.relationshipType,
      relationshipLabel: r.relationshipLabel,
      score: r.score,
    }));
  }

  /**
   * Get related tools for format (viewer/editor)
   */
  private getRelatedToolsForFormat(ext: string): DynamicRelatedTool[] {
    const related: DynamicRelatedTool[] = [];
    const targets = conversionRegistry.getTargets(ext);

    // Top 3 conversion targets
    for (const target of targets.slice(0, 3)) {
      const slug = `${ext}-to-${target}`;
      const id = toolIdentityEngine.slugToId(slug);
      if (id) {
        related.push({
          id,
          slug,
          name: `${ext.toUpperCase()} to ${target.toUpperCase()}`,
          type: 'converter',
          relationshipType: 'same-input',
          relationshipLabel: 'Convert to',
          score: 0.9,
        });
      }
    }

    return related;
  }

  /**
   * Build search keywords for conversion
   */
  private buildSearchKeywords(input: FormatMetadata, output: FormatMetadata): string[] {
    const keywords = new Set<string>();

    // Extensions
    keywords.add(input.ext);
    keywords.add(output.ext);
    input.aliases.forEach(a => keywords.add(a));
    output.aliases.forEach(a => keywords.add(a));

    // Names
    keywords.add(input.name.toLowerCase());
    keywords.add(output.name.toLowerCase());
    keywords.add(input.lowercaseName);
    keywords.add(output.lowercaseName);

    // Category
    keywords.add(input.category);
    keywords.add(output.category);

    // MIME types
    keywords.add(input.mime);
    keywords.add(output.mime);

    // Common search terms
    keywords.add('convert');
    keywords.add('converter');
    keywords.add('to');

    return Array.from(keywords);
  }

  /**
   * Build search keywords for format
   */
  private buildFormatSearchKeywords(meta: FormatMetadata): string[] {
    const keywords = new Set<string>();

    keywords.add(meta.ext);
    meta.aliases.forEach(a => keywords.add(a));
    keywords.add(meta.name.toLowerCase());
    keywords.add(meta.lowercaseName);
    keywords.add(meta.category);
    keywords.add(meta.mime);
    keywords.add('view');
    keywords.add('viewer');
    keywords.add('online');

    return Array.from(keywords);
  }

  /**
   * Get engine for conversion
   */
  private getEngine(inputExt: string, outputExt: string): string {
    const provider = this.selectProvider(inputExt, outputExt);
    return provider?.id || 'unknown';
  }

  /**
   * Determine conversion difficulty
   */
  private determineDifficulty(input: FormatMetadata, output: FormatMetadata): 'easy' | 'medium' | 'advanced' {
    // Cross-category is advanced
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

    // Animation loss
    if (input.hasAnimation && !output.hasAnimation) {
      return 'medium';
    }

    return 'easy';
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularity(input: FormatMetadata, output: FormatMetadata): number {
    const inputPriority = input.searchPriority;
    const outputPriority = output.searchPriority;
    const inputVolume = formatRegistry.get(input.ext)?.searchVolume ?? 0;
    const outputVolume = formatRegistry.get(output.ext)?.searchVolume ?? 0;

    const priorityScore = (inputPriority + outputPriority) / 2;
    const volumeScore = Math.log10(inputVolume + outputVolume + 1) * 10;

    return Math.round(priorityScore + volumeScore);
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const dynamicToolEngine = new DynamicToolEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getTool(idOrSlug: string): DynamicTool | undefined {
  return dynamicToolEngine.get(idOrSlug);
}

export function getAllTools(options?: ToolGenerationOptions): DynamicTool[] {
  return dynamicToolEngine.getAll(options);
}

export function getToolsByType(type: ToolType): DynamicTool[] {
  return dynamicToolEngine.getByType(type);
}

export function getToolsByCategory(category: FormatCategory): DynamicTool[] {
  return dynamicToolEngine.getByCategory(category);
}

export function searchTools(query: string, limit?: number): DynamicTool[] {
  return dynamicToolEngine.search(query, limit);
}

export function getPopularTools(limit?: number): DynamicTool[] {
  return dynamicToolEngine.getPopular(limit);
}
