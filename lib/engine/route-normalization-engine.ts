/**
 * lib/engine/route-normalization-engine.ts
 * Route Normalization Engine - prevents duplicate routes from aliases
 *
 * Ensures that format aliases don't create duplicate routes:
 * - /image-converter/jpeg-to-png → redirects to /image-converter/jpg-to-png
 * - /image-converter/jpg-to-jpeg → normalizes to /image-converter/jpg-to-jpg
 *
 * All routes use canonical extensions from alias engine.
 */

import type { FormatCategory } from '../types/formats';
import type { SupportedLocale } from '../config/route-definitions';
import { aliasEngine } from './alias-engine';
import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry } from '../registry/format-registry';
import { categoryEngine } from './category-engine';

// ---------------------------------------------------------------------------
// ROUTE TYPES
// ---------------------------------------------------------------------------

export interface NormalizedRoute {
  path: string;                   // Normalized path with canonical extensions
  originalPath?: string;          // Original path if different
  isCanonical: boolean;           // True if already canonical
  redirectTo?: string;             // Canonical path to redirect to
  httpStatus?: number;            // 301 for permanent, 302 for temporary
}

export interface RoutePattern {
  type: 'converter' | 'viewer' | 'editor' | 'processor' | 'format' | 'category';
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => {
    format?: string;
    inputFormat?: string;
    outputFormat?: string;
    category?: string;
    toolId?: string;
  };
}

// ---------------------------------------------------------------------------
// ROUTE PATTERNS
// ---------------------------------------------------------------------------

const ROUTE_PATTERNS: RoutePattern[] = [
  // Converter routes: /{category}-converter/{input}-to-{output}
  {
    type: 'converter',
    pattern: /^\/([a-z]+)-converter\/([a-z0-9]+)-to-([a-z0-9]+)$/i,
    extract: (match) => ({
      category: match[1],
      inputFormat: match[2],
      outputFormat: match[3],
    }),
  },
  // Viewer routes: /view/{format}
  {
    type: 'viewer',
    pattern: /^\/view\/([a-z0-9]+)$/i,
    extract: (match) => ({
      format: match[1],
    }),
  },
  // Editor routes: /edit/{format}
  {
    type: 'editor',
    pattern: /^\/edit\/([a-z0-9]+)$/i,
    extract: (match) => ({
      format: match[1],
    }),
  },
  // Format routes: /format/{format}
  {
    type: 'format',
    pattern: /^\/format\/([a-z0-9]+)$/i,
    extract: (match) => ({
      format: match[1],
    }),
  },
  // Tool routes: /tools/{toolId}
  {
    type: 'processor',
    pattern: /^\/tools\/([a-z0-9-]+)$/i,
    extract: (match) => ({
      toolId: match[1],
    }),
  },
];

// Localized route pattern
const LOCALE_PREFIX = /^\/(en|tr|de|fr|es|it|pt|ja|zh|nl|pl|ko|sv|da|no|hu|fi)(\/.*)?$/;

// ---------------------------------------------------------------------------
// ROUTE NORMALIZATION ENGINE CLASS
// ---------------------------------------------------------------------------

class RouteNormalizationEngine {
  private redirectCache: Map<string, NormalizedRoute>;

  constructor() {
    this.redirectCache = new Map();
  }

  /**
   * Normalize a route path
   * Returns the canonical route with redirect info if needed
   */
  normalize(path: string): NormalizedRoute {
    // Check cache
    if (this.redirectCache.has(path)) {
      return this.redirectCache.get(path)!;
    }

    // Strip locale prefix for normalization
    const { pathWithoutLocale, locale } = this.stripLocale(path);

    // Find matching pattern
    for (const pattern of ROUTE_PATTERNS) {
      const match = pathWithoutLocale.match(pattern.pattern);
      if (match) {
        const result = this.normalizeMatch(path, pathWithoutLocale, locale, pattern, match);
        this.redirectCache.set(path, result);
        return result;
      }
    }

    // No pattern matched - return as-is
    return {
      path,
      isCanonical: true,
    };
  }

  /**
   * Strip locale prefix from path
   */
  private stripLocale(path: string): { pathWithoutLocale: string; locale?: SupportedLocale } {
    const match = path.match(LOCALE_PREFIX);
    if (match) {
      return {
        pathWithoutLocale: match[2] || '/',
        locale: match[1] as SupportedLocale,
      };
    }
    return { pathWithoutLocale: path };
  }

