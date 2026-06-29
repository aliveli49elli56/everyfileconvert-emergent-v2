/**
 * lib/registry/unified-registry.ts
 * Unified tool registry - single source of truth for all tools
 * Links converters, viewers, editors, and future tool types
 */

import type { LucideIcon } from 'lucide-react';
import { ArrowRightLeft, Eye, CreditCard as Edit3, Wand as Wand2 } from 'lucide-react';
import { formatRegistry } from './format-registry';
import { conversionRegistry } from './conversion-registry';
import { viewerRegistry } from './viewer-registry';
import { editorRegistry } from './editor-registry';
import type { FormatDefinition, FormatCategory } from '../types/formats';

// ---------------------------------------------------------------------------
// TOOL TYPES
// ---------------------------------------------------------------------------

export type ToolType = 'converter' | 'viewer' | 'editor' | 'processor' | 'utility';

export interface UnifiedToolDefinition {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  icon: LucideIcon;
  inputFormat?: string;
  outputFormat?: string;
  category: FormatCategory;
  route: string;
  premiumOnly?: boolean;
  searchPriority: number;
  seoKeywords?: string[];
  relatedTools?: string[];
}

// ---------------------------------------------------------------------------
// GENERATE CONVERTER TOOLS FROM CONVERSION REGISTRY
// ---------------------------------------------------------------------------

function generateConverterTools(): UnifiedToolDefinition[] {
  const tools: UnifiedToolDefinition[] = [];
  const allSlugs = conversionRegistry.getAllSlugs();

  for (const slug of allSlugs) {
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || !parsed.outputFormat) continue;

    const inputFormat = formatRegistry.get(parsed.inputFormat);
    const categoryDef = formatRegistry.getCategory(parsed.inputCategory);
    const converterRoute = categoryDef?.converterRoute ?? '/tools';

    const tool: UnifiedToolDefinition = {
      id: slug,
      type: 'converter',
      name: `${parsed.inputName} to ${parsed.outputName}`,
      description: `Convert ${parsed.inputName} files to ${parsed.outputName} format. Free online converter with no upload required.`,
      icon: ArrowRightLeft,
      inputFormat: parsed.inputFormat,
      outputFormat: parsed.outputFormat,
      category: parsed.inputCategory,
      route: `${converterRoute}/${parsed.inputFormat}-to-${parsed.outputFormat}`,
      premiumOnly: inputFormat?.premiumOnly ?? false,
      searchPriority: (inputFormat?.searchPriority ?? 50) + (inputFormat?.searchVolume ? Math.min(inputFormat.searchVolume / 1000, 50) : 0),
      relatedTools: [],
    };

    tools.push(tool);
  }

  return tools;
}

// ---------------------------------------------------------------------------
// GENERATE VIEWER TOOLS FROM FORMAT REGISTRY
// ---------------------------------------------------------------------------

function generateViewerTools(): UnifiedToolDefinition[] {
  const tools: UnifiedToolDefinition[] = [];
  const viewableFormats = formatRegistry.getViewableFormats();

  for (const fmt of viewableFormats) {
    const viewerEngine = fmt.viewerEngine;
    if (!viewerEngine || viewerEngine === 'none') continue;

    const engineCap = viewerRegistry.getEngine(viewerEngine);
    if (!engineCap) continue;

    const tool: UnifiedToolDefinition = {
      id: `view-${fmt.ext}`,
      type: 'viewer',
      name: `${fmt.name} Viewer`,
      description: `View ${fmt.name} files online. No download required.`,
      icon: Eye,
      inputFormat: fmt.ext,
      category: fmt.category,
      route: `/view/${fmt.ext}`,
      premiumOnly: fmt.premiumOnly ?? false,
      searchPriority: (fmt.searchPriority ?? 50) - 10,
      relatedTools: [],
    };

    tools.push(tool);
  }

  return tools;
}

// ---------------------------------------------------------------------------
// GENERATE EDITOR TOOLS FROM EDITOR REGISTRY
// ---------------------------------------------------------------------------

function generateEditorTools(): UnifiedToolDefinition[] {
  const tools: UnifiedToolDefinition[] = [];
  const editors = editorRegistry.getAll();

  for (const editor of editors) {
    for (const inputFormat of editor.inputFormats) {
      const fmt = formatRegistry.get(inputFormat);
      if (!fmt) continue;

      const tool: UnifiedToolDefinition = {
        id: `edit-${fmt.ext}`,
        type: 'editor',
        name: `${fmt.name} Editor`,
        description: editor.description,
        icon: Edit3,
        inputFormat: fmt.ext,
        category: fmt.category,
        route: `/edit/${fmt.ext}`,
        premiumOnly: editor.premiumOnly ?? false,
        searchPriority: (fmt.searchPriority ?? 50) - 20,
        relatedTools: [],
      };

      tools.push(tool);
    }
  }

  return tools;
}

// ---------------------------------------------------------------------------
// STATIC PROCESSOR TOOLS (Tools from /tools/[toolId])
// ---------------------------------------------------------------------------

