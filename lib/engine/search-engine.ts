/**
 * lib/engine/search-engine.ts
 * Auto Search Engine - generates search index from registries
 *
 * Auto-builds search index from:
 * - Format Registry (extensions, names, MIME types, aliases)
 * - Conversion Registry (conversion slugs)
 * - Viewer Registry (viewer routes)
 * - Editor Registry (editor routes)
 * - Knowledge Registry (alternative names, technical terms)
 *
 * NO hardcoded search entries. All derived from registries.
 */

import type { FormatCategory } from '../types/formats';
import { dynamicToolEngine, type DynamicTool } from './dynamic-tool-engine';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { metadataEngine, type FormatMetadata } from '../registry/metadata-registry';
import { aliasEngine } from './alias-engine';
import { mimeEngine } from './mime-engine';
import { categoryEngine } from './category-engine';

// ---------------------------------------------------------------------------
// SEARCH TYPES
// ---------------------------------------------------------------------------

export interface SearchDocument {
  id: string;
  type: 'tool' | 'format' | 'category';
  slug: string;
  name: string;
  shortName: string;
  description: string;
  route: string;
  category: FormatCategory;
  keywords: string[];
  priority: number;
  isPremium: boolean;
  isAvailable: boolean;

  // For tools
  inputFormat?: string;
  outputFormat?: string;
  toolType?: string;
  operation?: string;

  // For formats
  ext?: string;
  mime?: string;
  aliases?: string[];

  // Scoring
  score?: number;
}

export interface SearchOptions {
  limit?: number;
  types?: ('tool' | 'format' | 'category')[];
  categories?: FormatCategory[];
  includePremium?: boolean;
  minScore?: number;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
  matchedField: string;
  highlights: { field: string; snippet: string }[];
}

// ---------------------------------------------------------------------------
// SEARCH INDEX CLASS
// ---------------------------------------------------------------------------

class SearchIndex {
  private documents: Map<string, SearchDocument>;
  private invertedIndex: Map<string, Set<string>>;
  private trigramIndex: Map<string, Set<string>>;
  private prefixIndex: Map<string, Set<string>>;

  constructor() {
    this.documents = new Map();
    this.invertedIndex = new Map();
    this.trigramIndex = new Map();
    this.prefixIndex = new Map();
  }

  add(doc: SearchDocument): void {
    this.documents.set(doc.id, doc);

    // Index all keywords
    for (const keyword of doc.keywords) {
      const normalized = keyword.toLowerCase();
      this.addToIndex(this.invertedIndex, normalized, doc.id);
      this.addTrigrams(normalized, doc.id);
      this.addPrefixes(normalized, doc.id);
    }

    // Index name
    const nameWords = doc.name.toLowerCase().split(/\s+/);
    for (const word of nameWords) {
      this.addToIndex(this.invertedIndex, word, doc.id);
      this.addTrigrams(word, doc.id);
      this.addPrefixes(word, doc.id);
    }

    // Index description words
    const descWords = doc.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length >= 3) {
        this.addToIndex(this.invertedIndex, word, doc.id);
      }
    }
  }

  private addToIndex(index: Map<string, Set<string>>, key: string, docId: string): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(docId);
  }

  private addTrigrams(text: string, docId: string): void {
    const normalized = text.toLowerCase();
    for (let i = 0; i <= normalized.length - 3; i++) {
      const trigram = normalized.slice(i, i + 3);
      this.addToIndex(this.trigramIndex, trigram, docId);
    }
  }

  private addPrefixes(text: string, docId: string): void {
    const normalized = text.toLowerCase();
    for (let len = 2; len <= normalized.length; len++) {
      const prefix = normalized.slice(0, len);
      this.addToIndex(this.prefixIndex, prefix, docId);
    }
  }

  search(query: string): Set<string> {
    const normalized = query.toLowerCase().trim();
    const results = new Set<string>();

    // Exact match
    const exact = this.invertedIndex.get(normalized);
    if (exact) {
      for (const id of Array.from(exact)) results.add(id);
    }

    // Prefix match
    const prefixKeys = Array.from(this.invertedIndex.keys())
      .filter(k => k.startsWith(normalized));
    for (const key of prefixKeys) {
      const docs = this.invertedIndex.get(key);
      if (docs) {
        for (const id of Array.from(docs)) results.add(id);
      }
    }

    // Contains match
    for (const [key, docs] of Array.from(this.invertedIndex)) {
      if (key.includes(normalized)) {
        for (const id of Array.from(docs)) results.add(id);
      }
    }

    return results;
  }

  get(id: string): SearchDocument | undefined {
    return this.documents.get(id);
  }

  getAll(): SearchDocument[] {
    return Array.from(this.documents.values());
  }

  clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.trigramIndex.clear();
    this.prefixIndex.clear();
  }
}

