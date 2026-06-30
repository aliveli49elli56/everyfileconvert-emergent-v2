/**
 * lib/engine/dynamic-tool-page-data.ts
 * Server-side data layer for Dynamic Tool Pages
 *
 * Generates page data from Dynamic Tool Engine for use in pages.
 * This is the bridge between registries and Next.js pages.
 */

import type { FormatCategory } from '../types/formats';
import { dynamicToolEngine, type DynamicTool } from './dynamic-tool-engine';
import { categoryEngine } from './category-engine';
import { navigationEngine } from './navigation-engine';
import { relationshipEngine } from '../registry/relationship-registry';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { aliasEngine } from './alias-engine';

// ---------------------------------------------------------------------------
// PAGE DATA TYPES
// ---------------------------------------------------------------------------

export interface ToolPageData {
  // Tool info
  tool: DynamicTool | null;

  // For conversions
  parsedConversion: {
    inputFormat: string;
    outputFormat: string | null;
    inputName: string;
    outputName: string | null;
    inputCategory: FormatCategory;
    outputCategory: FormatCategory | null;
    isSingleFormat: boolean;
    isValid: boolean;
  } | null;

  // Page metadata
  title: string;
  description: string;
  keywords: string[];

  // Category info
  category: FormatCategory;
  categorySlug: string;
  categoryRoute: string;
  categoryLabel: string;

  // Breadcrumbs
  breadcrumbs: {
    label: string;
    href?: string;
    isCurrent?: boolean;
  }[];

  // Related tools
  relatedTools: RelatedToolData[];

  // Available output formats (for single-format pages)
  availableOutputs: {
    ext: string;
    name: string;
    mime: string;
    category: string;
  }[];

  // Upload configuration
  uploadConfig: {
    acceptedExtensions: string[];
    acceptedMimes: string[];
    maxFileSize: number;
    supportsBatch: boolean;
    showPreview: boolean;
  };

  // Provider info
  provider: {
    id: string;
    name: string;
    type: 'client' | 'server' | 'external';
  } | null;

  // Capabilities
  capabilities: {
    hasTransparency: boolean;
    hasAnimation: boolean;
    isLossless: boolean;
    supportsBatch: boolean;
  };

  // Route info
  route: string;
  canonicalRoute: string;
}

export interface RelatedToolData {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  inputFormat: string;
  outputFormat: string | null;
  category: FormatCategory;
  route: string;
  relationshipType: string;
  relationshipLabel: string;
  score: number;
}

// ---------------------------------------------------------------------------
// CATEGORY UTILITIES
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<FormatCategory, string> = {
  image:        'Image',
  raw:          'RAW',
  vector:       'Vector',
  icon:         'Icon',
  "3d":         '3D',
  cad:          'CAD',
  video:        'Video',
  audio:        'Audio',
  pdf:          'PDF',
  document:     'Document',
  spreadsheet:  'Spreadsheet',
  presentation: 'Presentation',
  archive:      'Archive',
  font:         'Font',
  gis:          'GIS',
  email:        'Email',
  code:         'Code',
  ebook:        'eBook',
  webpage:      'Webpage',
  subtitle:     'Subtitle',
  certificate:  'Certificate',
  scientific:   'Scientific',
  medical:      'Medical',
  "disk-image": 'Disk Image',
  executable:   'Executable',
  other:        'Other',
};

const CATEGORY_ROUTES: Record<FormatCategory, string> = {
  image:        'image-converter',
  raw:          'image-converter',
  vector:       'image-converter',
  icon:         'image-converter',
  "3d":         'cad-converter',
  cad:          'cad-converter',
  video:        'video-converter',
  audio:        'audio-converter',
  pdf:          'document-converter',
  document:     'document-converter',
  spreadsheet:  'document-converter',
  presentation: 'document-converter',
  archive:      'archive-converter',
  font:         'font-converter',
  gis:          'gis-converter',
  email:        'email-converter',
  code:         'code-converter',
  ebook:        'ebook-converter',
  webpage:      'document-converter',
  subtitle:     'document-converter',
  certificate:  'document-converter',
  scientific:   'document-converter',
  medical:      'document-converter',
  "disk-image": 'archive-converter',
  executable:   'archive-converter',
  other:        'document-converter',
};