export const PROCESSOR_TOOLS: UnifiedToolDefinition[] = [
  // Image processors
  {
    id: 'image-cropper',
    type: 'processor',
    name: 'Image Cropper',
    description: 'Crop images to custom dimensions or aspect ratios',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/image-cropper',
    searchPriority: 90,
    relatedTools: ['image-resizer', 'image-rotator'],
  },
  {
    id: 'image-compressor',
    type: 'processor',
    name: 'Image Compressor',
    description: 'Reduce image file size while maintaining quality',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/image-compressor',
    searchPriority: 95,
    relatedTools: ['format-converter'],
  },
  {
    id: 'image-upscaler',
    type: 'processor',
    name: 'Image Upscaler',
    description: 'Increase image resolution using AI enhancement',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/image-upscaler',
    premiumOnly: true,
    searchPriority: 85,
    relatedTools: ['image-resizer'],
  },
  {
    id: 'image-rotator',
    type: 'processor',
    name: 'Image Rotator',
    description: 'Rotate and flip images to any angle',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/image-rotator',
    searchPriority: 80,
    relatedTools: ['image-cropper'],
  },
  {
    id: 'color-adjustments',
    type: 'processor',
    name: 'Color Adjustments',
    description: 'Adjust brightness, contrast, saturation, and hue',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/color-adjustments',
    searchPriority: 75,
    relatedTools: ['image-compressor'],
  },
  {
    id: 'background-remover',
    type: 'processor',
    name: 'Background Remover',
    description: 'Remove image backgrounds instantly with AI',
    icon: Wand2,
    inputFormat: 'png',
    category: 'image',
    route: '/tools/background-remover',
    premiumOnly: true,
    searchPriority: 95,
    relatedTools: ['image-cropper', 'format-converter'],
  },

  // Video processors
  {
    id: 'video-trimmer',
    type: 'processor',
    name: 'Video Trimmer',
    description: 'Cut and trim video clips to any length',
    icon: Wand2,
    inputFormat: 'mp4',
    category: 'video',
    route: '/tools/video-trimmer',
    searchPriority: 90,
    relatedTools: ['video-compressor'],
  },
  {
    id: 'video-compressor',
    type: 'processor',
    name: 'Video Compressor',
    description: 'Reduce video file size without quality loss',
    icon: Wand2,
    inputFormat: 'mp4',
    category: 'video',
    route: '/tools/video-compressor',
    searchPriority: 92,
    relatedTools: ['video-trimmer'],
  },
  {
    id: 'audio-extractor',
    type: 'processor',
    name: 'Audio Extractor',
    description: 'Extract audio track from any video file',
    icon: Wand2,
    inputFormat: 'mp4',
    category: 'video',
    route: '/tools/audio-extractor',
    searchPriority: 85,
    relatedTools: ['video-trimmer'],
  },
  {
    id: 'gif-maker',
    type: 'processor',
    name: 'GIF Maker',
    description: 'Convert video clips to animated GIFs',
    icon: Wand2,
    inputFormat: 'mp4',
    category: 'video',
    route: '/tools/gif-maker',
    searchPriority: 88,
    relatedTools: ['video-trimmer'],
  },

  // Audio processors
  {
    id: 'audio-trimmer',
    type: 'processor',
    name: 'Audio Trimmer',
    description: 'Cut audio to specific start and end times',
    icon: Wand2,
    inputFormat: 'mp3',
    category: 'audio',
    route: '/tools/audio-trimmer',
    searchPriority: 80,
    relatedTools: ['audio-compressor'],
  },
  {
    id: 'audio-compressor',
    type: 'processor',
    name: 'Audio Compressor',
    description: 'Reduce audio file size by adjusting bitrate',
    icon: Wand2,
    inputFormat: 'mp3',
    category: 'audio',
    route: '/tools/audio-compressor',
    searchPriority: 82,
    relatedTools: ['audio-trimmer'],
  },
  {
    id: 'volume-normalizer',
    type: 'processor',
    name: 'Volume Normalizer',
    description: 'Normalize audio volume to standard levels',
    icon: Wand2,
    inputFormat: 'mp3',
    category: 'audio',
    route: '/tools/volume-normalizer',
    searchPriority: 75,
    relatedTools: ['audio-compressor'],
  },

  // PDF processors
  {
    id: 'pdf-merger',
    type: 'processor',
    name: 'PDF Merger',
    description: 'Combine multiple PDF files into one',
    icon: Wand2,
    inputFormat: 'pdf',
    category: 'document',
    route: '/tools/pdf-merger',
    searchPriority: 88,
    relatedTools: ['pdf-splitter'],
  },
  {
    id: 'pdf-splitter',
    type: 'processor',
    name: 'PDF Splitter',
    description: 'Split PDF into individual pages or sections',
    icon: Wand2,
    inputFormat: 'pdf',
    category: 'document',
    route: '/tools/pdf-splitter',
    searchPriority: 85,
    relatedTools: ['pdf-merger'],
  },
  {
    id: 'pdf-compressor',
    type: 'processor',
    name: 'PDF Compressor',
    description: 'Reduce PDF file size while maintaining quality',
    icon: Wand2,
    inputFormat: 'pdf',
    category: 'document',
    route: '/tools/pdf-compressor',
    searchPriority: 90,
    relatedTools: ['pdf-merger'],
  },
  {
    id: 'pdf-protect',
    type: 'processor',
    name: 'PDF Protect',
    description: 'Add password protection to PDF documents',
    icon: Wand2,
    inputFormat: 'pdf',
    category: 'document',
    route: '/tools/pdf-protect',
    searchPriority: 70,
    relatedTools: ['pdf-unlock'],
  },
  {
    id: 'pdf-unlock',
    type: 'processor',
    name: 'PDF Unlock',
    description: 'Remove password from protected PDF files',
    icon: Wand2,
    inputFormat: 'pdf',
    category: 'document',
    route: '/tools/pdf-unlock',
    searchPriority: 68,
    relatedTools: ['pdf-protect'],
  },
];

