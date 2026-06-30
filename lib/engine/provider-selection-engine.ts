/**
 * lib/engine/provider-selection-engine.ts
 *
 * Universal Provider Selection Engine — Phase 6A
 *
 * Selects the optimal processing provider for any conversion request using
 * ONLY metadata from the registries.  Zero hardcoded if/else routing.
 *
 * Selection flow:
 *   Request
 *     → Processor Registry   (which processors handle this format pair?)
 *     → Provider Registry    (which providers implement those processors?)
 *     → Library Registry     (do the underlying libraries support this pair?)
 *     → Capability Scoring   (rank by: quality × speed / memory)
 *     → Browser Compatibility (filter if client-side required)
 *     → Memory Limits        (filter by file size)
 *     → Premium Availability (filter by user tier)
 *     → Fallback Chain       (pick best, then fallback, then server)
 *     → Selected Provider
 */

import type { FormatDefinition } from '../types/formats';
// Provider interfaces are not needed directly by the selection engine —
// business logic only reads metadata from PROVIDER_META_TABLE.
// Import types only if needed for typing future typed provider factories.
import type {
  IImageProvider, IVideoProvider, IAudioProvider, IPDFProvider,
  IDocumentProvider, ISpreadsheetProvider, IPresentationProvider,
  IEbookProvider, IArchiveProvider, IFontProvider, IGISProvider,
  IEmailProvider, ICodeProvider, IWebpageProvider, ISubtitleProvider,
  ICertificateProvider, IScientificProvider, IMedicalProvider,
  IDiskImageProvider, IThreeDProvider, ICADProvider, IOCRProvider,
  IVectorProvider,
} from '../types/provider-interfaces';
import type { LibraryDefinition } from '../registry/library-registry';
import { processorRegistry } from '../registry/processor-registry';
import { libraryRegistry } from '../registry/library-registry';
// TYPES
// ---------------------------------------------------------------------------

export type UserTier = 'free' | 'premium' | 'enterprise';

export type RuntimeEnvironment = 'browser' | 'server' | 'edge';

export interface SelectionRequest {
  /** Source format extension (lowercase) */
  inputExt: string;
  /** Target format extension (lowercase) */
  outputExt: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** Whether the request originates from a browser (no server access) */
  runtimeEnv: RuntimeEnvironment;
  /** User tier — controls premium provider access */
  userTier: UserTier;
  /** Prefer lower memory usage over quality */
  preferLowMemory?: boolean;
  /** Prefer fastest result even if quality lower */
  preferSpeed?: boolean;
  /** Explicit provider override (skip selection) */
  providerOverride?: string;
}

export type ProviderStatus =
  | 'selected'      // Chosen primary provider
  | 'fallback'      // Fallback if primary fails
  | 'unavailable';  // Cannot handle this request

export interface ProviderCandidate {
  /** Provider unique identifier */
  providerId: string;
  /** Human-readable name */
  providerName: string;
  /** Underlying library ID */
  libraryId: string;
  /** Whether this runs in browser */
  browserCompatible: boolean;
  /** Whether this requires server */
  serverRequired: boolean;
  /** Whether this requires a premium subscription */
  requiresPremium: boolean;
  /** Estimated quality score 0–100 */
  qualityScore: number;
  /** Estimated relative speed score 0–100 */
  speedScore: number;
  /** Estimated memory score 0–100 (higher = uses less memory) */
  memoryScore: number;
  /** Composite priority score (higher = preferred) */
  compositeScore: number;
  /** Max file size this provider supports (0 = unlimited) */
  maxFileSizeBytes: number;
  /** Whether the operation requires a browser page reload for WASM init */
  requiresWasmInit?: boolean;
  /** Reason this candidate was rejected (undefined if viable) */
  rejectionReason?: string;
}

export interface SelectionResult {
  /** Request that triggered this selection */
  request: SelectionRequest;
  /** Ordered list of candidates evaluated (best first) */
  candidates: ProviderCandidate[];
  /** Selected primary provider */
  selected: ProviderCandidate | null;
  /** Ordered fallback chain after primary */
  fallbackChain: ProviderCandidate[];
  /** Whether the operation requires a browser page reload for WASM init */
  requiresWasmInit: boolean;
  /** Whether the operation is available at all */
  isOperationSupported: boolean;
  /** Explanation of the selection decision */
  selectionReason: string;
}

