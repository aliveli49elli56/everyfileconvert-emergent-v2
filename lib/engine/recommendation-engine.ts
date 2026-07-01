/**
 * lib/engine/recommendation-engine.ts
 * Conversion Recommendation Engine — Phase 7
 *
 * Given an uploaded file's format, suggests the most useful target conversions.
 * Uses:
 *   - conversionRegistry.getTargets()    — valid conversions
 *   - format metadata (searchVolume, popularConversions, tier)
 *   - category affinity scoring
 *
 * NO hardcoded suggestions. Everything from registries.
 */

import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry, CATEGORY_DEFINITIONS } from '../registry/format-registry';
import type { FormatCategory } from '../types/formats';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface ConversionSuggestion {
  from:        string;
  to:          string;
  fromName:    string;
  toName:      string;
  category:    FormatCategory;
  href:        string;
  score:       number;
  reason:      string;
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

class RecommendationEngine {
  private cache = new Map<string, ConversionSuggestion[]>();

  /**
   * Suggest target formats for a given source format.
   * Results sorted by relevance (search volume + tier + popularity).
   */
  suggest(
    sourceFormat: string,
    locale       = 'en',
    limit        = 8,
  ): ConversionSuggestion[] {
    const key = `${sourceFormat}:${locale}:${limit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const fmt  = sourceFormat.toLowerCase();
    const srcDef = formatRegistry.get(fmt);
    if (!srcDef) return [];

    const targets = conversionRegistry.getTargets(fmt);
    const popular = srcDef.popularConversions ?? [];

    const suggestions: ConversionSuggestion[] = targets.map(to => {
      const toDef = formatRegistry.get(to);
      if (!toDef) return null;

      // Score factors
      const volumeScore   = toDef.searchVolume     ?? 0;
      const priorityScore = (toDef.searchPriority  ?? 50) * 2;
      const tierScore     = toDef.tier === 'popular'  ? 200
                          : toDef.tier === 'standard' ? 100
                          : 50;
      const popularScore  = popular.includes(to) ? 300 : 0;

      const score = volumeScore + priorityScore + tierScore + popularScore;
      const reason = popular.includes(to)      ? 'Popular conversion'
                   : toDef.tier === 'popular'  ? 'Widely used format'
                   : toDef.browserNative       ? 'Browser-compatible'
                   : 'Supported conversion';

      return {
        from:     fmt,
        to,
        fromName: srcDef.name,
        toName:   toDef.name,
        category: srcDef.category,
        href:     `/${locale}/${srcDef.category}-converter/${fmt}-to-${to}`,
        score,
        reason,
      } satisfies ConversionSuggestion;
    }).filter((x): x is ConversionSuggestion => x !== null);

    const result = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    this.cache.set(key, result);
    return result;
  }

  /**
   * Suggest conversions for a MIME type (when extension is unknown).
   * Looks up the format by MIME and delegates to suggest().
   */
  suggestByMime(
    mime:   string,
    locale = 'en',
    limit  = 8,
  ): ConversionSuggestion[] {
    const all    = formatRegistry.getAll();
    const fmtDef = all.find(f => f.mime === mime || (f.altMimes ?? []).includes(mime));
    if (!fmtDef) return [];
    return this.suggest(fmtDef.ext, locale, limit);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const recommendationEngine = new RecommendationEngine();

// ---------------------------------------------------------------------------
// EXPANDED RECOMMENDATION METHODS — Phase 7.1
// ---------------------------------------------------------------------------

export interface RelatedViewerLink {
  ext: string;
  name: string;
  href: string;
}

export interface RelatedCategoryLink {
  category: FormatCategory;
  label: string;
  href: string;
  count: number;
}

export interface AlternativeFormat {
  ext: string;
  name: string;
  href: string;
  reason: string;
}

class ExpandedRecommendationEngine {
  private cache = new Map<string, unknown[]>();

  private cached<T>(key: string, fn: () => T[]): T[] {
    if (this.cache.has(key)) return this.cache.get(key) as T[];
    const result = fn();
    this.cache.set(key, result);
    return result;
  }

  /** All conversions FROM and TO a given format as recommendation links. */
  getRelatedConverters(
    format: string,
    locale = 'en',
    limit  = 8,
  ): ConversionSuggestion[] {
    return this.cached(`rc:${format}:${locale}:${limit}`, () => {
      const suggestions = recommendationEngine.suggest(format, locale, limit);
      // Also include top inverse conversions
      const inv = conversionRegistry.getAllConversions()
        .filter(c => c.target === format.toLowerCase())
        .slice(0, 4)
        .map(c => {
          const fromDef = formatRegistry.get(c.source);
          const toDef   = formatRegistry.get(format.toLowerCase());
          if (!fromDef || !toDef) return null;
          return {
            from:     c.source,
            to:       format.toLowerCase(),
            fromName: fromDef.name,
            toName:   toDef.name,
            category: fromDef.category,
            href:     `/${locale}/${fromDef.category}-converter/${c.source}-to-${format.toLowerCase()}`,
            score:    fromDef.searchVolume ?? 50,
            reason:   'Supported conversion',
          } satisfies ConversionSuggestion;
        })
        .filter((x): x is ConversionSuggestion => x !== null);

      const seen = new Set(suggestions.map(s => `${s.from}-${s.to}`));
      const all  = [...suggestions, ...inv.filter(s => !seen.has(`${s.from}-${s.to}`))];
      return all.slice(0, limit);
    });
  }

  /** Viewer pages relevant to a given format or same-category formats. */
  getRelatedViewers(format: string, locale = 'en'): RelatedViewerLink[] {
    return this.cached(`rv:${format}:${locale}`, () => {
      const fmtDef = formatRegistry.get(format.toLowerCase());
      if (!fmtDef) return [];

      // Formats in same category that have viewer pages
      return formatRegistry.getAll()
        .filter(f =>
          f.ext !== format.toLowerCase() &&
          f.hasViewer &&
          (f.category === fmtDef.category || (fmtDef.tier === 'popular' && f.tier === 'popular'))
        )
        .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
        .slice(0, 6)
        .map(f => ({
          ext:  f.ext,
          name: `${f.ext.toUpperCase()} Viewer`,
          href: `/${locale}/view/${f.ext}`,
        }));
    });
  }

  /** Category pages related to a given category. */
  getRelatedCategories(
    category: FormatCategory,
    locale = 'en',
    limit  = 5,
  ): RelatedCategoryLink[] {
    return this.cached(`rcat:${category}:${locale}:${limit}`, () => {
      return (Object.keys(CATEGORY_DEFINITIONS) as FormatCategory[])
        .filter(c => c !== category && CATEGORY_DEFINITIONS[c]?.converterRoute)
        .map(c => {
          const def   = CATEGORY_DEFINITIONS[c];
          const count = formatRegistry.getByCategory(c).length;
          return {
            category: c,
            label: def.seoLabel,
            href:  `/${locale}${def.converterRoute}`,
            count,
          };
        })
        .filter(c => c.count > 0)
        .slice(0, limit);
    });
  }

  /** Alternative formats in the same category (similar but different). */
  getAlternativeFormats(format: string, limit = 5): AlternativeFormat[] {
    return this.cached(`alt:${format}:${limit}`, () => {
      const fmt = formatRegistry.get(format.toLowerCase());
      if (!fmt) return [];

      return formatRegistry.getByCategory(fmt.category)
        .filter(f => f.ext !== format.toLowerCase() && f.tier !== 'legacy')
        .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
        .slice(0, limit)
        .map(f => ({
          ext:    f.ext,
          name:   f.name,
          href:   `/${f.category}-converter/${f.ext}`,
          reason: f.description ?? `Another ${fmt.category} format`,
        }));
    });
  }

  /** Formats with higher quality/compatibility than the given format. */
  getBetterOutputFormats(
    format: string,
    locale = 'en',
    limit  = 5,
  ): ConversionSuggestion[] {
    return this.cached(`better:${format}:${locale}:${limit}`, () => {
      const src = formatRegistry.get(format.toLowerCase());
      if (!src) return [];
      const suggestions = recommendationEngine.suggest(format, locale, 20);
      // Filter to formats that are "better" (popular tier, browser-native, or popular conversion)
      return suggestions
        .filter(s => {
          const tgt = formatRegistry.get(s.to);
          return tgt && (tgt.tier === 'popular' || tgt.browserNative);
        })
        .slice(0, limit);
    });
  }

  /** Top formats globally or within a category, sorted by searchVolume. */
  getPopularFormats(category?: FormatCategory, limit = 8): string[] {
    return this.cached(`pop:${category ?? 'all'}:${limit}`, () => {
      const all = category
        ? formatRegistry.getByCategory(category)
        : formatRegistry.getAll();
      return all
        .filter(f => f.tier === 'popular' || (f.searchVolume ?? 0) > 50000)
        .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
        .slice(0, limit)
        .map(f => f.ext);
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const expandedRecommendationEngine = new ExpandedRecommendationEngine();
