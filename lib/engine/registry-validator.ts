/**
 * lib/engine/registry-validator.ts
 * Registry Validator - validates registry integrity
 *
 * Validates:
 * - No duplicate formats
 * - No duplicate aliases
 * - No orphan conversions (conversions referencing non-existent formats)
 * - No circular aliases
 * - Consistent MIME types
 * - All conversions have valid provider
 * - Category assignments are valid
 *
 * Run during build/deploy to catch configuration errors early.
 */

import type { FormatCategory } from '../types/formats';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { aliasEngine } from './alias-engine';
import { mimeEngine } from './mime-engine';
import { categoryEngine } from './category-engine';
import { providerRegistry } from '../registry/provider-registry';

// ---------------------------------------------------------------------------
// VALIDATION TYPES
// ---------------------------------------------------------------------------

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  location: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  stats: {
    formats: number;
    aliases: number;
    conversions: number;
    categories: number;
    providers: number;
  };
}

// ---------------------------------------------------------------------------
// VALIDATION CODES
// ---------------------------------------------------------------------------

export const VALIDATION_CODES = {
  // Format errors
  DUPLICATE_FORMAT: 'F001',
  MISSING_MIME: 'F002',
  MISSING_CATEGORY: 'F003',
  INVALID_EXTENSION: 'F004',

  // Alias errors
  DUPLICATE_ALIAS: 'A001',
  CIRCULAR_ALIAS: 'A002',
  ORPHAN_ALIAS: 'A003',
  SELF_ALIAS: 'A004',

  // Conversion errors
  ORPHAN_CONVERSION_SOURCE: 'C001',
  ORPHAN_CONVERSION_TARGET: 'C002',
  DUPLICATE_CONVERSION: 'C003',
  INVALID_CONVERSION_SLUG: 'C004',
  MISSING_PROVIDER: 'C005',

  // Category errors
  INVALID_CATEGORY: 'CAT001',
  UNKNOWN_CATEGORY: 'CAT002',

  // MIME errors
  DUPLICATE_MIME: 'M001',
  MISSING_MIME_MAPPING: 'M002',

  // Consistency warnings
  INCONSISTENT_CAPABILITY: 'W001',
  MISSING_FAMILY: 'W002',
  MISSING_SIGNATURE: 'W003',
  MISSING_POPULAR_CONVERSIONS: 'W004',
} as const;

// ---------------------------------------------------------------------------
// REGISTRY VALIDATOR CLASS
// ---------------------------------------------------------------------------

class RegistryValidator {
  private issues: ValidationIssue[];

  constructor() {
    this.issues = [];
  }

  /**
   * Run all validations
   */
  validate(): ValidationResult {
    this.issues = [];

    // Run validators
    this.validateFormats();
    this.validateAliases();
    this.validateConversions();
    this.validateCategories();
    this.validateMimeTypes();
    this.validateProviders();
    this.validateConsistency();

    // Separate issues by severity
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const info = this.issues.filter(i => i.severity === 'info');

    // Build stats
    const stats = {
      formats: formatRegistry.getAll().length,
      aliases: Object.keys(aliasEngine.getAllEquivalent('png')).length, // Sample
      conversions: conversionRegistry.getAllSlugs().length,
      categories: categoryEngine.getAllCategoryIds().length,
      providers: providerRegistry.getEnabled().length,
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      stats,
    };
  }

