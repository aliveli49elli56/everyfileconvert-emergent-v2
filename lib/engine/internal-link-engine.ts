/**
 * lib/engine/internal-link-engine.ts
 * Internal Link Engine — Phase 7
 *
 * Generates registry-driven internal links for every format and category.
 * Sources:
 *   - Same source format → all conversions FROM format
 *   - Same target format → all conversions TO format  (inverted matrix)
 *   - Same category     → sibling conversions
 *   - Related tools     → from toolRegistry
 *   - Popular conversions from format metadata
 *
 * NO hardcoded links. Everything derived from registries.
 */

import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry }     from '../registry/format-registry';
import type { FormatCategory }  from '../types/formats';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface InternalLink {
  href:          string;
  label:         string;
  type:          'conversion-from' | 'conversion-to' | 'category' | 'tool';
  priority:      number;
  inputFormat?:  string;
  outputFormat?: string;
}

export interface InternalLinkGroup {
  title: string;
  links: InternalLink[];
}

// ---------------------------------------------------------------------------
// INVERTED MATRIX (sources → targets that point TO each format)
// ---------------------------------------------------------------------------

function buildInverseMatrix(): Map<string, string[]> {
  const inv = new Map<string, string[]>();
  const all = conversionRegistry.getAllConversions();
  for (const { source, target } of all) {
    if (!inv.has(target)) inv.set(target, []);
    inv.get(target)!.push(source);
  }
  return inv;
}

// ---------------------------------------------------------------------------
// ENGINE CLASS
// ---------------------------------------------------------------------------

class InternalLinkEngine {
  private linkCache  = new Map<string, InternalLink[]>();
  private groupCache = new Map<string, InternalLinkGroup[]>();
  private inverseMatrix: Map<string, string[]> | null = null;

  private getInverse(): Map<string, string[]> {
    if (!this.inverseMatrix) this.inverseMatrix = buildInverseMatrix();
    return this.inverseMatrix;
  }

  // ── Links for a specific format ─────────────────────────────────────────────

  /**
   * Returns flat list of internal links for a given format.
   * Includes conversions FROM and TO the format, sorted by relevance.
   */
  getLinksForFormat(format: string, locale = 'en', limit = 14): InternalLink[] {
    const key = `${format}:${locale}:${limit}`;
    if (this.linkCache.has(key)) return this.linkCache.get(key)!;

    const fmtDef = formatRegistry.get(format.toLowerCase());
    if (!fmtDef) return [];

    const links: InternalLink[] = [];
    const seen  = new Set<string>();

    const add = (link: InternalLink) => {
      const id = link.href;
      if (seen.has(id)) return;
      seen.add(id);
      links.push(link);
    };

    // 1. Conversions FROM this format
    const targets = conversionRegistry.getTargets(format.toLowerCase());
    for (const to of targets) {
      const toDef = formatRegistry.get(to);
      if (!toDef) continue;
      const category = fmtDef.category;
      add({
        href:         `/${locale}/${category}-converter/${format.toLowerCase()}-to-${to}`,
        label:        `${format.toUpperCase()} to ${to.toUpperCase()}`,
        type:         'conversion-from',
        priority:     (toDef.searchVolume ?? 0) * 2 + (toDef.searchPriority ?? 50),
        inputFormat:  format.toLowerCase(),
        outputFormat: to,
      });
    }

    // 2. Conversions TO this format (inverse matrix)
    const sources = this.getInverse().get(format.toLowerCase()) ?? [];
    for (const from of sources.slice(0, 8)) {
      const fromDef = formatRegistry.get(from);
      if (!fromDef) continue;
      const category = fromDef.category;
      add({
        href:         `/${locale}/${category}-converter/${from}-to-${format.toLowerCase()}`,
        label:        `${from.toUpperCase()} to ${format.toUpperCase()}`,
        type:         'conversion-to',
        priority:     (fromDef.searchVolume ?? 0) + (fromDef.searchPriority ?? 40),
        inputFormat:  from,
        outputFormat: format.toLowerCase(),
      });
    }

    const result = links
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

    this.linkCache.set(key, result);
    return result;
  }

