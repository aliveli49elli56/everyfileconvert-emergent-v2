/**
 * lib/engine/signature-engine.ts
 * File Signature Engine - Magic Number detection for file validation
 *
 * Detects actual file type from binary content, not just extension.
 * Used to validate uploads and detect mismatched extensions.
 */

// ---------------------------------------------------------------------------
// FILE SIGNATURE DEFINITIONS
// ---------------------------------------------------------------------------

export interface FileSignature {
  /** Format ID (extension) */
  format: string;
  /** Human-readable format name */
  name: string;
  /** MIME type for this format */
  mime: string;
  /** Magic bytes at specific offset */
  signatures: SignaturePattern[];
  /** File extensions that commonly use this signature */
  extensions: string[];
  /** Whether signature check is reliable for this format */
  reliability: 'high' | 'medium' | 'low';
  /** Optional offset where signature appears (default 0) */
  offset?: number;
  /** Optional trailer/footer signature */
  trailer?: SignaturePattern;
}

export interface SignaturePattern {
  /** Expected bytes as hex string or number array */
  bytes: number[] | string;
  /** Optional offset from start (overrides parent offset) */
  offset?: number;
  /** Optional mask for bits to ignore */
  mask?: number[];
  /** Optional ranges of valid values */
  ranges?: Array<{ offset: number; min: number; max: number }>;
}

// ---------------------------------------------------------------------------
// KNOWN FILE SIGNATURES (Magic Numbers)
// ---------------------------------------------------------------------------

