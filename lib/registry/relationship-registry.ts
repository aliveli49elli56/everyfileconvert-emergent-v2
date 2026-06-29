/**
 * lib/registry/relationship-registry.ts
 * Tool Relationship Engine - automatic relationship building
 *
 * Generates relationships between tools without hardcoding.
 * Registry-driven approach: relationships derived from format data and conversion matrix.
 */

import type { FormatCategory } from '../types/formats';
import { conversionRegistry } from './conversion-registry';
import { formatRegistry } from './format-registry';
import { aliasEngine } from '../engine/alias-engine';
import { familyEngine } from '../engine/family-engine';

// ---------------------------------------------------------------------------
// RELATIONSHIP TYPES
// ---------------------------------------------------------------------------

export type RelationshipType =
  | 'same-input'       // Same source format, different targets
  | 'same-output'      // Different sources, same target
  | 'reverse'          // B→A conversion (reverse of A→B)
  | 'same-family'      // Formats in same family
  | 'same-category'    // Formats in same category
  | 'popular'          // Popular conversion from this format
  | 'trending'         // Trending conversions
  | 'recent'           // Recently viewed/used
  | 'recommended'      // Recommended by algorithm
  | 'alternative';     // Alternative to current tool

export interface ToolRelationship {
  sourceTool: string;
  relatedTool: string;
  relationshipType: RelationshipType;
  score: number; // 0-1 relevance score
  label: string; // Display label
}

export interface RelatedTool {
  slug: string;
  inputFormat: string;
  outputFormat: string;
  inputName: string;
  outputName: string;
  category: FormatCategory;
  relationshipType: RelationshipType;
  relationshipLabel: string;
  score: number;
}

// ---------------------------------------------------------------------------
// RELATIONSHIP ENGINE CLASS
// ---------------------------------------------------------------------------

class RelationshipEngine {
  private relationshipCache: Map<string, RelatedTool[]>;
  private popularConversions: Map<string, string[]>;

  constructor() {
    this.relationshipCache = new Map();
    this.popularConversions = new Map();
    this.buildPopularConversions();
  }

  /**
   * Build popular conversions from registry data
   */
  private buildPopularConversions(): void {
    const formats = formatRegistry.getAll();

    for (const format of formats) {
      if (format.popularConversions && format.popularConversions.length > 0) {
        this.popularConversions.set(format.ext, format.popularConversions);
      }
    }
  }

  /**
   * Get related tools for a conversion slug
   */
  getRelated(slug: string, limit: number = 10): RelatedTool[] {
    // Check cache
    if (this.relationshipCache.has(slug)) {
      return this.relationshipCache.get(slug)!.slice(0, limit);
    }

    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || parsed.isSingleFormat || !parsed.outputFormat) return [];

    const related = this.buildRelatedSlugs(
      parsed.inputFormat,
      parsed.outputFormat,
      limit
    );

    // Cache result
    this.relationshipCache.set(slug, related);

