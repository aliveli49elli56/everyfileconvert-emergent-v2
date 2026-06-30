/**
 * lib/providers/ebook-provider.ts
 *
 * Phase 6B Part 2 — Browser IEbookProvider implementation.
 *
 * Libraries used (all lazy-loaded):
 *   - epubjs  : EPUB parsing, metadata, text extraction, resource listing
 *   - jszip   : EPUB image extraction (EPUB is a ZIP)
 *
 * Browser limitations declared via canHandle():
 *   - MOBI/AZW/AZW3 : server-only (proprietary format, no open browser parser)
 *   - FB2           : partial (XML-based, parseable in browser)
 *   - DJVU          : server-only
 *   - Full format conversion (EPUB→MOBI etc.) : server-only (requires Calibre)
 */

import type {
  IEbookProvider,
  ProviderInfo,
  ProviderCapabilityCheck,
  EbookConvertOptions,
  BaseProcessingOptions,
} from '../types/provider-interfaces';
import type { ConversionResult } from '../types/conversion';
import { providerLifecycleRegistry } from '../core/browser-arch';

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserEbookProvider',
  name: 'Browser Ebook Provider',
  version: '6.2.0',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

const BROWSER_INPUT_FORMATS  = ['epub', 'fb2', 'html', 'htm', 'txt'];
const SERVER_ONLY_FORMATS    = ['mobi', 'azw', 'azw3', 'lit', 'lrf', 'pdb', 'djvu'];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fail(msg: string): ConversionResult {
  return { success: false, error: msg, errorCode: 'CONVERSION_FAILED' };
}