export const FILE_SIGNATURES: FileSignature[] = [
  // ── Images ──────────────────────────────────────────────────────────────────
  {
    format: 'png',
    name: 'PNG Image',
    mime: 'image/png',
    signatures: [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
    extensions: ['png'],
    reliability: 'high',
  },
  {
    format: 'jpg',
    name: 'JPEG Image',
    mime: 'image/jpeg',
    signatures: [
      { bytes: [0xFF, 0xD8, 0xFF] }, // Start of image
    ],
    extensions: ['jpg', 'jpeg', 'jpe', 'jfif'],
    reliability: 'high',
    trailer: { bytes: [0xFF, 0xD9] }, // End of image marker
  },
  {
    format: 'gif',
    name: 'GIF Image',
    mime: 'image/gif',
    signatures: [
      { bytes: 'GIF87a' }, // GIF87a
      { bytes: 'GIF89a' }, // GIF89a
    ],
    extensions: ['gif'],
    reliability: 'high',
  },
  {
    format: 'webp',
    name: 'WebP Image',
    mime: 'image/webp',
    signatures: [
      { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    ],
    extensions: ['webp'],
    reliability: 'high',
    offset: 0,
    // Additional check at offset 8: 'WEBP'
  },
  {
    format: 'bmp',
    name: 'Bitmap Image',
    mime: 'image/bmp',
    signatures: [{ bytes: 'BM' }],
    extensions: ['bmp', 'dib'],
    reliability: 'high',
  },
  {
    format: 'tiff',
    name: 'TIFF Image',
    mime: 'image/tiff',
    signatures: [
      { bytes: [0x49, 0x49, 0x2A, 0x00] }, // Little-endian TIFF
      { bytes: [0x4D, 0x4D, 0x00, 0x2A] }, // Big-endian TIFF
    ],
    extensions: ['tiff', 'tif'],
    reliability: 'high',
  },
  {
    format: 'avif',
    name: 'AVIF Image',
    mime: 'image/avif',
    signatures: [
      { bytes: [0x00, 0x00, 0x00] }, // ftyp box start
    ],
    extensions: ['avif'],
    reliability: 'medium',
  },
  {
    format: 'heic',
    name: 'HEIC Image',
    mime: 'image/heic',
    signatures: [
      { bytes: [0x00, 0x00, 0x00] },
    ],
    extensions: ['heic', 'heif'],
    reliability: 'medium',
  },
  {
    format: 'ico',
    name: 'Windows Icon',
    mime: 'image/x-icon',
    signatures: [{ bytes: [0x00, 0x00, 0x01, 0x00] }],
    extensions: ['ico'],
    reliability: 'high',
  },
  {
    format: 'psd',
    name: 'Photoshop Document',
    mime: 'image/vnd.adobe.photoshop',
    signatures: [{ bytes: '8BPS' }],
    extensions: ['psd'],
    reliability: 'high',
  },

  // ── Video ─────────────────────────────────────────────────────────────────
  {
    format: 'mp4',
    name: 'MP4 Video',
    mime: 'video/mp4',
    signatures: [
      { bytes: [0x00, 0x00, 0x00] }, // ftyp box, check ftyp brand at offset 8
    ],
    extensions: ['mp4', 'm4v', 'm4a', 'm4p'],
    reliability: 'medium',
  },
  {
    format: 'webm',
    name: 'WebM Video',
    mime: 'video/webm',
    signatures: [{ bytes: [0x1A, 0x45, 0xDF, 0xA3] }], // EBML header
    extensions: ['webm', 'mkv'],
    reliability: 'high',
  },
  {
    format: 'avi',
    name: 'AVI Video',
    mime: 'video/x-msvideo',
    signatures: [{ bytes: 'RIFF' }],
    extensions: ['avi'],
    reliability: 'high',
  },
  {
    format: 'mov',
    name: 'QuickTime Movie',
    mime: 'video/quicktime',
    signatures: [{ bytes: [0x00, 0x00, 0x00] }], // Check moov/mdat atoms
    extensions: ['mov', 'qt'],
    reliability: 'medium',
  },
  {
    format: 'flv',
    name: 'Flash Video',
    mime: 'video/x-flv',
    signatures: [{ bytes: 'FLV' }],
    extensions: ['flv'],
    reliability: 'high',
  },
  {
    format: 'mpeg',
    name: 'MPEG Video',
    mime: 'video/mpeg',
    signatures: [
      { bytes: [0x00, 0x00, 0x01, 0xBA] }, // MPEG-PS
      { bytes: [0x00, 0x00, 0x01, 0xB3] }, // MPEG sequence header
    ],
    extensions: ['mpeg', 'mpg', 'mpe', 'vob'],
    reliability: 'high',
  },

  // ── Audio ────────────────────────────────────────────────────────────────
  {
    format: 'mp3',
    name: 'MP3 Audio',
    mime: 'audio/mpeg',
    signatures: [
      { bytes: [0xFF, 0xFB] }, // MPEG audio frame sync
      { bytes: [0xFF, 0xFA] },
      { bytes: [0xFF, 0xF2] },
      { bytes: [0xFF, 0xF3] },
      { bytes: 'ID3' }, // ID3 tag
    ],
    extensions: ['mp3', 'mpga'],
    reliability: 'high',
  },
  {
    format: 'wav',
    name: 'WAV Audio',
    mime: 'audio/wav',
    signatures: [{ bytes: 'RIFF' }],
    extensions: ['wav', 'wave'],
    reliability: 'high',
  },
  {
    format: 'flac',
    name: 'FLAC Audio',
    mime: 'audio/flac',
    signatures: [{ bytes: 'fLaC' }],
    extensions: ['flac'],
    reliability: 'high',
  },
  {
    format: 'ogg',
    name: 'Ogg Audio',
    mime: 'audio/ogg',
    signatures: [{ bytes: 'OggS' }],
    extensions: ['ogg', 'oga', 'ogv', 'opus'],
    reliability: 'high',
  },
  {
    format: 'aac',
    name: 'AAC Audio',
    mime: 'audio/aac',
    signatures: [{ bytes: [0xFF, 0xF1] }, { bytes: [0xFF, 0xF9] }],
    extensions: ['aac', 'm4a'],
    reliability: 'high',
  },
  {
    format: 'aiff',
    name: 'AIFF Audio',
    mime: 'audio/aiff',
    signatures: [{ bytes: 'FORM' }],
    extensions: ['aiff', 'aif', 'aifc'],
    reliability: 'high',
  },
  {
    format: 'amr',
    name: 'AMR Audio',
    mime: 'audio/amr',
    signatures: [{ bytes: '#!AMR' }, { bytes: '#!AMR-WB' }],
    extensions: ['amr'],
    reliability: 'high',
  },

  // ── Documents ───────────────────────────────────────────────────────────
  {
    format: 'pdf',
    name: 'PDF Document',
    mime: 'application/pdf',
    signatures: [{ bytes: '%PDF' }],
    extensions: ['pdf'],
    reliability: 'high',
    trailer: { bytes: '%%EOF' },
  },
  {
    format: 'zip',
    name: 'ZIP Archive',
    mime: 'application/zip',
    signatures: [
      { bytes: [0x50, 0x4B, 0x03, 0x04] }, // Local file header
      { bytes: [0x50, 0x4B, 0x05, 0x06] }, // Empty archive
      { bytes: [0x50, 0x4B, 0x07, 0x08] }, // Spanned archive
    ],
    extensions: ['zip', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'epub', 'jar', 'apk'],
    reliability: 'high',
  },
  {
    format: 'rar',
    name: 'RAR Archive',
    mime: 'application/vnd.rar',
    signatures: [{ bytes: 'Rar!' }],
    extensions: ['rar'],
    reliability: 'high',
  },
  {
    format: '7z',
    name: '7-Zip Archive',
    mime: 'application/x-7z-compressed',
    signatures: [{ bytes: '7z' }],
    extensions: ['7z'],
    reliability: 'high',
  },
  {
    format: 'tar',
    name: 'TAR Archive',
    mime: 'application/x-tar',
    signatures: [{ bytes: 'ustar', offset: 257 }],
    extensions: ['tar'],
    reliability: 'high',
  },
  {
    format: 'gz',
    name: 'GZIP Archive',
    mime: 'application/gzip',
    signatures: [{ bytes: [0x1F, 0x8B] }],
    extensions: ['gz', 'gzip', 'tgz'],
    reliability: 'high',
  },
  {
    format: 'bz2',
    name: 'BZIP2 Archive',
    mime: 'application/x-bzip2',
    signatures: [{ bytes: 'BZ' }],
    extensions: ['bz2', 'bzip2', 'tbz2'],
    reliability: 'high',
  },

  // ── Office Documents ────────────────────────────────────────────────────
  {
    format: 'docx',
    name: 'Word Document (OOXML)',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signatures: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }],
    extensions: ['docx'],
    reliability: 'medium', // ZIP-based, need content check
  },
  {
    format: 'xlsx',
    name: 'Excel Spreadsheet (OOXML)',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signatures: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }],
    extensions: ['xlsx'],
    reliability: 'medium',
  },
  {
    format: 'pptx',
    name: 'PowerPoint (OOXML)',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    signatures: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }],
    extensions: ['pptx'],
    reliability: 'medium',
  },
  {
    format: 'doc',
    name: 'Word Document (Legacy)',
    mime: 'application/msword',
    signatures: [{ bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] }], // OLE2
    extensions: ['doc', 'xls', 'ppt', 'dot'],
    reliability: 'high',
  },

  // ── eBooks ─────────────────────────────────────────────────────────────────
  {
    format: 'epub',
    name: 'EPUB eBook',
    mime: 'application/epub+zip',
    signatures: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }],
    extensions: ['epub'],
    reliability: 'medium',
  },
  {
    format: 'mobi',
    name: 'Mobipocket eBook',
    mime: 'application/x-mobipocket-ebook',
    signatures: [{ bytes: 'BOOKMOBI' }],
    extensions: ['mobi', 'prc'],
    reliability: 'high',
  },

  // ── Fonts ────────────────────────────────────────────────────────────────
  {
    format: 'ttf',
    name: 'TrueType Font',
    mime: 'font/ttf',
    signatures: [{ bytes: [0x00, 0x01, 0x00, 0x00] }],
    extensions: ['ttf'],
    reliability: 'medium',
  },
  {
    format: 'otf',
    name: 'OpenType Font',
    mime: 'font/otf',
    signatures: [{ bytes: 'OTTO' }],
    extensions: ['otf'],
    reliability: 'high',
  },
  {
    format: 'woff',
    name: 'Web Open Font Format',
    mime: 'font/woff',
    signatures: [{ bytes: 'wOFF' }],
    extensions: ['woff'],
    reliability: 'high',
  },
  {
    format: 'woff2',
    name: 'Web Open Font Format 2',
    mime: 'font/woff2',
    signatures: [{ bytes: 'wOF2' }],
    extensions: ['woff2'],
    reliability: 'high',
  },
  {
    format: 'eot',
    name: 'Embedded OpenType',
    mime: 'application/vnd.ms-fontobject',
    signatures: [{ bytes: [0x00, 0x00, 0x00] }],
    extensions: ['eot'],
    reliability: 'low',
  },

  // ── CAD ───────────────────────────────────────────────────────────────────
  {
    format: 'dwg',
    name: 'AutoCAD Drawing',
    mime: 'application/acad',
    signatures: [{ bytes: 'AC10' }],
    extensions: ['dwg'],
    reliability: 'high',
  },
  {
    format: 'stl',
    name: 'STL 3D Model',
    mime: 'model/stl',
    signatures: [{ bytes: 'solid' }], // ASCII STL
    extensions: ['stl'],
    reliability: 'medium',
  },

  // ── Other ──────────────────────────────────────────────────────────────────
  {
    format: 'xml',
    name: 'XML Document',
    mime: 'application/xml',
    signatures: [{ bytes: '<?xml' }],
    extensions: ['xml', 'svg', 'xhtml', 'rss', 'atom'],
    reliability: 'high',
  },
  {
    format: 'sqlite',
    name: 'SQLite Database',
    mime: 'application/x-sqlite3',
    signatures: [{ bytes: 'SQLite format 3' }],
    extensions: ['sqlite', 'db', 'sqlite3'],
    reliability: 'high',
  },
  {
    format: 'exe',
    name: 'Windows Executable',
    mime: 'application/x-msdownload',
    signatures: [{ bytes: 'MZ' }],
    extensions: ['exe', 'dll'],
    reliability: 'high',
  },
];

