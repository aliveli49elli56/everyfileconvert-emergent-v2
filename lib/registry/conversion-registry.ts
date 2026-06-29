/**
 * lib/registry/conversion-registry.ts
 * Central conversion matrix - defines valid source → target conversions
 */

import type { FormatDefinition, ParsedConversionSlug, FormatCategory, ConverterType } from '../types/formats';
import type { ConversionOperation, ConversionDomain, RelatedConversion } from '../types/conversion';
import { formatRegistry } from './format-registry';

// ---------------------------------------------------------------------------
// CONVERSION MATRIX
// Defines which target formats each source format can be converted to
// ---------------------------------------------------------------------------

export const CONVERSION_MATRIX: Record<string, string[]> = {
  // ── Raster Image ────────────────────────────────────────────────────────────
  png:  ["jpg", "jpeg", "webp", "gif", "bmp", "tiff", "ico", "icns", "svg", "pdf"],
  jpg:  ["png", "jpeg", "webp", "gif", "bmp", "tiff", "ico", "icns", "pdf"],
  jpeg: ["png", "jpg",  "webp", "gif", "bmp", "tiff", "ico", "icns", "pdf"],
  webp: ["png", "jpg",  "jpeg", "gif", "bmp", "tiff", "pdf"],
  gif:  ["png", "jpg",  "jpeg", "webp", "bmp", "tiff", "pdf"],
  bmp:  ["png", "jpg",  "jpeg", "webp", "gif", "tiff", "ico", "pdf"],
  tiff: ["png", "jpg",  "jpeg", "webp", "gif", "bmp", "pdf"],
  heic: ["png", "jpg",  "jpeg", "webp", "tiff", "pdf"],
  heif: ["png", "jpg",  "jpeg", "webp", "tiff", "pdf"],
  avif: ["png", "jpg",  "jpeg", "webp", "gif", "pdf"],

  // ── Camera RAW ──────────────────────────────────────────────────────────────
  raw:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  cr2:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  nef:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  arw:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  dng:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],

  // ── Vector & Design ─────────────────────────────────────────────────────────
  svg:  ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"],
  ai:   ["png", "jpg", "jpeg", "webp", "svg", "eps", "pdf"],
  eps:  ["png", "jpg", "jpeg", "webp", "svg", "ai",  "pdf"],
  psd:  ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "pdf"],
  cdr:  ["png", "jpg", "jpeg", "webp", "svg", "eps", "pdf"],
  indd: ["png", "jpg", "jpeg", "eps", "pdf"],

  // ── Icons ───────────────────────────────────────────────────────────────────
  ico:  ["png", "jpg", "jpeg", "bmp", "icns"],
  icns: ["png", "jpg", "jpeg", "ico"],

  // ── CAD / 3D ────────────────────────────────────────────────────────────────
  dwg:  ["dxf", "pdf", "svg"],
  dxf:  ["dwg", "pdf", "svg"],
  step: ["stl", "obj", "fbx"],
  stp:  ["stl", "obj", "fbx"],
  stl:  ["obj", "fbx", "step"],
  obj:  ["stl", "fbx", "step"],
  fbx:  ["obj", "stl"],

  // ── Video ──────────────────────────────────────────────────────────────────
  mp4:  ["webm", "avi", "mov", "mkv", "wmv", "flv", "m4v", "mpeg", "3gp", "ogv", "gif", "mp3", "wav", "ogg", "aac", "m4a"],
  webm: ["mp4",  "avi", "mov", "mkv", "ogv", "gif", "mp3", "wav", "ogg", "aac"],
  avi:  ["mp4",  "webm", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav"],
  mov:  ["mp4",  "webm", "avi", "mkv", "m4v", "gif", "mp3", "wav", "aac"],
  mkv:  ["mp4",  "webm", "avi", "mov", "ogv", "gif", "mp3", "wav", "ogg", "flac"],
  wmv:  ["mp4",  "webm", "avi", "mov", "flv", "asf", "gif", "mp3", "wav"],
  flv:  ["mp4",  "webm", "avi", "mov", "gif", "mp3", "wav"],
  mpeg: ["mp4",  "webm", "avi", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav", "ogg", "aac"],
  mpg:  ["mp4",  "webm", "avi", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav", "ogg", "aac"],
  m4v:  ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "aac", "m4a"],
  "3gp":["mp4",  "webm", "avi", "mov", "gif", "mp3", "wav", "aac"],
  ogv:  ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "ogg"],
  ts:   ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "aac"],
  f4v:  ["mp4",  "webm", "avi", "mov", "flv", "gif", "mp3", "wav"],

  // ── Audio ───────────────────────────────────────────────────────────────────
  mp3:  ["wav",  "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus"],
  wav:  ["mp3",  "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus"],
  ogg:  ["mp3",  "wav", "flac", "aac", "m4a", "opus"],
  flac: ["mp3",  "wav", "ogg", "aac", "m4a", "aiff"],
  aac:  ["mp3",  "wav", "ogg", "flac", "m4a", "opus"],
  m4a:  ["mp3",  "wav", "ogg", "flac", "aac", "aiff"],
  wma:  ["mp3",  "wav", "ogg", "aac", "flac"],
  aiff: ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  opus: ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  ac3:  ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  amr:  ["mp3",  "wav", "aac", "ogg",  "m4a"],
  caf:  ["mp3",  "wav", "ogg", "flac", "aac", "m4a", "aiff"],

  // ── Document ────────────────────────────────────────────────────────────────
  pdf:  ["jpg",  "png", "webp", "svg", "txt", "docx", "dwg", "dxf"],
  doc:  ["docx", "pdf", "txt",  "rtf", "odt", "html"],
  docx: ["doc",  "pdf", "txt",  "rtf", "odt", "html"],
  xls:  ["xlsx", "pdf", "ods"],
  xlsx: ["xls",  "pdf", "ods"],
  ppt:  ["pptx", "pdf", "odp"],
  pptx: ["ppt",  "pdf", "odp"],
  txt:  ["pdf",  "docx", "html", "rtf", "md"],
  rtf:  ["pdf",  "docx", "txt",  "html"],
  odt:  ["docx", "pdf", "txt",  "html"],
  ods:  ["xlsx", "pdf"],
  odp:  ["pptx", "pdf"],
  html: ["pdf",  "txt", "docx", "md"],
  epub: ["pdf",  "txt", "html", "mobi", "azw3"],
  mobi: ["epub", "pdf", "txt",  "html", "azw3"],
  azw3: ["epub", "pdf", "txt",  "html", "mobi"],
  md:   ["pdf",  "html", "txt", "docx"],
};

