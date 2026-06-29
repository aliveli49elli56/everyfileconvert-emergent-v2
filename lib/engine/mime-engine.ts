/**
 * lib/engine/mime-engine.ts
 * MIME Resolution Engine - centralized MIME type detection and normalization
 *
 * Single source of truth for MIME type mappings.
 * Used by validation, file handling, and conversion pipeline.
 */

import { aliasEngine } from './alias-engine';

// ---------------------------------------------------------------------------
// PRIMARY MIME MAPPINGS
// Extension → Primary MIME type
// ---------------------------------------------------------------------------

export const EXTENSION_TO_MIME: Record<string, string> = {
  // ── Raster Images ────────────────────────────────────────────────────────
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',

  // ── Camera RAW ───────────────────────────────────────────────────────────
  raw: 'image/x-raw',
  cr2: 'image/x-canon-cr2',
  cr3: 'image/x-canon-cr3',
  nef: 'image/x-nikon-nef',
  arw: 'image/x-sony-arw',
  dng: 'image/x-adobe-dng',
  rw2: 'image/x-panasonic-rw2',
  orf: 'image/x-olympus-orf',
  sr2: 'image/x-sony-sr2',
  pef: 'image/x-pentax-pef',
  raf: 'image/x-fuji-raf',

  // ── Vector & Design ───────────────────────────────────────────────────────
  svg: 'image/svg+xml',
  ai: 'application/vnd.adobe.illustrator',
  eps: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop',
  cdr: 'application/x-cdr',
  indd: 'application/x-indesign',
  sketch: 'application/x-sketch',
  fig: 'application/x-figma',

  // ── Icons ──────────────────────────────────────────────────────────────────
  ico: 'image/x-icon',
  icns: 'image/x-icns',

  // ── Video ──────────────────────────────────────────────────────────────────
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  mkv: 'video/x-matroska',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  ogv: 'video/ogg',
  ts: 'video/mp2t',
  m2ts: 'video/mp2t',
  mts: 'video/mp2t',
  f4v: 'video/x-f4v',
  asf: 'video/x-ms-asf',
  vob: 'video/dvd',

  // ── Audio ──────────────────────────────────────────────────────────────────
  mp3: 'audio/mpeg',
  mpga: 'audio/mpeg',
  mpeg3: 'audio/mpeg',
  wav: 'audio/wav',
  wave: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  m4p: 'audio/mp4',
  m4b: 'audio/mp4',
  m4r: 'audio/mp4',
  wma: 'audio/x-ms-wma',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  aifc: 'audio/aiff',
  opus: 'audio/opus',
  ac3: 'audio/ac3',
  amr: 'audio/amr',
  awb: 'audio/amr-wb',
  caf: 'audio/x-caf',
  ra: 'audio/x-pn-realaudio',
  au: 'audio/basic',
  snd: 'audio/basic',

  // ── Documents ──────────────────────────────────────────────────────────────
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
  odg: 'application/vnd.oasis.opendocument.graphics',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',

  // ── eBooks ─────────────────────────────────────────────────────────────────
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  azw: 'application/vnd.amazon.ebook',
  azw3: 'application/vnd.amazon.ebook',
  fb2: 'application/x-fictionbook+xml',

  // ── Archives ───────────────────────────────────────────────────────────────
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  gzip: 'application/gzip',
  bz2: 'application/x-bzip2',
  xz: 'application/x-xz',
  zst: 'application/zstd',

  // ── CAD ────────────────────────────────────────────────────────────────────
  dwg: 'application/acad',
  dxf: 'application/dxf',
  step: 'application/step',
  stp: 'application/step',
  stl: 'model/stl',
  obj: 'model/obj',
  fbx: 'application/octet-stream',
  iges: 'model/iges',
  igs: 'model/iges',

  // ── Fonts ──────────────────────────────────────────────────────────────────
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  eot: 'application/vnd.ms-fontobject',

  // ── Email ──────────────────────────────────────────────────────────────────
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',

  // ── Data & Code ────────────────────────────────────────────────────────────
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'application/x-yaml',
  yml: 'application/x-yaml',
  sql: 'application/sql',
  js: 'application/javascript',
  typescript: 'application/typescript',
  css: 'text/css',

  // ── GIS ────────────────────────────────────────────────────────────────────
  geojson: 'application/geo+json',
  kml: 'application/vnd.google-earth.kml+xml',
  kmz: 'application/vnd.google-earth.kmz',
  shp: 'application/x-shp',
  gpx: 'application/gpx+xml',
};

// ---------------------------------------------------------------------------
// REVERSE MAPPING
// MIME → Extension (primary extension for each MIME type)
// ---------------------------------------------------------------------------