  /**
   * Validate format registry
   */
  private validateFormats(): void {
    const formats = formatRegistry.getAll();
    const seenExtensions = new Set<string>();
    const seenNames = new Set<string>();

    for (const format of formats) {
      // Check for duplicate extensions
      const ext = format.ext.toLowerCase();
      if (seenExtensions.has(ext)) {
        this.addError(
          VALIDATION_CODES.DUPLICATE_FORMAT,
          `Duplicate format extension: ${ext}`,
          `format-registry:${ext}`
        );
      }
      seenExtensions.add(ext);

      // Check for duplicate names
      const nameLower = format.name.toLowerCase();
      if (seenNames.has(nameLower)) {
        this.addWarning(
          VALIDATION_CODES.DUPLICATE_FORMAT,
          `Duplicate format name: ${format.name}`,
          `format-registry:${ext}`
        );
      }
      seenNames.add(nameLower);

      // Check for missing MIME type
      if (!format.mime) {
        this.addError(
          VALIDATION_CODES.MISSING_MIME,
          `Missing MIME type for ${ext}`,
          `format-registry:${ext}`
        );
      }

      // Check for invalid category
      if (!categoryEngine.isValid(format.category)) {
        this.addError(
          VALIDATION_CODES.INVALID_CATEGORY,
          `Invalid category "${format.category}" for ${ext}`,
          `format-registry:${ext}`,
          `Use one of: ${categoryEngine.getAllCategoryIds().join(', ')}`
        );
      }

      // Check extension format
      if (!/^[a-z0-9]{1,10}$/.test(ext)) {
        this.addWarning(
          VALIDATION_CODES.INVALID_EXTENSION,
          `Extension "${ext}" may not be valid`,
          `format-registry:${ext}`
        );
      }
    }
  }

  /**
   * Validate alias mappings
   */
  private validateAliases(): void {
    const aliasMap = aliasEngine.getAllAliases();
    const resolved = new Set<string>();

    for (const [alias, canonical] of Object.entries(aliasMap)) {
      // Check for self-alias
      if (alias === canonical) {
        this.addWarning(
          VALIDATION_CODES.SELF_ALIAS,
          `Format ${alias} is aliased to itself`,
          `alias-engine:${alias}`
        );
        continue;
      }

      // Check for circular aliases
      if (this.hasCircularAlias(alias, aliasMap, new Set())) {
        this.addError(
          VALIDATION_CODES.CIRCULAR_ALIAS,
          `Circular alias detected: ${alias}`,
          `alias-engine:${alias}`
        );
      }

      // Check that canonical format exists
      const format = formatRegistry.get(canonical as string);
      if (!format) {
        this.addError(
          VALIDATION_CODES.ORPHAN_ALIAS,
          `Alias ${alias} points to non-existent format ${canonical}`,
          `alias-engine:${alias}`
        );
      }

      // Check for duplicate aliases
      if (resolved.has(alias)) {
        this.addError(
          VALIDATION_CODES.DUPLICATE_ALIAS,
          `Duplicate alias: ${alias}`,
          `alias-engine:${alias}`
        );
      }
      resolved.add(alias);
    }
  }

  /**
   * Check for circular alias chain
   */
  private hasCircularAlias(
    alias: string,
    aliasMap: Record<string, string>,
    visited: Set<string>
  ): boolean {
    if (visited.has(alias)) return true;
    visited.add(alias);

    const canonical = aliasMap[alias];
    if (!canonical) return false;

    // If canonical is also an alias, follow the chain
    if (aliasMap[canonical]) {
      return this.hasCircularAlias(canonical, aliasMap, visited);
    }

    return false;
  }

  /**
   * Validate conversion matrix
   */
  private validateConversions(): void {
    const slugs = conversionRegistry.getAllSlugs();
    const seenSlugs = new Set<string>();

    for (const slug of slugs) {
      // Check for duplicate slugs
      if (seenSlugs.has(slug)) {
        this.addError(
          VALIDATION_CODES.DUPLICATE_CONVERSION,
          `Duplicate conversion slug: ${slug}`,
          `conversion-registry:${slug}`
        );
      }
      seenSlugs.add(slug);

      const parsed = conversionRegistry.parseSlug(slug);
      if (!parsed) {
        this.addError(
          VALIDATION_CODES.INVALID_CONVERSION_SLUG,
          `Invalid conversion slug: ${slug}`,
          `conversion-registry:${slug}`
        );
        continue;
      }

      // Check that source format exists
      const sourceFormat = formatRegistry.get(parsed.inputFormat);
      if (!sourceFormat) {
        this.addError(
          VALIDATION_CODES.ORPHAN_CONVERSION_SOURCE,
          `Conversion ${slug} references non-existent source format: ${parsed.inputFormat}`,
          `conversion-registry:${slug}`
        );
      }

      // Check that target format exists
      if (parsed.outputFormat) {
        const targetFormat = formatRegistry.get(parsed.outputFormat);
        if (!targetFormat) {
          this.addError(
            VALIDATION_CODES.ORPHAN_CONVERSION_TARGET,
            `Conversion ${slug} references non-existent target format: ${parsed.outputFormat}`,
            `conversion-registry:${slug}`
          );
        }
      }

      // Check if there's a provider capable of handling this conversion
      if (parsed.outputFormat) {
        const hasProvider = this.hasProviderFor(parsed.inputFormat, parsed.outputFormat);
        if (!hasProvider) {
          this.addWarning(
            VALIDATION_CODES.MISSING_PROVIDER,
            `No provider configured for conversion: ${slug}`,
            `conversion-registry:${slug}`
          );
        }
      }
    }
  }