function outputFilename(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

// ---------------------------------------------------------------------------
// EBOOK PROVIDER
// ---------------------------------------------------------------------------

export class BrowserEbookProvider implements IEbookProvider {
  readonly info: ProviderInfo = PROVIDER_INFO;
  private _ready = false;

  async initialize(): Promise<boolean> {
    this._ready = typeof window !== 'undefined';
    if (this._ready) {
      providerLifecycleRegistry.markReady(this.info.id);
    }
    return this._ready;
  }

  isReady(): boolean { return this._ready; }

  async canHandle(input: File | string, _targetFormat: string): Promise<ProviderCapabilityCheck> {
    const ext = typeof input === 'string'
      ? input.toLowerCase()
      : (input as File).name.split('.').pop()?.toLowerCase() ?? '';

    if (SERVER_ONLY_FORMATS.includes(ext)) {
      return {
        supported: false,
        reason: `${ext.toUpperCase()} ebook format requires server processing (Calibre). No browser parser available.`,
        requiresServer: true,
      };
    }
    if (!BROWSER_INPUT_FORMATS.includes(ext)) {
      return { supported: false, reason: `Unsupported ebook format: ${ext}` };
    }
    return { supported: true };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IEbookProvider methods ─────────────────────────────────────────────────

  async convert(file: File, options: EbookConvertOptions): Promise<ConversionResult> {
    const srcExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const target = options.targetFormat.toLowerCase();

    // EPUB → text (text extraction)
    if (srcExt === 'epub' && (target === 'txt' || target === 'text')) {
      const text = await this.extractText(file);
      return {
        success: true,
        blob: new Blob([text], { type: 'text/plain' }),
        filename: outputFilename(file.name, 'txt'),
        mimeType: 'text/plain',
      };
    }

    // EPUB → HTML
    if (srcExt === 'epub' && (target === 'html' || target === 'htm')) {
      const text = await this.extractText(file);
      const meta = await this.getMetadata(file);
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${meta.title ?? ''}</title></head><body><pre>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre></body></html>`;
      return {
        success: true,
        blob: new Blob([html], { type: 'text/html' }),
        filename: outputFilename(file.name, 'html'),
        mimeType: 'text/html',
      };
    }

    // Full cross-format conversion (EPUB→MOBI etc.) requires server
    return fail(`Full ebook format conversion from ${srcExt} to ${target} requires server processing (Calibre). Browser supports text/metadata extraction only.`);
  }

  async extractImages(file: File, _options?: BaseProcessingOptions): Promise<ConversionResult[]> {
    try {
      const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const results: ConversionResult[] = [];
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const ext = path.split('.').pop()?.toLowerCase() ?? '';
        if (!imageExts.includes(ext)) continue;
        const buffer = await entry.async('arraybuffer');
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        results.push({
          success: true,
          blob: new Blob([buffer], { type: mime }),
          filename: path.split('/').pop() ?? path,
          mimeType: mime,
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  async extractText(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'epub') return this._extractEpubText(file);
    if (ext === 'fb2') return this._extractFb2Text(file);
    if (['html', 'htm'].includes(ext)) {
      const html = await file.text();
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return file.text();
  }

  async getMetadata(file: File): Promise<{ title?: string; author?: string; language?: string; chapters: number }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'epub') return this._getEpubMetadata(file);
    if (ext === 'fb2') return this._getFb2Metadata(file);

    return { title: file.name.replace(/\.[^/.]+$/, ''), chapters: 0 };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _extractEpubText(file: File): Promise<string> {
    try {
      // Use epubjs to parse spine and extract text from each chapter
      const ePub = (await import(/* webpackChunkName: "epubjs" */ 'epubjs')).default;
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      const texts: string[] = [];
      const spine = (book.spine as unknown) as { items: Array<{ href: string }> };
      const spineItems = spine.items ?? [];

      for (const item of spineItems) {
        try {
          const section = book.spine.get(item.href);
          if (!section) continue;
          await section.load(book.load.bind(book));
          const doc = section.document;
          if (doc) {
            texts.push(doc.body?.textContent ?? '');
          }
        } catch {
          // Skip unreadable sections
        }
      }

      return texts.join('\n\n').replace(/\s+/g, ' ').trim();
    } catch {
      // Fallback: raw ZIP text extraction
      try {
        const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const texts: string[] = [];
        for (const [path, entry] of Object.entries(zip.files)) {
          if (!path.endsWith('.html') && !path.endsWith('.xhtml') && !path.endsWith('.htm')) continue;
          const content = await entry.async('string');
          texts.push(content.replace(/<[^>]*>/g, ' '));
        }
        return texts.join('\n\n').replace(/\s+/g, ' ').trim();
      } catch {
        return '';
      }
    }
  }

  private async _getEpubMetadata(file: File): Promise<{ title?: string; author?: string; language?: string; chapters: number }> {
    try {
      const ePub = (await import(/* webpackChunkName: "epubjs" */ 'epubjs')).default;
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;
      const meta = await book.loaded.metadata;
      const spine = (book.spine as unknown) as { items: unknown[] };
      const metaRecord = meta as unknown as Record<string, unknown>;
      return {
        title: metaRecord.title as string | undefined,
        author: metaRecord.creator as string | undefined,
        language: metaRecord.language as string | undefined,
        chapters: spine.items?.length ?? 0,
      };
    } catch {
      return { title: file.name.replace(/\.[^/.]+$/, ''), chapters: 0 };
    }
  }

  private async _extractFb2Text(file: File): Promise<string> {
    const xml = await file.text();
    return xml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private async _getFb2Metadata(file: File): Promise<{ title?: string; author?: string; language?: string; chapters: number }> {
    try {
      const xml = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const title = doc.querySelector('book-title')?.textContent ?? undefined;
      const firstName = doc.querySelector('first-name')?.textContent ?? '';
      const lastName = doc.querySelector('last-name')?.textContent ?? '';
      const author = [firstName, lastName].filter(Boolean).join(' ') || undefined;
      const lang = doc.querySelector('lang')?.textContent ?? undefined;
      const chapters = doc.querySelectorAll('section').length;
      return { title, author, language: lang, chapters };
    } catch {
      return { chapters: 0 };
    }
  }
}

export const browserEbookProvider = new BrowserEbookProvider();
