/**
 * lib/providers/ffmpeg-provider.ts
 * FFmpeg.wasm provider for video/audio operations
 */

import { BaseProvider, providerFactory } from './base-provider';
import type { ProviderCapabilities } from '../types/providers';
import type { ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';

// ---------------------------------------------------------------------------
// CAPABILITIES
// ---------------------------------------------------------------------------

const FFMPEG_CAPABILITIES: ProviderCapabilities = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  maxFiles: 10,
  supportsFormats: [
    'mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'mpeg', 'mpg', 'm4v',
    '3gp', 'ogv', 'ts', 'f4v', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
    'wma', 'aiff', 'opus', 'ac3', 'amr', 'caf',
  ],
  supportsOperations: [
    'video:convert',
    'video:trim',
    'video:compress',
    'video:rotate',
    'video:extract-audio',
    'video:gif',
    'video:crop',
    'video:reverse',
    'video:subtitle',
    'video:merge',
    'audio:convert',
    'audio:trim',
    'audio:compress',
    'audio:normalize',
    'audio:merge',
    'audio:speed',
    'audio:pitch',
  ],
  premiumOnly: false,
  requiresAuth: false,
  estimatedSpeed: 'medium',
  qualityRating: 'high',
};

// ---------------------------------------------------------------------------
// FFMPEG PROVIDER
// ---------------------------------------------------------------------------

class FFmpegProvider extends BaseProvider {
  readonly id = 'ffmpeg';
  readonly name = 'FFmpeg.wasm';
  readonly type = 'client' as const;
  readonly capabilities = FFMPEG_CAPABILITIES;

  async execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const { files, operation, options } = job;

    if (!files.length) {
      return this.failure('No files provided', 'INVALID_OPTIONS');
    }

    try {
      this.reportProgress(job.id, 'loading', 5, 'Initializing FFmpeg...', onProgress);

      // Use the existing VideoAudioEngine for actual processing
      const { VideoAudioEngine } = await import('../engine/VideoAudioEngine');

      this.reportProgress(job.id, 'processing', 30, 'Processing...', onProgress);

      // Map job to VideoAudioEngine format
      const result = await VideoAudioEngine.process({
        files,
        op: operation as 'video:convert' | 'video:trim' | 'video:compress' | 'video:rotate' | 'video:extract-audio' | 'video:gif' | 'video:crop' | 'video:reverse' | 'video:subtitle' | 'audio:convert' | 'audio:trim' | 'audio:compress' | 'audio:normalize' | 'audio:merge' | 'audio:speed' | 'audio:pitch',
        options: options as Parameters<typeof VideoAudioEngine.process>[0]['options'],
        onProgress: (pct) => {
          const progress = 30 + Math.round(pct * 0.6);
          this.reportProgress(job.id, 'processing', progress, 'Processing...', onProgress);
        },
      });

      this.reportProgress(job.id, 'complete', 100, 'Complete', onProgress);

      return this.success(result.blob, result.filename, result.mimeType);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'FFmpeg conversion failed';
      return this.failure(message, 'CONVERSION_FAILED');
    }
  }

  estimateTime(job: ConversionJob): number {
    // FFmpeg is slower than canvas - estimate based on file size
    const totalBytes = job.files.reduce((sum, f) => sum + f.size, 0);
    const mb = totalBytes / (1024 * 1024);

    // Video is more intensive
    const isVideo = job.operation.startsWith('video');
    return isVideo ? mb * 1000 : mb * 300;
  }
}

// Register with factory
providerFactory.register('ffmpeg', FFmpegProvider);

export { FFmpegProvider };
