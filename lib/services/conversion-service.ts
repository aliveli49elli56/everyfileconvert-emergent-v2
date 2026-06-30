/**
 * lib/services/conversion-service.ts
 * Central conversion orchestration service.
 *
 * Phase 6B: All browser processing requests now route through the
 * Provider Selection Engine first. Legacy engine is kept as fallback.
 */

import type {
  ConversionJob,
  ConversionResult,
  ConversionProgress,
  ConversionOptions,
  ConversionOperation,
} from '../types/conversion';
import { providerRegistry } from '../registry/provider-registry';
import { formatRegistry } from '../registry/format-registry';
import { conversionRegistry } from '../registry/conversion-registry';
import { providerSelectionEngine } from '../engine/provider-selection-engine';

// ---------------------------------------------------------------------------
// CONVERSION SERVICE
// ---------------------------------------------------------------------------

interface ConversionServiceConfig {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  enableCache: boolean;
}

const DEFAULT_CONFIG: ConversionServiceConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
  timeoutMs: 300000, // 5 minutes
  enableCache: true,
};

class ConversionService {
  private config: ConversionServiceConfig;
  private activeJobs: Map<string, ConversionJob>;
  private jobResults: Map<string, ConversionResult>;

  constructor(config: Partial<ConversionServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeJobs = new Map();
    this.jobResults = new Map();
  }

  /**
   * Create a new conversion job
   */
  createJob(
    files: File[],
    operation: ConversionOperation,
    options?: ConversionOptions,
    mode: 'free' | 'premium' = 'free'
  ): ConversionJob {
    return {
      id: this.generateJobId(),
      files,
      operation,
      options,
      mode,
      createdAt: new Date(),
    };
  }

  /**
   * Execute a conversion job
   */
  async execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    this.activeJobs.set(job.id, job);

