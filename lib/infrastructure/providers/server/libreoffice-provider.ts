/**
 * lib/infrastructure/providers/server/libreoffice-provider.ts
 *
 * LibreOffice Server Provider — Interface + Stub
 *
 * ILibreOfficeProvider: server-side document conversion interface.
 * Handles: DOCX↔PDF, XLSX↔PDF, PPTX↔PDF, ODT, ODS, ODP, etc.
 *
 * Future provider (Phase 6D-2): REST API to LibreOffice container.
 * Browser fallback: existing browser-based converters (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// LIBREOFFICE TYPES
// ---------------------------------------------------------------------------

export type LibreOfficeFormat =
  | 'pdf' | 'docx' | 'doc' | 'odt' | 'rtf' | 'txt'
  | 'xlsx' | 'xls' | 'ods' | 'csv'
  | 'pptx' | 'ppt' | 'odp'
  | 'html' | 'epub';

export interface LibreOfficeConversionOptions {
  inputFormat: LibreOfficeFormat;
  outputFormat: LibreOfficeFormat;
  pdfQuality?: 'screen' | 'print' | 'prepress';
  password?: string;
}

export interface LibreOfficeConversionResult {
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

export interface ILibreOfficeProvider {
  getMetadata(): ProviderMetadata;
  convert(inputBlob: Blob, options: LibreOfficeConversionOptions): Promise<LibreOfficeConversionResult>;
  getSupportedFormats(): Promise<{ input: string[]; output: string[] } | null>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubLibreOfficeProvider implements ILibreOfficeProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-libreoffice',
    displayName:    'Stub LibreOffice Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       51,
    healthStatus:   'unknown',
    capabilities:   ['doc-convert', 'pdf-export', 'spreadsheet', 'presentation'],
    futureProvider: 'libreoffice-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async convert(_input: Blob, _options: LibreOfficeConversionOptions): Promise<LibreOfficeConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'LibreOffice server not enabled' };
  }

  async getSupportedFormats(): Promise<{ input: string[]; output: string[] } | null> { return null; }
  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubLibreOfficeProvider = new StubLibreOfficeProvider();