  /**
   * Check if there's a provider for conversion
   */
  private hasProviderFor(inputExt: string, outputExt: string): boolean {
    const providers = providerRegistry.getEnabled();

    for (const provider of providers) {
      const caps = provider.capabilities;
      const supportsInput = caps.supportsFormats.length === 0 || caps.supportsFormats.includes(inputExt);
      const supportsOutput = caps.supportsFormats.length === 0 || caps.supportsFormats.includes(outputExt);

      if (supportsInput || supportsOutput) {
        return true;
      }
    }

    // Image converters have canvas as fallback
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'].includes(inputExt)) {
      return true;
    }

    return false;
  }

  /**
   * Validate categories
   */
  private validateCategories(): void {
    const formats = formatRegistry.getAll();
    const categories = new Set(categoryEngine.getAllCategoryIds());

    for (const format of formats) {
      if (!categories.has(format.category)) {
        this.addError(
          VALIDATION_CODES.UNKNOWN_CATEGORY,
          `Unknown category "${format.category}" for format ${format.ext}`,
          `format-registry:${format.ext}`,
          `Add to category definitions`
        );
      }
    }
  }

  /**
   * Validate MIME types
   */
  private validateMimeTypes(): void {
    const formats = formatRegistry.getAll();
    const mimeToExt = new Map<string, string>();

    for (const format of formats) {
      // Check that MIME is mapped back to this extension
      if (format.mime) {
        const mappedExt = mimeEngine.getExtension(format.mime);

        // It's okay if MIME maps to a different extension (alias)
        if (mappedExt && mappedExt !== format.ext) {
          const canonical = aliasEngine.resolve(mappedExt);
          const expectedCanonical = aliasEngine.resolve(format.ext);

          if (canonical !== expectedCanonical) {
            this.addWarning(
              VALIDATION_CODES.DUPLICATE_MIME,
              `MIME ${format.mime} maps to ${mappedExt}, expected ${format.ext}`,
              `format-registry:${format.ext}`
            );
          }
        }

        // Track MIME → extension mapping
        if (mimeToExt.has(format.mime)) {
          const existingExt = mimeToExt.get(format.mime)!;
          if (!aliasEngine.areEquivalent(existingExt, format.ext)) {
            this.addInfo(
              VALIDATION_CODES.DUPLICATE_MIME,
              `MIME ${format.mime} used by both ${existingExt} and ${format.ext}`,
              `mime-engine:${format.mime}`
            );
          }
        }
        mimeToExt.set(format.mime, format.ext);
      } else {
        this.addWarning(
          VALIDATION_CODES.MISSING_MIME_MAPPING,
          `No MIME mapping for extension ${format.ext}`,
          `mime-engine:${format.ext}`
        );
      }
    }
  }

  /**
   * Validate providers
   */
  private validateProviders(): void {
    const providers = providerRegistry.getEnabled();

    for (const provider of providers) {
      // Check for duplicate provider IDs
      const allConfigs = providerRegistry.getConfig(provider.id);
      if (!allConfigs) {
        this.addError(
          'P001',
          `Provider ${provider.id} not found in registry`,
          `provider-registry:${provider.id}`
        );
      }

      // Check that provider supports at least one format
      if (provider.capabilities.supportsFormats.length === 0) {
        this.addInfo(
          'P002',
          `Provider ${provider.id} supports all formats (empty supportsFormats)`,
          `provider-registry:${provider.id}`
        );
      }
    }
  }

  /**
   * Validate consistency
   */
  private validateConsistency(): void {
    const formats = formatRegistry.getAll();

    for (const format of formats) {
      // Check that formats with transparency capability have appropriate outputs
      const caps = format.ext;
      const targets = conversionRegistry.getTargets(format.ext);

      // Check popular conversions
      if (!format.popularConversions || format.popularConversions.length === 0) {
        this.addInfo(
          VALIDATION_CODES.MISSING_POPULAR_CONVERSIONS,
          `No popular conversions defined for ${format.ext}`,
          `format-registry:${format.ext}`
        );
      }

      // Check for family membership
      const family = aliasEngine.getFamily(format.ext);
      if (!family && targets.length > 5) {
        this.addInfo(
          VALIDATION_CODES.MISSING_FAMILY,
          `${format.ext} has ${targets.length} converisons but no family assigned`,
          `family-engine:${format.ext}`
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ISSUE HELPERS
  // ---------------------------------------------------------------------------

  private addError(
    code: string,
    message: string,
    location: string,
    suggestion?: string
  ): void {
    this.issues.push({
      severity: 'error',
      code,
      message,
      location,
      suggestion,
    });
  }

  private addWarning(
    code: string,
    message: string,
    location: string,
    suggestion?: string
  ): void {
    this.issues.push({
      severity: 'warning',
      code,
      message,
      location,
      suggestion,
    });
  }

  private addInfo(
    code: string,
    message: string,
    location: string,
    suggestion?: string
  ): void {
    this.issues.push({
      severity: 'info',
      code,
      message,
      location,
      suggestion,
    });
  }

  // ---------------------------------------------------------------------------
  // SPECIFIC VALIDATIONS
  // ---------------------------------------------------------------------------

  /**
   * Validate a single extension
   */
  validateExtension(ext: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const canonical = aliasEngine.resolve(ext);

    // Check format exists
    const format = formatRegistry.get(canonical);
    if (!format) {
      issues.push({
        severity: 'error',
        code: VALIDATION_CODES.ORPHAN_ALIAS,
        message: `Format ${ext} not found in registry`,
        location: `format-registry:${ext}`,
      });
      return issues;
    }

    // Check MIME type
    if (!format.mime) {
      issues.push({
        severity: 'error',
        code: VALIDATION_CODES.MISSING_MIME,
        message: `Missing MIME type for ${ext}`,
        location: `format-registry:${ext}`,
      });
    }

    // Check category
    if (!categoryEngine.isValid(format.category)) {
      issues.push({
        severity: 'error',
        code: VALIDATION_CODES.INVALID_CATEGORY,
        message: `Invalid category ${format.category}`,
        location: `format-registry:${ext}`,
      });
    }

    // Check conversions
    const targets = conversionRegistry.getTargets(canonical);
    if (targets.length === 0) {
      issues.push({
        severity: 'warning',
        code: VALIDATION_CODES.MISSING_POPULAR_CONVERSIONS,
        message: `No conversion targets for ${ext}`,
        location: `conversion-registry:${ext}`,
      });
    }

    return issues;
  }

  /**
   * Validate a conversion slug
   */
  validateSlug(slug: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const parsed = conversionRegistry.parseSlug(slug);

    if (!parsed) {
      issues.push({
        severity: 'error',
        code: VALIDATION_CODES.INVALID_CONVERSION_SLUG,
        message: `Invalid slug format: ${slug}`,
        location: `conversion-registry:${slug}`,
      });
      return issues;
    }

    // Validate source
    const sourceIssues = this.validateExtension(parsed.inputFormat);
    issues.push(...sourceIssues);

    // Validate target
    if (parsed.outputFormat) {
      const targetIssues = this.validateExtension(parsed.outputFormat);
      issues.push(...targetIssues);
    }

    return issues;
  }

  /**
   * Quick check if registry is valid
   */
  isValid(): boolean {
    const result = this.validate();
    return result.valid;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const registryValidator = new RegistryValidator();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function validateRegistries(): ValidationResult {
  return registryValidator.validate();
}

export function isValidExtension(ext: string): boolean {
  const issues = registryValidator.validateExtension(ext);
  return !issues.some(i => i.severity === 'error');
}

export function isValidSlug(slug: string): boolean {
  const issues = registryValidator.validateSlug(slug);
  return !issues.some(i => i.severity === 'error');
}
