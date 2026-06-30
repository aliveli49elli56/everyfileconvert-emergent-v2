/**
 * lib/types/provider-interfaces.ts
 * Phase 6A — Universal Provider Interface Layer
 *
 * Defines a domain-specific abstract interface for every supported format category.
 * All business logic and processing engines MUST communicate exclusively through
 * these interfaces. No engine may reference a library directly.
 * Libraries must remain fully swappable.
 */

import type { ConversionOptions, ConversionResult, ConversionProgress } from './conversion';

// ---------------------------------------------------------------------------
// BASE PROVIDER INTERFACE
// ---------------------------------------------------------------------------

export interface ProviderInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: 'client' | 'server' | 'external';
  readonly enabled: boolean;
  readonly premiumOnly: boolean;
}

export interface ProviderCapabilityCheck {
  supported: boolean;
  reason?: string;
  requiresPremium?: boolean;
  requiresServer?: boolean;
}

export interface BaseProcessingOptions {
  quality?: number;
  onProgress?: (p: ConversionProgress) => void;
  signal?: AbortSignal;
  workerEnabled?: boolean;
  chunkProcessing?: boolean;
}

/** Root interface that all domain providers extend */
export interface IBaseProvider {
  readonly info: ProviderInfo;
  initialize(): Promise<boolean>;
  isReady(): boolean;
  canHandle(input: File | string, targetFormat: string): Promise<ProviderCapabilityCheck>;
  dispose?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// 1. IMAGE PROVIDER
// ---------------------------------------------------------------------------

export interface ImageConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  background?: string;
}

export interface ImageEditOptions extends BaseProcessingOptions {
  crop?: { x: number; y: number; w: number; h: number };
  rotation?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  blurRadius?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
}

export interface ImageWatermarkOptions extends BaseProcessingOptions {
  text?: string;
  imageFile?: File;
  opacity?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize?: number;
  color?: string;
}

