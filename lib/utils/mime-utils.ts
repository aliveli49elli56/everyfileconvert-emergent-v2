/**
 * lib/utils/mime-utils.ts
 *
 * Phase 6B: All MIME lookups now delegate to mime-engine which derives its
 * data from the Format Registry (single source of truth).
 * No duplicate MIME map is maintained here.
 */

export {
  getMimeType,
  getExtensionFromMime as getExtensionForMime,
  normalizeMimeType as normalizeMime,
  isImageMime,
  isVideoMime,
  isAudioMime,
} from '../engine/mime-engine';

import { mimeEngine } from '../engine/mime-engine';

/** Get MIME type for a file extension */
export function getMimeForExt(ext: string): string {
  return mimeEngine.getMime(ext);
}

/** Check if MIME type represents a PDF */
export function isPdfMime(mime: string): boolean {
  return mime === 'application/pdf';
}

/** Check if MIME type represents a document */
export function isDocumentMime(mime: string): boolean {
  const normalized = mimeEngine.normalizeMime(mime);
  return (
    normalized === 'application/pdf' ||
    normalized === 'application/msword' ||
    normalized === 'text/plain' ||
    normalized === 'application/rtf' ||
    normalized.startsWith('application/vnd.openxmlformats-officedocument') ||
    normalized.startsWith('application/vnd.oasis.opendocument')
  );
}

/** Get file MIME type from a File object */
export function detectFileMime(file: File): string {
  return mimeEngine.getMimeFromFile(file);
}

/** Get human-readable category label from MIME type */
export function getCategoryFromMime(mime: string): string {
  if (mimeEngine.isImage(mime)) return 'image';
  if (mimeEngine.isVideo(mime)) return 'video';
  if (mimeEngine.isAudio(mime)) return 'audio';
  if (isPdfMime(mime) || isDocumentMime(mime)) return 'document';
  return 'other';
}

/** Get human-readable category label */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    other: 'File',
  };
  return labels[category] ?? 'File';
}
