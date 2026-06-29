/**
 * lib/engine/navigation-engine.ts
 * Auto Navigation Engine - generates navigation from registries
 *
 * Auto-generates navigation structure for:
 * - Main navigation (Converters, Viewers, Editors, Tools)
 * - Category navigation (Image, Video, Audio, Document, etc.)
 * - Popular tools navigation
 * - Footer navigation
 * - Breadcrumbs
 *
 * NO hardcoded navigation links. All derived from registries.
 */

import type { FormatCategory } from '../types/formats';
import type { SupportedLocale } from '../config/route-definitions';
import { dynamicToolEngine, type DynamicTool } from './dynamic-tool-engine';
import { categoryEngine, type CategoryMetadata } from './category-engine';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { aliasEngine } from './alias-engine';

// ---------------------------------------------------------------------------
// NAVIGATION TYPES
// ---------------------------------------------------------------------------

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  description?: string;
  badge?: string;
  children?: NavItem[];
  isExternal?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  sortPriority: number;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface NavigationContext {
  locale?: SupportedLocale;
  currentPath?: string;
  userTier?: 'free' | 'premium' | 'enterprise';
  includePremium?: boolean;
}

// ---------------------------------------------------------------------------
// NAVIGATION ENGINE CLASS
// ---------------------------------------------------------------------------

class NavigationEngine {
  private navCache: Map<string, NavSection[]>;
  private categoryNavCache: Map<string, NavItem>;

  constructor() {
    this.navCache = new Map();
    this.categoryNavCache = new Map();
  }

  /**
   * Get main navigation - AUTO from registries
   */
  getMainNavigation(context?: NavigationContext): NavSection[] {
    const cacheKey = `main-${context?.includePremium ? 'premium' : 'free'}`;

    if (this.navCache.has(cacheKey)) {
      return this.navCache.get(cacheKey)!;
    }

    const sections: NavSection[] = [
      this.buildConvertersNav(context),
      this.buildViewersNav(context),
      this.buildEditorsNav(context),
      this.buildToolsNav(context),
    ];

    this.navCache.set(cacheKey, sections);
    return sections;
  }

  /**
   * Build Converters navigation - AUTO from Conversion Registry
   */
  private buildConvertersNav(context?: NavigationContext): NavSection {
    const categories = categoryEngine.getCategoriesWithTools();
    const items: NavItem[] = [];

    for (const cat of categories) {
      const catTools = dynamicToolEngine.getByCategory(cat.id)
        .filter(t => t.type === 'converter')
        .filter(t => context?.includePremium || !t.isPremium)
        .sort((a, b) => b.searchPriority - a.searchPriority)
        .slice(0, 5);

      if (catTools.length > 0) {
        items.push({
          id: `cat-${cat.slug}`,
          label: cat.pluralName,
          href: cat.route,
          icon: cat.icon,
          description: cat.description,
          children: catTools.map(t => ({
            id: t.id,
            label: t.shortName,
            href: t.route,
            icon: t.icon,
            sortPriority: t.searchPriority,
          })),
          sortPriority: cat.sortPriority,
        });
      }
    }

    // Add "All Converters" link
    items.unshift({
      id: 'all-converters',
      label: 'All Converters',
      href: '/converters',
      icon: 'ArrowRightLeft',
      description: 'Browse all file converters',
      sortPriority: 0,
    });

    return {
      id: 'converters',
      label: 'Converters',
      items: items.sort((a, b) => a.sortPriority - b.sortPriority),
      collapsible: true,
      defaultExpanded: true,
    };
  }

  /**
   * Build Viewers navigation - AUTO from Format Registry
   */
  private buildViewersNav(context?: NavigationContext): NavSection {
    const viewers = dynamicToolEngine.getViewers()
      .filter(t => context?.includePremium || !t.isPremium)
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, 10);

    const items: NavItem[] = [
      {
        id: 'all-viewers',
        label: 'All Viewers',
        href: '/view',
        icon: 'Eye',
        description: 'Browse all file viewers',
        sortPriority: 0,
      },
    ];

    // Group by category
    const byCategory = new Map<FormatCategory, DynamicTool[]>();
    for (const viewer of viewers) {
      const cat = viewer.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(viewer);
    }