// ---------------------------------------------------------------------------
// PROVIDER METADATA REGISTRY
// Maps provider IDs to their capabilities as pure metadata.
// No provider implementations are imported here.
// ---------------------------------------------------------------------------

interface ProviderMeta {
  id: string;
  name: string;
  libraryId: string;
  browserCompatible: boolean;
  serverRequired: boolean;
  requiresPremium: boolean;
  /** Formats this provider can accept as input */
  inputFormats: string[];
  /** Formats this provider can produce as output */
  outputFormats: string[];
  /** Relative quality score (0–100) */
  qualityScore: number;
  /** Relative speed score (0–100) */
  speedScore: number;
  /** Memory efficiency score (0–100, higher = uses less memory) */
  memoryScore: number;
  /** Max file size in bytes this provider can handle (0 = unlimited) */
  maxFileSizeBytes: number;
  /** Provider requires WASM initialisation before first use */
  requiresWasmInit: boolean;
  /** Supported processor IDs */
  processorIds: string[];
}

/**
 * Provider metadata table — single source of truth for routing decisions.
 * All routing logic reads from this table; nothing else.
 */
const PROVIDER_META_TABLE: ProviderMeta[] = [

  // ── Image ──────────────────────────────────────────────────────────────────

  {
    id: "CanvasImageProvider",
    name: "Canvas API Image Provider",
    libraryId: "canvas-api",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif", "ico", "tif", "tiff", "jfif"],
    outputFormats: ["png", "jpg", "jpeg", "webp", "bmp"],
    qualityScore: 75,
    speedScore: 95,
    memoryScore: 80,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["image-converter", "image-resizer", "image-compressor"],
  },
  {
    id: "SquooshImageProvider",
    name: "Squoosh Image Provider",
    libraryId: "squoosh",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["png", "jpg", "jpeg", "webp", "avif"],
    outputFormats: ["png", "jpg", "jpeg", "webp", "avif", "jxl"],
    qualityScore: 90,
    speedScore: 70,
    memoryScore: 65,
    maxFileSizeBytes: 20 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["image-converter", "image-compressor"],
  },
  {
    id: "JimpImageProvider",
    name: "Jimp Image Provider",
    libraryId: "jimp",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["png", "jpg", "jpeg", "bmp", "gif", "tiff"],
    outputFormats: ["png", "jpg", "jpeg", "bmp", "gif", "tiff"],
    qualityScore: 70,
    speedScore: 55,
    memoryScore: 70,
    maxFileSizeBytes: 30 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["image-converter", "image-editor"],
  },
  {
    id: "SharpImageProvider",
    name: "Sharp (Server) Image Provider",
    libraryId: "sharp",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["png", "jpg", "jpeg", "webp", "gif", "tiff", "avif", "heic", "heif"],
    outputFormats: ["png", "jpg", "jpeg", "webp", "gif", "tiff", "avif", "heic"],
    qualityScore: 98,
    speedScore: 95,
    memoryScore: 90,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["image-converter", "image-resizer", "image-compressor", "image-optimizer"],
  },
  {
    id: "CloudinaryProvider",
    name: "Cloudinary API Provider",
    libraryId: "cloudinary",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "avif", "svg"],
    outputFormats: ["png", "jpg", "jpeg", "webp", "gif", "avif"],
    qualityScore: 95,
    speedScore: 80,
    memoryScore: 100,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["image-converter", "image-resizer"],
  },

  // ── RAW Image ─────────────────────────────────────────────────────────────

  {
    id: "RawImageProvider",
    name: "RAW Image Provider (Server)",
    libraryId: "imagemagick",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["raw", "cr2", "cr3", "nef", "arw", "dng", "raf", "rw2", "orf", "pef", "srw", "erf", "mrw", "x3f"],
    outputFormats: ["png", "jpg", "jpeg", "webp", "tiff"],
    qualityScore: 92,
    speedScore: 65,
    memoryScore: 60,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["raw-converter"],
  },

  // ── Video ──────────────────────────────────────────────────────────────────

  {
    id: "FFmpegWasmProvider",
    name: "FFmpeg WASM Provider",
    libraryId: "ffmpeg-wasm",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["mp4", "webm", "avi", "mov", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v", "3gp", "ogv", "ts", "f4v", "mp3", "wav", "ogg", "flac", "aac", "m4a"],
    outputFormats: ["mp4", "webm", "avi", "mov", "mkv", "ogv", "mp3", "wav", "ogg", "flac", "aac", "m4a", "gif"],
    qualityScore: 88,
    speedScore: 50,
    memoryScore: 40,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["video-converter", "audio-converter", "gif-converter"],
  },
  {
    id: "FFmpegServerProvider",
    name: "FFmpeg Server Provider",
    libraryId: "ffmpeg-server",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["mp4", "webm", "avi", "mov", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v", "3gp", "hevc", "m2ts", "rm", "rmvb", "vob", "asf", "mp3", "wav", "ogg", "flac", "aac", "m4a", "alac", "wma", "opus", "ac3", "amr"],
    outputFormats: ["mp4", "webm", "avi", "mov", "mkv", "wmv", "ogv", "mp3", "wav", "ogg", "flac", "aac", "m4a", "gif"],
    qualityScore: 99,
    speedScore: 90,
    memoryScore: 75,
    maxFileSizeBytes: 0,
    requiresWasmInit: false,
    processorIds: ["video-converter", "audio-converter"],
  },

  // ── Audio ──────────────────────────────────────────────────────────────────

  {
    id: "WebAudioProvider",
    name: "Web Audio API Provider",
    libraryId: "web-audio-api",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["mp3", "wav", "ogg", "aac", "m4a"],
    outputFormats: ["wav"],
    qualityScore: 80,
    speedScore: 85,
    memoryScore: 90,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["audio-converter"],
  },

  // ── PDF ────────────────────────────────────────────────────────────────────

  {
    id: "PDFLibProvider",
    name: "pdf-lib Provider",
    libraryId: "pdf-lib",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    qualityScore: 85,
    speedScore: 75,
    memoryScore: 80,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["pdf-editor", "pdf-merger", "pdf-splitter"],
  },
  {
    id: "PDFJSProvider",
    name: "PDF.js Viewer Provider",
    libraryId: "pdfjs",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["pdf"],
    outputFormats: ["png", "jpg"],
    qualityScore: 88,
    speedScore: 70,
    memoryScore: 70,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["pdf-converter", "pdf-viewer"],
  },
  {
    id: "GhostscriptProvider",
    name: "Ghostscript Server Provider",
    libraryId: "ghostscript",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["pdf", "eps", "ps"],
    outputFormats: ["pdf", "png", "jpg", "svg", "eps"],
    qualityScore: 96,
    speedScore: 60,
    memoryScore: 55,
    maxFileSizeBytes: 2 * 1024 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["pdf-converter", "pdf-compressor"],
  },

  // ── Document ──────────────────────────────────────────────────────────────

  {
    id: "MammothProvider",
    name: "Mammoth DOCX Provider",
    libraryId: "mammoth",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["docx"],
    outputFormats: ["html", "txt", "md"],
    qualityScore: 85,
    speedScore: 80,
    memoryScore: 90,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["document-converter"],
  },
  {
    id: "DocxPreviewProvider",
    name: "docx-preview Viewer",
    libraryId: "docx-preview",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["docx"],
    outputFormats: ["html"],
    qualityScore: 88,
    speedScore: 70,
    memoryScore: 80,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["document-viewer"],
  },
  {
    id: "LibreOfficeProvider",
    name: "LibreOffice Server Provider",
    libraryId: "libreoffice",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["docx", "doc", "odt", "xlsx", "xls", "ods", "pptx", "ppt", "odp", "txt", "rtf", "html", "csv"],
    outputFormats: ["pdf", "docx", "odt", "xlsx", "ods", "pptx", "odp", "txt", "html", "csv", "png", "jpg"],
    qualityScore: 95,
    speedScore: 55,
    memoryScore: 50,
    maxFileSizeBytes: 2 * 1024 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["document-converter", "spreadsheet-converter", "presentation-converter"],
  },
  {
    id: "AsposeWordsProvider",
    name: "Aspose Words Cloud Provider",
    libraryId: "aspose-words",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["docx", "doc", "odt", "rtf", "txt", "html", "md"],
    outputFormats: ["docx", "pdf", "odt", "html", "md", "txt", "epub"],
    qualityScore: 98,
    speedScore: 70,
    memoryScore: 100,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["document-converter"],
  },

  // ── Spreadsheet ────────────────────────────────────────────────────────────

  {
    id: "SheetJSProvider",
    name: "SheetJS Provider",
    libraryId: "sheetjs",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["xlsx", "xls", "xlsm", "xlsb", "ods", "csv", "tsv"],
    outputFormats: ["xlsx", "xls", "ods", "csv", "tsv", "html", "json"],
    qualityScore: 88,
    speedScore: 85,
    memoryScore: 75,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["spreadsheet-converter", "csv-converter"],
  },

  // ── OCR ────────────────────────────────────────────────────────────────────

  {
    id: "TesseractProvider",
    name: "Tesseract.js OCR Provider",
    libraryId: "tesseract-js",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "pdf"],
    outputFormats: ["txt", "pdf", "html", "json"],
    qualityScore: 80,
    speedScore: 55,
    memoryScore: 50,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["ocr-processor"],
  },
  {
    id: "GoogleVisionProvider",
    name: "Google Vision OCR Provider",
    libraryId: "google-vision",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "pdf"],
    outputFormats: ["txt", "json", "pdf"],
    qualityScore: 97,
    speedScore: 80,
    memoryScore: 100,
    maxFileSizeBytes: 20 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["ocr-processor"],
  },

  // ── Archive ────────────────────────────────────────────────────────────────

  {
    id: "JSZipProvider",
    name: "JSZip Provider",
    libraryId: "jszip",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["zip"],
    outputFormats: ["zip"],
    qualityScore: 90,
    speedScore: 80,
    memoryScore: 70,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["archive-extractor", "archive-creator"],
  },
  {
    id: "UnrarProvider",
    name: "node-unrar-js Provider",
    libraryId: "node-unrar-js",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["rar"],
    outputFormats: ["zip"],
    qualityScore: 90,
    speedScore: 70,
    memoryScore: 65,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["archive-extractor"],
  },
  {
    id: "SevenZipProvider",
    // 7z-wasm@1.2.0 installed as infrastructure. Module factory registered in browser-arch.ts.
    // WASM binary served from /public/wasm/7zz.wasm.
    // Processing pipeline (SevenZipEngine.initialize() + FS + callMain) planned for Phase 6C.
    // Current BrowserArchiveProvider.canHandle() returns 'future' for these formats
    // via archive-capability.ts — no fake processing, truthful metadata only.
    name: "7zip-wasm Provider",
    libraryId: "7zip-wasm",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    // Formats per 7z-wasm capability. RAR is read-only even by 7-Zip (no create).
    inputFormats: ["7z", "tar", "gz", "bz2", "xz", "cab", "zip", "rar"],
    outputFormats: ["7z", "tar", "gz", "bz2", "xz", "zip"],
    qualityScore: 92,
    speedScore: 65,
    memoryScore: 60,
    maxFileSizeBytes: 1 * 1024 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["archive-extractor", "archive-creator"],
  },

  // ── Font ───────────────────────────────────────────────────────────────────

  {
    id: "OpenTypeProvider",
    name: "OpenType.js Provider",
    libraryId: "opentype-js",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["ttf", "otf", "woff"],
    outputFormats: ["svg", "ttf", "otf"],
    qualityScore: 88,
    speedScore: 80,
    memoryScore: 90,
    maxFileSizeBytes: 10 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["font-converter"],
  },
  {
    id: "FontkitProvider",
    name: "Fontkit Provider",
    libraryId: "fontkit",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["ttf", "otf", "woff", "woff2", "ttc", "dfont"],
    outputFormats: ["ttf", "otf"],
    qualityScore: 90,
    speedScore: 75,
    memoryScore: 85,
    maxFileSizeBytes: 10 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["font-converter"],
  },

  // ── GIS ────────────────────────────────────────────────────────────────────

  {
    id: "TurfProvider",
    name: "Turf.js GIS Provider",
    libraryId: "turf-js",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["geojson", "topojson"],
    outputFormats: ["geojson"],
    qualityScore: 85,
    speedScore: 90,
    memoryScore: 85,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["gis-converter"],
  },
  {
    id: "GDALProvider",
    name: "GDAL Provider",
    libraryId: "gdal",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["shp", "geojson", "kml", "kmz", "gpkg", "gpx", "geotiff"],
    outputFormats: ["geojson", "kml", "shp", "gpkg", "csv"],
    qualityScore: 96,
    speedScore: 60,
    memoryScore: 50,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["gis-converter"],
  },

  // ── Webpage ────────────────────────────────────────────────────────────────

  {
    id: "Html2CanvasProvider",
    name: "html2canvas Provider",
    libraryId: "html2canvas",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["html", "xhtml"],
    outputFormats: ["png", "jpg"],
    qualityScore: 72,
    speedScore: 80,
    memoryScore: 80,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["webpage-to-image"],
  },
  {
    id: "PuppeteerProvider",
    name: "Puppeteer Server Provider",
    libraryId: "puppeteer",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["html", "url", "xhtml", "mhtml"],
    outputFormats: ["pdf", "png", "jpg", "webp"],
    qualityScore: 98,
    speedScore: 75,
    memoryScore: 55,
    maxFileSizeBytes: 0,
    requiresWasmInit: false,
    processorIds: ["webpage-to-pdf", "webpage-to-image"],
  },

  // ── 3D ─────────────────────────────────────────────────────────────────────

  {
    id: "ThreeJSProvider",
    name: "Three.js 3D Provider",
    libraryId: "three-js",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["glb", "gltf", "obj", "fbx", "stl", "dae", "ply"],
    outputFormats: ["glb", "gltf", "obj"],
    qualityScore: 88,
    speedScore: 75,
    memoryScore: 65,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["3d-viewer", "3d-converter"],
  },
  {
    id: "AssimpProvider",
    name: "AssimpJS 3D Provider",
    libraryId: "assimpjs",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["fbx", "obj", "stl", "dae", "ply", "3ds", "blend", "lwo"],
    outputFormats: ["obj", "stl", "glb", "gltf", "dae"],
    qualityScore: 90,
    speedScore: 55,
    memoryScore: 50,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["3d-converter"],
  },

  // ── CAD ────────────────────────────────────────────────────────────────────

  {
    id: "OpenCascadeProvider",
    name: "OpenCascade CAD Provider",
    libraryId: "opencascade",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["step", "iges", "igs"],
    outputFormats: ["step", "stl", "obj", "glb"],
    qualityScore: 94,
    speedScore: 45,
    memoryScore: 40,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: true,
    processorIds: ["cad-converter"],
  },

  // ── Medical ────────────────────────────────────────────────────────────────

  {
    id: "DCMJSProvider",
    name: "dcmjs DICOM Provider",
    libraryId: "dcmjs",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["dcm", "dicom"],
    outputFormats: ["png", "jpg", "json"],
    qualityScore: 88,
    speedScore: 65,
    memoryScore: 60,
    maxFileSizeBytes: 500 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["medical-viewer", "dicom-converter"],
  },

  // ── Certificates ──────────────────────────────────────────────────────────

  {
    id: "NodeForgeProvider",
    name: "node-forge Certificate Provider",
    libraryId: "node-forge",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["pem", "der", "crt", "cer", "p12", "pfx", "csr"],
    outputFormats: ["pem", "der", "p12", "pfx"],
    qualityScore: 92,
    speedScore: 85,
    memoryScore: 95,
    maxFileSizeBytes: 5 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["certificate-converter"],
  },
  {
    id: "OpenSSLProvider",
    name: "OpenSSL Server Provider",
    libraryId: "openssl",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["pem", "der", "crt", "cer", "p12", "pfx", "p7b", "csr"],
    outputFormats: ["pem", "der", "p12", "pfx", "txt"],
    qualityScore: 99,
    speedScore: 80,
    memoryScore: 90,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["certificate-converter"],
  },

  // ── OCR extras ─────────────────────────────────────────────────────────────

  {
    id: "PaddleOCRProvider",
    name: "PaddleOCR Server Provider",
    libraryId: "paddleocr",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["png", "jpg", "jpeg", "bmp", "tiff"],
    outputFormats: ["txt", "json", "pdf"],
    qualityScore: 95,
    speedScore: 65,
    memoryScore: 50,
    maxFileSizeBytes: 100 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["ocr-processor"],
  },
  {
    id: "AzureOCRProvider",
    name: "Azure Computer Vision Provider",
    libraryId: "azure-ocr",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["png", "jpg", "jpeg", "bmp", "tiff", "pdf"],
    outputFormats: ["txt", "json"],
    qualityScore: 96,
    speedScore: 75,
    memoryScore: 100,
    maxFileSizeBytes: 50 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["ocr-processor"],
  },

  // ── Vector ─────────────────────────────────────────────────────────────────

  {
    id: "SVGOProvider",
    name: "SVGO Provider",
    libraryId: "svgo",
    browserCompatible: true,
    serverRequired: false,
    requiresPremium: false,
    inputFormats: ["svg"],
    outputFormats: ["svg"],
    qualityScore: 90,
    speedScore: 90,
    memoryScore: 95,
    maxFileSizeBytes: 10 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["svg-optimizer"],
  },
  {
    id: "InkscapeProvider",
    name: "Inkscape Server Provider",
    libraryId: "inkscape",
    browserCompatible: false,
    serverRequired: true,
    requiresPremium: true,
    inputFormats: ["svg", "ai", "eps", "wmf", "emf"],
    outputFormats: ["png", "pdf", "svg", "eps"],
    qualityScore: 96,
    speedScore: 55,
    memoryScore: 55,
    maxFileSizeBytes: 200 * 1024 * 1024,
    requiresWasmInit: false,
    processorIds: ["vector-converter", "svg-converter"],
  },
];

