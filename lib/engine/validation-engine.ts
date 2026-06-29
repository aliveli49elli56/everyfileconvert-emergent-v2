/**
 * lib/engine/validation-engine.ts
 * Enhanced Validation Engine - comprehensive file validation
 *
 * Validates: extension, MIME, signature, max size, corrupted, encrypted
 */

import type { FormatCategory } from '../types/formats';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { aliasEngine } from './alias-engine';
import { mimeEngine } from './mime-engine';
import { signatureEngine } from './signature-engine';
import { capabilityRegistry } from '../registry/capability-registry';

// ---------------------------------------------------------------------------
// VALIDATION TYPES
// ---------------------------------------------------------------------------

export type ValidationLevel = 'quick' | 'standard' | 'thorough';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo;
}

export interface ValidationError {
  code: string;
  message: string;
  field: string;
  recoverable: boolean;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string;
}

export interface ValidationInfo {
  detectedFormat: string | null;
  detectedMime: string | null;
  canonicalFormat: string | null;
  mimeType: string | null;
  signatureMatch: boolean | null;
  signatureVerified: boolean;
  sizeBytes: number;
  checksum?: string;
}

export interface ValidationOptions {
  level: ValidationLevel;
  maxSizeBytes?: number;
  allowedFormats?: string[];
  allowedCategories?: FormatCategory[];
  checkSignature: boolean;
  checkExtension: boolean;
  checkMime: boolean;
  checkCorrupted: boolean;
  checkEncrypted: boolean;
  targetFormat?: string;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  level: 'standard',
  checkSignature: true,
  checkExtension: true,
  checkMime: true,
  checkCorrupted: false,
  checkEncrypted: false,
};

// ---------------------------------------------------------------------------
// ERROR CODES
// ---------------------------------------------------------------------------

export const VALIDATION_ERRORS = {
  EMPTY_FILE: { code: 'EMPTY_FILE', message: 'File is empty' },
  FILE_TOO_LARGE: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum size' },
  UNKNOWN_FORMAT: { code: 'UNKNOWN_FORMAT', message: 'Unknown file format' },
  UNSUPPORTED_FORMAT: { code: 'UNSUPPORTED_FORMAT', message: 'Format is not supported' },
  SIGNATURE_MISMATCH: { code: 'SIGNATURE_MISMATCH', message: 'File signature does not match extension' },
  MIME_MISMATCH: { code: 'MIME_MISMATCH', message: 'MIME type does not match expected' },
  CORRUPTED_FILE: { code: 'CORRUPTED_FILE', message: 'File appears to be corrupted' },
  ENCRYPTED_FILE: { code: 'ENCRYPTED_FILE', message: 'File is encrypted' },
  INVALID_CONVERSION: { code: 'INVALID_CONVERSION', message: 'Conversion not supported' },
  CATEGORY_NOT_ALLOWED: { code: 'CATEGORY_NOT_ALLOWED', message: 'Format category not allowed' },
  FORMAT_NOT_ALLOWED: { code: 'FORMAT_NOT_ALLOWED', message: 'Format not in allowed list' },
  NO_SIGNATURE_DETECTED: { code: 'NO_SIGNATURE_DETECTED', message: 'Could not detect file signature' },
} as const;

// ---------------------------------------------------------------------------
// VALIDATION ENGINE CLASS
// ---------------------------------------------------------------------------

class ValidationEngine {
  /**
   * Validate a file comprehensively
   */
  async validate(file: File, options: Partial<ValidationOptions> = {}): Promise<ValidationResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo = {
      detectedFormat: null,
      detectedMime: null,
      canonicalFormat: null,
      mimeType: null,
      signatureMatch: null,
      signatureVerified: false,
      sizeBytes: file.size,
    };

    // 1. Basic checks
    if (file.size === 0) {
      errors.push({
        ...VALIDATION_ERRORS.EMPTY_FILE,
        field: 'file',
        recoverable: false,
      });
      return { valid: false, errors, warnings, info };
    }

    // 2. Size check
    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
      const maxSizeMB = Math.round(opts.maxSizeBytes / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      errors.push({
        ...VALIDATION_ERRORS.FILE_TOO_LARGE,
        message: `File is ${fileSizeMB}MB but maximum is ${maxSizeMB}MB`,
        field: 'size',
        recoverable: false,
      });
    }