// ---------------------------------------------------------------------------
// SIGNATURE ENGINE CLASS
// ---------------------------------------------------------------------------

class SignatureEngine {
  private signatures: FileSignature[];
  private signatureMap: Map<string, FileSignature>;

  constructor() {
    this.signatures = FILE_SIGNATURES;
    this.signatureMap = new Map();
    for (const sig of this.signatures) {
      this.signatureMap.set(sig.format, sig);
    }
  }

  /**
   * Detect file format from binary content
   * Returns the detected signature or null if not recognized
   */
  detect(data: Uint8Array): FileSignature | null {
    if (data.length < 4) return null;

    for (const sig of FILE_SIGNATURES) {
      if (this.matches(data, sig)) {
        return sig;
      }
    }

    return null;
  }

  /**
   * Check if data matches a specific signature
   */
  private matches(data: Uint8Array, sig: FileSignature): boolean {
    for (const pattern of sig.signatures) {
      const offset = pattern.offset ?? sig.offset ?? 0;
      const bytes = this.normalizeBytes(pattern.bytes);

      if (offset + bytes.length <= data.length) {
        let match = true;

        for (let i = 0; i < bytes.length; i++) {
          const expected = bytes[i];
          const actual = data[offset + i];
          const mask = pattern.mask?.[i];

          if (mask !== undefined) {
            if ((actual & mask) !== (expected & mask)) {
              match = false;
              break;
            }
          } else if (actual !== expected) {
            match = false;
            break;
          }
        }

        // Additional checks for specific formats
        if (match && sig.format === 'wav') {
          // Check for WAVE format
          if (data.length >= 12 && this.bytesToString(data.slice(8, 12)) !== 'WAVE') {
            match = false;
          }
        }

        if (match && sig.format === 'webp') {
          // Check for WEBP format
          if (data.length >= 12 && this.bytesToString(data.slice(8, 12)) !== 'WEBP') {
            match = false;
          }
        }

        if (match && sig.format === 'avi') {
          // Check for AVI format
          if (data.length >= 12 && this.bytesToString(data.slice(8, 12)) !== 'AVI ') {
            match = false;
          }
        }

        if (match && (sig.format === 'mp4' || sig.format === 'mov')) {
          // Check for ftyp box and brand
          if (data.length >= 12) {
            const ftyp = this.bytesToString(data.slice(4, 8));
            if (ftyp !== 'ftyp') {
              match = false;
            }
          }
        }

        if (match && (sig.format === 'docx' || sig.format === 'xlsx' || sig.format === 'pptx')) {
          // These are ZIP-based, need additional content check
          // For now, rely on extension + ZIP signature
          match = true;
        }

        if (match) return true;
      }
    }

    return false;
  }