// ---------------------------------------------------------------------------
// UNIFIED REGISTRY CLASS
// ---------------------------------------------------------------------------

class UnifiedRegistry {
  private tools: Map<string, UnifiedToolDefinition>;
  private converters: UnifiedToolDefinition[];
  private viewers: UnifiedToolDefinition[];
  private editors: UnifiedToolDefinition[];
  private processors: UnifiedToolDefinition[];

  constructor() {
    this.converters = generateConverterTools();
    this.viewers = generateViewerTools();
    this.editors = generateEditorTools();
    this.processors = PROCESSOR_TOOLS;

    this.tools = new Map();

    // Index all tools
    for (const tool of [...this.converters, ...this.viewers, ...this.editors, ...this.processors]) {
      this.tools.set(tool.id, tool);
    }
  }

  /** Get tool by ID */
  get(id: string): UnifiedToolDefinition | undefined {
    return this.tools.get(id);
  }

  /** Check if tool exists */
  has(id: string): boolean {
    return this.tools.has(id);
  }

  /** Get all tools */
  getAll(): UnifiedToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /** Get tools by type */
  getByType(type: ToolType): UnifiedToolDefinition[] {
    switch (type) {
      case 'converter': return [...this.converters];
      case 'viewer': return [...this.viewers];
      case 'editor': return [...this.editors];
      case 'processor': return [...this.processors];
      default: return [];
    }
  }

  /** Get tools by category */
  getByCategory(category: FormatCategory): UnifiedToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  /** Get tools by input format */
  getByInputFormat(ext: string): UnifiedToolDefinition[] {
    const lowerExt = ext.toLowerCase();
    return Array.from(this.tools.values()).filter(t => t.inputFormat === lowerExt);
  }

  /** Get tools by route */
  getByRoute(route: string): UnifiedToolDefinition | undefined {
    return Array.from(this.tools.values()).find(t => t.route === route);
  }

  /** Search tools */
  search(query: string): UnifiedToolDefinition[] {
    const q = query.toLowerCase();
    return Array.from(this.tools.values())
      .filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
      .sort((a, b) => b.searchPriority - a.searchPriority);
  }

  /** Get popular tools */
  getPopular(limit = 20): UnifiedToolDefinition[] {
    return Array.from(this.tools.values())
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, limit);
  }

  /** Get premium tools */
  getPremiumTools(): UnifiedToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.premiumOnly);
  }

  /** Get free tools */
  getFreeTools(): UnifiedToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => !t.premiumOnly);
  }

  /** Get related tools */
  getRelatedTools(toolId: string, limit = 5): UnifiedToolDefinition[] {
    const tool = this.tools.get(toolId);
    if (!tool) return [];

    const related: UnifiedToolDefinition[] = [];
    const seen = new Set<string>([toolId]);

    // From tool's related list
    if (tool.relatedTools) {
      for (const id of tool.relatedTools) {
        if (seen.has(id)) continue;
        const r = this.tools.get(id);
        if (r) {
          related.push(r);
          seen.add(id);
        }
      }
    }

    // Tools with same input format
    if (tool.inputFormat && related.length < limit) {
      for (const t of this.getByInputFormat(tool.inputFormat)) {
        if (seen.has(t.id)) continue;
        related.push(t);
        seen.add(t.id);
        if (related.length >= limit) break;
      }
    }

    // Tools in same category
    if (related.length < limit) {
      for (const t of this.getByCategory(tool.category)) {
        if (seen.has(t.id)) continue;
        related.push(t);
        seen.add(t.id);
        if (related.length >= limit) break;
      }
    }

    return related.slice(0, limit);
  }

  /** Get tool count */
  count(): { total: number; converters: number; viewers: number; editors: number; processors: number } {
    return {
      total: this.tools.size,
      converters: this.converters.length,
      viewers: this.viewers.length,
      editors: this.editors.length,
      processors: this.processors.length,
    };
  }

  /** Get all routes for sitemap */
  getAllRoutes(): string[] {
    return Array.from(this.tools.values()).map(t => t.route);
  }

  /** Get tools for SEO long-tail pages */
  getSeoTools(limit = 1000): UnifiedToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(t => t.type === 'converter')
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, limit);
  }
}

export const unifiedRegistry = new UnifiedRegistry();
