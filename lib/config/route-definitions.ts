/**
 * lib/config/route-definitions.ts
 * Route Definition Model - defines route patterns for all tools
 *
 * Pattern: {locale}/{category}/{toolType}/{sourceFormat}/{targetFormat}/slug
 *
 * This model provides route generation and parsing for the entire platform.
 */

import type { FormatCategory } from '../types/formats';
import type { ToolType } from '../registry/tool-identity-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry } from '../registry/format-registry';
import { aliasEngine } from '../engine/alias-engine';

// ---------------------------------------------------------------------------
// ROUTE TYPES
// ---------------------------------------------------------------------------

export type SupportedLocale =
  | 'en' | 'tr' | 'de' | 'fr' | 'es' | 'it'
  | 'pt' | 'ja' | 'zh' | 'nl' | 'pl' | 'ko'
  | 'sv' | 'da' | 'no' | 'hu' | 'fi';

export interface RouteDefinition {
  pattern: string;
  params: string[];
  example: string;
}

export interface ParsedRoute {
  locale: SupportedLocale;
  category: string;
  toolType: ToolType;
  sourceFormat?: string;
  targetFormat?: string;
  slug?: string;
  isValid: boolean;
}

export interface GeneratedRoute {
  path: string;
  asPath: string;
  query: Record<string, string>;
}

// ---------------------------------------------------------------------------
// ROUTE PATTERNS
// ---------------------------------------------------------------------------

export const ROUTE_PATTERNS = {
  // Main pages
  home: {
    pattern: '/',
    params: [],
    example: '/',
  },

  // Locale home
  localeHome: {
    pattern: '/{locale}',
    params: ['locale'],
    example: '/de',
  },

  // Converter pages
  converter: {
    pattern: '/{locale}/{converterType}',
    params: ['locale', 'converterType'],
    example: '/en/image-converter',
  },

  // Conversion slug
  conversionSlug: {
    pattern: '/{locale}/{converterType}/{slug}',
    params: ['locale', 'converterType', 'slug'],
    example: '/en/image-converter/png-to-jpg',
  },

  // Single format
  singleFormat: {
    pattern: '/{locale}/{converterType}/{format}',
    params: ['locale', 'converterType', 'format'],
    example: '/en/image-converter/png',
  },

  // Viewer pages
  viewer: {
    pattern: '/{locale}/viewer/{format}',
    params: ['locale', 'format'],
    example: '/en/viewer/pdf',
  },

  // Editor pages
  editor: {
    pattern: '/{locale}/editor/{format}',
    params: ['locale', 'format'],
    example: '/en/editor/png',
  },

  // Category pages
  category: {
    pattern: '/{locale}/category/{category}',
    params: ['locale', 'category'],
    example: '/en/category/image',
  },

  // Format info pages
  formatInfo: {
    pattern: '/{locale}/format/{format}',
    params: ['locale', 'format'],
    example: '/en/format/png',
  },
};

// ---------------------------------------------------------------------------
// ROUTE ENGINE CLASS
// ---------------------------------------------------------------------------

class RouteEngine {
  // Default locale
  private defaultLocale: SupportedLocale = 'en';

  // Supported locales
  private supportedLocales: Set<SupportedLocale> = new Set<SupportedLocale>([
    'en', 'tr', 'de', 'fr', 'es', 'it',
    'pt', 'ja', 'zh', 'nl', 'pl', 'ko',
    'sv', 'da', 'no', 'hu', 'fi',
  ]);

  // Converter type to category mapping
  private converterTypes: Record<string, FormatCategory[]> = {
    'image-converter': ['image', 'raw', 'vector', 'icon'],
    'video-converter': ['video'],
    'audio-converter': ['audio'],
    'document-converter': ['document', 'ebook'],
    'cad-converter': ['cad'],
    'archive-converter': ['archive'],
    'font-converter': ['font'],
  };

