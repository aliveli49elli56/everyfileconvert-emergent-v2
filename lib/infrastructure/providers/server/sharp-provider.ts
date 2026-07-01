/**
 * lib/infrastructure/providers/server/sharp-provider.ts
 *
 * Sharp Server Provider — Interface + Stub
 *
 * ISharpProvider: server-side high-performance image processing.
 * Handles: resize, crop, format conversion, EXIF, watermark, optimize.
 *
 * Future provider (Phase 6D-2): Node.js Sharp in server runtime.
 * Browser fallback: browser-based Canvas/WASM image tools (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// SHARP TYPES
// ---------------------------------------------------------------------------

export type SharpOutputFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif' | 'heif';

export interface SharpResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  background?: string;
}

export interface SharpProcessOptions {
  outputFormat?: SharpOutputFormat;
  quality?: number;
  resize?: SharpResizeOptions;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;
  stripExif?: boolean;
  progressive?: boolean;
}

export interface SharpProcessResult {
  success: boolean;
  outputBlob?: Blob;
  width?: number;
  height?: number;
  format?: string;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ISharpProvider {
  getMetadata(): ProviderMetadata;
  process(inputBlob: Blob, options: SharpProcessOptions): Promise<SharpProcessResult>;
  getMetadataFromImage(inputBlob: Blob): Promise<{ width: number; height: number; format: string; exif?: unknown } | null>;
  optimize(inputBlob: Blob, targetFormat: SharpOutputFormat, quality?: number): Promise<SharpProcessResult>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubSharpProvider implements ISharpProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-sharp',
    displayName:    'Stub Sharp Image Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       53,
    healthStatus:   'unknown',
    capabilities:   ['image-resize', 'image-convert', 'image-optimize', 'image-metadata', 'watermark'],
    futureProvider: 'sharp-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async process(_input: Blob, _options: SharpProcessOptions): Promise<SharpProcessResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Sharp server not enabled' };
  }

  async getMetadataFromImage(_input: Blob): Promise<null> { return null; }

  async optimize(_input: Blob, _format: SharpOutputFormat, _quality?: number): Promise<SharpProcessResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Sharp server not enabled' };
  }

  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubSharpProvider = new StubSharpProvider();
