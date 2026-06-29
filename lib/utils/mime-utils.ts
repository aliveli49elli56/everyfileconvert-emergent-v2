/**
 * lib/utils/mime-utils.ts
 * MIME type utilities
 */

// ---------------------------------------------------------------------------
// EXTENSION TO MIME MAPPING
// ---------------------------------------------------------------------------

const EXT_TO_MIME: Record<string, string> = {
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',

  // Videos
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  ogv: 'video/ogg',

  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  wma: 'audio/x-ms-wma',
  aiff: 'audio/aiff',
  opus: 'audio/opus',

  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',

  // Ebooks
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  azw3: 'application/vnd.amazon.ebook',

  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',

  // CAD
  dwg: 'application/acad',
  dxf: 'application/dxf',
  step: 'application/step',
  stp: 'application/step',
  stl: 'model/stl',
  obj: 'model/obj',
  fbx: 'application/octet-stream',

  // Design
  psd: 'image/vnd.adobe.photoshop',
  ai: 'application/postscript',
  eps: 'application/postscript',
  cdr: 'application/x-cdr',

  // Other
  eml: 'message/rfc822',
};

// ---------------------------------------------------------------------------
// MIME TO EXTENSION MAPPING
// ---------------------------------------------------------------------------

const MIME_TO_EXT: Record<string, string> = {};
for (const [ext, mime] of Object.entries(EXT_TO_MIME)) {
  MIME_TO_EXT[mime] = ext;
}

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------

/**
 * Get MIME type for extension
 */
export function getMimeType(ext: string): string {
  return EXT_TO_MIME[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Get extension for MIME type
 */
export function getExtensionForMime(mime: string): string {
  return MIME_TO_EXT[mime.toLowerCase()] || '';
}

/**
 * Check if MIME type is image
 */
export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

/**
 * Check if MIME type is video
 */
export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}

/**
 * Check if MIME type is audio
 */
export function isAudioMime(mime: string): boolean {
  return mime.startsWith('audio/');
}

/**
 * Check if MIME type is PDF
 */
export function isPdfMime(mime: string): boolean {
  return mime === 'application/pdf';
}

/**
 * Check if MIME type is document
 */
export function isDocumentMime(mime: string): boolean {
  const docMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/rtf',
  ];
  return docMimes.includes(mime);
}

/**
 * Get file MIME type from file object
 */
export function detectFileMime(file: File): string {
  // First check the file.type
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // Fall back to extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext) {
    return getMimeType(ext);
  }

  return 'application/octet-stream';
}

/**
 * Get category from MIME type
 */
export function getCategoryFromMime(mime: string): string {
  if (isImageMime(mime)) return 'image';
  if (isVideoMime(mime)) return 'video';
  if (isAudioMime(mime)) return 'audio';
  if (isPdfMime(mime)) return 'document';
  if (isDocumentMime(mime)) return 'document';
  return 'other';
}

/**
 * Get human-readable category label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    other: 'File',
  };
  return labels[category] || 'File';
}
