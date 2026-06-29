/**
 * Registry migration shim.
 *
 * Re-exports from the canonical registry system. This shim exists for
 * backward compatibility during migration.
 */

import { formatRegistry, CATEGORY_DEFINITIONS } from '@/lib/registry/format-registry';
import { conversionRegistry } from '@/lib/registry/conversion-registry';
import type { FormatDefinition, FormatCategory, ParsedConversionSlug } from '@/lib/types/formats';
import type { RelatedConversion } from '@/lib/types/conversion';

// Re-export types
export type { ParsedConversionSlug as ParsedSlug, RelatedConversion, FormatCategory, FormatDefinition as FormatEntry };

// Re-export registry functions with legacy naming
export const FORMAT_REGISTRY = formatRegistry.getAll();
export const CONVERSION_MATRIX = Object.fromEntries(
  formatRegistry.getAll()
    .filter(f => conversionRegistry.getTargets(f.ext).length > 0)
    .map(f => [f.ext, conversionRegistry.getTargets(f.ext)])
);
export const FORMAT_CATEGORIES: Record<FormatCategory, string[]> = {} as Record<FormatCategory, string[]>;
formatRegistry.getAll().forEach(f => {
  if (!FORMAT_CATEGORIES[f.category]) FORMAT_CATEGORIES[f.category] = [];
  FORMAT_CATEGORIES[f.category].push(f.ext);
});
export const CATEGORY_META = CATEGORY_DEFINITIONS;

export function parseConversionSlug(slug: string): ParsedConversionSlug | null {
  return conversionRegistry.parseSlug(slug);
}

export function getAllConversionSlugs(): string[] {
  return conversionRegistry.getAllSlugs();
}

export function getDescriptionVariant(_slug: string): number {
  return 0;
}

export function getRelatedConversions(input: string, output: string | null, limit?: number): RelatedConversion[] {
  return conversionRegistry.getRelated(input, output, limit);
}

export function getAvailableOutputFormats(input: string): { ext: string; name: string; mime: string; category: string }[] {
  return conversionRegistry.getAvailableOutputs(input);
}

export function getFormatDisplayName(ext: string): string {
  return formatRegistry.get(ext)?.name || ext.toUpperCase();
}

export function getFormatCategory(ext: string): FormatCategory | null {
  return formatRegistry.get(ext)?.category || null;
}

export function getFormatEntry(ext: string): FormatDefinition | undefined {
  return formatRegistry.get(ext);
}

export function getTargetsForSource(ext: string): string[] {
  return conversionRegistry.getTargets(ext);
}