  /**
   * Add locale prefix back to path
   */
  private addLocale(path: string, locale?: SupportedLocale): string {
    if (locale) {
      return `/${locale}${path}`;
    }
    return path;
  }

  /**
   * Normalize matched route
   */
  private normalizeMatch(
    originalPath: string,
    pathWithoutLocale: string,
    locale: SupportedLocale | undefined,
    pattern: RoutePattern,
    match: RegExpMatchArray
  ): NormalizedRoute {
    const extracted = pattern.extract(match);

    switch (pattern.type) {
      case 'converter':
        return this.normalizeConverterRoute(
          originalPath,
          pathWithoutLocale,
          locale,
          extracted.category || '',
          extracted.inputFormat || '',
          extracted.outputFormat || ''
        );

      case 'viewer':
        return this.normalizeFormatRoute(
          originalPath,
          pathWithoutLocale,
          locale,
          '/view',
          extracted.format || ''
        );

      case 'editor':
        return this.normalizeFormatRoute(
          originalPath,
          pathWithoutLocale,
          locale,
          '/edit',
          extracted.format || ''
        );

      case 'format':
        return this.normalizeFormatRoute(
          originalPath,
          pathWithoutLocale,
          locale,
          '/format',
          extracted.format || ''
        );

      default:
        return {
          path: originalPath,
          isCanonical: true,
        };
    }
  }

  /**
   * Normalize converter route
   */
  private normalizeConverterRoute(
    originalPath: string,
    pathWithoutLocale: string,
    locale: SupportedLocale | undefined,
    category: string,
    inputFormat: string,
    outputFormat: string
  ): NormalizedRoute {
    // Resolve aliases
    const canonicalInput = aliasEngine.resolve(inputFormat);
    const canonicalOutput = aliasEngine.resolve(outputFormat);

    // Check if already canonical
    const isCanonical = (canonicalInput === inputFormat && canonicalOutput === outputFormat);

    // Build canonical path
    const canonicalPath = this.addLocale(
      `/${category}-converter/${canonicalInput}-to-${canonicalOutput}`,
      locale
    );

    if (isCanonical) {
      return {
        path: canonicalPath,
        isCanonical: true,
      };
    }

    // Non-canonical - needs redirect
    return {
      path: canonicalPath,
      originalPath,
      isCanonical: false,
      redirectTo: canonicalPath,
      httpStatus: 301, // Permanent redirect for alias normalization
    };
  }

  /**
   * Normalize format-based route (viewer, editor, format)
   */
  private normalizeFormatRoute(
    originalPath: string,
    pathWithoutLocale: string,
    locale: SupportedLocale | undefined,
    prefix: string,
    format: string
  ): NormalizedRoute {
    // Resolve alias
    const canonicalFormat = aliasEngine.resolve(format);

    // Check if already canonical
    const isCanonical = (canonicalFormat === format);

    // Build canonical path
    const canonicalPath = this.addLocale(
      `${prefix}/${canonicalFormat}`,
      locale
    );

    if (isCanonical) {
      return {
        path: canonicalPath,
        isCanonical: true,
      };
    }

    // Non-canonical - needs redirect
    return {
      path: canonicalPath,
      originalPath,
      isCanonical: false,
      redirectTo: canonicalPath,
      httpStatus: 301,
    };
  }

  /**
   * Check if a route is canonical
   */
  isCanonical(path: string): boolean {
    const result = this.normalize(path);
    return result.isCanonical;
  }

  /**
   * Get canonical route for any route
   */
  getCanonical(path: string): string {
    const result = this.normalize(path);
    return result.path;
  }

  /**
   * Get redirect if needed
   */
  getRedirect(path: string): { redirectTo: string; httpStatus: number } | null {
    const result = this.normalize(path);
    if (result.redirectTo) {
      return {
        redirectTo: result.redirectTo,
        httpStatus: result.httpStatus || 301,
      };
    }
    return null;
  }

