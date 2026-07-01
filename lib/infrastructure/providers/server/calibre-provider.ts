/**
 * lib/infrastructure/providers/server/calibre-provider.ts
 *
 * Calibre Server Provider — Interface + Stub
 * Also covers OCR (Tesseract) and AI Processing interfaces.
 *
 * ICalibreProvider: server-side ebook conversion.
 * IOCRProvider: server-side OCR (Tesseract/Google Vision).
 * IAIProcessingProvider: server-side AI document analysis.
 *
 * Future provider (Phase 6D-2): Calibre CLI + Tesseract + AI APIs.
 * Browser fallback: browser-based ebook tools (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// CALIBRE TYPES
// ---------------------------------------------------------------------------

export type EbookFormat =
  | 'epub' | 'mobi' | 'azw' | 'azw3' | 'pdf'
  | 'txt' | 'rtf' | 'docx' | 'html' | 'fb2' | 'lit';

export interface CalibreConversionOptions {
  inputFormat: EbookFormat;
  outputFormat: EbookFormat;
  title?: string;
  author?: string;
  language?: string;
  outputProfile?: 'kindle' | 'tablet' | 'nook' | 'default';
}

export interface CalibreConversionResult {
  success: boolean;
  outputBlob?: Blob;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// OCR TYPES
// ---------------------------------------------------------------------------

export interface OCROptions {
  language?: string;
  dpi?: number;
  outputFormat?: 'text' | 'hocr' | 'pdf' | 'tsv';
  pageSegMode?: number;
}

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  outputBlob?: Blob;
  durationMs: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// AI PROCESSING TYPES
// ---------------------------------------------------------------------------

export interface AIDocumentAnalysisOptions {
  extractText?: boolean;
  extractTables?: boolean;
  classifyDocument?: boolean;
  language?: string;
}

export interface AIDocumentAnalysisResult {
  success: boolean;
  text?: string;
  tables?: unknown[][];
  documentType?: string;
  language?: string;
  confidence?: number;
  durationMs: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACES
// ---------------------------------------------------------------------------

export interface ICalibreProvider {
  getMetadata(): ProviderMetadata;
  convert(inputBlob: Blob, options: CalibreConversionOptions): Promise<CalibreConversionResult>;
  getSupportedFormats(): Promise<{ input: string[]; output: string[] } | null>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

export interface IOCRProvider {
  getMetadata(): ProviderMetadata;
  extractText(imageOrPdfBlob: Blob, options?: OCROptions): Promise<OCRResult>;
  getSupportedLanguages(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

export interface IAIProcessingProvider {
  getMetadata(): ProviderMetadata;
  analyzeDocument(docBlob: Blob, options?: AIDocumentAnalysisOptions): Promise<AIDocumentAnalysisResult>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUBS
// ---------------------------------------------------------------------------

export class StubCalibreProvider implements ICalibreProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-calibre',
    displayName:    'Stub Calibre Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       55,
    healthStatus:   'unknown',
    capabilities:   ['epub-convert', 'mobi-convert', 'ebook-optimize', 'kindle-format'],
    futureProvider: 'calibre-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async convert(_input: Blob, _opts: CalibreConversionOptions): Promise<CalibreConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Calibre server not enabled' };
  }

  async getSupportedFormats(): Promise<null> { return null; }
  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export class StubOCRProvider implements IOCRProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-ocr',
    displayName:    'Stub OCR Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       56,
    healthStatus:   'unknown',
    capabilities:   ['ocr', 'text-extraction', 'multi-language'],
    futureProvider: 'tesseract-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async extractText(_blob: Blob, _opts?: OCROptions): Promise<OCRResult> {
    return { success: false, durationMs: 0, error: 'OCR server not enabled' };
  }

  async getSupportedLanguages(): Promise<string[]> { return []; }
  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export class StubAIProcessingProvider implements IAIProcessingProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-ai-processing',
    displayName:    'Stub AI Document Processing Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       57,
    healthStatus:   'unknown',
    capabilities:   ['document-analysis', 'text-extraction', 'table-extraction', 'classification'],
    futureProvider: 'openai-processing',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async analyzeDocument(_blob: Blob, _opts?: AIDocumentAnalysisOptions): Promise<AIDocumentAnalysisResult> {
    return { success: false, durationMs: 0, error: 'AI Processing server not enabled' };
  }

  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubCalibreProvider       = new StubCalibreProvider();
export const stubOCRProvider           = new StubOCRProvider();
export const stubAIProcessingProvider  = new StubAIProcessingProvider();
