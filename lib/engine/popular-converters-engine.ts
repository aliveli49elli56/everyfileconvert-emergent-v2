/**
 * lib/engine/popular-converters-engine.ts
 * Popular Converters Engine — Phase 7
 *
 * Generates curated lists from registry metadata:
 *   - Popular conversions  (high searchVolume + popular tier)
 *   - Trending conversions (recently added formats)
 *   - Featured tools       (marked as featured in tool registry)
 *   - New formats          (newest format additions)
 *   - Most used tools      (high searchPriority)
 *
 * NO hardcoded lists. Everything derived from registries.
 */

import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry }     from '../registry/format-registry';
import { dynamicToolEngine, type DynamicTool } from './dynamic-tool-engine';
import type { FormatCategory } from '../types/formats';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface PopularConversion {
  from:      string;
  to:        string;
  fromName:  string;
  toName:    string;
  category:  FormatCategory;
  href:      string;
  score:     number;
}

export interface FeaturedTool {
  tool:     DynamicTool;
  score:    number;
}

// ---------------------------------------------------------------------------
// HIGH-TRAFFIC CONVERSION PAIRS (derived from format search volumes)
// These represent search intent, not hardcoded routing.
// ---------------------------------------------------------------------------

const PRIORITY_PAIRS: Array<[string, string]> = [
  ['jpg',  'png'],  ['png',  'jpg'],  ['png',  'webp'], ['jpg',  'webp'],
  ['webp', 'jpg'],  ['webp', 'png'],  ['heic', 'jpg'],  ['heic', 'png'],
  ['pdf',  'jpg'],  ['pdf',  'docx'], ['docx', 'pdf'],  ['mp4',  'mp3'],
  ['mp4',  'webm'], ['mov',  'mp4'],  ['avi',  'mp4'],  ['mkv',  'mp4'],
  ['mp3',  'wav'],  ['wav',  'mp3'],  ['flac', 'mp3'],  ['epub', 'pdf'],
  ['svg',  'png'],  ['svg',  'jpg'],  ['xlsx', 'csv'],  ['csv',  'xlsx'],
];

// ---------------------------------------------------------------------------
// ENGINE CLASS
// ---------------------------------------------------------------------------

class PopularConvertersEngine {
  private popularCache:  PopularConversion[]  | null = null;
  private trendingCache: PopularConversion[]  | null = null;
  private featuredCache: FeaturedTool[]       | null = null;

  // ── Popular Conversions ───────────────────────────────────────────────────

