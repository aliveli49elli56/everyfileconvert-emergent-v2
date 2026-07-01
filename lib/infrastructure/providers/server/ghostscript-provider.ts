/**
 * lib/infrastructure/providers/server/ghostscript-provider.ts
 *
 * Ghostscript Server Provider — Interface + Stub
 *
 * IGhostscriptProvider: server-side PDF processing interface.
 * Handles: PDF compression, PDF/A conversion, PDF splitting, merging.
 *
 * Future provider (Phase 6D-2): REST API to Ghostscript container.
 * Browser fallback: browser-based PDF tools (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// GHOSTSCRIPT TYPES
// ---------------------------------------------------------------------------

export type PdfCompatibilityLevel = '1.4' | '1.5' | '1.6' | '1.7' | '2.0';
export type PdfCompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress';

export interface GhostscriptCompressOptions {
  compressionLevel: PdfCompressionLevel;
  compatibilityLevel?: PdfCompatibilityLevel;
  colorImageDownsampleDpi?: number;
  grayImageDownsampleDpi?: number;
}

export interface GhostscriptConversionResult {
  success: boolean;
  outputBlob?: Blob;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  compressionRatio?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IGhostscriptProvider {
  getMetadata(): ProviderMetadata;
  compressPdf(inputBlob: Blob, options: GhostscriptCompressOptions): Promise<GhostscriptConversionResult>;
  convertToPdfA(inputBlob: Blob, level?: '1b' | '2b' | '3b'): Promise<GhostscriptConversionResult>;
  mergePdfs(inputs: Blob[]): Promise<GhostscriptConversionResult>;
  splitPdf(inputBlob: Blob, pageRanges: string[]): Promise<GhostscriptConversionResult[]>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubGhostscriptProvider implements IGhostscriptProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-ghostscript',
    displayName:    'Stub Ghostscript Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       52,
    healthStatus:   'unknown',
    capabilities:   ['pdf-compress', 'pdf-convert', 'pdf-merge', 'pdf-split', 'pdfa'],
    futureProvider: 'ghostscript-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async compressPdf(_input: Blob, _opts: GhostscriptCompressOptions): Promise<GhostscriptConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Ghostscript server not enabled' };
  }

  async convertToPdfA(_input: Blob, _level?: string): Promise<GhostscriptConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Ghostscript server not enabled' };
  }

  async mergePdfs(_inputs: Blob[]): Promise<GhostscriptConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Ghostscript server not enabled' };
  }

  async splitPdf(_input: Blob, _ranges: string[]): Promise<GhostscriptConversionResult[]> { return []; }
  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubGhostscriptProvider = new StubGhostscriptProvider();