// ---------------------------------------------------------------------------
// SEARCH ENGINE CLASS
// ---------------------------------------------------------------------------

class SearchEngine {
  private index: SearchIndex;
  private initialized: boolean = false;

  // Common search aliases
  private SEARCH_ALIASES: Record<string, string[]> = {
    'jpg': ['jpeg', 'jpe', 'jfif'],
    'jpeg': ['jpg', 'jpe', 'jfif'],
    'mpeg': ['mpg', 'mp2', 'mpe'],
    'mpg': ['mpeg', 'mp2', 'mpe'],
    'tiff': ['tif'],
    'tif': ['tiff'],
    'aiff': ['aif', 'aifc'],
    'word': ['doc', 'docx'],
    'excel': ['xls', 'xlsx'],
    'powerpoint': ['ppt', 'pptx'],
    'photoshop': ['psd'],
    'illustrator': ['ai'],
    'after effects': ['aep'],
    'premiere': ['prproj'],
    'cad': ['dwg', 'dxf'],
  };

  constructor() {
    this.index = new SearchIndex();
  }

  /**
   * Initialize search index from registries
   */
  initialize(): void {
    if (this.initialized) return;

    // Index all tools
    this.indexTools();

    // Index all formats
    this.indexFormats();

    // Index categories
    this.indexCategories();

    this.initialized = true;
  }

  /**
   * Index all tools from Dynamic Tool Engine
   */
  private indexTools(): void {
    const tools = dynamicToolEngine.getAll();

    for (const tool of tools) {
      const doc: SearchDocument = {
        id: tool.id,
        type: 'tool',
        slug: tool.slug,
        name: tool.name,
        shortName: tool.shortName,
        description: tool.description,
        route: tool.route,
        category: tool.category,
        keywords: tool.searchKeywords,
        priority: tool.searchPriority,
        isPremium: tool.isPremium,
        isAvailable: tool.isAvailable,
        inputFormat: tool.inputFormat,
        outputFormat: tool.outputFormat,
        toolType: tool.type,
        operation: tool.operation,
      };

      this.index.add(doc);
    }
  }

  /**
   * Index all formats from Format Registry
   */
  private indexFormats(): void {
    const formats = formatRegistry.getAll();

    for (const format of formats) {
      const meta = metadataEngine.getFormatMetadata(format.ext);
      if (!meta) continue;

      // Build keywords from multiple sources
      const keywords = new Set<string>();

      // Extension
      keywords.add(format.ext);
      keywords.add(format.ext.toUpperCase());

      // Aliases
      meta.aliases.forEach(a => keywords.add(a));

      // Names
      keywords.add(format.name);
      keywords.add(format.name.toLowerCase());
      keywords.add(meta.displayName);
      keywords.add(meta.lowercaseName);
      keywords.add(meta.shortName);
      keywords.add(meta.abbreviation);

      // MIME type
      keywords.add(meta.mime);
      meta.altMimes.forEach(m => keywords.add(m));

      // Category
      keywords.add(format.category);
      keywords.add(meta.category);

      // Family
      if (meta.family) {
        keywords.add(meta.family);
      }

      // Common search terms
      if (format.category === 'image') {
        keywords.add('photo');
        keywords.add('picture');
        keywords.add('graphic');
      }
      if (format.category === 'video') {
        keywords.add('movie');
        keywords.add('clip');
      }
      if (format.category === 'audio') {
        keywords.add('music');
        keywords.add('sound');
      }

      // Popular conversions
      meta.popularConversions.forEach(c => keywords.add(c));

      // Build description
      const description = this.buildFormatDescription(format.ext, meta);

      const doc: SearchDocument = {
        id: `format-${format.ext}`,
        type: 'format',
        slug: format.ext,
        name: format.name,
        shortName: meta.shortName,
        description,
        route: `/format/${format.ext}`,
        category: format.category,
        keywords: Array.from(keywords),
        priority: meta.searchPriority,
        isPremium: false, // Premium determined by provider requirements
        isAvailable: true,
        ext: format.ext,
        mime: meta.mime,
        aliases: meta.aliases,
      };

      this.index.add(doc);
    }
  }