  /**
   * Convert bytes pattern to number array
   */
  private normalizeBytes(bytes: number[] | string): number[] {
    if (typeof bytes === 'string') {
      return Array.from(bytes).map(c => c.charCodeAt(0));
    }
    return bytes;
  }

  /**
   * Convert bytes to string
   */
  private bytesToString(bytes: Uint8Array | number[]): string {
    return String.fromCharCode(...Array.from(bytes));
  }

  /**
   * Get signature for a known format
   */
  getSignature(format: string): FileSignature | undefined {
    return this.signatureMap.get(format);
  }

  /**
   * Get all signatures
   */
  getAllSignatures(): FileSignature[] {
    return [...this.signatures];
  }

  /**
   * Detect file format and verify extension matches
   */
  detectAndVerify(data: Uint8Array, extension: string): {
    detected: FileSignature | null;
    matches: boolean;
    warning?: string;
  } {
    const detected = this.detect(data);
    const ext = extension.toLowerCase().replace(/^\./, '');

    if (!detected) {
      return {
        detected: null,
        matches: false,
        warning: 'Could not detect file format from content',
      };
    }

    // Check if detected format matches extension
    const matches = detected.extensions.includes(ext);

    if (!matches) {
      return {
        detected,
        matches: false,
        warning: `File content appears to be ${detected.name} but extension is .${ext}`,
      };
    }

    return { detected, matches: true };
  }

