/**
 * lib/providers/document-provider.ts
 *
 * Phase 6B Part 2 — Browser IDocumentProvider implementation.
 *
 * Libraries used (all lazy-loaded):
 *   - mammoth      : DOCX → HTML / plain text
 *   - xlsx         : Spreadsheet-format document reading
 *   - jszip        : DOCX image extraction (DOCX is a ZIP)
 *
 * Browser limitations declared via canHandle():
 *   - DOC (legacy binary) : server-only
 *   - ODT / RTF           : server-only (no pure-JS parser)
 *   - DOCX → PDF          : partial (html2canvas bridge, layout imperfect)
 */

import type {
  IDocumentProvider,
  ProviderInfo,
  ProviderCapabilityCheck,
  BaseProcessingOptions,
} from '../types/provider-interfaces';
import type { ConversionResult } from '../types/conversion';
import { formatRegistry } from '../registry/format-registry';
import { providerLifecycleRegistry } from '../core/browser-arch';

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserDocumentProvider',
  name: 'Browser Document Provider',
  version: '6.2.0',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

/** Formats fully supported in browser */
const BROWSER_INPUT_FORMATS = ['docx', 'xlsx', 'xls', 'csv', 'txt', 'md', 'html', 'htm'];
/** Formats requiring server */
const SERVER_ONLY_FORMATS  = ['doc', 'odt', 'rtf', 'pages', 'wpd', 'abw'];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fail(msg: string): ConversionResult {
  return { success: false, error: msg, errorCode: 'CONVERSION_FAILED' };
}

function textBlob(text: string, filename: string): ConversionResult {
  return {
    success: true,
    blob: new Blob([text], { type: 'text/plain' }),
    filename,
    mimeType: 'text/plain',
  };
}

function htmlBlob(html: string, filename: string): ConversionResult {
  return {
    success: true,
    blob: new Blob([html], { type: 'text/html' }),
    filename,
    mimeType: 'text/html',
  };
}

