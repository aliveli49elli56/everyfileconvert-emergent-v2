/**
 * lib/engine/capability-matrix.ts
 *
 * Browser Capability Matrix — Phase 6B Part 2
 *
 * Maps every processor operation to its browser support status.
 * The Provider Selection Engine consults this matrix to decide whether
 * a browser provider, server provider, or no provider is appropriate.
 *
 * Rules:
 *  - This file contains NO business logic.
 *  - All statuses are metadata declarations.
 *  - Unsupported browser operations are declared here, not hidden in code.
 *  - Provider Selection Engine reads from this matrix; never hardcodes.
 *  - When a new processor is added to processor-registry.ts, a corresponding
 *    entry MUST be added here.
 *
 * Status Definitions:
 *   browser-supported   - Full browser implementation available
 *   partial             - Subset of operations work in browser; remainder needs server
 *   experimental        - Browser implementation exists but unstable/limited
 *   server-only         - Cannot run in browser; server required
 *   future              - Planned but not yet implemented anywhere
 *   unsupported         - No current implementation (browser or server)
 */

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ProcessorBrowserStatus =
  | 'browser-supported'
  | 'partial'
  | 'experimental'
  | 'server-only'
  | 'future'
  | 'unsupported';

export interface ProcessorCapabilityEntry {
  /** Processor ID matching ProcessorDefinition.id */
  processorId: string;
  /** Browser support status */
  browserStatus: ProcessorBrowserStatus;
  /** Server support status */
  serverStatus: ProcessorBrowserStatus;
  /**
   * Brief note about the limitation or implementation detail.
   * Shown in developer tools / debug mode.
   */
  note?: string;
  /**
   * Provider IDs that implement this processor in the browser.
   * Empty if browserStatus is server-only / unsupported.
   */
  browserProviderIds: string[];
  /**
   * Provider IDs that implement this processor on the server.
   * Empty if serverStatus is unsupported / future.
   */
  serverProviderIds: string[];
}

// ---------------------------------------------------------------------------
// BROWSER CAPABILITY MATRIX
// ---------------------------------------------------------------------------