  /**
   * Check if file has trailer signature (end marker)
   */
  hasTrailer(data: Uint8Array, format: string): boolean {
    const sig = this.signatureMap.get(format);
    if (!sig?.trailer) return false;

    const trailer = sig.trailer;
    const bytes = this.normalizeBytes(trailer.bytes);
    const offset = trailer.offset ?? (data.length - bytes.length);

    if (offset < 0 || offset + bytes.length > data.length) return false;

    for (let i = 0; i < bytes.length; i++) {
      if (data[offset + i] !== bytes[i]) return false;
    }

    return true;
  }

  /**
   * Read first N bytes from File object
   */
  async readSignature(file: File, bytes = 64): Promise<Uint8Array | null> {
    try {
      const slice = file.slice(0, bytes);
      const buffer = await slice.arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      return null;
    }
  }

  /**
   * Detect format from File object
   */
  async detectFile(file: File): Promise<FileSignature | null> {
    const signature = await this.readSignature(file);
    if (!signature) return null;
    return this.detect(signature);
  }

  /**
   * Verify file content matches extension
   */
  async verifyFile(file: File): Promise<{
    valid: boolean;
    detected: FileSignature | null;
    expectedFormat?: FileSignature;
    warning?: string;
  }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const signature = await this.readSignature(file);

    if (!signature) {
      return {
        valid: false,
        detected: null,
        warning: 'Could not read file content',
      };
    }

    const detected = this.detect(signature);
    const expected = this.signatureMap.get(ext.replaceAll('.', '')) ??
                     this.findByExtension(ext);

    if (!detected) {
      return {
        valid: true, // Unknown format, assume valid
        detected: null,
        expectedFormat: expected,
        warning: 'Unknown file format signature',
      };
    }

    const extensionMatches = detected.extensions.includes(ext) ||
                             (expected && detected.extensions.some(e => expected.extensions.includes(e)));

    if (!extensionMatches) {
      return {
        valid: false,
        detected,
        expectedFormat: expected,
        warning: `File content is ${detected.name} but extension is .${ext}`,
      };
    }

    return {
      valid: true,
      detected,
      expectedFormat: expected,
    };
  }

  /**
   * Find signature by extension
   */
  findByExtension(ext: string): FileSignature | undefined {
    const cleanExt = ext.toLowerCase().replace(/^\./, '');
    return FILE_SIGNATURES.find(sig => sig.extensions.includes(cleanExt));
  }

  /**
   * Get reliability rating for a format's signature detection
   */
  getReliability(format: string): 'high' | 'medium' | 'low' {
    return this.signatureMap.get(format)?.reliability ?? 'low';
  }

  /**
   * Check if format requires additional verification
   */
  needsAdditionalVerification(format: string): boolean {
    const sig = this.signatureMap.get(format);
    return sig?.reliability === 'medium' || sig?.reliability === 'low';
  }
}

export const signatureEngine = new SignatureEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function detectFileSignature(data: Uint8Array): FileSignature | null {
  return signatureEngine.detect(data);
}

export async function verifyFileSignature(file: File): Promise<{
  valid: boolean;
  detected: FileSignature | null;
  warning?: string;
}> {
  return signatureEngine.verifyFile(file);
}

export function getFileSignature(format: string): FileSignature | undefined {
  return signatureEngine.getSignature(format);
}

export function signatureReliability(format: string): 'high' | 'medium' | 'low' {
  return signatureEngine.getReliability(format);
}
