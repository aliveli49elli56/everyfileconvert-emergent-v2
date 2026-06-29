/**
 * lib/core/engine-registry.ts
 * Engine registry and dispatcher
 */

import type { IEngine, EngineClass, EngineConfig } from './engine-base';
import type { ConversionDomain, ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';

// ---------------------------------------------------------------------------
// ENGINE REGISTRY
// ---------------------------------------------------------------------------

class EngineRegistry {
  private engines: Map<ConversionDomain, IEngine>;
  private engineConfigs: Map<ConversionDomain, EngineConfig>;

  constructor() {
    this.engines = new Map();
    this.engineConfigs = new Map();
  }

  /**
   * Register an engine
   */
  register(domain: ConversionDomain, engine: IEngine, config?: Partial<EngineConfig>): void {
    this.engines.set(domain, engine);
    this.engineConfigs.set(domain, {
      domain,
      priority: config?.priority ?? 100,
      lazy: config?.lazy ?? true,
    });
  }

  /**
   * Get engine for domain
   */
  get(domain: ConversionDomain): IEngine | undefined {
    return this.engines.get(domain);
  }

  /**
   * Get engine for operation
   */
  getForOperation(operation: string): IEngine | undefined {
    const [domain] = operation.split(':') as [ConversionDomain];
    return this.engines.get(domain);
  }

  /**
   * Process a job using the appropriate engine
   */
  async process(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const [domain] = job.operation.split(':') as [ConversionDomain];
    const engine = this.engines.get(domain);

    if (!engine) {
      return {
        success: false,
        error: `No engine registered for domain: ${domain}`,
        errorCode: 'UNSUPPORTED_FORMAT',
      };
    }

    return engine.process(job, onProgress);
  }

  /**
   * Check if engine exists for domain
   */
  has(domain: ConversionDomain): boolean {
    return this.engines.has(domain);
  }

  /**
   * Get all registered domains
   */
  getDomains(): ConversionDomain[] {
    return Array.from(this.engines.keys());
  }
}

export const engineRegistry = new EngineRegistry();

// ---------------------------------------------------------------------------
// LEGACY COMPATIBILITY LAYER
// Uses dynamic imports and wraps legacy engines
// ---------------------------------------------------------------------------

/**
 * Initialize engines with legacy implementations
 */
export async function initializeEngines(): Promise<void> {
  // Image Engine - wrap legacy engine
  const { ImageEngine } = await import('../engine/ImageEngine');
  engineRegistry.register('image', {
    domain: 'image',
    name: 'ImageEngine',
    async process(job, onProgress) {
      const result = await ImageEngine.process({
        files: job.files,
        op: job.operation as 'image:convert' | 'image:crop' | 'image:resize' | 'image:rotate' | 'image:flip' | 'image:compress' | 'image:blur' | 'image:watermark' | 'image:color-adjust' | 'image:ocr',
        options: job.options as Parameters<typeof ImageEngine.process>[0]['options'],
        onProgress: onProgress ? (pct: number) => onProgress({ jobId: job.id, stage: 'processing', progress: pct }) : undefined,
      });
      return {
        success: true,
        blob: result.blob,
        filename: result.filename,
        mimeType: result.mimeType,
      };
    },
    canHandle: (op) => op.startsWith('image:'),
    getSupportedOperations: () => [
      'image:convert', 'image:crop', 'image:resize', 'image:rotate',
      'image:flip', 'image:compress', 'image:blur', 'image:watermark',
      'image:color-adjust', 'image:ocr',
    ],
  });

  // Video/Audio Engine
  const { VideoAudioEngine } = await import('../engine/VideoAudioEngine');
  const videoAudioHandler = async (job: ConversionJob, onProgress?: (progress: ConversionProgress) => void) => {
    const result = await VideoAudioEngine.process({
      files: job.files,
      op: job.operation as Parameters<typeof VideoAudioEngine.process>[0]['op'],
      options: job.options as Parameters<typeof VideoAudioEngine.process>[0]['options'],
      onProgress: onProgress ? (pct: number) => onProgress({ jobId: job.id, stage: 'processing', progress: pct }) : undefined,
    });
    return {
      success: true,
      blob: result.blob,
      filename: result.filename,
      mimeType: result.mimeType,
    };
  };

  engineRegistry.register('video', {
    domain: 'video',
    name: 'VideoAudioEngine',
    process: videoAudioHandler,
    canHandle: (op) => op.startsWith('video:') || op.startsWith('audio:'),
    getSupportedOperations: () => [
      'video:convert', 'video:trim', 'video:compress', 'video:rotate',
      'video:extract-audio', 'video:gif', 'video:crop', 'video:reverse',
      'video:subtitle', 'video:merge',
    ],
  });
  engineRegistry.register('audio', {
    domain: 'audio',
    name: 'VideoAudioEngine',
    process: videoAudioHandler,
    canHandle: (op) => op.startsWith('audio:'),
    getSupportedOperations: () => [
      'audio:convert', 'audio:trim', 'audio:compress', 'audio:normalize',
      'audio:merge', 'audio:speed', 'audio:pitch',
    ],
  });

  // PDF/Doc Engine
  const { PdfDocEngine } = await import('../engine/PdfDocEngine');
  const pdfDocHandler = async (job: ConversionJob, onProgress?: (progress: ConversionProgress) => void) => {
    const result = await PdfDocEngine.process({
      files: job.files,
      op: job.operation as Parameters<typeof PdfDocEngine.process>[0]['op'],
      options: job.options as Parameters<typeof PdfDocEngine.process>[0]['options'],
      onProgress: onProgress ? (pct: number) => onProgress({ jobId: job.id, stage: 'processing', progress: pct }) : undefined,
    });
    return {
      success: true,
      blob: result.blob,
      filename: result.filename,
      mimeType: result.mimeType,
    };
  };

  engineRegistry.register('pdf', {
    domain: 'pdf',
    name: 'PdfDocEngine',
    process: pdfDocHandler,
    canHandle: (op) => op.startsWith('pdf:') || op.startsWith('doc:'),
    getSupportedOperations: () => [
      'pdf:merge', 'pdf:split', 'pdf:compress', 'pdf:protect', 'pdf:unlock',
      'pdf:rotate', 'pdf:to-word', 'pdf:watermark', 'pdf:page-numbers',
    ],
  });
  engineRegistry.register('doc', {
    domain: 'doc',
    name: 'PdfDocEngine',
    process: pdfDocHandler,
    canHandle: (op) => op.startsWith('doc:'),
    getSupportedOperations: () => ['doc:to-pdf', 'doc:to-text', 'doc:convert'],
  });

  // Ebook Engine
  const { EbookEngine } = await import('../engine/EbookEngine');
  engineRegistry.register('ebook', {
    domain: 'ebook',
    name: 'EbookEngine',
    async process(job, onProgress) {
      const result = await EbookEngine.process({
        files: job.files,
        op: 'ebook:convert',
        options: job.options as Parameters<typeof EbookEngine.process>[0]['options'],
        onProgress: onProgress ? (pct: number) => onProgress({ jobId: job.id, stage: 'processing', progress: pct }) : undefined,
      });
      return {
        success: true,
        blob: result.blob,
        filename: result.filename,
        mimeType: result.mimeType,
      };
    },
    canHandle: (op) => op.startsWith('ebook:'),
    getSupportedOperations: () => ['ebook:convert'],
  });
}