function outputFilename(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

// ---------------------------------------------------------------------------
// DOCUMENT PROVIDER
// ---------------------------------------------------------------------------

export class BrowserDocumentProvider implements IDocumentProvider {
  readonly info: ProviderInfo = PROVIDER_INFO;
  private _ready = false;

  async initialize(): Promise<boolean> {
    this._ready = typeof window !== 'undefined';
    if (this._ready) {
      providerLifecycleRegistry.markReady(this.info.id);
    } else {
      providerLifecycleRegistry.markError(this.info.id, new Error('DOM unavailable'));
    }
    return this._ready;
  }

  isReady(): boolean { return this._ready; }

  async canHandle(input: File | string, targetFormat: string): Promise<ProviderCapabilityCheck> {
    const ext = typeof input === 'string'
      ? input.toLowerCase()
      : (input as File).name.split('.').pop()?.toLowerCase() ?? '';

    if (SERVER_ONLY_FORMATS.includes(ext)) {
      return { supported: false, reason: `${ext.toUpperCase()} conversion requires server`, requiresServer: true };
    }
    if (!BROWSER_INPUT_FORMATS.includes(ext)) {
      const fmt = formatRegistry.get(ext);
      if (!fmt || fmt.category !== 'document') {
        return { supported: false, reason: `Unsupported document format: ${ext}` };
      }
    }
    return { supported: true };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IDocumentProvider methods ─────────────────────────────────────────────

  async convert(file: File, targetFormat: string, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const target = targetFormat.toLowerCase();

    // DOCX → HTML | text | markdown
    if (ext === 'docx') {
      if (target === 'html' || target === 'htm') {
        return this._docxToHtml(file);
      }
      if (target === 'txt' || target === 'text' || target === 'md') {
        return this._docxToText(file);
      }
      if (target === 'pdf') {
        return this.toPdf(file);
      }
    }

    // Spreadsheet-like documents → text
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      if (target === 'csv') return this._spreadsheetToCsv(file);
      if (target === 'txt' || target === 'text') return this._spreadsheetToText(file);
      if (target === 'json') {
        const rows = await this._spreadsheetToRows(file);
        return {
          success: true,
          blob: new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
          filename: outputFilename(file.name, 'json'),
          mimeType: 'application/json',
        };
      }
    }

    // HTML/markdown pass-through or simple text extraction
    if (['html', 'htm'].includes(ext)) {
      if (target === 'txt' || target === 'text') return this.toText(file);
      if (target === 'md') return this._htmlToMarkdown(file);
    }

    return fail(`Conversion from ${ext} to ${target} not supported in browser`);
  }

  async toPdf(file: File, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    try {
      // DOCX → HTML → canvas → PDF
      const htmlResult = await this._docxToHtml(file);
      if (!htmlResult.success || !htmlResult.blob) {
        return fail('Could not extract HTML from document for PDF conversion');
      }
      const htmlText = await htmlResult.blob.text();
      const { PDFDocument, StandardFonts, rgb } = await import(/* webpackChunkName: "pdf-lib" */ 'pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      // Render plain text version into PDF (layout-limited browser implementation)
      const text = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const lines = text.match(/.{1,90}/g) ?? [];
      let y = 820;
      for (const line of lines) {
        if (y < 40) { pdfDoc.addPage([595, 842]); y = 820; }
        page.drawText(line, { x: 40, y, size: 11, font, color: rgb(0, 0, 0) });
        y -= 16;
      }
      const pdfBytes = await pdfDoc.save();
      return {
        success: true,
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename: outputFilename(file.name, 'pdf'),
        mimeType: 'application/pdf',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'PDF conversion failed');
    }
  }

  async toText(file: File, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'docx') return this._docxToText(file);
    if (['html', 'htm'].includes(ext)) {
      const text = await file.text();
      const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return textBlob(plain, outputFilename(file.name, 'txt'));
    }
    // Default: read as text
    try {
      const text = await file.text();
      return textBlob(text, outputFilename(file.name, 'txt'));
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'Text extraction failed');
    }
  }

  async extractImages(file: File, _options?: BaseProcessingOptions): Promise<ConversionResult[]> {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (ext !== 'docx') return [];

      // DOCX is a ZIP — extract images from word/media/
      const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const results: ConversionResult[] = [];
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!path.startsWith('word/media/') || zipEntry.dir) continue;
        const buffer = await zipEntry.async('arraybuffer');
        const ext2 = path.split('.').pop()?.toLowerCase() ?? 'bin';
        const mime = ext2 === 'jpg' ? 'image/jpeg' : `image/${ext2}`;
        results.push({
          success: true,
          blob: new Blob([buffer], { type: mime }),
          filename: path.split('/').pop()!,
          mimeType: mime,
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  async getWordCount(file: File): Promise<number> {
    try {
      const result = await this._docxToText(file);
      if (!result.success || !result.blob) return 0;
      const text = await result.blob.text();
      return text.trim().split(/\s+/).filter(Boolean).length;
    } catch {
      return 0;
    }
  }

  async getMetadata(file: File): Promise<Record<string, unknown>> {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (ext === 'docx') {
        const mammoth = await import(/* webpackChunkName: "mammoth" */ 'mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const wordCount = result.value.trim().split(/\s+/).filter(Boolean).length;
        return { filename: file.name, size: file.size, wordCount, format: 'docx' };
      }
      return { filename: file.name, size: file.size, format: ext };
    } catch {
      return { filename: file.name, size: file.size };
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _docxToHtml(file: File): Promise<ConversionResult> {
    try {
      const mammoth = await import(/* webpackChunkName: "mammoth" */ 'mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return htmlBlob(result.value, outputFilename(file.name, 'html'));
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'DOCX→HTML conversion failed');
    }
  }

  private async _docxToText(file: File): Promise<ConversionResult> {
    try {
      const mammoth = await import(/* webpackChunkName: "mammoth" */ 'mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return textBlob(result.value, outputFilename(file.name, 'txt'));
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'DOCX→text conversion failed');
    }
  }

  private async _spreadsheetToCsv(file: File): Promise<ConversionResult> {
    try {
      const XLSX = await import(/* webpackChunkName: "sheetjs" */ 'xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      return {
        success: true,
        blob: new Blob([csv], { type: 'text/csv' }),
        filename: outputFilename(file.name, 'csv'),
        mimeType: 'text/csv',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'CSV conversion failed');
    }
  }

  private async _spreadsheetToText(file: File): Promise<ConversionResult> {
    const csv = await this._spreadsheetToCsv(file);
    if (!csv.success || !csv.blob) return csv;
    const text = await csv.blob.text();
    return textBlob(text, outputFilename(file.name, 'txt'));
  }

  private async _spreadsheetToRows(file: File): Promise<Record<string, unknown>[]> {
    const XLSX = await import(/* webpackChunkName: "sheetjs" */ 'xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, unknown>[];
  }

  private async _htmlToMarkdown(file: File): Promise<ConversionResult> {
    const html = await file.text();
    // Simple inline HTML→Markdown (no external library required)
    const md = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    return {
      success: true,
      blob: new Blob([md], { type: 'text/markdown' }),
      filename: outputFilename(file.name, 'md'),
      mimeType: 'text/markdown',
    };
  }
}

export const browserDocumentProvider = new BrowserDocumentProvider();