  // ── Links for a conversion page (from-to) ──────────────────────────────────

  getLinksForConversion(
    inputFmt: string,
    outputFmt: string,
    locale = 'en',
  ): InternalLinkGroup[] {
    const key = `${inputFmt}:${outputFmt}:${locale}`;
    if (this.groupCache.has(key)) return this.groupCache.get(key)!;

    const inputDef  = formatRegistry.get(inputFmt.toLowerCase());
    const outputDef = formatRegistry.get(outputFmt.toLowerCase());
    if (!inputDef || !outputDef) return [];

    const groups: InternalLinkGroup[] = [];

    // Group 1: Other conversions FROM same input
    const otherTargets = conversionRegistry
      .getTargets(inputFmt.toLowerCase())
      .filter(t => t !== outputFmt.toLowerCase())
      .slice(0, 8);

    if (otherTargets.length > 0) {
      groups.push({
        title: `Convert ${inputFmt.toUpperCase()} to...`,
        links: otherTargets.map(to => {
          const toDef = formatRegistry.get(to);
          return {
            href:         `/${locale}/${inputDef.category}-converter/${inputFmt.toLowerCase()}-to-${to}`,
            label:        `${inputFmt.toUpperCase()} to ${to.toUpperCase()}`,
            type:         'conversion-from' as const,
            priority:     toDef?.searchVolume ?? 50,
            inputFormat:  inputFmt.toLowerCase(),
            outputFormat: to,
          };
        }),
      });
    }

    // Group 2: Other conversions TO same output
    const otherSources = (this.getInverse().get(outputFmt.toLowerCase()) ?? [])
      .filter(s => s !== inputFmt.toLowerCase())
      .slice(0, 8);

    if (otherSources.length > 0) {
      groups.push({
        title: `Convert to ${outputFmt.toUpperCase()} from...`,
        links: otherSources.map(from => {
          const fromDef = formatRegistry.get(from);
          return {
            href:         `/${locale}/${fromDef?.category ?? inputDef.category}-converter/${from}-to-${outputFmt.toLowerCase()}`,
            label:        `${from.toUpperCase()} to ${outputFmt.toUpperCase()}`,
            type:         'conversion-to' as const,
            priority:     fromDef?.searchVolume ?? 40,
            inputFormat:  from,
            outputFormat: outputFmt.toLowerCase(),
          };
        }),
      });
    }

    this.groupCache.set(key, groups);
    return groups;
  }

  // ── Links for a category page ────────────────────────────────────────────────

  getLinksForCategory(
    category: FormatCategory,
    locale   = 'en',
    limit    = 24,
  ): InternalLink[] {
    const key = `cat:${category}:${locale}:${limit}`;
    if (this.linkCache.has(key)) return this.linkCache.get(key)!;

    const all = conversionRegistry.getAllConversions();
    const seen = new Set<string>();
    const links: InternalLink[] = [];

    for (const { source, target } of all) {
      if (links.length >= limit) break;
      const srcDef = formatRegistry.get(source);
      if (!srcDef || srcDef.category !== category) continue;
      const href = `/${locale}/${category}-converter/${source}-to-${target}`;
      if (seen.has(href)) continue;
      seen.add(href);
      links.push({
        href,
        label:        `${source.toUpperCase()} to ${target.toUpperCase()}`,
        type:         'conversion-from',
        priority:     (srcDef.searchVolume ?? 0) + (srcDef.searchPriority ?? 50),
        inputFormat:  source,
        outputFormat: target,
      });
    }

    const result = links.sort((a, b) => b.priority - a.priority).slice(0, limit);
    this.linkCache.set(key, result);
    return result;
  }

  clearCache(): void {
    this.linkCache.clear();
    this.groupCache.clear();
  }
}

export const internalLinkEngine = new InternalLinkEngine();