// ---------------------------------------------------------------------------
// DATA GENERATION FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Get page data for a conversion slug
 */
export function getConversionPageData(slug: string): ToolPageData | null {
  // Resolve aliases in slug
  const parts = slug.split('-to-');
  let inputExt = parts[0]?.toLowerCase() || '';
  let outputExt = parts.length > 1 ? parts[1]?.toLowerCase() : null;

  // Resolve aliases
  inputExt = aliasEngine.resolve(inputExt);
  if (outputExt) {
    outputExt = aliasEngine.resolve(outputExt);
  }

  // Get tool from dynamic engine
  const canonicalSlug = outputExt ? `${inputExt}-to-${outputExt}` : inputExt;
  const tool = dynamicToolEngine.getBySlug(canonicalSlug);

  // Parse from conversion registry
  const parsed = conversionRegistry.parseSlug(canonicalSlug);

  if (!parsed) {
    // Fallback: try to get format info
    const format = formatRegistry.get(inputExt);
    if (format) {
      // Single-format page
      return getSingleFormatPageData(inputExt);
    }
    return null;
  }

  // Get input format info
  const inputFormat = formatRegistry.get(parsed.inputFormat);
  if (!inputFormat) return null;

  // Build page data
  const isSingleFormat = parsed.isSingleFormat || !parsed.outputFormat;

  // Category info
  const category = parsed.inputCategory;
  const categorySlug = CATEGORY_ROUTES[category] || 'tools';
  const categoryRoute = `/${categorySlug}`;
  const categoryLabel = CATEGORY_LABELS[category] || 'Tools';

  // Get available outputs for single-format pages
  const availableOutputs = isSingleFormat
    ? conversionRegistry.getAvailableOutputs(parsed.inputFormat)
    : [];

  // Build title
  const inputUpper = parsed.inputFormat.toUpperCase();
  const outputUpper = parsed.outputFormat?.toUpperCase();
  const title = isSingleFormat
    ? `Convert ${inputUpper} Files Online - Free ${inputUpper} Converter`
    : `Convert ${inputUpper} to ${outputUpper} Online - Free & Secure`;

  // Build description
  const description = isSingleFormat
    ? `Free online ${parsed.inputName} converter supporting multiple output formats. 100% private, files processed locally.`
    : `Free online ${parsed.inputName} to ${parsed.outputName} converter. 100% private, files processed locally in your browser.`;

  // Build keywords
  const keywords = isSingleFormat
    ? [inputUpper, 'converter', 'convert', 'online', 'free', parsed.inputFormat, category]
    : [inputUpper, outputUpper, 'to', 'convert', 'converter', 'online', 'free', parsed.inputFormat, parsed.outputFormat || ''];

  // Build breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: `${categoryLabel} Tools`, href: categoryRoute },
    { label: isSingleFormat ? `${inputUpper} Converter` : `${inputUpper} to ${outputUpper}`, isCurrent: true },
  ];

  // Get related tools
  const relatedTools = getRelatedToolsData(slug, 6);

  // Build upload config
  const uploadConfig = {
    acceptedExtensions: [`.${parsed.inputFormat}`],
    acceptedMimes: inputFormat.mime ? [inputFormat.mime] : [],
    maxFileSize: 100 * 1024 * 1024, // 100MB default
    supportsBatch: false,
    showPreview: category === 'image',
  };

  // Provider info
  const provider = tool?.provider ? {
    id: tool.provider,
    name: tool.provider,
    type: 'client' as const,
  } : null;

  // Capabilities from tool or input format
  const capabilities = {
    hasTransparency: tool?.capabilities.hasTransparency ?? false,
    hasAnimation: tool?.capabilities.hasAnimation ?? false,
    isLossless: tool?.capabilities.isLossless ?? true,
    supportsBatch: tool?.capabilities.supportsBatch ?? false,
  };

  // Build parsed conversion data
  const parsedConversion = {
    inputFormat: parsed.inputFormat,
    outputFormat: parsed.outputFormat,
    inputName: parsed.inputName,
    outputName: parsed.outputName,
    inputCategory: parsed.inputCategory,
    outputCategory: parsed.outputCategory,
    isSingleFormat,
    isValid: parsed.isValid,
  };

  return {
    tool: tool || null,
    parsedConversion,
    title,
    description,
    keywords: keywords.filter((k): k is string => !!k),
    category,
    categorySlug,
    categoryRoute,
    categoryLabel,
    breadcrumbs,
    relatedTools,
    availableOutputs,
    uploadConfig,
    provider,
    capabilities,
    route: tool?.route || `/${categorySlug}/${canonicalSlug}`,
    canonicalRoute: `/${categorySlug}/${canonicalSlug}`,
  };
}