    for (const [catId, tools] of Array.from(byCategory)) {
      const meta = categoryEngine.getMetadata(catId);
      if (meta) {
        items.push({
          id: `viewers-${meta.slug}`,
          label: meta.pluralName,
          href: `/view?category=${meta.slug}`,
          icon: meta.icon,
          children: tools.slice(0, 4).map((t: DynamicTool) => ({
            id: t.id,
            label: t.shortName,
            href: t.route,
            icon: t.icon,
            sortPriority: t.searchPriority,
          })),
          sortPriority: meta.sortPriority,
        });
      }
    }

    return {
      id: 'viewers',
      label: 'Viewers',
      items: items.sort((a, b) => a.sortPriority - b.sortPriority),
      collapsible: true,
      defaultExpanded: false,
    };
  }

  /**
   * Build Editors navigation - AUTO from Editor Registry
   */
  private buildEditorsNav(context?: NavigationContext): NavSection {
    const editors = dynamicToolEngine.getEditors()
      .filter(t => context?.includePremium || !t.isPremium)
      .sort((a, b) => b.searchPriority - a.searchPriority);

    const items: NavItem[] = [
      {
        id: 'all-editors',
        label: 'All Editors',
        href: '/edit',
        icon: 'Edit3',
        description: 'Browse all file editors',
        sortPriority: 0,
      },
    ];

    for (const editor of editors) {
      items.push({
        id: editor.id,
        label: editor.name,
        href: editor.route,
        icon: editor.icon,
        description: editor.description,
        isPremium: editor.isPremium,
        sortPriority: editor.searchPriority,
      });
    }

    return {
      id: 'editors',
      label: 'Editors',
      items,
      collapsible: true,
      defaultExpanded: false,
    };
  }

  /**
   * Build Tools navigation - AUTO from processors
   */
  private buildToolsNav(context?: NavigationContext): NavSection {
    const processors = dynamicToolEngine.getProcessors()
      .filter(t => context?.includePremium || !t.isPremium)
      .sort((a, b) => b.searchPriority - a.searchPriority);

    const items: NavItem[] = [
      {
        id: 'all-tools',
        label: 'All Tools',
        href: '/tools',
        icon: 'Wand2',
        description: 'Browse all processing tools',
        sortPriority: 0,
      },
    ];

    // Group by category
    const byCategory = new Map<string, DynamicTool[]>();
    for (const proc of processors) {
      const catSlug = proc.categorySlug;
      if (!byCategory.has(catSlug)) byCategory.set(catSlug, []);
      byCategory.get(catSlug)!.push(proc);
    }

    for (const [catSlug, tools] of Array.from(byCategory)) {
      const meta = categoryEngine.getBySlug(catSlug);
      if (meta && tools.length > 0) {
        items.push({
          id: `tools-${catSlug}`,
          label: meta.pluralName,
          href: `/tools?category=${catSlug}`,
          icon: meta.icon,
          children: tools.map((t: DynamicTool) => ({
            id: t.id,
            label: t.name,
            href: t.route,
            icon: t.icon,
            sortPriority: t.searchPriority,
          })),
          sortPriority: meta.sortPriority,
        });
      }
    }

    return {
      id: 'tools',
      label: 'Tools',
      items: items.sort((a, b) => a.sortPriority - b.sortPriority),
      collapsible: true,
      defaultExpanded: false,
    };
  }

  /**
   * Get category navigation - AUTO from registries
   */
  getCategoryNavigation(category: FormatCategory, context?: NavigationContext): NavItem {
    const cacheKey = `${category}-${context?.includePremium ? 'premium' : 'free'}`;

    if (this.categoryNavCache.has(cacheKey)) {
      return this.categoryNavCache.get(cacheKey)!;
    }

    const meta = categoryEngine.getMetadata(category);
    if (!meta) {
      return this.buildEmptyNavItem(category);
    }

    const tools = dynamicToolEngine.getByCategory(category)
      .filter(t => context?.includePremium || !t.isPremium)
      .sort((a, b) => b.searchPriority - a.searchPriority);

    // Popular converters for this category
    const popularConverters = tools
      .filter(t => t.type === 'converter')
      .slice(0, 10);

    // Available formats in this category
    const formats = formatRegistry.getByCategory(category);

    const navItem: NavItem = {
      id: `nav-${meta.slug}`,
      label: meta.pluralName,
      href: meta.route,
      icon: meta.icon,
      description: meta.description,
      children: [
        // Popular conversions
        ...popularConverters.slice(0, 5).map(t => ({
          id: t.id,
          label: t.shortName,
          href: t.route,
          icon: t.icon,
          sortPriority: t.searchPriority,
        })),
        // Browse all link
        {
          id: `browse-${meta.slug}`,
          label: `All ${meta.pluralName} Formats`,
          href: `/formats/${meta.slug}`,
          icon: 'Folder',
          sortPriority: 999,
        },
      ],
      sortPriority: meta.sortPriority,
    };

    this.categoryNavCache.set(cacheKey, navItem);
    return navItem;
  }

  /**
   * Get popular tools navigation - AUTO from search priority
   */
  getPopularNavigation(limit: number = 20, context?: NavigationContext): NavItem[] {
    return dynamicToolEngine.getPopular(limit)
      .filter(t => context?.includePremium || !t.isPremium)
      .map(t => ({
        id: t.id,
        label: t.name,
        href: t.route,
        icon: t.icon,
        description: t.description,
        isPremium: t.isPremium,
        sortPriority: t.searchPriority,
      }));
  }

  /**
   * Get footer navigation - AUTO from categories
   */
  getFooterNavigation(): NavSection[] {
    const categories = categoryEngine.getCategoriesWithTools();

    const categorySection: NavSection = {
      id: 'categories',
      label: 'By Category',
      items: categories.map(cat => ({
        id: `footer-${cat.slug}`,
        label: cat.pluralName,
        href: cat.route,
        icon: cat.icon,
        sortPriority: cat.sortPriority,
      })).sort((a, b) => a.sortPriority - b.sortPriority),
    };

    const popularTools = this.getPopularNavigation(10);

    const popularSection: NavSection = {
      id: 'popular',
      label: 'Popular Tools',
      items: popularTools.slice(0, 6),
    };

    const resourceSection: NavSection = {
      id: 'resources',
      label: 'Resources',
      items: [
        { id: 'help', label: 'Help Center', href: '/help', icon: 'HelpCircle', sortPriority: 1 },
        { id: 'api', label: 'API', href: '/api', icon: 'Code', sortPriority: 2 },
        { id: 'pricing', label: 'Pricing', href: '/pricing', icon: 'CreditCard', sortPriority: 3 },
        { id: 'about', label: 'About', href: '/about', icon: 'Info', sortPriority: 4 },
      ],
    };

    return [categorySection, popularSection, resourceSection];
  }

  /**
   * Get breadcrumbs for tool - AUTO from tool metadata
   */
  getBreadcrumbs(tool: DynamicTool): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
    ];

    const catMeta = categoryEngine.getMetadata(tool.category);
    if (catMeta) {
      crumbs.push({
        label: catMeta.pluralName,
        href: catMeta.route,
      });
    }

    // Add tool type
    if (tool.type === 'converter') {
      crumbs.push({
        label: 'Converters',
        href: '/converters',
      });
    } else if (tool.type === 'viewer') {
      crumbs.push({
        label: 'Viewers',
        href: '/view',
      });
    } else if (tool.type === 'editor') {
      crumbs.push({
        label: 'Editors',
        href: '/edit',
      });
    }

    // Add current tool
    crumbs.push({
      label: tool.name,
      isCurrent: true,
    });

    return crumbs;
  }

  /**
   * Get breadcrumbs for conversion slug - AUTO
   */
  getBreadcrumbsForSlug(slug: string): BreadcrumbItem[] {
    const tool = dynamicToolEngine.getBySlug(slug);
    if (tool) {
      return this.getBreadcrumbs(tool);
    }

    // Fallback for slug not found
    const parsed = conversionRegistry.parseSlug(slug);
    if (!parsed) {
      return [{ label: 'Home', href: '/' }];
    }

    const crumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
    ];

    const catMeta = categoryEngine.getMetadata(parsed.inputCategory);
    if (catMeta) {
      crumbs.push({
        label: catMeta.pluralName,
        href: catMeta.route,
      });
    }

    if (parsed.outputFormat) {
      crumbs.push({
        label: `${parsed.inputName} to ${parsed.outputName}`,
        isCurrent: true,
      });
    } else {
      crumbs.push({
        label: parsed.inputName,
        isCurrent: true,
      });
    }

    return crumbs;
  }

  /**
   * Get format navigation - all formats that can convert to/from
   */
  getFormatNavigation(ext: string): {
    canConvertTo: NavItem[];
    canConvertFrom: NavItem[];
  } {
    const canonical = aliasEngine.resolve(ext);
    const format = formatRegistry.get(canonical);

    if (!format) {
      return { canConvertTo: [], canConvertFrom: [] };
    }

    // Formats this can convert to
    const targets = conversionRegistry.getTargets(canonical);
    const canConvertTo: NavItem[] = targets.map(target => {
      const targetFormat = formatRegistry.get(target);
      return {
        id: `${canonical}-to-${target}`,
        label: targetFormat?.name || target.toUpperCase(),
        href: `/image-converter/${canonical}-to-${target}`,
        sortPriority: targetFormat?.searchPriority || 50,
      };
    }).sort((a, b) => b.sortPriority - a.sortPriority);

    // Formats that can convert to this
    const allSlugs = conversionRegistry.getAllSlugs();
    const sources = allSlugs
      .filter(slug => slug.endsWith(`-to-${canonical}`))
      .map(slug => slug.split('-to-')[0]);

    const canConvertFrom: NavItem[] = sources.map(source => {
      const sourceFormat = formatRegistry.get(source);
      return {
        id: `${source}-to-${canonical}`,
        label: sourceFormat?.name || source.toUpperCase(),
        href: `/image-converter/${source}-to-${canonical}`,
        sortPriority: sourceFormat?.searchPriority || 50,
      };
    }).sort((a, b) => b.sortPriority - a.sortPriority);

    return { canConvertTo, canConvertFrom };
  }

  /**
   * Get sidebar navigation for category
   */
  getSidebarNavigation(category: FormatCategory): NavSection[] {
    const meta = categoryEngine.getMetadata(category);
    if (!meta) return [];

    const tools = dynamicToolEngine.getByCategory(category)
      .sort((a, b) => b.searchPriority - a.searchPriority);

    const sections: NavSection[] = [];

    // Converters
    const converters = tools.filter(t => t.type === 'converter');
    if (converters.length > 0) {
      sections.push({
        id: 'sidebar-converters',
        label: 'Converters',
        items: converters.slice(0, 10).map(t => ({
          id: t.id,
          label: t.shortName,
          href: t.route,
          icon: t.icon,
          sortPriority: t.searchPriority,
        })),
      });
    }

    // Viewers
    const viewers = tools.filter(t => t.type === 'viewer');
    if (viewers.length > 0) {
      sections.push({
        id: 'sidebar-viewers',
        label: 'Viewers',
        items: viewers.map(t => ({
          id: t.id,
          label: t.shortName,
          href: t.route,
          icon: t.icon,
          sortPriority: t.searchPriority,
        })),
      });
    }

    // Editors
    const editors = tools.filter(t => t.type === 'editor');
    if (editors.length > 0) {
      sections.push({
        id: 'sidebar-editors',
        label: 'Editors',
        items: editors.map(t => ({
          id: t.id,
          label: t.shortName,
          href: t.route,
          icon: t.icon,
          sortPriority: t.searchPriority,
        })),
      });
    }

    return sections;
  }

  /**
   * Build empty nav item for missing categories
   */
  private buildEmptyNavItem(id: string): NavItem {
    return {
      id,
      label: id,
      href: '/tools',
      sortPriority: 999,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.navCache.clear();
    this.categoryNavCache.clear();
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const navigationEngine = new NavigationEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getMainNavigation(context?: NavigationContext): NavSection[] {
  return navigationEngine.getMainNavigation(context);
}

export function getPopularNavigation(limit?: number, context?: NavigationContext): NavItem[] {
  return navigationEngine.getPopularNavigation(limit, context);
}

export function getBreadcrumbs(tool: DynamicTool): BreadcrumbItem[] {
  return navigationEngine.getBreadcrumbs(tool);
}