export const BROWSER_CAPABILITY_MATRIX: ProcessorCapabilityEntry[] = [

  // ── Image ─────────────────────────────────────────────────────────────────

  {
    processorId: 'image:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas API handles common raster formats; HEIC/RAW require server',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider', 'CloudinaryProvider'],
  },
  {
    processorId: 'image:resize',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas API supports all standard resize operations',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:crop',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:rotate',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:flip',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:compress',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas toBlob() provides quality control for JPEG/WebP',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:watermark',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:metadata-remove',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas re-encode strips EXIF metadata',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:background-remove',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: threshold-based alpha; Server: ML model for precise results',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['RemoveBgProvider'],
  },
  {
    processorId: 'image:upscale',
    browserStatus: 'experimental',
    serverStatus: 'browser-supported',
    note: 'Browser: Canvas interpolation only; Server: ML upscaler',
    browserProviderIds: ['CanvasImageProvider'],
    serverProviderIds: ['SharpImageProvider'],
  },
  {
    processorId: 'image:ocr',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Tesseract.js (WASM) for browser; PaddleOCR / Google Vision for server',
    browserProviderIds: ['TesseractProvider'],
    serverProviderIds: ['GoogleVisionProvider', 'PaddleOCRProvider'],
  },

  // ── RAW ───────────────────────────────────────────────────────────────────

  {
    processorId: 'raw:develop',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'LibRaw requires native binary; no browser WASM port available',
    browserProviderIds: [],
    serverProviderIds: ['RawImageProvider'],
  },
  {
    processorId: 'raw:convert',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'LibRaw requires native binary',
    browserProviderIds: [],
    serverProviderIds: ['RawImageProvider'],
  },

  // ── Vector ────────────────────────────────────────────────────────────────

  {
    processorId: 'vector:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: SVG→PNG via Canvas rasterize; AI/EPS require server Inkscape',
    browserProviderIds: ['SVGOProvider'],
    serverProviderIds: ['InkscapeProvider'],
  },
  {
    processorId: 'vector:optimize',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'SVGO runs fully in browser',
    browserProviderIds: ['SVGOProvider'],
    serverProviderIds: ['InkscapeProvider'],
  },
  {
    processorId: 'vector:rasterize',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas drawImage() handles SVG rasterization',
    browserProviderIds: ['SVGOProvider'],
    serverProviderIds: ['InkscapeProvider'],
  },

  // ── Video ──────────────────────────────────────────────────────────────────

  {
    processorId: 'video:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'FFmpeg.wasm handles common formats; large files (>500 MB) require server',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:compress',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:trim',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:merge',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:extract-audio',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:gif',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:crop',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:rotate',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:reverse',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: memory-limited to ~200 MB; large files need server',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'video:subtitle',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },

  // ── Audio ──────────────────────────────────────────────────────────────────

  {
    processorId: 'audio:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider', 'WebAudioProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:trim',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:normalize',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:merge',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:pitch',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: FFmpeg.wasm atempo filter only; full pitch-shift needs server',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:speed',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:volume',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },
  {
    processorId: 'audio:compress',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['FFmpegWasmProvider'],
    serverProviderIds: ['FFmpegServerProvider'],
  },

  // ── PDF ────────────────────────────────────────────────────────────────────

  {
    processorId: 'pdf:merge',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:split',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:compress',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: limited stream recompression; full optimization requires server',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:protect',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'pdf-lib supports AES-256 encryption in browser',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:unlock',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser can decrypt if password is known; brute-force needs server',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:rotate',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:watermark',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:page-numbers',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['PDFLibProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:to-image',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'PDF.js renders pages to Canvas for export',
    browserProviderIds: ['PDFJSProvider'],
    serverProviderIds: ['GhostscriptProvider'],
  },
  {
    processorId: 'pdf:ocr',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['TesseractProvider', 'PDFJSProvider'],
    serverProviderIds: ['GhostscriptProvider', 'GoogleVisionProvider'],
  },

  // ── Document ───────────────────────────────────────────────────────────────

  {
    processorId: 'doc:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: DOCX→HTML/text via Mammoth; DOC/ODT/RTF require server LibreOffice',
    browserProviderIds: ['MammothProvider', 'BrowserDocumentProvider'],
    serverProviderIds: ['LibreOfficeProvider', 'AsposeWordsProvider'],
  },
  {
    processorId: 'doc:to-pdf',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: HTML intermediate via Mammoth + html2canvas; quality limited',
    browserProviderIds: ['BrowserDocumentProvider'],
    serverProviderIds: ['LibreOfficeProvider', 'AsposeWordsProvider'],
  },
  {
    processorId: 'doc:to-text',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Mammoth handles DOCX text extraction cleanly',
    browserProviderIds: ['BrowserDocumentProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'doc:extract-images',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'DOCX images extractable via zip parsing; embedded image quality varies',
    browserProviderIds: ['BrowserDocumentProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },

  // ── Spreadsheet ────────────────────────────────────────────────────────────

  {
    processorId: 'spreadsheet:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'SheetJS handles all common spreadsheet formats in browser',
    browserProviderIds: ['SheetJSProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'spreadsheet:to-pdf',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: HTML→canvas→PDF; layout fidelity limited',
    browserProviderIds: ['SheetJSProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'spreadsheet:merge',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['SheetJSProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'spreadsheet:to-json',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['SheetJSProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'spreadsheet:filter',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['SheetJSProvider'],
    serverProviderIds: ['LibreOfficeProvider'],
  },

  // ── Presentation ───────────────────────────────────────────────────────────

  {
    processorId: 'presentation:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: PPTX→HTML via pptx2html; full fidelity requires server',
    browserProviderIds: [],
    serverProviderIds: ['LibreOfficeProvider', 'AsposeWordsProvider'],
  },
  {
    processorId: 'presentation:to-pdf',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'Reliable slide→PDF conversion requires LibreOffice server',
    browserProviderIds: [],
    serverProviderIds: ['LibreOfficeProvider'],
  },
  {
    processorId: 'presentation:extract-images',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'PPTX slide images extractable via zip parsing with pptx2html',
    browserProviderIds: [],
    serverProviderIds: ['LibreOfficeProvider'],
  },

  // ── Ebook ──────────────────────────────────────────────────────────────────

  {
    processorId: 'ebook:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: EPUB read/metadata/text extraction; format conversion needs server',
    browserProviderIds: ['BrowserEbookProvider'],
    serverProviderIds: ['CalibreProvider'],
  },
  {
    processorId: 'ebook:extract-images',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'EPUB images listed via epubjs; extraction via JSZip',
    browserProviderIds: ['BrowserEbookProvider'],
    serverProviderIds: ['CalibreProvider'],
  },

  // ── Archive ────────────────────────────────────────────────────────────────

  {
    processorId: 'archive:compress',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: ZIP creation via JSZip; 7z/TAR/GZ create need server or 7zip-wasm (future)',
    browserProviderIds: ['BrowserArchiveProvider', 'JSZipProvider'],
    serverProviderIds: ['LibarchiveProvider'],
  },
  {
    processorId: 'archive:extract',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: ZIP/RAR extract supported; 7z/TAR/XZ future via 7zip-wasm',
    browserProviderIds: ['BrowserArchiveProvider', 'JSZipProvider', 'UnrarProvider'],
    serverProviderIds: ['LibarchiveProvider'],
  },
  {
    processorId: 'archive:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: re-zip only (extract + re-compress); direct archive conversion needs server',
    browserProviderIds: ['BrowserArchiveProvider'],
    serverProviderIds: ['LibarchiveProvider'],
  },
  {
    processorId: 'archive:list',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: ZIP/RAR listing supported; 7z listing future',
    browserProviderIds: ['BrowserArchiveProvider', 'JSZipProvider'],
    serverProviderIds: ['LibarchiveProvider'],
  },

  // ── Font ───────────────────────────────────────────────────────────────────

  {
    processorId: 'font:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: TTF/OTF→SVG paths via opentype.js; WOFF2 encoding needs server',
    browserProviderIds: ['BrowserFontProvider', 'OpenTypeProvider'],
    serverProviderIds: ['FontkitProvider'],
  },
  {
    processorId: 'font:subset',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: opentype.js glyphset subsetting; full Unicode subsetting needs server',
    browserProviderIds: ['BrowserFontProvider'],
    serverProviderIds: ['FontkitProvider'],
  },
  {
    processorId: 'font:preview',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Canvas rendering of font glyphs fully supported in browser',
    browserProviderIds: ['BrowserFontProvider'],
    serverProviderIds: ['FontkitProvider'],
  },
  {
    processorId: 'font:metadata',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'opentype.js reads name tables for all common font formats',
    browserProviderIds: ['BrowserFontProvider'],
    serverProviderIds: ['FontkitProvider'],
  },

  // ── GIS ────────────────────────────────────────────────────────────────────

  {
    processorId: 'gis:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: GeoJSON/TopoJSON via Turf.js; SHP/KML require server GDAL',
    browserProviderIds: ['TurfProvider'],
    serverProviderIds: ['GDALProvider'],
  },
  {
    processorId: 'gis:project',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: proj4js handles common projections; complex CRS need server',
    browserProviderIds: ['TurfProvider'],
    serverProviderIds: ['GDALProvider'],
  },
  {
    processorId: 'gis:simplify',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Turf.js simplify runs fully in browser',
    browserProviderIds: ['TurfProvider'],
    serverProviderIds: ['GDALProvider'],
  },

  // ── Webpage ────────────────────────────────────────────────────────────────

  {
    processorId: 'webpage:to-pdf',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: HTML files only via html2canvas+pdf-lib; URL→PDF requires server Puppeteer',
    browserProviderIds: ['BrowserWebpageProvider', 'Html2CanvasProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },
  {
    processorId: 'webpage:screenshot',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: HTML files via html2canvas; URLs restricted by CORS',
    browserProviderIds: ['BrowserWebpageProvider', 'Html2CanvasProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },
  {
    processorId: 'webpage:full-screenshot',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: html2canvas full-page mode; URL screenshots need server',
    browserProviderIds: ['BrowserWebpageProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },
  {
    processorId: 'webpage:to-text',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'DOMParser textContent extraction fully browser-compatible',
    browserProviderIds: ['BrowserWebpageProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },
  {
    processorId: 'webpage:to-markdown',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'DOMParser + inline HTML→Markdown conversion; no external library needed',
    browserProviderIds: ['BrowserWebpageProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },
  {
    processorId: 'webpage:to-image',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: HTML files only; URL screenshots blocked by CORS',
    browserProviderIds: ['BrowserWebpageProvider', 'Html2CanvasProvider'],
    serverProviderIds: ['PuppeteerProvider'],
  },

  // ── Subtitle ───────────────────────────────────────────────────────────────

  {
    processorId: 'subtitle:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Pure text/regex parsing; all subtitle formats fully browser-compatible',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'subtitle:sync',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'subtitle:translate',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'Translation requires external AI/NMT service; server proxy needed',
    browserProviderIds: [],
    serverProviderIds: [],
  },

  // ── Certificate ────────────────────────────────────────────────────────────

  {
    processorId: 'certificate:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'node-forge handles PEM/DER/PKCS12 conversion in browser',
    browserProviderIds: ['NodeForgeProvider'],
    serverProviderIds: ['OpenSSLProvider'],
  },
  {
    processorId: 'certificate:inspect',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['NodeForgeProvider'],
    serverProviderIds: ['OpenSSLProvider'],
  },
  {
    processorId: 'certificate:extract-key',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: public key extraction safe; private key extraction requires caution',
    browserProviderIds: ['NodeForgeProvider'],
    serverProviderIds: ['OpenSSLProvider'],
  },

  // ── 3D ─────────────────────────────────────────────────────────────────────

  {
    processorId: '3d:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: Three.js handles GLB/GLTF/OBJ; FBX/BLEND require server Assimp',
    browserProviderIds: ['ThreeJSProvider'],
    serverProviderIds: ['AssimpProvider'],
  },
  {
    processorId: '3d:compress',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: meshoptimizer via Three.js; full Draco compression needs server',
    browserProviderIds: ['ThreeJSProvider'],
    serverProviderIds: ['AssimpProvider'],
  },
  {
    processorId: '3d:optimize',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    browserProviderIds: ['ThreeJSProvider'],
    serverProviderIds: ['AssimpProvider'],
  },
  {
    processorId: '3d:preview',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Three.js WebGL rendering is the primary preview implementation',
    browserProviderIds: ['ThreeJSProvider'],
    serverProviderIds: [],
  },

  // ── CAD ────────────────────────────────────────────────────────────────────

  {
    processorId: 'cad:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: DXF parsing via dxf package; STEP/IGES require OpenCascade WASM',
    browserProviderIds: ['OpenCascadeProvider'],
    serverProviderIds: [],
  },
  {
    processorId: 'cad:to-pdf',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'DWG/DXF→PDF requires CAD kernel; no browser implementation available',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'cad:preview',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: DXF preview via dxf library; DWG requires server',
    browserProviderIds: ['OpenCascadeProvider'],
    serverProviderIds: [],
  },

  // ── OCR ────────────────────────────────────────────────────────────────────

  {
    processorId: 'ocr:recognize',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['TesseractProvider'],
    serverProviderIds: ['GoogleVisionProvider', 'PaddleOCRProvider', 'AzureOCRProvider'],
  },
  {
    processorId: 'ocr:pdf-to-text',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: ['TesseractProvider', 'PDFJSProvider'],
    serverProviderIds: ['GoogleVisionProvider'],
  },

  // ── Email ──────────────────────────────────────────────────────────────────

  {
    processorId: 'email:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: EML text parsing; MSG format requires server-side MIME library',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'email:extract',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'EML attachment extraction possible in browser; MSG needs server',
    browserProviderIds: [],
    serverProviderIds: [],
  },

  // ── Code / Data ────────────────────────────────────────────────────────────

  {
    processorId: 'code:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'JSON/YAML/TOML/XML conversion via pure JS parsers',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'code:format',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'Prettier WASM handles formatting in browser',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'code:minify',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    browserProviderIds: [],
    serverProviderIds: [],
  },

  // ── Scientific ─────────────────────────────────────────────────────────────

  {
    processorId: 'scientific:convert',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: CSV/JSON via danfo.js; HDF5/MAT/NetCDF require server',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'scientific:visualize',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser charts via Recharts/d3; large datasets need server preprocessing',
    browserProviderIds: [],
    serverProviderIds: [],
  },

  // ── Medical ────────────────────────────────────────────────────────────────

  {
    processorId: 'medical:convert',
    browserStatus: 'browser-supported',
    serverStatus: 'browser-supported',
    note: 'dcmjs handles DICOM in browser',
    browserProviderIds: ['DCMJSProvider'],
    serverProviderIds: [],
  },
  {
    processorId: 'medical:anonymize',
    browserStatus: 'partial',
    serverStatus: 'browser-supported',
    note: 'Browser: dcmjs tag removal; full de-identification audit requires server',
    browserProviderIds: ['DCMJSProvider'],
    serverProviderIds: [],
  },

  // ── Disk Image ─────────────────────────────────────────────────────────────

  {
    processorId: 'disk:convert',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'Disk image conversion requires native tools (qemu-img, VBoxManage)',
    browserProviderIds: [],
    serverProviderIds: [],
  },
  {
    processorId: 'disk:extract',
    browserStatus: 'server-only',
    serverStatus: 'browser-supported',
    note: 'Filesystem mounting requires kernel privileges; browser-only extraction impossible',
    browserProviderIds: [],
    serverProviderIds: [],
  },
];

// ---------------------------------------------------------------------------
// INDEXED LOOKUP — O(1) access by processorId
// ---------------------------------------------------------------------------

const CAPABILITY_INDEX = new Map<string, ProcessorCapabilityEntry>(
  BROWSER_CAPABILITY_MATRIX.map(e => [e.processorId, e])
);

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Get the capability entry for a specific processor.
 * Returns undefined if the processor is not in the matrix.
 */
export function getProcessorCapability(
  processorId: string
): ProcessorCapabilityEntry | undefined {
  return CAPABILITY_INDEX.get(processorId);
}

/**
 * Returns true if the processor can be handled in the browser at all
 * (browser-supported or partial).
 */
export function isBrowserCapable(processorId: string): boolean {
  const entry = CAPABILITY_INDEX.get(processorId);
  if (!entry) return false;
  return (
    entry.browserStatus === 'browser-supported' ||
    entry.browserStatus === 'partial' ||
    entry.browserStatus === 'experimental'
  );
}

/**
 * Returns all processors that have a specific browser status.
 */
export function getProcessorsByStatus(
  status: ProcessorBrowserStatus
): ProcessorCapabilityEntry[] {
  return BROWSER_CAPABILITY_MATRIX.filter(e => e.browserStatus === status);
}

/**
 * Returns summary statistics for the capability matrix.
 */
export function getCapabilityMatrixSummary(): {
  total: number;
  browserSupported: number;
  partial: number;
  experimental: number;
  serverOnly: number;
  future: number;
  unsupported: number;
} {
  const counts = {
    total: BROWSER_CAPABILITY_MATRIX.length,
    browserSupported: 0,
    partial: 0,
    experimental: 0,
    serverOnly: 0,
    future: 0,
    unsupported: 0,
  };
  for (const entry of BROWSER_CAPABILITY_MATRIX) {
    switch (entry.browserStatus) {
      case 'browser-supported': counts.browserSupported++; break;
      case 'partial': counts.partial++; break;
      case 'experimental': counts.experimental++; break;
      case 'server-only': counts.serverOnly++; break;
      case 'future': counts.future++; break;
      case 'unsupported': counts.unsupported++; break;
    }
  }
  return counts;
}
