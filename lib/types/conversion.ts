/**
 * lib/types/conversion.ts
 * Conversion operation types
 */

import type { FormatDefinition } from './formats';

/** All supported conversion operations */
export type ConversionOperation =
  // ── Image ─────────────────────────────────────────────────────────────────
  | 'image:convert'
  | 'image:crop'
  | 'image:resize'
  | 'image:rotate'
  | 'image:flip'
  | 'image:compress'
  | 'image:blur'
  | 'image:watermark'
  | 'image:color-adjust'
  | 'image:ocr'
  | 'image:metadata-remove'
  | 'image:background-remove'
  | 'image:upscale'
  // ── RAW ───────────────────────────────────────────────────────────────────
  | 'raw:develop'
  | 'raw:convert'
  // ── Vector ────────────────────────────────────────────────────────────────
  | 'vector:convert'
  | 'vector:optimize'
  | 'vector:rasterize'
  // ── Video ─────────────────────────────────────────────────────────────────
  | 'video:convert'
  | 'video:trim'
  | 'video:compress'
  | 'video:rotate'
  | 'video:extract-audio'
  | 'video:gif'
  | 'video:crop'
  | 'video:reverse'
  | 'video:subtitle'
  | 'video:merge'
  // ── Audio ─────────────────────────────────────────────────────────────────
  | 'audio:convert'
  | 'audio:trim'
  | 'audio:compress'
  | 'audio:normalize'
  | 'audio:merge'
  | 'audio:speed'
  | 'audio:pitch'
  | 'audio:volume'
  // ── PDF ───────────────────────────────────────────────────────────────────
  | 'pdf:merge'
  | 'pdf:split'
  | 'pdf:compress'
  | 'pdf:protect'
  | 'pdf:unlock'
  | 'pdf:rotate'
  | 'pdf:to-word'
  | 'pdf:watermark'
  | 'pdf:page-numbers'
  | 'pdf:ocr'
  | 'pdf:to-image'
  // ── Document ──────────────────────────────────────────────────────────────
  | 'doc:to-pdf'
  | 'doc:to-text'
  | 'doc:convert'
  | 'doc:extract-images'
  // ── Spreadsheet ───────────────────────────────────────────────────────────
  | 'spreadsheet:convert'
  | 'spreadsheet:to-pdf'
  | 'spreadsheet:merge'
  | 'spreadsheet:to-json'
  | 'spreadsheet:filter'
  // ── Presentation ──────────────────────────────────────────────────────────
  | 'presentation:convert'
  | 'presentation:to-pdf'
  | 'presentation:extract-images'
  // ── Ebook ─────────────────────────────────────────────────────────────────
  | 'ebook:convert'
  | 'ebook:extract-images'
  // ── Archive ───────────────────────────────────────────────────────────────
  | 'archive:compress'
  | 'archive:extract'
  | 'archive:convert'
  | 'archive:list'
  // ── Font ──────────────────────────────────────────────────────────────────
  | 'font:convert'
  | 'font:subset'
  | 'font:preview'
  | 'font:metadata'
  // ── GIS ───────────────────────────────────────────────────────────────────
  | 'gis:convert'
  | 'gis:project'
  | 'gis:simplify'
  // ── Email ─────────────────────────────────────────────────────────────────
  | 'email:convert'
  | 'email:extract'
  // ── Code / Data ───────────────────────────────────────────────────────────
  | 'code:convert'
  | 'code:format'
  | 'code:minify'
  // ── Webpage ───────────────────────────────────────────────────────────────
  | 'webpage:to-pdf'
  | 'webpage:screenshot'
  | 'webpage:full-screenshot'
  | 'webpage:to-text'
  | 'webpage:to-markdown'
  | 'webpage:to-image'
  // ── Subtitle ──────────────────────────────────────────────────────────────
  | 'subtitle:convert'
  | 'subtitle:sync'
  | 'subtitle:translate'
  // ── Certificate ───────────────────────────────────────────────────────────
  | 'certificate:convert'
  | 'certificate:inspect'
  | 'certificate:extract-key'
  // ── 3D ────────────────────────────────────────────────────────────────────
  | '3d:convert'
  | '3d:compress'
  | '3d:optimize'
  | '3d:preview'
  // ── CAD ───────────────────────────────────────────────────────────────────
  | 'cad:convert'
  | 'cad:to-pdf'
  | 'cad:preview'
  // ── OCR ───────────────────────────────────────────────────────────────────
  | 'ocr:recognize'
  | 'ocr:pdf-to-text'
  // ── Scientific ────────────────────────────────────────────────────────────
  | 'scientific:convert'
  | 'scientific:visualize'
  // ── Medical ───────────────────────────────────────────────────────────────
  | 'medical:convert'
  | 'medical:anonymize'
  // ── Disk Image ────────────────────────────────────────────────────────────
  | 'disk:convert'
  | 'disk:extract';