  /**
   * Generate all alias routes for a canonical route
   * Useful for sitemap generation
   */
  generateAliasRoutes(canonicalPath: string): string[] {
    const aliases: string[] = [];
    const { pathWithoutLocale, locale } = this.stripLocale(canonicalPath);

    // Find matching pattern
    for (const pattern of ROUTE_PATTERNS) {
      const match = pathWithoutLocale.match(pattern.pattern);
      if (match) {
        const extracted = pattern.extract(match);

        if (pattern.type === 'converter' && extracted.inputFormat && extracted.outputFormat) {
          // Get all aliases for input and output
          const inputAliases = aliasEngine.getAllEquivalent(extracted.inputFormat);
          const outputAliases = aliasEngine.getAllEquivalent(extracted.outputFormat);
          const category = extracted.category || '';

          // Generate all combinations
          for (const inputAlias of inputAliases) {
            for (const outputAlias of outputAliases) {
              const aliasPath = this.addLocale(
                `/${category}-converter/${inputAlias}-to-${outputAlias}`,
                locale
              );
              if (aliasPath !== canonicalPath) {
                aliases.push(aliasPath);
              }
            }
          }
        } else if ((pattern.type === 'viewer' || pattern.type === 'editor' || pattern.type === 'format') && extracted.format) {
          // Get all aliases for format
          const formatAliases = aliasEngine.getAllEquivalent(extracted.format);
          const prefix = pathWithoutLocale.split('/').slice(0, 2).join('/');

          for (const formatAlias of formatAliases) {
            const aliasPath = this.addLocale(
              `${prefix}/${formatAlias}`,
              locale
            );
            if (aliasPath !== canonicalPath) {
              aliases.push(aliasPath);
            }
          }
        }
        break;
      }
    }

    return aliases;
  }

  /**
   * Generate canonical route for conversion
   */
  generateConverterRoute(
    inputFormat: string,
    outputFormat: string,
    category?: FormatCategory,
    locale?: SupportedLocale
  ): string {
    const canonicalInput = aliasEngine.resolve(inputFormat);
    const canonicalOutput = aliasEngine.resolve(outputFormat);
    const catSlug = category
      ? categoryEngine.getMetadata(category)?.slug || 'tools'
      : 'tools';

    return this.addLocale(
      `/${catSlug}-converter/${canonicalInput}-to-${canonicalOutput}`,
      locale
    );
  }

  /**
   * Generate canonical route for viewer
   */
  generateViewerRoute(format: string, locale?: SupportedLocale): string {
    const canonical = aliasEngine.resolve(format);
    return this.addLocale(`/view/${canonical}`, locale);
  }

  /**
   * Generate canonical route for editor
   */
  generateEditorRoute(format: string, locale?: SupportedLocale): string {
    const canonical = aliasEngine.resolve(format);
    return this.addLocale(`/edit/${canonical}`, locale);
  }

  /**
   * Generate canonical route for format page
   */
  generateFormatRoute(format: string, locale?: SupportedLocale): string {
    const canonical = aliasEngine.resolve(format);
    return this.addLocale(`/format/${canonical}`, locale);
  }

  /**
   * Validate route for conflicts
   * Returns warning if alias routes point to same canonical
   */
  validateRoutes(): { canonical: string; aliases: string[] }[] {
    const validations: { canonical: string; aliases: string[] }[] = [];
    const seenCanonicals = new Set<string>();

    // Get all conversion slugs
    const slugs = conversionRegistry.getAllSlugs();

    for (const slug of slugs) {
      const parsed = conversionRegistry.parseSlug(slug);
      if (!parsed || !parsed.outputFormat) continue;

      const canonicalPath = this.generateConverterRoute(
        parsed.inputFormat,
        parsed.outputFormat,
        parsed.inputCategory
      );

      if (seenCanonicals.has(canonicalPath)) {
        continue;
      }
      seenCanonicals.add(canonicalPath);

      const aliases = this.generateAliasRoutes(canonicalPath);
      if (aliases.length > 0) {
        validations.push({
          canonical: canonicalPath,
          aliases,
        });
      }
    }

    return validations;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.redirectCache.clear();
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const routeNormalizationEngine = new RouteNormalizationEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function normalizeRoute(path: string): NormalizedRoute {
  return routeNormalizationEngine.normalize(path);
}

export function getCanonicalRoute(path: string): string {
  return routeNormalizationEngine.getCanonical(path);
}

export function generateConverterRoute(
  inputFormat: string,
  outputFormat: string,
  category?: FormatCategory,
  locale?: SupportedLocale
): string {
  return routeNormalizationEngine.generateConverterRoute(inputFormat, outputFormat, category, locale);
}

export function generateViewerRoute(format: string, locale?: SupportedLocale): string {
  return routeNormalizationEngine.generateViewerRoute(format, locale);
}