// ---------------------------------------------------------------------------
// DOMAIN MAPPINGS
// ---------------------------------------------------------------------------

const DOMAIN_MAP: Record<string, ConversionDomain> = {
  image: 'image',
  raw: 'image',
  vector: 'image',
  icon: 'image',
  cad: 'image',
  video: 'video',
  audio: 'audio',
  document: 'pdf',
};

const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'opus', 'ac3', 'amr', 'caf']);

// ---------------------------------------------------------------------------
// REGISTRY CLASS
// ---------------------------------------------------------------------------

class ConversionRegistry {
  private matrix: Map<string, string[]>;

  constructor() {
    this.matrix = new Map();
    for (const [src, targets] of Object.entries(CONVERSION_MATRIX)) {
      this.matrix.set(src.toLowerCase(), [...targets]);
    }
  }

  /** Check if conversion is valid */
  isValid(source: string, target: string): boolean {
    const targets = this.matrix.get(source.toLowerCase());
    return targets?.includes(target.toLowerCase()) ?? false;
  }

  /** Get valid targets for source */
  getTargets(source: string): string[] {
    return [...(this.matrix.get(source.toLowerCase()) || [])];
  }

  /** Get target format definitions */
  getTargetFormats(source: string): FormatDefinition[] {
    const targets = this.getTargets(source);
    return targets
      .map(ext => formatRegistry.get(ext))
      .filter((f): f is FormatDefinition => f !== undefined);
  }

  /** Get all conversion slugs */
  getAllSlugs(): string[] {
    const slugs: string[] = [];
    for (const [source, targets] of Object.entries(CONVERSION_MATRIX)) {
      for (const target of targets) {
        slugs.push(`${source}-to-${target}`);
      }
    }
    return slugs;
  }

  /** Parse conversion slug */
  parseSlug(slug: string): ParsedConversionSlug | null {
    if (!slug || typeof slug !== "string") return null;

    const lower = slug.toLowerCase();
    const parts = lower.split("-to-");

    if (parts.length === 2 && parts[0] && parts[1]) {
      const inputFormat = parts[0];
      const outputFormat = parts[1];
      const inputEntry = formatRegistry.get(inputFormat);
      const outputEntry = formatRegistry.get(outputFormat);

      if (!inputEntry || !outputEntry) return null;
      if (!this.isValid(inputFormat, outputFormat)) return null;

      return {
        inputFormat,
        outputFormat,
        inputName: inputEntry.name,
        outputName: outputEntry.name,
        inputCategory: inputEntry.category,
        outputCategory: outputEntry.category,
        inputMime: inputEntry.mime,
        outputMime: outputEntry.mime,
        isValid: true,
        isSingleFormat: false,
      };
    }

    // Single-format slug
    const entry = formatRegistry.get(lower);
    if (!entry || !this.matrix.has(lower)) return null;

    return {
      inputFormat: lower,
      outputFormat: null,
      inputName: entry.name,
      outputName: null,
      inputCategory: entry.category,
      outputCategory: null,
      inputMime: entry.mime,
      outputMime: null,
      isValid: true,
      isSingleFormat: true,
    };
  }