    try {
      // Validate job
      const validation = await this.validateJob(job);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; '),
          errorCode: 'INVALID_OPTIONS',
        };
      }

      // Phase 6B: Route through Provider Selection Engine first
      const srcExt = job.files[0]?.name.split('.').pop()?.toLowerCase() ?? '';
      const tgtExt = (job.options as { targetFormat?: string })?.targetFormat?.toLowerCase() ?? '';

      const selectionResult = providerSelectionEngine.select({
        inputExt: srcExt,
        outputExt: tgtExt,
        fileSizeBytes: job.files.reduce((s, f) => s + f.size, 0),
        runtimeEnv: 'browser',
        userTier: job.mode === 'premium' ? 'premium' : 'free',
      });

      // Try new Phase 6A/6B provider implementations
      const selectedCandidate = selectionResult.selected;
      const pse = selectedCandidate ? this.resolveNewProvider(selectedCandidate.providerId) : null;
      if (pse) {
        const result = await this.executeWithNewProvider(job, pse, onProgress);
        this.jobResults.set(job.id, result);
        return { ...result, duration: Date.now() - startTime, provider: selectedCandidate!.providerName };
      }

      // Fall back to old provider-registry
      const providerConfig = providerRegistry.selectBest(job);
      if (!providerConfig) {
        return {
          success: false,
          error: 'No suitable provider available',
          errorCode: 'UNSUPPORTED_FORMAT',
        };
      }

      // Get implementation
      const provider = providerRegistry.getImplementation(providerConfig.id);
      if (!provider) {
        // Fallback to legacy engine dispatch
        return this.executeLegacy(job, onProgress);
      }

      // Execute with provider
      const result = await this.executeWithProvider(
        job,
        provider,
        onProgress
      );

      // Record result
      this.jobResults.set(job.id, result);

      return {
        ...result,
        duration: Date.now() - startTime,
        provider: providerConfig.name,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        errorCode: 'CONVERSION_FAILED',
        duration: Date.now() - startTime,
      };
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Phase 6B: Map PSE provider IDs to new IImageProvider/IVideoProvider implementations.
   * As more providers are implemented, add them here.
   */
  private resolveNewProvider(providerId: string): import('../types/provider-interfaces').IBaseProvider | null {
    try {
      switch (providerId) {
        case 'CanvasApiProvider':
        case 'CanvasImageProvider': {
          const { imageCanvasProvider } = require('../providers/image-canvas-provider');
          return imageCanvasProvider;
        }
        case 'FFmpegWasmProvider': {
          const { videoFFmpegProvider } = require('../providers/video-ffmpeg-provider');
          return videoFFmpegProvider;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Phase 6B: Execute using new IBaseProvider-conformant providers.
   */
  private async executeWithNewProvider(
    job: ConversionJob,
    provider: import('../types/provider-interfaces').IBaseProvider,
    onProgress?: (progress: ConversionProgress) => void,
  ): Promise<ConversionResult> {
    // Ensure provider is ready
    if (!provider.isReady()) {
      const ok = await provider.initialize();
      if (!ok) {
        return { success: false, error: `Provider ${provider.info.id} failed to initialize`, errorCode: 'CONVERSION_FAILED' };
      }
    }

    // Check capability
    const srcExt = job.files[0]?.name.split('.').pop() ?? '';
    const tgtExt = (job.options as { targetFormat?: string })?.targetFormat ?? '';
    const check = await provider.canHandle(job.files[0] ?? '', tgtExt);
    if (!check.supported) {
      return this.executeLegacy(job, onProgress);
    }

    // Route to typed provider method
    const domain = (job.operation as string).split(':')[0];
    if (domain === 'image') {
      const imgProvider = provider as import('../types/provider-interfaces').IImageProvider;
      const opts = {
        targetFormat: tgtExt,
        quality: (job.options as { quality?: number })?.quality,
        onProgress: (p: ConversionProgress) => onProgress?.(p),
      };
      return imgProvider.convert(job.files[0], opts);
    }
    if (domain === 'video' || domain === 'audio') {
      const vidProvider = provider as import('../types/provider-interfaces').IVideoProvider;
      return vidProvider.convert(job.files[0], {
        targetFormat: tgtExt,
        onProgress: (p: ConversionProgress) => onProgress?.(p),
      });
    }

    // Generic fallback
    return this.executeLegacy(job, onProgress);
  }

  /**
   * Execute using legacy engine dispatch (backward compatibility)
   */
  private async executeLegacy(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const { Transcoder } = await import('../engine/Transcoder');

    onProgress?.({
      jobId: job.id,
      stage: 'validating',
      progress: 0,
    });

    try {
      const result = await Transcoder.run({
        files: job.files,
        op: job.operation as 'image:convert' | 'image:crop' | 'image:resize' | 'image:rotate' | 'image:flip' | 'image:compress' | 'image:blur' | 'image:watermark' | 'image:color-adjust' | 'image:ocr' | 'video:convert' | 'video:trim' | 'video:compress' | 'video:rotate' | 'video:extract-audio' | 'video:gif' | 'video:crop' | 'video:reverse' | 'video:subtitle' | 'audio:convert' | 'audio:trim' | 'audio:compress' | 'audio:normalize' | 'audio:merge' | 'audio:speed' | 'audio:pitch' | 'pdf:merge' | 'pdf:split' | 'pdf:compress' | 'pdf:protect' | 'pdf:unlock' | 'pdf:rotate' | 'pdf:to-word' | 'pdf:watermark' | 'pdf:page-numbers' | 'doc:to-pdf' | 'doc:to-text' | 'ebook:convert',
        options: job.options as Parameters<typeof Transcoder.run>[0]['options'],
        onProgress: (pct) => {
          onProgress?.({
            jobId: job.id,
            stage: 'processing',
            progress: pct,
          });
        },
      });

      onProgress?.({
        jobId: job.id,
        stage: 'complete',
        progress: 100,
      });

      return {
        success: true,
        blob: result.blob,
        filename: result.filename,
        mimeType: result.mimeType,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      return {
        success: false,
        error: errorMessage,
        errorCode: 'CONVERSION_FAILED',
      };
    }
  }

  /**
   * Execute with provider implementation
   */
  private async executeWithProvider(
    job: ConversionJob,
    provider: import('../types/providers').IConversionProvider,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    // Provider executes with progress callback
    return provider.execute(job, (p) => {
      onProgress?.(p);
    });
  }

  /**
   * Validate a conversion job
   */
  private async validateJob(job: ConversionJob): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check files
    if (!job.files.length) {
      errors.push('No files provided');
    }

    // Check file sizes
    for (const file of job.files) {
      if (file.size === 0) {
        errors.push(`File "${file.name}" is empty`);
      }
    }

    // Check format validity if target specified
    if (job.options?.targetFormat) {
      const sourceExt = job.files[0]?.name.split('.').pop()?.toLowerCase();
      if (sourceExt && !conversionRegistry.isValid(sourceExt, job.options.targetFormat)) {
        errors.push(`Conversion from ${sourceExt} to ${job.options.targetFormat} is not supported`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active job count
   */
  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Cancel a job
   */
  cancel(jobId: string): boolean {
    return this.activeJobs.delete(jobId);
  }
}

export const conversionService = new ConversionService();