// Build a fast lookup by provider ID
const PROVIDER_META_MAP = new Map<string, ProviderMeta>(
  PROVIDER_META_TABLE.map(p => [p.id, p])
);

// ---------------------------------------------------------------------------
// SCORING HELPERS
// ---------------------------------------------------------------------------

/**
 * Compute a composite score: weighted blend of quality, speed, and memory.
 * Weights default to an equal mix unless overridden by request preferences.
 */
function computeCompositeScore(
  meta: ProviderMeta,
  preferSpeed: boolean,
  preferLowMemory: boolean
): number {
  const wQuality = 0.5;
  const wSpeed   = preferSpeed      ? 0.35 : 0.25;
  const wMemory  = preferLowMemory  ? 0.35 : 0.25;

  // normalise so weights always sum to 1
  const total = wQuality + wSpeed + wMemory;

  return (
    (meta.qualityScore * wQuality +
     meta.speedScore   * wSpeed   +
     meta.memoryScore  * wMemory) / total
  );
}

// ---------------------------------------------------------------------------
// SELECTION ENGINE CLASS
// ---------------------------------------------------------------------------

export class ProviderSelectionEngine {

  /**
   * Evaluate all known providers for a given conversion request and return
   * a fully ordered SelectionResult — all logic is metadata-driven.
   */
  select(request: SelectionRequest): SelectionResult {

    // 0. Handle explicit override
    if (request.providerOverride) {
      const meta = PROVIDER_META_MAP.get(request.providerOverride);
      if (meta) {
        const candidate = this.buildCandidate(meta, request);
        return {
          request,
          candidates: [candidate],
          selected: candidate,
          fallbackChain: [],
          requiresWasmInit: candidate.requiresWasmInit ?? false,
          isOperationSupported: true,
          selectionReason: `Explicit override: ${request.providerOverride}`,
        };
      }
    }

    // 1. Collect all providers that can handle this format pair
    const allCandidates = this.buildCandidates(request);

    // 2. Sort by composite score (descending)
    const sorted = [...allCandidates].sort((a, b) => b.compositeScore - a.compositeScore);

    // 3. Separate viable from rejected
    const viable = sorted.filter(c => !c.rejectionReason);
    const rejected = sorted.filter(c => c.rejectionReason);

    const selected = viable[0] ?? null;
    const fallbackChain = viable.slice(1);

    const requiresWasmInit = selected
      ? (PROVIDER_META_MAP.get(selected.providerId)?.requiresWasmInit ?? false)
      : false;

    return {
      request,
      candidates: [...sorted, ...rejected],
      selected,
      fallbackChain,
      requiresWasmInit,
      isOperationSupported: selected !== null,
      selectionReason: selected
        ? this.buildReason(selected, request)
        : `No provider available for ${request.inputExt} → ${request.outputExt}`,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private buildCandidates(request: SelectionRequest): ProviderCandidate[] {
    return PROVIDER_META_TABLE.map(meta => this.buildCandidate(meta, request));
  }

  private buildCandidate(
    meta: ProviderMeta,
    request: SelectionRequest
  ): ProviderCandidate {

    const compositeScore = computeCompositeScore(
      meta,
      request.preferSpeed    ?? false,
      request.preferLowMemory ?? false
    );

    const candidate: ProviderCandidate = {
      providerId: meta.id,
      providerName: meta.name,
      libraryId: meta.libraryId,
      browserCompatible: meta.browserCompatible,
      serverRequired: meta.serverRequired,
      requiresPremium: meta.requiresPremium,
      qualityScore: meta.qualityScore,
      speedScore: meta.speedScore,
      memoryScore: meta.memoryScore,
      compositeScore,
      maxFileSizeBytes: meta.maxFileSizeBytes,
    };

    // Check: does this provider handle the format pair?
    const handlesInput  = meta.inputFormats.includes(request.inputExt);
    const handlesOutput = meta.outputFormats.includes(request.outputExt);
    if (!handlesInput || !handlesOutput) {
      candidate.rejectionReason = `Format pair ${request.inputExt}→${request.outputExt} not supported`;
      return candidate;
    }

    // Check: runtime environment compatibility
    if (request.runtimeEnv === 'browser' && meta.serverRequired) {
      candidate.rejectionReason = 'Server-only provider; browser environment requested';
      return candidate;
    }
    if (request.runtimeEnv === 'server' && !meta.browserCompatible && !meta.serverRequired) {
      candidate.rejectionReason = 'Browser-only provider; server environment requested';
      return candidate;
    }

    // Check: file size limit
    if (
      meta.maxFileSizeBytes > 0 &&
      request.fileSizeBytes > meta.maxFileSizeBytes
    ) {
      const mb = (meta.maxFileSizeBytes / (1024 * 1024)).toFixed(0);
      candidate.rejectionReason = `File exceeds provider limit (${mb} MB)`;
      return candidate;
    }

    // Check: premium tier
    if (meta.requiresPremium && request.userTier === 'free') {
      candidate.rejectionReason = 'Premium subscription required';
      return candidate;
    }

    // Candidate is viable — attach WASM init flag from meta
    candidate.requiresWasmInit = meta.requiresWasmInit;
    return candidate;
  }

  private buildReason(
    selected: ProviderCandidate,
    request: SelectionRequest
  ): string {
    const lib = libraryRegistry.get(selected.libraryId);
    const libName = lib?.name ?? selected.libraryId;

    if (selected.browserCompatible && !selected.serverRequired) {
      return `Client-side processing via ${libName} (score: ${selected.compositeScore.toFixed(1)})`;
    }
    if (selected.serverRequired) {
      return `Server-side processing via ${libName} (score: ${selected.compositeScore.toFixed(1)})`;
    }
    return `Processing via ${libName}`;
  }

  // ── Convenience helpers ────────────────────────────────────────────────────

  /** Quick check: is a conversion supported at all (any tier)? */
  isSupported(inputExt: string, outputExt: string): boolean {
    return PROVIDER_META_TABLE.some(
      m =>
        m.inputFormats.includes(inputExt) &&
        m.outputFormats.includes(outputExt)
    );
  }

  /** List all providers that support a conversion pair */
  providersForPair(
    inputExt: string,
    outputExt: string
  ): ProviderMeta[] {
    return PROVIDER_META_TABLE.filter(
      m =>
        m.inputFormats.includes(inputExt) &&
        m.outputFormats.includes(outputExt)
    );
  }

  /** All registered provider IDs */
  get allProviderIds(): string[] {
    return PROVIDER_META_TABLE.map(p => p.id);
  }

  /** Count of registered providers */
  get providerCount(): number {
    return PROVIDER_META_TABLE.length;
  }
}

export const providerSelectionEngine = new ProviderSelectionEngine();