  /**
   * Index all categories
   */
  private indexCategories(): void {
    const categories = categoryEngine.getAllCategories();

    for (const cat of categories) {
      const keywords = new Set<string>();

      keywords.add(cat.id);
      keywords.add(cat.name);
      keywords.add(cat.pluralName);
      keywords.add(cat.slug);
      keywords.add(cat.description.split(' ')[0]);

      // Common aliases
      if (cat.id === 'image') {
        keywords.add('photo');
        keywords.add('picture');
        keywords.add('graphic');
      }
      if (cat.id === 'document') {
        keywords.add('office');
        keywords.add('doc');
      }
      if (cat.id === 'cad') {
        keywords.add('3d');
        keywords.add('engineering');
      }

      const doc: SearchDocument = {
        id: `category-${cat.id}`,
        type: 'category',
        slug: cat.slug,
        name: cat.name,
        shortName: cat.name,
        description: cat.description,
        route: cat.route,
        category: cat.id,
        keywords: Array.from(keywords),
        priority: cat.sortPriority,
        isPremium: false,
        isAvailable: true,
      };

      this.index.add(doc);
    }
  }

  /**
   * Build format description
   */
  private buildFormatDescription(ext: string, meta: FormatMetadata): string {
    const parts: string[] = [];

    parts.push(`${meta.displayName} (${ext.toUpperCase()})`);
    parts.push(`- ${meta.category} format.`);

    if (meta.hasTransparency) parts.push('Supports transparency.');
    if (meta.hasAnimation) parts.push('Supports animation.');
    if (meta.hasLayers) parts.push('Supports layers.');
    if (meta.isLossless) parts.push('Lossless compression.');
    if (meta.browserNative) parts.push('Native browser support.');

    return parts.join(' ');
  }

  /**
   * Search for documents
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    this.initialize();

    const normalized = query.toLowerCase().trim();
    if (!normalized) return [];

    // Expand query with aliases
    const expandedQueries = this.expandQuery(normalized);

    // Get matching document IDs
    const matchingIds = new Set<string>();
    for (const q of expandedQueries) {
      const results = this.index.search(q);
      for (const id of Array.from(results)) matchingIds.add(id);
    }

    // Build results
    const results: SearchResult[] = [];

    for (const id of Array.from(matchingIds)) {
      const doc = this.index.get(id);
      if (!doc) continue;

      // Apply filters
      if (options?.types && !options.types.includes(doc.type)) continue;
      if (options?.categories && !options.categories.includes(doc.category)) continue;
      if (!options?.includePremium && doc.isPremium) continue;
      if (doc.priority < (options?.minScore || 0)) continue;

      // Calculate score
      const { score, matchType, matchedField, highlights } = this.calculateScore(query, doc);

      results.push({
        document: doc,
        score,
        matchType,
        matchedField,
        highlights,
      });
    }

    // Sort by score and priority
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.document.priority - a.document.priority;
    });

    // Apply limit
    const limit = options?.limit || 50;
    return results.slice(0, limit);
  }

  /**
   * Expand query with aliases
   */
  private expandQuery(query: string): string[] {
    const queries = [query];

    // Check for aliases
    for (const [key, aliases] of Object.entries(this.SEARCH_ALIASES)) {
      if (query.includes(key)) {
        for (const alias of aliases) {
          queries.push(query.replace(key, alias));
        }
      }
    }

    return queries;
  }

