/**
 * lib/engine/related-tool-engine.ts
 * Related Tool Engine — Phase 7
 *
 * Maps format categories to relevant tool operations.
 * Reads from the existing dynamic tool engine / tool registry — no hardcoded lists.
 *
 * Returns tools sorted by relevance for a given context (format, category, slug).
 */

import type { FormatCategory } from '../types/formats';
import { dynamicToolEngine, type DynamicTool } from './dynamic-tool-engine';

// ---------------------------------------------------------------------------
// CATEGORY → OPERATION PRIORITY MAP
// ---------------------------------------------------------------------------

// Maps each category to a list of operation keywords that are most relevant.
// The engine searches the DynamicTool metadata for matching terms.
const CATEGORY_OPERATIONS: Record<FormatCategory, string[]> = {
  image:        ['resize', 'crop', 'compress', 'rotate', 'flip', 'watermark', 'background', 'upscale', 'color', 'blur', 'sharpen', 'grayscale'],
  raw:          ['convert', 'resize', 'compress', 'color'],
  vector:       ['convert', 'resize', 'optimize'],
  icon:         ['convert', 'resize'],
  video:        ['trim', 'compress', 'rotate', 'subtitle', 'audio', 'gif', 'speed', 'batch'],
  audio:        ['compress', 'trim', 'merge', 'normalize', 'pitch', 'speed', 'record', 'waveform'],
  pdf:          ['merge', 'split', 'compress', 'protect', 'rotate', 'watermark', 'convert', 'page'],
  document:     ['convert', 'merge', 'compress', 'edit'],
  spreadsheet:  ['convert', 'merge', 'compress'],
  presentation: ['convert', 'compress'],
  ebook:        ['convert', 'compress', 'metadata'],
  archive:      ['compress', 'extract', 'convert'],
  font:         ['convert', 'subset', 'optimize'],
  '3d':         ['convert', 'optimize'],
  cad:          ['convert', 'view', 'export'],
  gis:          ['convert', 'view'],
  email:        ['convert', 'view'],
  code:         ['format', 'convert', 'minify'],
  webpage:      ['convert', 'screenshot', 'pdf'],
  subtitle:     ['convert', 'sync', 'edit'],
  certificate:  ['convert', 'view'],
  scientific:   ['convert', 'view'],
  medical:      ['convert', 'view'],
  'disk-image': ['convert', 'extract'],
  executable:   ['convert', 'extract'],
  other:        ['convert'],
};

// ---------------------------------------------------------------------------
// ENGINE CLASS
// ---------------------------------------------------------------------------

class RelatedToolEngine {
  private cache = new Map<string, DynamicTool[]>();

  /**
   * Get related tools for a given format category.
   * Reads from DynamicToolEngine — no hardcoded lists.
   */
  getToolsForCategory(
    category: FormatCategory,
    limit    = 8,
  ): DynamicTool[] {
    const key = `cat:${category}:${limit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const ops = CATEGORY_OPERATIONS[category] ?? ['convert'];
    const allTools = dynamicToolEngine.getAll();

    // Score each tool by how many operation keywords it matches
    const scored = allTools
      .filter(t => !t.isPremium && t.isAvailable)
      .map(tool => {
        const searchable = [
          tool.slug,
          tool.name.toLowerCase(),
          tool.description.toLowerCase(),
          tool.category,
          tool.type,
          tool.operation ?? '',
        ].join(' ');

        const score = ops.reduce((acc, op) => acc + (searchable.includes(op) ? 1 : 0), 0);
        // Boost tools in the same category
        const categoryBoost = tool.category === category ? 3 : 0;

        return { tool, score: score + categoryBoost };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.tool)
      .slice(0, limit);

    this.cache.set(key, scored);
    return scored;
  }

  /**
   * Get related tools for a specific format.
   * Falls back to category-level tools if no format-specific ones found.
   */
  getToolsForFormat(
    format:   string,
    category: FormatCategory,
    limit    = 8,
  ): DynamicTool[] {
    const key = `fmt:${format}:${category}:${limit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const allTools = dynamicToolEngine.getAll();

    // Match tools whose inputFormat includes this format
    const formatSpecific = allTools
      .filter(t =>
        !t.isPremium &&
        t.isAvailable &&
        (t.inputFormat === format || t.category === category)
      )
      .slice(0, limit);

    if (formatSpecific.length >= limit) {
      this.cache.set(key, formatSpecific);
      return formatSpecific;
    }

    // Pad with category-level tools
    const catTools = this.getToolsForCategory(category, limit - formatSpecific.length);
    const seen     = new Set(formatSpecific.map(t => t.slug));
    const extra    = catTools.filter(t => !seen.has(t.slug));

    const result = [...formatSpecific, ...extra].slice(0, limit);
    this.cache.set(key, result);
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const relatedToolEngine = new RelatedToolEngine();