    // 3. Extract extension
    const extension = this.extractExtension(file.name);
    info.canonicalFormat = aliasEngine.resolve(extension);

    // 4. Get format info
    const format = formatRegistry.get(info.canonicalFormat);
    info.mimeType = format?.mime ?? mimeEngine.getMime(extension);

    // 5. Check if format is known
    if (opts.checkExtension && !format) {
      if (opts.level === 'thorough') {
        errors.push({
          ...VALIDATION_ERRORS.UNKNOWN_FORMAT,
          field: 'extension',
          recoverable: false,
        });
      } else {
        warnings.push({
          ...VALIDATION_ERRORS.UNKNOWN_FORMAT,
          field: 'extension',
        });
      }
    }

    // 6. Check allowed formats
    if (opts.allowedFormats && opts.allowedFormats.length > 0) {
      if (!opts.allowedFormats.includes(info.canonicalFormat)) {
        errors.push({
          ...VALIDATION_ERRORS.FORMAT_NOT_ALLOWED,
          field: 'format',
          recoverable: false,
        });
      }
    }

    // 7. Check allowed categories
    if (opts.allowedCategories && opts.allowedCategories.length > 0 && format) {
      if (!opts.allowedCategories.includes(format.category)) {
        errors.push({
          ...VALIDATION_ERRORS.CATEGORY_NOT_ALLOWED,
          field: 'category',
          recoverable: false,
        });
      }
    }

    // 8. MIME type check
    if (opts.checkMime && file.type) {
      const normalizedFileMime = mimeEngine.normalizeMime(file.type);
      const expectedMimes = mimeEngine.getAllMimes(info.canonicalFormat);

      if (!expectedMimes.some(m => mimeEngine.normalizeMime(m) === normalizedFileMime)) {
        info.detectedMime = normalizedFileMime;
        if (opts.level === 'thorough') {
          warnings.push({
            ...VALIDATION_ERRORS.MIME_MISMATCH,
            message: `File reports ${normalizedFileMime} but expected ${expectedMimes[0]}`,
            field: 'mime',
          });
        }
      }
    }

    // 9. Signature check
    if (opts.checkSignature && opts.level !== 'quick') {
      const signature = await signatureEngine.readSignature(file);

      if (signature) {
        const detected = signatureEngine.detect(signature);

        if (detected) {
          info.detectedFormat = detected.format;
          info.detectedMime = detected.mime;
          info.signatureVerified = true;

          // Check if signature matches extension
          const signatureResult = signatureEngine.detectAndVerify(signature, extension);
          info.signatureMatch = signatureResult.matches;

          if (!signatureResult.matches) {
            if (opts.level === 'thorough') {
              errors.push({
                ...VALIDATION_ERRORS.SIGNATURE_MISMATCH,
                message: signatureResult.warning ?? 'File signature does not match extension',
                field: 'signature',
                recoverable: true,
              });
            } else {
              warnings.push({
                ...VALIDATION_ERRORS.SIGNATURE_MISMATCH,
                message: signatureResult.warning ?? 'File signature does not match extension',
                field: 'signature',
              });
            }
          }
        } else if (opts.level === 'thorough') {
          warnings.push({
            ...VALIDATION_ERRORS.NO_SIGNATURE_DETECTED,
            field: 'signature',
          });
        }
      }
    }

    // 10. Corrupted check (for supported formats)
    if (opts.checkCorrupted && opts.level === 'thorough' && format) {
      const hasTrailer = await this.checkFileIntegrity(file, info.canonicalFormat);
      if (!hasTrailer) {
        warnings.push({
          ...VALIDATION_ERRORS.CORRUPTED_FILE,
          message: 'File may be truncated or corrupted',
          field: 'integrity',
        });
      }
    }

    // 11. Encryption check (for PDF, Office, ZIP)
    if (opts.checkEncrypted && format) {
      const isEncrypted = await this.checkEncryption(file, info.canonicalFormat);
      if (isEncrypted) {
        errors.push({
          ...VALIDATION_ERRORS.ENCRYPTED_FILE,
          field: 'encryption',
          recoverable: false,
        });
      }
    }