  /**
   * Calculate match score
   */
  private calculateScore(query: string, doc: SearchDocument): {
    score: number;
    matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
    matchedField: string;
    highlights: { field: string; snippet: string }[];
  } {
    const normalized = query.toLowerCase();
    let maxScore = 0;
    let bestMatch: 'exact' | 'prefix' | 'contains' | 'fuzzy' = 'fuzzy';
    let bestField = 'name';
    const highlights: { field: string; snippet: string }[] = [];

    // Check each field
    const fields = [
      { name: 'id', value: doc.id, weight: 100 },
      { name: 'slug', value: doc.slug, weight: 95 },
      { name: 'name', value: doc.name.toLowerCase(), weight: 90 },
      { name: 'shortName', value: doc.shortName.toLowerCase(), weight: 80 },
      { name: 'ext', value: doc.ext?.toLowerCase() || '', weight: 100 },
      { name: 'inputFormat', value: doc.inputFormat?.toLowerCase() || '', weight: 85 },
      { name: 'outputFormat', value: doc.outputFormat?.toLowerCase() || '', weight: 85 },
    ];

    for (const field of fields) {
      if (!field.value) continue;

      // Exact match
      if (field.value === normalized) {
        const score = field.weight * 1.0 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'exact';
          bestField = field.name;
        }
        continue;
      }

      // Prefix match
      if (field.value.startsWith(normalized)) {
        const score = field.weight * 0.9 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'prefix';
          bestField = field.name;
        }
        continue;
      }

      // Contains match
      if (field.value.includes(normalized)) {
        const score = field.weight * 0.7 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'contains';
          bestField = field.name;
        }
      }
    }

    // Check keywords (fuzzy match)
    for (const keyword of doc.keywords) {
      if (keyword.toLowerCase() === normalized) {
        const score = 60 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'exact';
          bestField = 'keywords';
        }
      } else if (keyword.toLowerCase().startsWith(normalized)) {
        const score = 50 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'prefix';
          bestField = 'keywords';
        }
      } else if (keyword.toLowerCase().includes(normalized)) {
        const score = 40 + doc.priority * 0.1;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = 'contains';
          bestField = 'keywords';
        }
      }
    }

    // Build highlight snippet
    if (doc.name.toLowerCase().includes(normalized)) {
      highlights.push({
        field: 'name',
        snippet: this.highlightMatch(doc.name, normalized),
      });
    }

    if (doc.description.toLowerCase().includes(normalized)) {
      highlights.push({
        field: 'description',
        snippet: this.highlightMatch(doc.description, normalized),
      });
    }

    return {
      score: Math.round(maxScore * 10) / 10,
      matchType: bestMatch,
      matchedField: bestField,
      highlights,
    };
  }

  /**
   * Create highlighted snippet
   */
  private highlightMatch(text: string, query: string): string {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 100);

    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + query.length + 30);

    let snippet = text.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Quick search for autocomplete
   */
  quickSearch(query: string, limit: number = 10): SearchResult[] {
    return this.search(query, { limit, minScore: 50 });
  }

  /**
   * Search by extension
   */
  searchByExtension(ext: string): SearchResult[] {
    const canonical = aliasEngine.resolve(ext);
    return this.search(canonical, { limit: 20 });
  }

  /**
   * Search by MIME type
   */
  searchByMime(mime: string): SearchResult[] {
    const ext = mimeEngine.getExtension(mime);
    if (ext) {
      return this.searchByExtension(ext);
    }
    return this.search(mime, { limit: 20 });
  }

  /**
   * Get suggestions for query
   */
  getSuggestions(query: string, limit: number = 10): string[] {
    const results = this.quickSearch(query, limit * 2);
    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const result of results) {
      const suggestion = result.document.name;
      if (!seen.has(suggestion)) {
        seen.add(suggestion);
        suggestions.push(suggestion);
      }
      if (suggestions.length >= limit) break;
    }

    return suggestions;
  }

  /**
   * Get all search keywords
   */
  getAllKeywords(): string[] {
    this.initialize();
    const keywords = new Set<string>();

    for (const doc of this.index.getAll()) {
      for (const keyword of doc.keywords) {
        keywords.add(keyword.toLowerCase());
      }
    }

    return Array.from(keywords).sort();
  }

  /**
   * Get search statistics
   */
  getStats(): {
    documents: number;
    keywords: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    this.initialize();

    const docs = this.index.getAll();
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const doc of docs) {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    }

    return {
      documents: docs.length,
      keywords: this.getAllKeywords().length,
      byType,
      byCategory,
    };
  }

  /**
   * Clear search index
   */
  clearIndex(): void {
    this.index.clear();
    this.initialized = false;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const searchEngine = new SearchEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function search(query: string, options?: SearchOptions): SearchResult[] {
  return searchEngine.search(query, options);
}

export function quickSearch(query: string, limit?: number): SearchResult[] {
  return searchEngine.quickSearch(query, limit);
}

export function getSuggestions(query: string, limit?: number): string[] {
  return searchEngine.getSuggestions(query, limit);
}