  /** Infer conversion operation */
  inferOperation(sourceExt: string, targetExt: string): ConversionOperation {
    const src = sourceExt.toLowerCase();
    const tgt = targetExt.toLowerCase();
    const srcDomain = formatRegistry.get(src)?.category;

    if (srcDomain === 'image' || srcDomain === 'raw' || srcDomain === 'vector' || srcDomain === 'icon') {
      return 'image:convert';
    }
    if (srcDomain === 'video') {
      if (AUDIO_EXTS.has(tgt)) return 'video:extract-audio';
      if (tgt === 'gif') return 'video:gif';
      return 'video:convert';
    }
    if (srcDomain === 'audio') {
      return 'audio:convert';
    }
    if (srcDomain === 'document' || srcDomain === 'cad') {
      if (tgt === 'pdf') return 'pdf:compress';
      if (tgt === 'docx') return 'doc:convert';
      return 'doc:convert';
    }

    return 'image:convert';
  }

  /** Get related conversions */
  getRelated(inputFormat: string, outputFormat: string | null, limit = 6): RelatedConversion[] {
    if (!outputFormat) return [];

    const related: RelatedConversion[] = [];
    const seen = new Set<string>();
    const currentSlug = `${inputFormat}-to-${outputFormat}`;

    const push = (from: string, to: string, label: string) => {
      const slug = `${from}-to-${to}`;
      if (slug === currentSlug || seen.has(slug)) return;
      if (!this.isValid(from, to)) return;
      const fromEntry = formatRegistry.get(from);
      const toEntry = formatRegistry.get(to);
      if (!fromEntry || !toEntry) return;
      seen.add(slug);
      related.push({
        slug,
        inputFormat: from,
        outputFormat: to,
        inputName: fromEntry.name,
        outputName: toEntry.name,
        category: fromEntry.category,
        relationLabel: label,
      });
    };

    for (const out of this.getTargets(inputFormat)) {
      if (related.length >= limit) break;
      if (out !== outputFormat) push(inputFormat, out, "Same input");
    }

    push(outputFormat, inputFormat, "Reverse");

    for (const out of this.getTargets(outputFormat)) {
      if (related.length >= limit) break;
      if (out !== inputFormat) push(outputFormat, out, "From output");
    }

    return related.slice(0, limit);
  }

  /** Get available outputs for single format page */
  getAvailableOutputs(inputExt: string): { ext: string; name: string; mime: string; category: string }[] {
    return this.getTargets(inputExt).map(ext => {
      const f = formatRegistry.get(ext);
      return f ? { ext: f.ext, name: f.name, mime: f.mime, category: f.category } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }

  /** Get all conversion pairs as flat array */
  getAllConversions(): { source: string; target: string }[] {
    const conversions: { source: string; target: string }[] = [];
    this.matrix.forEach((targets, source) => {
      for (const target of targets) {
        conversions.push({ source, target });
      }
    });
    return conversions;
  }

  /** Get source formats for a converter type */
  getSourcesForConverterType(type: ConverterType): FormatDefinition[] {
    const categoryMap: Record<ConverterType, FormatCategory[]> = {
      image: ['image', 'raw', 'vector', 'icon', 'cad'],
      video: ['video'],
      audio: ['audio'],
      document: ['document'],
      ebook: ['ebook'],
      cad: ['cad'],
      archive: ['archive'],
      font: ['font'],
    };

    const ebookExts = new Set(['epub', 'mobi', 'azw3', 'pdf', 'doc', 'docx', 'txt', 'html', 'rtf', 'odt']);
    const categories = categoryMap[type] || [];

    return formatRegistry.getAll().filter((f) => {
      if (!categories.includes(f.category)) return false;
      if (!this.matrix.has(f.ext)) return false;
      if (type === 'ebook') return ebookExts.has(f.ext);
      return true;
    });
  }
}

export const conversionRegistry = new ConversionRegistry();