    // 12. Conversion validity check
    if (opts.targetFormat) {
      if (!conversionRegistry.isValid(info.canonicalFormat, opts.targetFormat)) {
        errors.push({
          ...VALIDATION_ERRORS.INVALID_CONVERSION,
          message: `Cannot convert ${info.canonicalFormat} to ${opts.targetFormat}`,
          field: 'conversion',
          recoverable: false,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Quick validation (no signature check)
   */
  async quickValidate(file: File, options: Partial<ValidationOptions> = {}): Promise<ValidationResult> {
    return this.validate(file, { ...options, level: 'quick', checkSignature: false });
  }

  /**
   * Thorough validation (all checks)
   */
  async thoroughValidate(file: File, options: Partial<ValidationOptions> = {}): Promise<ValidationResult> {
    return this.validate(file, { ...options, level: 'thorough', checkCorrupted: true, checkEncrypted: true });
  }

  /**
   * Validate batch of files
   */
  async validateBatch(
    files: File[],
    options: Partial<ValidationOptions> = {}
  ): Promise<{ valid: boolean; results: Map<File, ValidationResult> }> {
    const results = new Map<File, ValidationResult>();
    let allValid = true;

    for (const file of files) {
      const result = await this.validate(file, options);
      results.set(file, result);
      if (!result.valid) allValid = false;
    }

    return { valid: allValid, results };
  }

  /**
   * Validate conversion parameters
   */
  validateConversion(
    sourceExt: string,
    targetExt: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const source = aliasEngine.resolve(sourceExt);
    const target = aliasEngine.resolve(targetExt);

    // Check formats exist
    if (!formatRegistry.has(source)) {
      errors.push(`Unknown source format: ${source}`);
    }

    if (!formatRegistry.has(target)) {
      errors.push(`Unknown target format: ${target}`);
    }

    // Check conversion is valid
    if (errors.length === 0 && !conversionRegistry.isValid(source, target)) {
      errors.push(`Conversion from ${source} to ${target} is not supported`);
    }

    // Get capability warnings
    if (errors.length === 0) {
      const capabilityWarnings = capabilityRegistry.getConversionWarnings(source, target);
      warnings.push(...capabilityWarnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Extract extension from filename
   */
  private extractExtension(filename: string): string {
    const ext = filename.split('.').pop() ?? '';
    return ext.toLowerCase().replace(/^\./, '');
  }

  /**
   * Check file integrity (trailer/footer signature)
   */
  private async checkFileIntegrity(file: File, format: string): Promise<boolean> {
    try {
      // For formats with known trailers, check for them
      const hasTrailer = signatureEngine.hasTrailer(
        new Uint8Array(await file.slice(-100).arrayBuffer()),
        format
      );
      return hasTrailer;
    } catch {
      return true; // Assume OK if can't check
    }
  }

  /**
   * Check if file is encrypted
   */
  private async checkEncryption(file: File, format: string): Promise<boolean> {
    // PDF encryption check
    if (format === 'pdf') {
      try {
        const header = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
        const headerStr = String.fromCharCode(...Array.from(header));

        // Check for /Encrypt in PDF
        if (headerStr.includes('/Encrypt')) {
          return true;
        }
      } catch {
        return false;
      }
    }

    // ZIP-based formats (docx, xlsx, etc.)
    if (['docx', 'xlsx', 'pptx', 'zip'].includes(format)) {
      try {
        const header = new Uint8Array(await file.slice(0, 100).arrayBuffer());

        // Check for encrypted ZIP flag
        if (header.length > 6 && (header[6] & 0x01)) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Get validation requirements for format
   */
  getValidationRequirements(format: string): {
    requiredSignature: boolean;
    requiredMime: boolean;
    maxRecommendedSize: number;
  } {
    const fmt = formatRegistry.get(format);
    const caps = capabilityRegistry.getCapabilities(format);

    return {
      requiredSignature: signatureEngine.getReliability(format) === 'high',
      requiredMime: true,
      maxRecommendedSize: caps?.maxFileSize ?? 500 * 1024 * 1024,
    };
  }
}

export const validationEngine = new ValidationEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export async function validateFile(
  file: File,
  options?: Partial<ValidationOptions>
): Promise<ValidationResult> {
  return validationEngine.validate(file, options);
}

export async function quickValidateFile(
  file: File,
  options?: Partial<ValidationOptions>
): Promise<ValidationResult> {
  return validationEngine.quickValidate(file, options);
}

export async function thoroughValidateFile(
  file: File,
  options?: Partial<ValidationOptions>
): Promise<ValidationResult> {
  return validationEngine.thoroughValidate(file, options);
}

export function validateConversion(source: string, target: string) {
  return validationEngine.validateConversion(source, target);
}
