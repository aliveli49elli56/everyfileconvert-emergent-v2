/**
 * lib/utils/file-utils.ts
 * File handling utilities
 */

// ---------------------------------------------------------------------------
// FILE SIZE FORMATTING
// ---------------------------------------------------------------------------

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Parse size string to bytes
 */
export function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return 0;

  const [, num, unit] = match;
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  return parseFloat(num) * multipliers[unit.toUpperCase()];
}

// ---------------------------------------------------------------------------
// FILE NAME UTILITIES
// ---------------------------------------------------------------------------

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get base name without extension
 */
export function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
}

/**
 * Change file extension
 */
export function changeExtension(filename: string, newExt: string): string {
  const base = getBaseName(filename);
  return `${base}.${newExt.replace(/^\./, '')}`;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 255);
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(base: string, ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${base}_${timestamp}_${random}.${ext}`;
}

// ---------------------------------------------------------------------------
// FILE VALIDATION
// ---------------------------------------------------------------------------

/**
 * Check if file is empty
 */
export function isEmptyFile(file: File): boolean {
  return file.size === 0;
}

/**
 * Check file size limit
 */
export function isWithinSizeLimit(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Check if extension matches
 */
export function hasExtension(file: File, allowed: string[]): boolean {
  const ext = getExtension(file.name);
  return allowed.map(e => e.toLowerCase()).includes(ext);
}

// ---------------------------------------------------------------------------
// BLOB UTILITIES
// ---------------------------------------------------------------------------

/**
 * Create object URL
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file as array buffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read file as data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// BLOB CREATION
// ---------------------------------------------------------------------------

/**
 * Create blob from base64
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

/**
 * Create blob from Uint8Array
 */
export function uint8ArrayToBlob(data: Uint8Array, mimeType: string): Blob {
  return new Blob([data], { type: mimeType });
}
