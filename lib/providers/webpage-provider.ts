/**
 * lib/providers/webpage-provider.ts
 *
 * Phase 6B Part 2 — Browser IWebpageProvider implementation.
 *
 * Libraries used (all lazy-loaded):
 *   - html2canvas : HTML element → canvas → PNG/JPG screenshot
 *   - pdf-lib     : canvas screenshot → embedded PDF
 *
 * Browser capabilities:
 *   - HTML file → screenshot (image) : FULL via html2canvas
 *   - HTML file → PDF                : PARTIAL via html2canvas + pdf-lib
 *   - HTML file → text/markdown      : FULL via DOMParser
 *   - URL → screenshot               : PARTIAL (same-origin only; cross-origin blocked by CORS)
 *   - URL → PDF                      : SERVER-ONLY (Puppeteer/Playwright)
 *
 * Security note:
 *   html2canvas cannot capture content from cross-origin iframes or pages.
 *   URL-based screenshots require server-side Puppeteer.
 */

import type {
  IWebpageProvider,
  ProviderInfo,
  ProviderCapabilityCheck,
  WebpageScreenshotOptions,
  WebpagePdfOptions,
  BaseProcessingOptions,
} from '../types/provider-interfaces';
import type { ConversionResult } from '../types/conversion';
import { providerLifecycleRegistry } from '../core/browser-arch';

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserWebpageProvider',
  name: 'Browser Webpage / HTML Provider',
  version: '6.2.0',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fail(msg: string): ConversionResult {
  return { success: false, error: msg, errorCode: 'CONVERSION_FAILED' };
}

