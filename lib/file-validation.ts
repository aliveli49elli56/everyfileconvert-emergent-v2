/**
 * lib/file-validation.ts
 *
 * File validation utilities — Phase 6C-1
 *
 * All size limits are resolved from the Limit Engine which reads exclusively
 * from /lib/config/subscription-config.ts.
 *
 * NO size limits are hardcoded in this file.
 *
 * Requirement 3: changing any limit requires only subscription-config.ts.
 * Requirement 7: limits resolved by category via Format Registry, not by extension.
 *
 * Usage:
 *   // Plan-aware validation (preferred):
 *   validateFileSizeForPlan(file, 'free', 'video')
 *
 *   // Extension-based validation (resolves category automatically):
 *   validateFileSizeByExtension(file, 'free', 'mp4')
 *
 *   // Legacy (backward-compatible): uses FREE plan + 'other' category limit
 *   validateFileSize(file)
 */

import type { PlanId } from './types/subscription';
import { limitEngine } from './engine/limit-engine';
import { DEFAULT_PLAN_ID } from './config/subscription-config';

// ---------------------------------------------------------------------------
// FILE VALIDATION RESULT
// ---------------------------------------------------------------------------

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// SIZE VALIDATION — Plan-Aware (Preferred)
// ---------------------------------------------------------------------------

/**
 * Validate a file's size against the plan limit for a given file category.
 *
 * Requirement 3: limit value comes only from subscription-config.ts via LimitEngine.
 * Requirement 7: category must match Format Registry category (e.g. 'audio', 'video').
 *
 * @param file     - File to validate
 * @param planId   - User's current plan (default: DEFAULT_PLAN_ID = 'free')
 * @param category - Format Registry category (e.g. 'image', 'video', 'audio', 'document')
 */
export function validateFileSizeForPlan(
  file: File,
  planId: PlanId = DEFAULT_PLAN_ID,
  category: string = 'other',
): FileValidationResult {
  const result = limitEngine.checkFileSizeAllowed(planId, category, file.size);
  if (result.allowed) return { isValid: true };
  return { isValid: false, error: result.reason };
}

/**
 * Validate a file's size — resolves category from file extension via Format Registry.
 *
 * Requirement 7: no hardcoded extension-to-limit mapping.
 * PNG/JPG/WEBP → 'image' → maxImageMB
 * MP3/WAV/FLAC → 'audio' → maxAudioMB
 * MP4/MOV/AVI  → 'video' → maxVideoMB
 * DOCX/DOC     → 'document' → maxDocumentMB
 *
 * @param file   - File to validate
 * @param planId - User's current plan (default: DEFAULT_PLAN_ID = 'free')
 * @param ext    - File extension without dot (e.g. 'mp3', 'png', 'docx')
 */
export function validateFileSizeByExtension(
  file: File,
  planId: PlanId = DEFAULT_PLAN_ID,
  ext: string,
): FileValidationResult {
  const result = limitEngine.checkFileSizeAllowedByExtension(planId, ext, file.size);
  if (result.allowed) return { isValid: true };
  return { isValid: false, error: result.reason };
}

// ---------------------------------------------------------------------------
// SIZE VALIDATION — Legacy (Backward-Compatible)
// ---------------------------------------------------------------------------

/**
 * Validate a file's size against the FREE plan 'other' category limit.
 *
 * Backward-compatible wrapper — existing callers continue to work unchanged.
 * Internally delegates to validateFileSizeForPlan with DEFAULT_PLAN_ID + 'other'.
 *
 * Requirement 3: no hardcoded limit — value comes from subscription-config.ts.
 *
 * @param file - File to validate
 */
export function validateFileSize(file: File): FileValidationResult {
  return validateFileSizeForPlan(file, DEFAULT_PLAN_ID, 'other');
}

// ---------------------------------------------------------------------------
// URL / BLOB UTILITIES (no subscription logic — pure utilities)
// ---------------------------------------------------------------------------

export function revokeObjectURL(url: string | null | undefined): void {
  if (url && typeof url === 'string') {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke object URL:', error);
    }
  }
}

export function clearFileBuffer(file: File | null | undefined): void {
  if (file) {
    // Explicitly dereference file to allow garbage collection
    file = null;
  }
}

export interface ConversionBlob {
  blob: Blob;
  fileName: string;
}

export function createDownloadUrl(blob: Blob): string {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create object URL:', error);
    throw new Error('Failed to create download URL');
  }
}

export function triggerFileDownload(
  downloadUrl: string,
  fileName: string,
): void {
  try {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Failed to trigger download:', error);
    throw new Error('Failed to download file');
  }
}