export interface IImageProvider extends IBaseProvider {
  convert(file: File, options: ImageConvertOptions): Promise<ConversionResult>;
  resize(file: File, width: number, height: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  crop(file: File, rect: { x: number; y: number; w: number; h: number }, options?: BaseProcessingOptions): Promise<ConversionResult>;
  rotate(file: File, degrees: 90 | 180 | 270, options?: BaseProcessingOptions): Promise<ConversionResult>;
  flip(file: File, direction: 'horizontal' | 'vertical', options?: BaseProcessingOptions): Promise<ConversionResult>;
  compress(file: File, quality: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  addWatermark(file: File, options: ImageWatermarkOptions): Promise<ConversionResult>;
  removeMetadata(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  removeBackground(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  upscale(file: File, factor: 2 | 4, options?: BaseProcessingOptions): Promise<ConversionResult>;
  ocr(file: File, language?: string): Promise<{ text: string; confidence: number }>;
}

// ---------------------------------------------------------------------------
// 2. RAW IMAGE PROVIDER
// ---------------------------------------------------------------------------

export interface RawDevelopOptions extends BaseProcessingOptions {
  targetFormat: string;
  exposure?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
  clarity?: number;
  vibrance?: number;
  saturation?: number;
}

export interface IRawProvider extends IBaseProvider {
  develop(file: File, options: RawDevelopOptions): Promise<ConversionResult>;
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractMetadata(file: File): Promise<Record<string, unknown>>;
  getPreview(file: File, maxDimension?: number): Promise<ConversionResult>;
}

// ---------------------------------------------------------------------------
// 3. VECTOR PROVIDER
// ---------------------------------------------------------------------------

export interface VectorConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  width?: number;
  height?: number;
  dpi?: number;
  background?: string;
}

export interface IVectorProvider extends IBaseProvider {
  convert(file: File, options: VectorConvertOptions): Promise<ConversionResult>;
  optimize(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  rasterize(file: File, width: number, height: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractText(file: File): Promise<string>;
  getViewBox(file: File): Promise<{ x: number; y: number; width: number; height: number }>;
}

// ---------------------------------------------------------------------------
// 4. VIDEO PROVIDER
// ---------------------------------------------------------------------------

export interface VideoConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  codec?: string;
  bitrate?: number;
  fps?: number;
  resolution?: { width: number; height: number };
  keepAudio?: boolean;
}

export interface VideoEditOptions extends BaseProcessingOptions {
  startTime?: number;
  endTime?: number;
  crop?: { x: number; y: number; w: number; h: number };
  rotation?: 0 | 90 | 180 | 270;
}

export interface IVideoProvider extends IBaseProvider {
  convert(file: File, options: VideoConvertOptions): Promise<ConversionResult>;
  trim(file: File, startTime: number, endTime: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  compress(file: File, targetSizeMB: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractAudio(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractFrames(file: File, fps: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toGif(file: File, options?: VideoEditOptions): Promise<ConversionResult>;
  merge(files: File[], options?: BaseProcessingOptions): Promise<ConversionResult>;
  addSubtitle(file: File, subtitleFile: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  crop(file: File, rect: { x: number; y: number; w: number; h: number }, options?: BaseProcessingOptions): Promise<ConversionResult>;
  rotate(file: File, degrees: 90 | 180 | 270, options?: BaseProcessingOptions): Promise<ConversionResult>;
  reverse(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getMetadata(file: File): Promise<{ duration: number; resolution: { w: number; h: number }; fps: number; codec: string }>;
}

// ---------------------------------------------------------------------------
// 5. AUDIO PROVIDER
// ---------------------------------------------------------------------------

export interface AudioConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: 1 | 2;
}

export interface IAudioProvider extends IBaseProvider {
  convert(file: File, options: AudioConvertOptions): Promise<ConversionResult>;
  trim(file: File, startTime: number, endTime: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  compress(file: File, targetBitrate: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  normalize(file: File, targetLUFS?: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  merge(files: File[], options?: BaseProcessingOptions): Promise<ConversionResult>;
  changeSpeed(file: File, factor: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  changePitch(file: File, semitones: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  adjustVolume(file: File, gainDB: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getMetadata(file: File): Promise<{ duration: number; bitrate: number; sampleRate: number; channels: number; codec: string }>;
}

// ---------------------------------------------------------------------------
// 6. PDF PROVIDER
// ---------------------------------------------------------------------------

export interface PdfProtectOptions extends BaseProcessingOptions {
  userPassword?: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowEditing?: boolean;
}

export interface IPDFProvider extends IBaseProvider {
  merge(files: File[], options?: BaseProcessingOptions): Promise<ConversionResult>;
  split(file: File, pageRanges: string, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  compress(file: File, preset?: 'screen' | 'ebook' | 'printer' | 'prepress', options?: BaseProcessingOptions): Promise<ConversionResult>;
  protect(file: File, options: PdfProtectOptions): Promise<ConversionResult>;
  unlock(file: File, password: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  rotate(file: File, degrees: 90 | 180 | 270, pageRange?: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  addWatermark(file: File, text: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  addPageNumbers(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toImage(file: File, format: 'jpg' | 'png' | 'webp', dpi?: number, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  toWord(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  ocr(file: File, language?: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getPageCount(file: File): Promise<number>;
}

// ---------------------------------------------------------------------------
// 7. DOCUMENT PROVIDER
// ---------------------------------------------------------------------------

export interface IDocumentProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toPdf(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toText(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractImages(file: File, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  getWordCount(file: File): Promise<number>;
  getMetadata(file: File): Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// 8. SPREADSHEET PROVIDER
// ---------------------------------------------------------------------------

export interface SpreadsheetConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  sheet?: number | string;
  includeHeaders?: boolean;
  delimiter?: string;
}

export interface ISpreadsheetProvider extends IBaseProvider {
  convert(file: File, options: SpreadsheetConvertOptions): Promise<ConversionResult>;
  toPdf(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toJson(file: File, sheet?: number | string): Promise<Record<string, unknown>[]>;
  merge(files: File[], options?: BaseProcessingOptions): Promise<ConversionResult>;
  filter(file: File, query: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getSheets(file: File): Promise<string[]>;
  getRowCount(file: File, sheet?: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// 9. PRESENTATION PROVIDER
// ---------------------------------------------------------------------------

export interface IPresentationProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toPdf(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractImages(file: File, format?: string, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  getSlideCount(file: File): Promise<number>;
  getMetadata(file: File): Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// 10. EBOOK PROVIDER
// ---------------------------------------------------------------------------

export interface EbookConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  author?: string;
  title?: string;
  language?: string;
  coverImage?: File;
}

export interface IEbookProvider extends IBaseProvider {
  convert(file: File, options: EbookConvertOptions): Promise<ConversionResult>;
  extractImages(file: File, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  extractText(file: File): Promise<string>;
  getMetadata(file: File): Promise<{ title?: string; author?: string; language?: string; chapters: number }>;
}

// ---------------------------------------------------------------------------
// 11. ARCHIVE PROVIDER
// ---------------------------------------------------------------------------

export interface ArchiveCompressOptions extends BaseProcessingOptions {
  targetFormat: string;
  compressionLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  password?: string;
}

export interface IArchiveProvider extends IBaseProvider {
  compress(files: File[], options: ArchiveCompressOptions): Promise<ConversionResult>;
  extract(file: File, password?: string, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  list(file: File): Promise<{ name: string; size: number; compressed: number; isDirectory: boolean }[]>;
  test(file: File, password?: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// 12. FONT PROVIDER
// ---------------------------------------------------------------------------

export interface FontConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  glyphs?: string;
}

export interface IFontProvider extends IBaseProvider {
  convert(file: File, options: FontConvertOptions): Promise<ConversionResult>;
  subset(file: File, characters: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  generatePreview(file: File, text?: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getMetadata(file: File): Promise<{ family: string; style: string; weight: string; glyphCount: number }>;
  getFamilyName(file: File): Promise<string>;
}

// ---------------------------------------------------------------------------
// 13. GIS / GEOSPATIAL PROVIDER
// ---------------------------------------------------------------------------

export interface GisConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  sourceCRS?: string;
  targetCRS?: string;
}

export interface IGISProvider extends IBaseProvider {
  convert(file: File, options: GisConvertOptions): Promise<ConversionResult>;
  reproject(file: File, targetCRS: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  simplify(file: File, tolerance: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getBBox(file: File): Promise<[number, number, number, number]>;
  getFeatureCount(file: File): Promise<number>;
}

// ---------------------------------------------------------------------------
// 14. EMAIL PROVIDER
// ---------------------------------------------------------------------------

export interface IEmailProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  extractAttachments(file: File, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  getHeaders(file: File): Promise<Record<string, string>>;
  getMetadata(file: File): Promise<{ from?: string; to?: string[]; subject?: string; date?: string; attachments: number }>;
}

// ---------------------------------------------------------------------------
// 15. CODE / DATA PROVIDER
// ---------------------------------------------------------------------------

export interface ICodeProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  format(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  minify(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  validate(file: File): Promise<{ valid: boolean; errors: string[] }>;
  parse(file: File): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// 16. WEBPAGE PROVIDER
// ---------------------------------------------------------------------------

export interface WebpageScreenshotOptions extends BaseProcessingOptions {
  targetFormat: 'png' | 'jpg' | 'webp';
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  waitForSelector?: string;
  waitMs?: number;
  scale?: number;
}

export interface WebpagePdfOptions extends BaseProcessingOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top: string; right: string; bottom: string; left: string };
}

export interface IWebpageProvider extends IBaseProvider {
  toPdf(urlOrFile: string | File, options?: WebpagePdfOptions): Promise<ConversionResult>;
  toImage(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult>;
  screenshot(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult>;
  fullPageScreenshot(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult>;
  toText(urlOrFile: string | File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toMarkdown(urlOrFile: string | File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getTitle(url: string): Promise<string>;
  getMetadata(urlOrFile: string | File): Promise<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// 17. SUBTITLE PROVIDER
// ---------------------------------------------------------------------------

export interface SubtitleConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  encoding?: string;
  timeOffset?: number;
}

export interface ISubtitleProvider extends IBaseProvider {
  convert(file: File, options: SubtitleConvertOptions): Promise<ConversionResult>;
  sync(file: File, offsetMs: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  validate(file: File): Promise<{ valid: boolean; errors: string[]; entryCount: number }>;
  parse(file: File): Promise<{ start: string; end: string; text: string }[]>;
  getCueCount(file: File): Promise<number>;
}

// ---------------------------------------------------------------------------
// 18. CERTIFICATE PROVIDER
// ---------------------------------------------------------------------------

export interface CertificateConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  password?: string;
  exportPassword?: string;
}

export interface ICertificateProvider extends IBaseProvider {
  convert(file: File, options: CertificateConvertOptions): Promise<ConversionResult>;
  inspect(file: File, password?: string): Promise<Record<string, unknown>>;
  extractPublicKey(file: File, password?: string): Promise<ConversionResult>;
  extractPrivateKey(file: File, password: string): Promise<ConversionResult>;
  getSubject(file: File, password?: string): Promise<string>;
  getExpiry(file: File, password?: string): Promise<Date>;
  isExpired(file: File): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// 19. SCIENTIFIC DATA PROVIDER
// ---------------------------------------------------------------------------

export interface IScientificProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  visualize(file: File, plotType?: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getDatasetInfo(file: File): Promise<{ dimensions: number[]; dtype: string; size: number }>;
  toCSV(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toJSON(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
}

// ---------------------------------------------------------------------------
// 20. MEDICAL IMAGING PROVIDER
// ---------------------------------------------------------------------------

export interface MedicalConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  anonymize?: boolean;
  series?: number;
  frame?: number;
}

export interface IMedicalProvider extends IBaseProvider {
  convert(file: File, options: MedicalConvertOptions): Promise<ConversionResult>;
  anonymize(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getPatientData(file: File): Promise<Record<string, string>>;
  getMetadata(file: File): Promise<Record<string, unknown>>;
  extractSlice(file: File, sliceIndex: number, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getImageDimensions(file: File): Promise<{ width: number; height: number; depth?: number }>;
}

// ---------------------------------------------------------------------------
// 21. DISK IMAGE PROVIDER
// ---------------------------------------------------------------------------

export interface IDiskImageProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  list(file: File): Promise<{ name: string; size: number; isDirectory: boolean }[]>;
  extract(file: File, path?: string, options?: BaseProcessingOptions): Promise<ConversionResult[]>;
  getVolumeInfo(file: File): Promise<{ label?: string; size: number; filesystem?: string }>;
  verify(file: File): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// 22. 3D MODEL PROVIDER
// ---------------------------------------------------------------------------

export interface ThreeDConvertOptions extends BaseProcessingOptions {
  targetFormat: string;
  scale?: number;
  mergeVertices?: boolean;
  removeTextures?: boolean;
  binary?: boolean;
}

export interface IThreeDProvider extends IBaseProvider {
  convert(file: File, options: ThreeDConvertOptions): Promise<ConversionResult>;
  compress(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  optimize(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  generatePreview(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getMeshInfo(file: File): Promise<{ vertices: number; faces: number; materials: number; textures: number }>;
}

// ---------------------------------------------------------------------------
// 23. CAD PROVIDER
// ---------------------------------------------------------------------------

export interface ICADProvider extends IBaseProvider {
  convert(file: File, targetFormat: string, options?: BaseProcessingOptions): Promise<ConversionResult>;
  toPdf(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  generatePreview(file: File, options?: BaseProcessingOptions): Promise<ConversionResult>;
  getLayerCount(file: File): Promise<number>;
  getEntityCount(file: File): Promise<number>;
}

// ---------------------------------------------------------------------------
// 24. OCR PROVIDER
// ---------------------------------------------------------------------------

export interface OCROptions extends BaseProcessingOptions {
  language?: string;
  outputFormat?: 'txt' | 'pdf' | 'docx' | 'json';
  dpi?: number;
  enhanceContrast?: boolean;
}

export interface IOCRProvider extends IBaseProvider {
  recognize(file: File, options?: OCROptions): Promise<{ text: string; confidence: number; words: { text: string; confidence: number; bbox: number[] }[] }>;
  pdfToSearchable(file: File, options?: OCROptions): Promise<ConversionResult>;
  imageToText(file: File, options?: OCROptions): Promise<ConversionResult>;
  detectLanguage(file: File): Promise<string>;
}

// ---------------------------------------------------------------------------
// PROVIDER TYPE MAP — for type-safe provider resolution
// ---------------------------------------------------------------------------

export interface ProviderTypeMap {
  image: IImageProvider;
  raw: IRawProvider;
  vector: IVectorProvider;
  video: IVideoProvider;
  audio: IAudioProvider;
  pdf: IPDFProvider;
  document: IDocumentProvider;
  spreadsheet: ISpreadsheetProvider;
  presentation: IPresentationProvider;
  ebook: IEbookProvider;
  archive: IArchiveProvider;
  font: IFontProvider;
  gis: IGISProvider;
  email: IEmailProvider;
  code: ICodeProvider;
  webpage: IWebpageProvider;
  subtitle: ISubtitleProvider;
  certificate: ICertificateProvider;
  scientific: IScientificProvider;
  medical: IMedicalProvider;
  'disk-image': IDiskImageProvider;
  '3d': IThreeDProvider;
  cad: ICADProvider;
  ocr: IOCRProvider;
}

export type ProviderDomain = keyof ProviderTypeMap;