/** Conversion domain */
export type ConversionDomain =
  | 'image' | 'raw' | 'vector'
  | 'video' | 'audio'
  | 'pdf' | 'doc' | 'spreadsheet' | 'presentation'
  | 'ebook' | 'archive' | 'font'
  | 'gis' | 'email' | 'code'
  | 'webpage' | 'subtitle' | 'certificate'
  | 'scientific' | 'medical' | 'disk' | '3d' | 'cad';

/** Conversion options - all possible parameters */
export interface ConversionOptions {
  // Format
  sourceFormat?: string;
  targetFormat?: string;
  quality?: number;

  // Image
  crop?: { x: number; y: number; w: number; h: number };
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  blurRadius?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkFontSize?: number;

  // Video/Audio
  startTime?: number;
  endTime?: number;
  bitrate?: number;
  fps?: number;
  speed?: number;
  pitch?: number;
  lufsTarget?: number;
  keepAudio?: boolean;

  // PDF/Doc
  pageRange?: string;
  password?: string;
  ownerPassword?: string;
  userPassword?: string;
  pageNumberPosition?: string;
  pageNumberStart?: number;
  pageNumberFontSize?: number;
  subtitleText?: string;
  splitPages?: number;
  splitMode?: 'all' | 'range';
  compressionPreset?: string;
  rotateDegrees?: number;
  mergeMode?: 'concat' | 'overlay';
  watermarkColor?: string;
  watermarkAngle?: number;
}

/** Processing priority levels */
export type ProcessingPriority = 'realtime' | 'normal' | 'background';

/** Conversion job definition */
export interface ConversionJob {
  id: string;
  files: File[];
  operation: ConversionOperation;
  options?: ConversionOptions;
  priority?: ProcessingPriority;
  mode: 'free' | 'premium';
  userId?: string;
  sessionId?: string;
  locale?: string;
  createdAt: Date;
  onProgress?: (progress: ConversionProgress) => void;
}

/** Conversion result */
export interface ConversionResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  mimeType?: string;
  error?: string;
  errorCode?: ConversionErrorCode;
  duration?: number;
  provider?: string;
  cached?: boolean;
}

/** Progress information */
export interface ConversionProgress {
  jobId: string;
  stage: ConversionStage;
  progress: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

/** Conversion stages */
export type ConversionStage =
  | 'queued'
  | 'validating'
  | 'loading'
  | 'processing'
  | 'encoding'
  | 'uploading'
  | 'downloading'
  | 'complete'
  | 'failed';

/** Error codes */
export type ConversionErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'CONVERSION_FAILED'
  | 'PROCESSING_TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'PREMIUM_REQUIRED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_OPTIONS';

/** Related conversion for SEO */
export interface RelatedConversion {
  slug: string;
  inputFormat: string;
  outputFormat: string;
  inputName: string;
  outputName: string;
  category: string;
  relationLabel: string;
}