const MIME_TO_EXTENSION: Record<string, string> = {};
for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
  if (!MIME_TO_EXTENSION[mime]) {
    MIME_TO_EXTENSION[mime] = ext;
  }
}

// ---------------------------------------------------------------------------
// ALTERNATIVE MIME TYPES
// Some formats have multiple valid MIME types
// ---------------------------------------------------------------------------

export const ALTERNATIVE_MIMES: Record<string, string[]> = {
  jpg: ['image/jpeg', 'image/pjpeg'],
  png: ['image/png', 'image/x-png'],
  mp4: ['video/mp4', 'video/x-m4v', 'video/mp4v-es'],
  mov: ['video/quicktime', 'video/x-quicktime'],
  avi: ['video/x-msvideo', 'video/avi', 'video/msvideo'],
  mp3: ['audio/mpeg', 'audio/mpeg3', 'audio/x-mpeg', 'audio/x-mp3'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
  ogg: ['audio/ogg', 'audio/x-ogg', 'application/ogg'],
  html: ['text/html', 'application/xhtml+xml'],
  json: ['application/json', 'text/json', 'application/x-json'],
  xml: ['application/xml', 'text/xml', 'application/x-xml'],
  csv: ['text/csv', 'application/csv', 'text/x-csv'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/x-zip'],
};

// ---------------------------------------------------------------------------
// MIME TYPE CATEGORIES
// ---------------------------------------------------------------------------

const MIME_CATEGORY_MAP: Record<string, string> = {
  'image/': 'image',
  'video/': 'video',
  'audio/': 'audio',
  'text/': 'text',
  'application/': 'application',
  'font/': 'font',
  'model/': 'model',
  'message/': 'message',
};

// ---------------------------------------------------------------------------
// MIME ENGINE CLASS
// ---------------------------------------------------------------------------

class MimeEngine {
  private extMap: Map<string, string>;
  private mimeMap: Map<string, string>;
  private altMimeMap: Map<string, string[]>;

  constructor() {
    // Build lookup maps
    this.extMap = new Map();
    for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
      this.extMap.set(ext.toLowerCase(), mime);
    }

    this.mimeMap = new Map();
    for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
      if (!this.mimeMap.has(mime)) {
        this.mimeMap.set(mime, ext);
      }
    }

    this.altMimeMap = new Map();
    for (const [ext, mimes] of Object.entries(ALTERNATIVE_MIMES)) {
      this.altMimeMap.set(ext.toLowerCase(), mimes);
    }
  }

  /**
   * Get MIME type for extension
   */
  getMime(ext: string): string {
    const canonical = aliasEngine.resolve(ext);
    return this.extMap.get(canonical.toLowerCase()) ?? 'application/octet-stream';
  }

  /**
   * Get all known MIME types for extension
   */
  getAllMimes(ext: string): string[] {
    const canonical = aliasEngine.resolve(ext);
    const primary = this.getMime(canonical);
    const alts = this.altMimeMap.get(canonical.toLowerCase()) ?? [];
    return [primary, ...alts.filter(m => m !== primary)];
  }

  /**
   * Get extension for MIME type
   */
  getExtension(mime: string): string {
    const normalized = this.normalizeMime(mime);
    return this.mimeMap.get(normalized) ?? '';
  }

  /**
   * Check if MIME type is valid for extension
   */
  isMimeValidForExt(ext: string, mime: string): boolean {
    const allMimes = this.getAllMimes(ext);
    const normalizedMime = this.normalizeMime(mime);
    return allMimes.some(m => this.normalizeMime(m) === normalizedMime);
  }

  /**
   * Normalize MIME type (lowercase, strip parameters)
   */
  normalizeMime(mime: string): string {
    return mime.toLowerCase().split(';')[0].trim();
  }

  /**
   * Get category from MIME type
   */
  getCategoryFromMime(mime: string): string {
    const normalized = this.normalizeMime(mime);
    for (const [prefix, category] of Object.entries(MIME_CATEGORY_MAP)) {
      if (normalized.startsWith(prefix)) {
        return category;
      }
    }
    return 'application';
  }

  /**
   * Check if MIME is image
   */
  isImage(mime: string): boolean {
    return this.normalizeMime(mime).startsWith('image/');
  }

  /**
   * Check if MIME is video
   */
  isVideo(mime: string): boolean {
    return this.normalizeMime(mime).startsWith('video/');
  }

  /**
   * Check if MIME is audio
   */
  isAudio(mime: string): boolean {
    return this.normalizeMime(mime).startsWith('audio/');
  }

  /**
   * Check if MIME is document
   */
  isDocument(mime: string): boolean {
    const normalized = this.normalizeMime(mime);
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.',
      'text/plain',
      'text/html',
      'text/markdown',
    ].some(p => normalized.startsWith(p));
  }

  /**
   * Check if MIME is text-based
   */
  isText(mime: string): boolean {
    const normalized = this.normalizeMime(mime);
    return normalized.startsWith('text/') ||
           normalized.includes('json') ||
           normalized.includes('xml') ||
           normalized.includes('javascript') ||
           normalized.includes('typescript');
  }

  /**
   * Check if MIME is binary
   */
  isBinary(mime: string): boolean {
    return !this.isText(mime);
  }

  /**
   * Detect MIME from file signature (first bytes)
   * Returns null if signature not recognized
   */
  detectFromSignature(signature: Uint8Array): string | null {
    if (signature.length < 4) return null;

    // Check common file signatures
    const hex = this.bytesToHex(signature.slice(0, 16));

    // PNG
    if (hex.startsWith('89504e470d0a1a0a')) return 'image/png';

    // JPEG
    if (hex.startsWith('ffd8ff')) return 'image/jpeg';

    // GIF
    if (hex.startsWith('47494638')) return 'image/gif';

    // WebP
    if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'image/webp';

    // PDF
    if (hex.startsWith('25504446')) return 'application/pdf';

    // ZIP-based formats
    if (hex.startsWith('504b0304') || hex.startsWith('504b0506') || hex.startsWith('504b0708')) {
      return 'application/zip'; // Could be docx, xlsx, epub, etc.
    }

    // RAR
    if (hex.startsWith('52617221')) return 'application/vnd.rar';

    // 7z
    if (hex.startsWith('377abcaf271c')) return 'application/x-7z-compressed';

    // MP4/MOV
    if (hex.includes('66747970')) {
      // Check for video brand
      const brandOffset = hex.indexOf('66747970') + 8;
      const brand = hex.slice(brandOffset, brandOffset + 8);
      if (brand.startsWith('6d703432') || brand.startsWith('69736f6d')) return 'video/mp4';
      if (brand.startsWith('71742020') || brand.startsWith('6d703431')) return 'video/quicktime';
      if (brand.startsWith('7765626d')) return 'video/webm';
    }

    // MP3
    if (hex.startsWith('fffb') || hex.startsWith('fff3') || hex.startsWith('fff2')) {
      return 'audio/mpeg';
    }
    if (hex.startsWith('494433')) return 'audio/mpeg'; // ID3 tag

    // WAV
    if (hex.startsWith('52494646') && hex.slice(16, 24) === '57415645') return 'audio/wav';

    // FLAC
    if (hex.startsWith('664c6143')) return 'audio/flac';

    // OGG
    if (hex.startsWith('4f676753')) return 'audio/ogg';

    // AVI
    if (hex.startsWith('52494646') && hex.slice(16, 24) === '41564920') return 'video/x-msvideo';

    return null;
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get MIME from file object
   * Uses file.type if available, falls back to extension detection
   */
  getMimeFromFile(file: File): string {
    // First check the file.type property
    if (file.type && file.type !== 'application/octet-stream') {
      return this.normalizeMime(file.type);
    }

    // Fall back to extension
    const ext = file.name.split('.').pop();
    if (ext) {
      return this.getMime(ext);
    }

    return 'application/octet-stream';
  }

  /**
   * Check if two MIME types are equivalent
   */
  areMimesEquivalent(mime1: string, mime2: string): boolean {
    const norm1 = this.normalizeMime(mime1);
    const norm2 = this.normalizeMime(mime2);

    if (norm1 === norm2) return true;

    // Check if they map to same extension
    const ext1 = this.getExtension(norm1);
    const ext2 = this.getExtension(norm2);

    if (ext1 && ext2 && ext1 === ext2) return true;

    return false;
  }
}

export const mimeEngine = new MimeEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getMimeType(ext: string): string {
  return mimeEngine.getMime(ext);
}

export function getExtensionFromMime(mime: string): string {
  return mimeEngine.getExtension(mime);
}

export function normalizeMimeType(mime: string): string {
  return mimeEngine.normalizeMime(mime);
}

export function detectMimeFromSignature(signature: Uint8Array): string | null {
  return mimeEngine.detectFromSignature(signature);
}

export function isImageMime(mime: string): boolean {
  return mimeEngine.isImage(mime);
}

export function isVideoMime(mime: string): boolean {
  return mimeEngine.isVideo(mime);
}

export function isAudioMime(mime: string): boolean {
  return mimeEngine.isAudio(mime);
}
