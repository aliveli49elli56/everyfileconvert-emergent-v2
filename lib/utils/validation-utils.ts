/**
 * lib/utils/validation-utils.ts
 * Validation utilities
 */

import { getExtension } from './file-utils';

// ---------------------------------------------------------------------------
// FILE VALIDATION
// ---------------------------------------------------------------------------

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a file for conversion
 */
export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedExtensions?: string[];
    allowedMimes?: string[];
  } = {}
): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size === 0) {
    errors.push('File is empty');
  }

  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    const maxMB = Math.round(options.maxSizeBytes / (1024 * 1024));
    const fileMB = Math.round(file.size / (1024 * 1024));
    errors.push(`File is ${fileMB}MB but maximum is ${maxMB}MB`);
  }

  // Check extension
  if (options.allowedExtensions?.length) {
    const ext = getExtension(file.name);
    if (!options.allowedExtensions.includes(ext)) {
      errors.push(`File type .${ext} is not supported`);
    }
  }

  // Check MIME type
  if (options.allowedMimes?.length) {
    if (!options.allowedMimes.includes(file.type)) {
      warnings.push(`MIME type ${file.type} may not be fully supported`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple files for batch processing
 */
export function validateBatch(
  files: File[],
  options: {
    maxFiles?: number;
    maxSizeBytes?: number;
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file count
  if (options.maxFiles && files.length > options.maxFiles) {
    errors.push(`Maximum ${options.maxFiles} files allowed, got ${files.length}`);
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, options);
    errors.push(...result.errors.map(e => `${file.name}: ${e}`));
    warnings.push(...result.warnings.map(w => `${file.name}: ${w}`));
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// OPTION VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validate conversion options
 */
export function validateOptions(
  options: Record<string, unknown>,
  schema: Record<string, { type: string; required?: boolean; min?: number; max?: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, spec] of Object.entries(schema)) {
    const value = options[key];

    // Check required
    if (spec.required && value === undefined) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value === undefined) continue;

    // Check type
    if (spec.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${key} must be a number`);
        continue;
      }
      if (spec.min !== undefined && value < spec.min) {
        errors.push(`${key} must be at least ${spec.min}`);
      }
      if (spec.max !== undefined && value > spec.max) {
        errors.push(`${key} must be at most ${spec.max}`);
      }
    }

    if (spec.type === 'string' && typeof value !== 'string') {
      errors.push(`${key} must be a string`);
    }

    if (spec.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${key} must be a boolean`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// CONVERSION VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validate source-target conversion pair
 */
export function validateConversion(
  sourceExt: string,
  targetExt: string,
  conversionMatrix: Record<string, string[]>
): { valid: boolean; error?: string } {
  const targets = conversionMatrix[sourceExt.toLowerCase()];

  if (!targets) {
    return { valid: false, error: `Cannot convert from ${sourceExt}` };
  }

  if (!targets.includes(targetExt.toLowerCase())) {
    return { valid: false, error: `Cannot convert ${sourceExt} to ${targetExt}` };
  }

  return { valid: true };
}