  // Category to converter type mapping
  private categoryToConverter: Record<FormatCategory, string> = {
    image: 'image-converter',
    raw: 'image-converter',
    vector: 'image-converter',
    icon: 'image-converter',
    video: 'video-converter',
    audio: 'audio-converter',
    document: 'document-converter',
    ebook: 'document-converter',
    cad: 'cad-converter',
    archive: 'archive-converter',
    font: 'font-converter',
    gis: 'cad-converter',
    email: 'document-converter',
    code: 'document-converter',
  };

  /**
   * Generate route for conversion slug
   */
  generateConversionRoute(
    slug: string,
    locale: SupportedLocale = 'en'
  ): GeneratedRoute {
    const parsed = conversionRegistry.parseSlug(slug);

    if (!parsed || parsed.isSingleFormat) {
      // Single format route
      const format = slug.toLowerCase();
      const category = formatRegistry.get(format)?.category ?? 'image';
      const converterType = this.categoryToConverter[category] ?? 'image-converter';

      return {
        path: `/${locale}/${converterType}/${format}`,
        asPath: `/${locale}/${converterType}/${format}`,
        query: { format },
      };
    }

    // Conversion slug route
    const converterType = this.categoryToConverter[parsed.inputCategory] ?? 'image-converter';

    return {
      path: `/${locale}/${converterType}/${slug}`,
      asPath: `/${locale}/${converterType}/${slug}`,
      query: {
        sourceFormat: parsed.inputFormat,
        targetFormat: parsed.outputFormat ?? '',
      },
    };
  }

  /**
   * Generate route for viewer
   */
  generateViewerRoute(format: string, locale: SupportedLocale = 'en'): GeneratedRoute {
    const canonical = aliasEngine.resolve(format);
    return {
      path: `/${locale}/viewer/${canonical}`,
      asPath: `/${locale}/viewer/${canonical}`,
      query: { format: canonical },
    };
  }

  /**
   * Generate route for editor
   */
  generateEditorRoute(format: string, locale: SupportedLocale = 'en'): GeneratedRoute {
    const canonical = aliasEngine.resolve(format);
    return {
      path: `/${locale}/editor/${canonical}`,
      asPath: `/${locale}/editor/${canonical}`,
      query: { format: canonical },
    };
  }

  /**
   * Generate route for category page
   */
  generateCategoryRoute(category: FormatCategory, locale: SupportedLocale = 'en'): GeneratedRoute {
    return {
      path: `/${locale}/category/${category}`,
      asPath: `/${locale}/category/${category}`,
      query: { category },
    };
  }

  /**
   * Generate route for format info page
   */
  generateFormatRoute(format: string, locale: SupportedLocale = 'en'): GeneratedRoute {
    const canonical = aliasEngine.resolve(format);
    return {
      path: `/${locale}/format/${canonical}`,
      asPath: `/${locale}/format/${canonical}`,
      query: { format: canonical },
    };
  }