    return related;
  }

  /**
   * Build related slugs from format pair
   */
  private buildRelatedSlugs(
    inputFormat: string,
    outputFormat: string,
    limit: number
  ): RelatedTool[] {
    const related: RelatedTool[] = [];
    const seen = new Set<string>();
    const currentSlug = `${inputFormat}-to-${outputFormat}`;

    const addRelated = (
      from: string,
      to: string,
      type: RelationshipType,
      score: number
    ) => {
      const slug = `${from}-to-${to}`;
      if (slug === currentSlug || seen.has(slug)) return;
      if (!conversionRegistry.isValid(from, to)) return;

      const fromFmt = formatRegistry.get(from);
      const toFmt = formatRegistry.get(to);
      if (!fromFmt || !toFmt) return;

      seen.add(slug);
      related.push({
        slug,
        inputFormat: from,
        outputFormat: to,
        inputName: fromFmt.name,
        outputName: toFmt.name,
        category: fromFmt.category,
        relationshipType: type,
        relationshipLabel: this.getRelationshipLabel(type, fromFmt.name, toFmt.name),
        score,
      });
    };

    // 1. Same input conversions (high relevance)
    const sameInputLimit = Math.ceil(limit * 0.4);
    const targets = conversionRegistry.getTargets(inputFormat);
    for (const target of targets) {
      if (related.length >= sameInputLimit) break;
      if (target !== outputFormat) {
        addRelated(inputFormat, target, 'same-input', 0.9);
      }
    }

    // 2. Reverse conversion
    if (conversionRegistry.isValid(outputFormat, inputFormat)) {
      addRelated(outputFormat, inputFormat, 'reverse', 0.85);
    }

    // 3. Same output conversions (from different sources)
    const sameOutputLimit = Math.ceil(limit * 0.2);
    const allFormats = formatRegistry.getAll();
    for (const fmt of allFormats) {
      if (related.length >= sameInputLimit + sameOutputLimit) break;
      if (fmt.ext === inputFormat) continue;
      const fmtTargets = conversionRegistry.getTargets(fmt.ext);
      if (fmtTargets.includes(outputFormat)) {
        addRelated(fmt.ext, outputFormat, 'same-output', 0.7);
      }
    }

    // 4. Same family conversions
    const family = familyEngine.getFamily(inputFormat);
    if (family) {
      for (const member of family.members) {
        if (related.length >= limit) break;
        if (member === inputFormat) continue;
        const memberTargets = conversionRegistry.getTargets(member);
        for (const target of memberTargets.slice(0, 3)) {
          addRelated(member, target, 'same-family', 0.6);
        }
      }
    }

    // 5. Same category conversions
    const inputCategory = formatRegistry.get(inputFormat)?.category;
    if (inputCategory) {
      const categoryFormats = formatRegistry.getByCategory(inputCategory);
      for (const fmt of categoryFormats.slice(0, 5)) {
        if (related.length >= limit) break;
        if (fmt.ext === inputFormat) continue;
        const fmtTargets = conversionRegistry.getTargets(fmt.ext);
        if (fmtTargets.length > 0) {
          addRelated(fmt.ext, fmtTargets[0], 'same-category', 0.5);
        }
      }
    }

    // 6. Popular conversions from this format
    const popular = this.popularConversions.get(inputFormat);
    if (popular) {
      for (const target of popular) {
        if (related.length >= limit) break;
        addRelated(inputFormat, target, 'popular', 0.8);
      }
    }

    // Sort by score and limit
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get human-readable relationship label
   */
  private getRelationshipLabel(
    type: RelationshipType,
    fromName: string,
    toName: string
  ): string {
    switch (type) {
      case 'same-input':
        return 'Also converts to';
      case 'same-output':
        return 'Also converts to this';
      case 'reverse':
        return 'Reverse conversion';
      case 'same-family':
        return 'Related format';
      case 'same-category':
        return 'Similar category';
      case 'popular':
        return 'Popular conversion';
      case 'trending':
        return 'Trending now';
      case 'recent':
        return 'Recently used';
      case 'recommended':
        return 'Recommended';
      case 'alternative':
        return 'Alternative';
      default:
        return 'Related';
    }
  }

  /**
   * Get tools that could be alternatives to current tool
   */
  getAlternatives(slug: string, limit: number = 5): RelatedTool[] {
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed || parsed.isSingleFormat || !parsed.outputFormat) return [];

    const alternatives: RelatedTool[] = [];

    // Same input → different outputs that achieve similar goals
    const targets = conversionRegistry.getTargets(parsed.inputFormat);

    // Prioritize targets that can convert back
    for (const target of targets) {
      if (target === parsed.outputFormat) continue;
      if (alternatives.length >= limit) break;

      // Check if this target can convert back to the original source
      const canConvertBack = conversionRegistry.isValid(target, parsed.outputFormat);
      const score = canConvertBack ? 0.8 : 0.6;

      const toFmt = formatRegistry.get(target);
      if (toFmt) {
        alternatives.push({
          slug: `${parsed.inputFormat}-to-${target}`,
          inputFormat: parsed.inputFormat,
          outputFormat: target,
          inputName: parsed.inputName,
          outputName: toFmt.name,
          category: toFmt.category,
          relationshipType: 'alternative',
          relationshipLabel: 'Alternative output',
          score,
        });
      }
    }

    return alternatives;
  }

  /**
   * Get all formats related to a format (not conversion specific)
   */
  getRelatedFormats(ext: string, limit: number = 10): string[] {
    const related = new Set<string>();
    const family = familyEngine.getFamily(ext);

    // Family members
    if (family) {
      family.members.forEach(m => related.add(m));
    }

    // Same category
    const category = formatRegistry.get(ext)?.category;
    if (category) {
      const categoryFormats = formatRegistry.getByCategory(category);
      categoryFormats.forEach(f => related.add(f.ext));
    }

    // Conversions targets
    const targets = conversionRegistry.getTargets(ext);
    targets.forEach(t => related.add(t));

    // Formats that convert to this
    const allSources = conversionRegistry.getAllSlugs()
      .filter(s => s.includes(`-to-${ext}`))
      .map(s => s.split('-to-')[0]);
    allSources.forEach(s => related.add(s));

    // Remove self
    related.delete(ext);

    return Array.from(related).slice(0, limit);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.relationshipCache.clear();
  }

  /**
   * Get relationship between two tools
   */
  getRelationship(slug1: string, slug2: string): RelationshipType | null {
    const parsed1 = conversionRegistry.parseSlug(slug1);
    const parsed2 = conversionRegistry.parseSlug(slug2);

    if (!parsed1 || !parsed2 || parsed1.isSingleFormat || parsed2.isSingleFormat) {
      return null;
    }

    // Same input
    if (parsed1.inputFormat === parsed2.inputFormat) {
      return 'same-input';
    }

    // Same output
    if (parsed1.outputFormat === parsed2.outputFormat) {
      return 'same-output';
    }

    // Reverse
    if (
      parsed1.inputFormat === parsed2.outputFormat &&
      parsed1.outputFormat === parsed2.inputFormat
    ) {
      return 'reverse';
    }

    // Same family
    if (familyEngine.areSameFamily(parsed1.inputFormat, parsed2.inputFormat)) {
      return 'same-family';
    }

    // Same category
    if (parsed1.inputCategory === parsed2.inputCategory) {
      return 'same-category';
    }

    return null;
  }
}

export const relationshipEngine = new RelationshipEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getRelatedTools(slug: string, limit?: number): RelatedTool[] {
  return relationshipEngine.getRelated(slug, limit);
}

export function getAlternativeTools(slug: string, limit?: number): RelatedTool[] {
  return relationshipEngine.getAlternatives(slug, limit);
}

export function getRelatedFormats(ext: string, limit?: number): string[] {
  return relationshipEngine.getRelatedFormats(ext, limit);
}