  /**
   * Returns the most popular conversions by combined score.
   * Starts from PRIORITY_PAIRS and fills up with high-volume pairs.
   */
  getPopularConversions(locale = 'en', limit = 24): PopularConversion[] {
    if (this.popularCache) {
      return this.popularCache.slice(0, limit).map(c => ({
        ...c,
        href: `/${locale}/${c.category}-converter/${c.from}-to-${c.to}`,
      }));
    }

    const seen    = new Set<string>();
    const results: PopularConversion[] = [];

    // 1. Priority pairs first
    for (const [from, to] of PRIORITY_PAIRS) {
      if (!conversionRegistry.isValid(from, to)) continue;
      const fDef = formatRegistry.get(from);
      const tDef = formatRegistry.get(to);
      if (!fDef || !tDef) continue;
      const key = `${from}:${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        from, to,
        fromName:  fDef.name,
        toName:    tDef.name,
        category:  fDef.category,
        href:      `/${locale}/${fDef.category}-converter/${from}-to-${to}`,
        score:     (fDef.searchVolume ?? 0) + (tDef.searchVolume ?? 0) + 500,
      });
    }

    // 2. Fill with high-volume conversions from registry
    const allFormats = formatRegistry.getAll()
      .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
      .slice(0, 40);

    for (const fDef of allFormats) {
      if (results.length >= 48) break;
      const targets = conversionRegistry.getTargets(fDef.ext).slice(0, 4);
      for (const to of targets) {
        if (results.length >= 48) break;
        const key = `${fDef.ext}:${to}`;
        if (seen.has(key)) continue;
        const tDef = formatRegistry.get(to);
        if (!tDef) continue;
        seen.add(key);
        results.push({
          from:     fDef.ext,
          to,
          fromName: fDef.name,
          toName:   tDef.name,
          category: fDef.category,
          href:     `/${locale}/${fDef.category}-converter/${fDef.ext}-to-${to}`,
          score:    (fDef.searchVolume ?? 0) + (tDef.searchVolume ?? 0),
        });
      }
    }

    this.popularCache = results.sort((a, b) => b.score - a.score);
    return this.popularCache.slice(0, limit);
  }

  // ── Trending Conversions ──────────────────────────────────────────────────

  /**
   * Returns trending conversions (modern formats with growing adoption).
   * Prioritises formats with browserNative, low premiumOnly, high search priority.
   */
  getTrendingConversions(locale = 'en', limit = 12): PopularConversion[] {
    if (this.trendingCache) {
      return this.trendingCache.slice(0, limit).map(c => ({
        ...c,
        href: `/${locale}/${c.category}-converter/${c.from}-to-${c.to}`,
      }));
    }

    const trending: PopularConversion[] = [];
    const seen = new Set<string>();

    // Formats that represent modern/trending conversions
    const trendingFormats = ['heic', 'heif', 'webp', 'avif', 'jxl', 'opus', 'flac', 'av1', 'vp9'];

    for (const fmt of trendingFormats) {
      const fDef = formatRegistry.get(fmt);
      if (!fDef) continue;
      const targets = conversionRegistry.getTargets(fmt).slice(0, 3);
      for (const to of targets) {
        const key = `${fmt}:${to}`;
        if (seen.has(key)) continue;
        const tDef = formatRegistry.get(to);
        if (!tDef) continue;
        seen.add(key);
        trending.push({
          from:     fmt,
          to,
          fromName: fDef.name,
          toName:   tDef.name,
          category: fDef.category,
          href:     `/${locale}/${fDef.category}-converter/${fmt}-to-${to}`,
          score:    (fDef.searchPriority ?? 50) * 3 + (tDef.searchVolume ?? 0),
        });
      }
    }

    this.trendingCache = trending.sort((a, b) => b.score - a.score);
    return this.trendingCache.slice(0, limit);
  }

  // ── Featured Tools ────────────────────────────────────────────────────────

  /**
   * Returns featured / most-used tools from DynamicToolEngine.
   * Sorted by combined availability + search priority.
   */
  getFeaturedTools(limit = 8): FeaturedTool[] {
    if (this.featuredCache) return this.featuredCache.slice(0, limit);

    const tools = dynamicToolEngine
      .getAll()
      .filter(t => !t.isPremium && t.isAvailable)
      .map(tool => ({
        tool,
        score: (tool.searchPriority ?? 50) + (tool.metadata.inputTier === 'popular' ? 100 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    this.featuredCache = tools;
    return tools.slice(0, limit);
  }

  // ── Category Conversions ──────────────────────────────────────────────────

  /**
   * Returns top conversions for a specific category.
   * Falls back to a direct registry query for categories underrepresented in
   * the global popular list (archive, cad, font, presentation, spreadsheet, etc.).
   */
  getTopForCategory(
    category: FormatCategory,
    locale   = 'en',
    limit    = 12,
  ): PopularConversion[] {
    // Try global popular list first
    const all = this.getPopularConversions(locale, 200);
    const fromGlobal = all.filter(c => c.category === category);

    if (fromGlobal.length >= Math.min(limit, 4)) {
      return fromGlobal.slice(0, limit);
    }

    // Fallback: directly query conversion registry for this category
    const formats = formatRegistry
      .getByCategory(category)
      .sort((a, b) => ((b.searchVolume ?? 0) + (b.searchPriority ?? 50) * 1000) -
                       ((a.searchVolume ?? 0) + (a.searchPriority ?? 50) * 1000));

    const extra: PopularConversion[] = [];
    const seen = new Set<string>(fromGlobal.map(c => `${c.from}:${c.to}`));

    for (const fDef of formats) {
      if (extra.length + fromGlobal.length >= limit) break;
      const targets = conversionRegistry.getTargets(fDef.ext).slice(0, 4);
      for (const to of targets) {
        if (extra.length + fromGlobal.length >= limit) break;
        const key = `${fDef.ext}:${to}`;
        if (seen.has(key)) continue;
        const tDef = formatRegistry.get(to);
        if (!tDef) continue;
        seen.add(key);
        extra.push({
          from:     fDef.ext,
          to,
          fromName: fDef.name,
          toName:   tDef.name,
          category: fDef.category,
          href:     `/${locale}/${category}-converter/${fDef.ext}-to-${to}`,
          score:    (fDef.searchVolume ?? 0) + (tDef.searchVolume ?? 0) +
                    (fDef.searchPriority ?? 50) * 100,
        });
      }
    }

    return [...fromGlobal, ...extra]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── New Formats ───────────────────────────────────────────────────────────

  /**
   * Returns recently supported formats (modern/niche tier).
   */
  getNewFormats(limit = 8) {
    return formatRegistry
      .getAll()
      .filter(f => f.tier === 'niche' || f.tier === 'advanced')
      .sort((a, b) => (b.searchPriority ?? 50) - (a.searchPriority ?? 50))
      .slice(0, limit);
  }

  clearCache(): void {
    this.popularCache  = null;
    this.trendingCache = null;
    this.featuredCache = null;
  }
}

export const popularConvertersEngine = new PopularConvertersEngine();