/**
 * Get page data for a single format page
 */
export function getSingleFormatPageData(ext: string): ToolPageData | null {
  const canonical = aliasEngine.resolve(ext);
  const format = formatRegistry.get(canonical);
  if (!format) return null;

  const tool = dynamicToolEngine.getBySlug(canonical);

  // Get targets for this format
  const availableOutputs = conversionRegistry.getAvailableOutputs(canonical);

  const category = format.category;
  const categorySlug = CATEGORY_ROUTES[category] || 'tools';
  const categoryLabel = CATEGORY_LABELS[category] || 'Tools';

  const inputUpper = canonical.toUpperCase();
  const title = `Convert ${inputUpper} Files Online - Free ${format.name} Converter`;
  const description = `Free online ${format.name} converter. Convert ${inputUpper} to multiple formats. 100% private, files processed locally.`;
  const keywords = [inputUpper, canonical, 'converter', 'convert', 'online', 'free', category];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: `${categoryLabel} Tools`, href: `/${categorySlug}` },
    { label: `${inputUpper} Converter`, isCurrent: true },
  ];

  return {
    tool: tool || null,
    parsedConversion: {
      inputFormat: canonical,
      outputFormat: null,
      inputName: format.name,
      outputName: null,
      inputCategory: category,
      outputCategory: null,
      isSingleFormat: true,
      isValid: true,
    },
    title,
    description,
    keywords,
    category,
    categorySlug,
    categoryRoute: `/${categorySlug}`,
    categoryLabel,
    breadcrumbs,
    relatedTools: [],
    availableOutputs,
    uploadConfig: {
      acceptedExtensions: [`.${canonical}`],
      acceptedMimes: format.mime ? [format.mime] : [],
      maxFileSize: 100 * 1024 * 1024,
      supportsBatch: false,
      showPreview: category === 'image',
    },
    provider: tool?.provider ? {
      id: tool.provider,
      name: tool.provider,
      type: 'client' as const,
    } : null,
    capabilities: {
      hasTransparency: false,
      hasAnimation: false,
      isLossless: true,
      supportsBatch: false,
    },
    route: `/${categorySlug}/${canonical}`,
    canonicalRoute: `/${categorySlug}/${canonical}`,
  };
}

/**
 * Get page data for a viewer page
 */