  /**
   * Parse a route path
   */
  parseRoute(path: string): ParsedRoute {
    const segments = path.split('/').filter(Boolean);

    // Check for locale
    let locale: SupportedLocale = this.defaultLocale;
    let startIndex = 0;

    if (segments.length > 0 && this.supportedLocales.has(segments[0] as SupportedLocale)) {
      locale = segments[0] as SupportedLocale;
      startIndex = 1;
    }

    const relevantSegments = segments.slice(startIndex);

    // Root path
    if (relevantSegments.length === 0) {
      return {
        locale,
        category: '',
        toolType: 'converter',
        isValid: true,
      };
    }

    // Viewer route
    if (relevantSegments[0] === 'viewer' && relevantSegments[1]) {
      return {
        locale,
        category: 'image',
        toolType: 'viewer',
        sourceFormat: relevantSegments[1],
        isValid: true,
      };
    }

    // Editor route
    if (relevantSegments[0] === 'editor' && relevantSegments[1]) {
      return {
        locale,
        category: 'image',
        toolType: 'editor',
        sourceFormat: relevantSegments[1],
        isValid: true,
      };
    }

    // Category route
    if (relevantSegments[0] === 'category' && relevantSegments[1]) {
      return {
        locale,
        category: relevantSegments[1],
        toolType: 'converter',
        isValid: true,
      };
    }

    // Format info route
    if (relevantSegments[0] === 'format' && relevantSegments[1]) {
      return {
        locale,
        category: '',
        toolType: 'converter',
        sourceFormat: relevantSegments[1],
        isValid: true,
      };
    }

    // Converter type route
    if (relevantSegments[0]?.endsWith('-converter')) {
      const converterType = relevantSegments[0];
      const categories = this.converterTypes[converterType] ?? [];

      // Has slug
      if (relevantSegments[1]) {
        const slug = relevantSegments[1];
        const parsed = conversionRegistry.parseSlug(slug);

        if (parsed && !parsed.isSingleFormat) {
          return {
            locale,
            category: parsed.inputCategory,
            toolType: 'converter',
            sourceFormat: parsed.inputFormat,
            targetFormat: parsed.outputFormat ?? undefined,
            slug,
            isValid: true,
          };
        }

        // Single format
        return {
          locale,
          category: categories[0] ?? 'image',
          toolType: 'converter',
          sourceFormat: slug,
          isValid: true,
        };
      }

      // Converter landing page
      return {
        locale,
        category: categories[0] ?? '',
        toolType: 'converter',
        isValid: true,
      };
    }

    // Unknown route
    return {
      locale,
      category: '',
      toolType: 'converter',
      isValid: false,
    };
  }

  /**
   * Get all converter types
   */
  getConverterTypes(): string[] {
    return Object.keys(this.converterTypes);
  }

  /**
   * Get categories for converter type
   */
  getCategoriesForConverter(converterType: string): FormatCategory[] {
    return this.converterTypes[converterType] ?? [];
  }

  /**
   * Get converter type for category
   */
  getConverterForCategory(category: FormatCategory): string {
    return this.categoryToConverter[category] ?? 'image-converter';
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale: string): boolean {
    return this.supportedLocales.has(locale as SupportedLocale);
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return Array.from(this.supportedLocales);
  }

  /**
   * Generate all conversion routes for static generation
   */
  generateAllConversionRoutes(locale: SupportedLocale = 'en'): string[] {
    const slugs = conversionRegistry.getAllSlugs();
    const routes: string[] = [];

    for (const slug of slugs) {
      const route = this.generateConversionRoute(slug, locale);
      routes.push(route.path);
    }

    return routes;
  }

  /**
   * Generate all viewer routes
   */
  generateAllViewerRoutes(locale: SupportedLocale = 'en'): string[] {
    const formats = formatRegistry.getViewableFormats();
    return formats.map(f => `/${locale}/viewer/${f.ext}`);
  }

  /**
   * Generate all editor routes
   */
  generateAllEditorRoutes(locale: SupportedLocale = 'en'): string[] {
    const formats = formatRegistry.getEditableFormats();
    return formats.map(f => `/${locale}/editor/${f.ext}`);
  }

  /**
   * Generate all format info routes
   */
  generateAllFormatRoutes(locale: SupportedLocale = 'en'): string[] {
    const formats = formatRegistry.getAll();
    return formats.map(f => `/${locale}/format/${f.ext}`);
  }

  /**
   * Get default locale
   */
  getDefaultLocale(): SupportedLocale {
    return this.defaultLocale;
  }
}

export const routeEngine = new RouteEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getConversionPath(slug: string, locale?: SupportedLocale): string {
  return routeEngine.generateConversionRoute(slug, locale).path;
}

export function getViewerPath(format: string, locale?: SupportedLocale): string {
  return routeEngine.generateViewerRoute(format, locale).path;
}

export function getEditorPath(format: string, locale?: SupportedLocale): string {
  return routeEngine.generateEditorRoute(format, locale).path;
}

export function parsePath(path: string): ParsedRoute {
  return routeEngine.parseRoute(path);
}

export function getAllLocales(): SupportedLocale[] {
  return routeEngine.getSupportedLocales();
}

export { type SupportedLocale as Locale };
