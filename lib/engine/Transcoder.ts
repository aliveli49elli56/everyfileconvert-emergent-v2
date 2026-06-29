/**
 * lib/engine/Transcoder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central transcoding hub. All operations pass through here.
 * Each sub-engine is lazy-loaded so the browser only fetches what it needs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { formatRegistry } from '@/lib/registry/format-registry';

// ── Operation Types ────────────────────────────────────────────────────────────
export type TranscodeOp =
  // Image
  | 'image:convert' | 'image:crop' | 'image:resize' | 'image:rotate'
  | 'image:flip'   | 'image:compress' | 'image:blur' | 'image:watermark'
  | 'image:color-adjust' | 'image:ocr'
  // Video
  | 'video:convert' | 'video:trim' | 'video:compress' | 'video:rotate'
  | 'video:extract-audio' | 'video:gif' | 'video:crop' | 'video:reverse'
  | 'video:subtitle'
  // Audio
  | 'audio:convert' | 'audio:trim' | 'audio:compress' | 'audio:normalize'
  | 'audio:merge' | 'audio:speed' | 'audio:pitch'
  // PDF
  | 'pdf:merge' | 'pdf:split' | 'pdf:compress' | 'pdf:protect' | 'pdf:unlock'
  | 'pdf:rotate' | 'pdf:to-word' | 'pdf:watermark' | 'pdf:page-numbers'
  // Doc
  | 'doc:to-pdf' | 'doc:to-text'
  // Ebook
  | 'ebook:convert';

// ── Options ────────────────────────────────────────────────────────────────────
export interface TranscodeOptions {
  // Format
  sourceFormat?: string;
  targetFormat?: string;
  quality?: number; // 0–100

  // Image manipulation
  crop?: { x: number; y: number; w: number; h: number };
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  rotation?: number; // degrees
  flipH?: boolean;
  flipV?: boolean;
  blurRadius?: number;
  brightness?: number; // -100 to 100
  contrast?: number;   // -100 to 100
  saturation?: number; // -100 to 100
  hue?: number;        // -180 to 180
  watermarkText?: string;
  watermarkOpacity?: number; // 0–1
  watermarkPosition?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkFontSize?: number;

  // Video / Audio trim & settings
  startTime?: number;  // seconds
  endTime?: number;    // seconds
  bitrate?: number;    // kbps
  fps?: number;
  speed?: number;      // 0.5–2.0
  pitch?: number;      // semitones -12..12
  lufsTarget?: number; // e.g. -14 for streaming

  // PDF / Doc
  pageRange?: string;  // e.g. "1-3,5,7-9"
  password?: string;
  ownerPassword?: string;
  userPassword?: string;
  pageNumberPosition?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  pageNumberStart?: number;
  pageNumberFontSize?: number;
  subtitleText?: string;
  splitPages?: number; // pages per chunk
  splitMode?: 'all' | 'range';
  compressionPreset?: string; // 'screen' | 'ebook' | 'printer' | 'prepress'
  rotateDegrees?: number;     // for PDF rotation
  mergeMode?: 'concat' | 'overlay'; // for audio merge
  keepAudio?: boolean;
  watermarkColor?: string;
  watermarkAngle?: number;
}

// ── Job & Result ───────────────────────────────────────────────────────────────
export interface TranscodeJob {
  files: File[];
  op: TranscodeOp;
  options?: TranscodeOptions;
  onProgress?: (pct: number) => void;
}

export interface TranscodeResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

// ── Output filename helper ─────────────────────────────────────────────────────
export function buildOutputName(original: string, newExt: string): string {
  // Rule: "abc.png" → "abc.webp" (never "abc.webp.png")
  const base = original.replace(/\.[^/.]+$/, '');
  return `${base}.${newExt}`;
}

// ── Domain detection (registry-driven) ───────────────────────────────────────────────────
const AUDIO_EXTS = new Set(['mp3','wav','ogg','flac','aac','m4a','wma','aiff','opus','ac3','amr','ra','caf']);

export function detectDomain(ext: string): 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'ebook' | null {
  const entry = formatRegistry.get(ext.toLowerCase());
  if (!entry) return null;

  const cat = entry.category;
  if (['image', 'raw', 'vector', 'icon', 'cad'].includes(cat)) return 'image';
  if (cat === 'video') return 'video';
  if (cat === 'audio') return 'audio';
  if (cat === 'document') return 'doc';
  if (cat === 'ebook') return 'ebook';
  // PDF is its own domain for processing purposes
  if (ext.toLowerCase() === 'pdf') return 'pdf';
  return null;
}

export function inferOp(sourceExt: string, targetExt: string): TranscodeOp {
  const src = sourceExt.toLowerCase();
  const tgt = targetExt.toLowerCase();
  const srcDomain = detectDomain(src);
  const tgtDomain = detectDomain(tgt);

  if (srcDomain === 'image') return 'image:convert';
  if (srcDomain === 'video' && AUDIO_EXTS.has(tgt)) return 'video:extract-audio';
  if (srcDomain === 'video') return 'video:convert';
  if (srcDomain === 'audio') return 'audio:convert';
  if (srcDomain === 'doc' && tgt === 'pdf') return 'doc:to-pdf';
  if (srcDomain === 'doc' && (tgt === 'txt' || tgt === 'html' || tgt === 'htm')) return 'doc:to-text';
  if (srcDomain === 'pdf' && tgtDomain === 'doc') return 'pdf:to-word';
  if (srcDomain === 'pdf' && tgtDomain === 'ebook') return 'ebook:convert';
  if (srcDomain === 'pdf') return 'pdf:compress';
  if (srcDomain === 'doc') return 'ebook:convert';       // doc → ebook
  if (srcDomain === 'ebook') return 'ebook:convert';     // ebook → any
  return 'image:convert'; // fallback
}

// ── Transcoder Singleton ───────────────────────────────────────────────────────
class TranscoderEngine {
  async run(job: TranscodeJob): Promise<TranscodeResult> {
    const { files, op } = job;
    if (!files.length) throw new Error('No files provided');

    const [domain] = op.split(':');

    try {
      switch (domain) {
        case 'image': {
          const { ImageEngine } = await import('./ImageEngine');
          return await ImageEngine.process(job);
        }
        case 'video':
        case 'audio': {
          const { VideoAudioEngine } = await import('./VideoAudioEngine');
          return await VideoAudioEngine.process(job);
        }
        case 'pdf':
        case 'doc': {
          const { PdfDocEngine } = await import('./PdfDocEngine');
          return await PdfDocEngine.process(job);
        }
        case 'ebook': {
          const { EbookEngine } = await import('./EbookEngine');
          return await EbookEngine.process(job);
        }
        default:
          throw new Error(`Unknown domain: ${domain}`);
      }
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'string' ? err : 'Transcoding failed');
      throw new Error(`Dosya işlenemedi: ${msg}. Lütfen başka bir format deneyin.`);
    }
  }
}

export const Transcoder = new TranscoderEngine();