export function getViewerPageData(ext: string): ToolPageData | null {
  const canonical = aliasEngine.resolve(ext);
  const format = formatRegistry.get(canonical);
  if (!format) return null;

  const tool = dynamicToolEngine.getBySlug(`viewer-${canonical}`);
  const category = format.category;
  const categorySlug = CATEGORY_ROUTES[category] || 'tools';
  const categoryLabel = CATEGORY_LABELS[category] || 'Tools';

  const extUpper = canonical.toUpperCase();
  const title = `Free Online ${extUpper} Viewer — Open ${format.name} Files Instantly`;
  const description = `Open and view ${format.name} files directly in your browser. No installation, 100% private.`;
  const keywords = [extUpper, 'viewer', 'view', 'open', 'online', 'free', canonical];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Viewers', href: '/view' },
    { label: `${extUpper} Viewer`, isCurrent: true },
  ];

  // Get related conversions
  const relatedTools = conversionRegistry.getTargets(canonical)
    .slice(0, 6)
    .map(target => {
      const targetFormat = formatRegistry.get(target);
      const slug = `${canonical}-to-${target}`;
      return {
        id: slug,
        slug,
        name: `${extUpper} to ${target.toUpperCase()}`,
        shortName: `${extUpper} → ${target.toUpperCase()}`,
        inputFormat: canonical,
        outputFormat: target,
        category,
        route: `/${categorySlug}/${slug}`,
        relationshipType: 'same-input',
        relationshipLabel: 'Convert to',
        score: 0.9,
      };
    });

  return {
    tool: tool || null,
    parsedConversion: null,
    title,
    description,
    keywords,
    category,
    categorySlug,
    categoryRoute: '/view',
    categoryLabel,
    breadcrumbs,
    relatedTools,
    availableOutputs: [],
    uploadConfig: {
      acceptedExtensions: [`.${canonical}`],
      acceptedMimes: format.mime ? [format.mime] : [],
      maxFileSize: 100 * 1024 * 1024,
      supportsBatch: false,
      showPreview: true,
    },
    provider: tool?.provider ? {
      id: tool.provider,
      name: tool.provider,
      type: 'client' as const,
    } : null,
    capabilities: {
      hasTransparency: false,
      hasAnimation: format.viewerEngine === 'video',
      isLossless: true,
      supportsBatch: false,
    },
    route: `/view/${canonical}`,
    canonicalRoute: `/view/${canonical}`,
  };
}

/**
 * Get related tools data for a conversion
 */
export function getRelatedToolsData(slug: string, limit: number = 6): RelatedToolData[] {
  const related = relationshipEngine.getRelated(slug, limit);
  const firstCategory = related[0]?.category || 'image';
  const categorySlug = CATEGORY_ROUTES[firstCategory as FormatCategory] || 'image-converter';

  return related.map(r => ({
    id: r.slug,
    slug: r.slug,
    name: `${r.inputName} to ${r.outputName}`,
    shortName: `${r.inputFormat.toUpperCase()} → ${r.outputFormat.toUpperCase()}`,
    inputFormat: r.inputFormat,
    outputFormat: r.outputFormat,
    category: r.category,
    route: `/${categorySlug}/${r.slug}`,
    relationshipType: r.relationshipType,
    relationshipLabel: r.relationshipLabel,
    score: r.score,
  }));
}

/**
 * Get all conversion slugs (for generateStaticParams)
 */
export function getAllConversionSlugs(): string[] {
  return conversionRegistry.getAllSlugs();
}

/**
 * Get all viewer slugs
 */
export function getAllViewerSlugs(): string[] {
  const viewable = formatRegistry.getViewableFormats();
  return viewable.map(f => f.ext);
}

/**
 * Get navigation categories for page
 */
export function getNavigationCategories() {
  return categoryEngine.getAllCategories();
}

/**
 * Get popular tools for homepage/sidebar
 */
export function getPopularToolsData(limit: number = 10): RelatedToolData[] {
  const tools = dynamicToolEngine.getPopular(limit);

  return tools.filter(t => t.type === 'converter').map(t => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    shortName: t.shortName,
    inputFormat: t.inputFormat || '',
    outputFormat: t.outputFormat || null,
    category: t.category,
    route: t.route,
    relationshipType: 'popular',
    relationshipLabel: 'Popular',
    score: t.searchPriority,
  }));
}
