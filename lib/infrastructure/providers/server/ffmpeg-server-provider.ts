/**
 * lib/infrastructure/providers/server/ffmpeg-server-provider.ts
 *
 * FFmpeg Server Provider — Interface + Stub
 *
 * IFFmpegServerProvider: server-side FFmpeg processing interface.
 * Integrates with ProviderSelectionEngine via HybridProviderResolver.
 *
 * Future provider (Phase 6D-2): REST API to FFmpeg container.
 * Browser fallback: existing browser-based FFmpeg WASM (unchanged).
 */

import type { ProviderMetadata } from '../../types';

// ---------------------------------------------------------------------------
// FFMPEG TYPES
// ---------------------------------------------------------------------------

export interface FFmpegConversionOptions {
  inputFormat: string;
  outputFormat: string;
  videoBitrate?: string;
  audioBitrate?: string;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  fps?: number;
  quality?: number;
  customArgs?: string[];
}

export interface FFmpegConversionResult {
  success: boolean;
  outputBlob?: Blob;
  outputUrl?: string;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  command?: string;
  error?: string;
}

export interface FFmpegServerCapabilities {
  version: string;
  supportedFormats: string[];
  supportedCodecs: string[];
  maxFileSizeMb: number;
  maxConcurrent: number;
  gpuAcceleration: boolean;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

/**
 * Implementation-agnostic FFmpeg Server Provider.
 * Future: REST API → FFmpeg Docker container.
 * Integrates with ProviderSelectionEngine (serverRequired: true candidates).
 */
export interface IFFmpegServerProvider {
  getMetadata(): ProviderMetadata;
  convert(inputBlob: Blob, options: FFmpegConversionOptions): Promise<FFmpegConversionResult>;
  getCapabilities(): Promise<FFmpegServerCapabilities | null>;
  isAvailable(): Promise<boolean>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubFFmpegServerProvider implements IFFmpegServerProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-ffmpeg-server',
    displayName:    'Stub FFmpeg Server Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       50,
    healthStatus:   'unknown',
    capabilities:   ['video-convert', 'audio-convert', 'transcode', 'compress', 'extract-audio'],
    futureProvider: 'ffmpeg-server',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async convert(_input: Blob, _options: FFmpegConversionOptions): Promise<FFmpegConversionResult> {
    return { success: false, durationMs: 0, inputBytes: 0, outputBytes: 0, error: 'Server FFmpeg not enabled (ENABLE_SERVER_PROVIDERS=false)' };
  }

  async getCapabilities(): Promise<FFmpegServerCapabilities | null> { return null; }
  async isAvailable(): Promise<boolean> { return false; }
  async ping(): Promise<{ ok: boolean; latencyMs: number }> { return { ok: false, latencyMs: 0 }; }
}

export const stubFFmpegServerProvider = new StubFFmpegServerProvider();