function outputFilename(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

function isUrl(input: string | File): boolean {
  if (typeof input !== 'string') return false;
  return input.startsWith('http://') || input.startsWith('https://');
}

// ---------------------------------------------------------------------------
// WEBPAGE PROVIDER
// ---------------------------------------------------------------------------

export class BrowserWebpageProvider implements IWebpageProvider {
  readonly info: ProviderInfo = PROVIDER_INFO;
  private _ready = false;

  async initialize(): Promise<boolean> {
    this._ready = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (this._ready) {
      providerLifecycleRegistry.markReady(this.info.id);
    }
    return this._ready;
  }

  isReady(): boolean { return this._ready; }

  async canHandle(input: File | string, _targetFormat: string): Promise<ProviderCapabilityCheck> {
    if (isUrl(input)) {
      return {
        supported: true,
        reason: 'URL screenshots are subject to CORS restrictions. Use server Puppeteer for reliable URL capture.',
      };
    }
    const ext = typeof input === 'string'
      ? input.toLowerCase()
      : (input as File).name.split('.').pop()?.toLowerCase() ?? '';
    if (!['html', 'htm', 'xhtml', 'mhtml'].includes(ext)) {
      return { supported: false, reason: `Unsupported webpage format: ${ext}` };
    }
    return { supported: true };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IWebpageProvider methods ───────────────────────────────────────────────

  async toPdf(urlOrFile: string | File, options?: WebpagePdfOptions): Promise<ConversionResult> {
    if (isUrl(urlOrFile)) {
      return fail('URL-to-PDF requires server Puppeteer. Browser can only convert local HTML files to PDF.');
    }
    try {
      const imgResult = await this._renderHtmlToCanvas(urlOrFile as File, {
        targetFormat: 'png',
        fullPage: true,
        ...options,
      });
      if (!imgResult.success || !imgResult.blob) return imgResult;

      const { PDFDocument } = await import(/* webpackChunkName: "pdf-lib" */ 'pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const imgBytes = new Uint8Array(await imgResult.blob.arrayBuffer());
      const image = await pdfDoc.embedPng(imgBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await pdfDoc.save();
      const filename = typeof urlOrFile === 'string'
        ? 'page.pdf'
        : outputFilename((urlOrFile as File).name, 'pdf');
      return {
        success: true,
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename,
        mimeType: 'application/pdf',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'HTML→PDF conversion failed');
    }
  }

  async toImage(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult> {
    return this.screenshot(urlOrFile, options);
  }

  async screenshot(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult> {
    if (isUrl(urlOrFile)) {
      return fail('URL screenshots require server Puppeteer (CORS restrictions). Browser can only capture local HTML files.');
    }
    return this._renderHtmlToCanvas(urlOrFile as File, options);
  }

  async fullPageScreenshot(urlOrFile: string | File, options?: WebpageScreenshotOptions): Promise<ConversionResult> {
    return this.screenshot(urlOrFile, { targetFormat: 'png' as const, ...options, fullPage: true });
  }

  async toText(urlOrFile: string | File, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    if (isUrl(urlOrFile)) {
      return fail('Fetching URL content is blocked by CORS in browser. Use server implementation.');
    }
    try {
      const file = urlOrFile as File;
      const html = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const text = doc.body?.textContent ?? doc.documentElement?.textContent ?? '';
      const clean = text.replace(/\s+/g, ' ').trim();
      return {
        success: true,
        blob: new Blob([clean], { type: 'text/plain' }),
        filename: outputFilename(file.name, 'txt'),
        mimeType: 'text/plain',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'Text extraction failed');
    }
  }

  async toMarkdown(urlOrFile: string | File, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    if (isUrl(urlOrFile)) {
      return fail('Fetching URL content is blocked by CORS in browser. Use server implementation.');
    }
    try {
      const file = urlOrFile as File;
      const html = await file.text();
      const md = this._htmlToMarkdown(html);
      return {
        success: true,
        blob: new Blob([md], { type: 'text/markdown' }),
        filename: outputFilename(file.name, 'md'),
        mimeType: 'text/markdown',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'HTML→Markdown conversion failed');
    }
  }

  async getTitle(url: string): Promise<string> {
    if (!isUrl(url)) {
      // Local file name as title
      return url.replace(/\.[^/.]+$/, '').split('/').pop() ?? url;
    }
    // Cannot fetch cross-origin URLs in browser without a proxy
    return url;
  }

  async getMetadata(urlOrFile: string | File): Promise<Record<string, string>> {
    if (isUrl(urlOrFile)) {
      return { url: urlOrFile as string, limitation: 'metadata extraction from URLs requires server' };
    }
    try {
      const file = urlOrFile as File;
      const html = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const meta: Record<string, string> = {
        title: doc.title ?? '',
        filename: file.name,
        size: String(file.size),
      };
      doc.querySelectorAll('meta[name]').forEach((el) => {
        const name = el.getAttribute('name') ?? '';
        const content = el.getAttribute('content') ?? '';
        if (name && content) meta[name] = content;
      });
      doc.querySelectorAll('meta[property]').forEach((el) => {
        const prop = el.getAttribute('property') ?? '';
        const content = el.getAttribute('content') ?? '';
        if (prop && content) meta[prop] = content;
      });
      return meta;
    } catch {
      return {};
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _renderHtmlToCanvas(file: File, options?: WebpageScreenshotOptions): Promise<ConversionResult> {
    try {
      const html2canvas = (await import(/* webpackChunkName: "html2canvas" */ 'html2canvas')).default;

      // Inject HTML into an off-screen iframe
      const html = await file.text();
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1280px;height:800px;visibility:hidden;border:none;';
      document.body.appendChild(iframe);

      try {
        const iDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!iDoc) return fail('Could not create render frame');

        iDoc.open();
        iDoc.write(html);
        iDoc.close();

        // Wait for images/fonts to load
        await new Promise(r => setTimeout(r, options?.waitMs ?? 500));

        const canvas = await html2canvas(iDoc.body, {
          useCORS: true,
          allowTaint: false,
          scale: options?.scale ?? 1,
          backgroundColor: '#ffffff',
          width: options?.viewport?.width ?? 1280,
          height: options?.viewport?.height,
          windowWidth: options?.viewport?.width ?? 1280,
          scrollY: 0,
        });

        const targetFmt = options?.targetFormat ?? 'png';
        const isJpeg = targetFmt === 'jpg';
        const mime = isJpeg ? 'image/jpeg' : 'image/png';
        const quality = isJpeg ? 0.92 : undefined;

        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas empty')), mime, quality);
        });

        return {
          success: true,
          blob,
          filename: outputFilename(file.name, isJpeg ? 'jpg' : 'png'),
          mimeType: mime,
        };
      } finally {
        document.body.removeChild(iframe);
      }
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'HTML rendering failed');
    }
  }

  private _htmlToMarkdown(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*/gi, '![$1]($2)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, c) => c.split('\n').map((l: string) => `> ${l}`).join('\n') + '\n')
      .replace(/<hr[^>]*>/gi, '\n---\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const browserWebpageProvider = new BrowserWebpageProvider();
