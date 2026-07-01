/**
 * lib/infrastructure/providers/server/puppeteer-provider.ts
 *
 * Puppeteer Server Provider — Interface + Stub
 *
 * IPuppeteerProvider: server-side headless Chrome/PDF generation.
 * Handles: HTML→PDF, webpage screenshots, web scraping for conversion.
 *
 * Future provider (Phase 6D-2): Puppeteer in server runtime.
 * Browser fallback: browser-based canvas/print tools (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// PUPPETEER TYPES
// ---------------------------------------------------------------------------

export interface PuppeteerPdfOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  scale?: number;
  pageRanges?: string;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface PuppeteerScreenshotOptions {
  fullPage?: boolean;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  waitForSelector?: string;
  waitMs?: number;
}

export interface PuppeteerResult {
  success: boolean;
  outputBlob?: Blob;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IPuppeteerProvider {
  getMetadata(): ProviderMetadata;
  htmlToPdf(html: string, options?: PuppeteerPdfOptions): Promise<PuppeteerResult>;
  urlToPdf(url: string, options?: PuppeteerPdfOptions): Promise<PuppeteerResult>;
  urlToScreenshot(url: string, options?: PuppeteerScreenshotOptions): Promise<PuppeteerResult>;
  htmlToScreenshot(html: string, options?: PuppeteerScreenshotOptions): Promise<PuppeteerResult>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubPuppeteerProvider implements IPuppeteerProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-puppeteer',
    displayName:    'Stub Puppeteer Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       54,
    healthStatus:   'unknown',
    capabilities:   ['html-to-pdf', 'url-to-pdf', 'screenshot', 'web-scrape'],
    futureProvider: 'puppeteer-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async htmlToPdf(_html: string, _opts?: PuppeteerPdfOptions): Promise<PuppeteerResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Puppeteer server not enabled' };
  }

  async urlToPdf(_url: string, _opts?: PuppeteerPdfOptions): Promise<PuppeteerResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Puppeteer server not enabled' };
  }

  async urlToScreenshot(_url: string, _opts?: PuppeteerScreenshotOptions): Promise<PuppeteerResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Puppeteer server not enabled' };
  }

  async htmlToScreenshot(_html: string, _opts?: PuppeteerScreenshotOptions): Promise<PuppeteerResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Puppeteer server not enabled' };
  }

  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubPuppeteerProvider = new StubPuppeteerProvider();
