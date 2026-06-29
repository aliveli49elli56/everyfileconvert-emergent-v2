/**
 * lib/engine/pipeline-engine.ts
 * Conversion Pipeline Engine - orchestrates the conversion workflow
 *
 * Pipeline stages:
 * upload → validation → signature → alias → family → capability → provider → conversion → preview → cache → download → analytics
 */

import type { ProcessingEngine } from '../types/formats';
import type { ConversionOperation, ConversionJob } from '../types/conversion';
import { aliasEngine } from './alias-engine';
import { familyEngine } from './family-engine';
import { mimeEngine } from './mime-engine';
import { signatureEngine } from './signature-engine';
import { capabilityRegistry } from '../registry/capability-registry';
import { providerFallbackEngine, type ProviderType, type ConversionRequest } from './provider-fallback-engine';
import { conversionRegistry } from '../registry/conversion-registry';
import { formatRegistry } from '../registry/format-registry';

// ---------------------------------------------------------------------------
// PIPELINE TYPES
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'upload'
  | 'validation'
  | 'signature'
  | 'alias'
  | 'family'
  | 'capability'
  | 'provider'
  | 'conversion'
  | 'preview'
  | 'cache'
  | 'download'
  | 'analytics';

export interface PipelineContext {
  jobId: string;
  sessionId: string;
  userId?: string;

  // File information
  file: File;
  fileName: string;
  fileSize: number;
  fileExtension: string;

  // Resolved values (populated by pipeline)
  canonicalExtension?: string;
  detectedSignature?: string;
  mimeFromExtension?: string;
  mimeFromSignature?: string;
  formatFamily?: string;
  capabilities?: Record<string, unknown>;

  // Conversion details
  sourceFormat: string;
  targetFormat: string;
  operation: ConversionOperation;
  provider: ProviderType;
  fallbackProvider?: ProviderType;

  // Processing
  isPremium: boolean;
  isBatch: boolean;
  hasPreview: boolean;

  // Results
  outputBlob?: Blob;
  outputFileName?: string;
  previewUrl?: string;
  downloadUrl?: string;

  // Metadata
  startTime: number;
  endTime?: number;
  duration?: number;

  // Warnings and errors
  warnings: string[];
  errors: string[];

  // Stage tracking
  completedStages: PipelineStage[];
  currentStage?: PipelineStage;
  stageTimes: Record<PipelineStage, number>;
}

export interface PipelineResult {
  success: boolean;
  context: PipelineContext;
  output?: Blob;
  preview?: string;
  downloadUrl?: string;
  warnings: string[];
  errors: string[];
  duration: number;
  stages: {
    name: PipelineStage;
    duration: number;
    success: boolean;
  }[];
}

export interface PipelineConfig {
  skipSignatureCheck: boolean;
  skipPreview: boolean;
  skipCache: boolean;
  skipAnalytics: boolean;
  forceProvider?: ProviderType;
  maxFileSize: number;
  validateExtension: boolean;
  collectWarnings: boolean;
}

const DEFAULT_CONFIG: PipelineConfig = {
  skipSignatureCheck: false,
  skipPreview: false,
  skipCache: false,
  skipAnalytics: false,
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  validateExtension: true,
  collectWarnings: true,
};

// ---------------------------------------------------------------------------
// PIPELINE ENGINE CLASS
// ---------------------------------------------------------------------------

class PipelineEngine {
  private config: PipelineConfig;
  private stageProcessors: Map<PipelineStage, (ctx: PipelineContext) => Promise<PipelineContext>>;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stageProcessors = new Map();

    // Register stage processors
    this.stageProcessors.set('upload', this.processUpload.bind(this));
    this.stageProcessors.set('validation', this.processValidation.bind(this));
    this.stageProcessors.set('signature', this.processSignature.bind(this));
    this.stageProcessors.set('alias', this.processAlias.bind(this));
    this.stageProcessors.set('family', this.processFamily.bind(this));
    this.stageProcessors.set('capability', this.processCapability.bind(this));
    this.stageProcessors.set('provider', this.processProvider.bind(this));
    this.stageProcessors.set('conversion', this.processConversion.bind(this));
    this.stageProcessors.set('preview', this.processPreview.bind(this));
    this.stageProcessors.set('cache', this.processCache.bind(this));
    this.stageProcessors.set('download', this.processDownload.bind(this));
    this.stageProcessors.set('analytics', this.processAnalytics.bind(this));
  }

  /**
   * Execute the full conversion pipeline
   */
  async execute(
    file: File,
    targetFormat: string,
    options: {
      jobId?: string;
      sessionId?: string;
      userId?: string;
      isPremium?: boolean;
      isBatch?: boolean;
      forceProvider?: ProviderType;
    } = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: { name: PipelineStage; duration: number; success: boolean }[] = [];

    // Initialize context
    const context: PipelineContext = {
      jobId: options.jobId ?? this.generateJobId(),
      sessionId: options.sessionId ?? this.generateSessionId(),
      userId: options.userId,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileExtension: this.extractExtension(file.name),
      sourceFormat: '',
      targetFormat: aliasEngine.resolve(targetFormat),
      operation: 'image:convert',
      provider: 'canvas',
      isPremium: options.isPremium ?? false,
      isBatch: options.isBatch ?? false,
      hasPreview: false,
      startTime,
      warnings: [],
      errors: [],
      completedStages: [],
      stageTimes: {} as Record<PipelineStage, number>,
    };

    // Override provider if forced
    if (options.forceProvider || this.config.forceProvider) {
      context.provider = options.forceProvider ?? this.config.forceProvider!;
    }

    const pipelineStages: PipelineStage[] = [
      'upload',
      'validation',
      'signature',
      'alias',
      'family',
      'capability',
      'provider',
      'conversion',
      'preview',
      'cache',
      'download',
      'analytics',
    ];

    let currentContext = context;

    try {
      for (const stage of pipelineStages) {
        // Skip stages based on config
        if (stage === 'signature' && this.config.skipSignatureCheck) continue;
        if (stage === 'preview' && this.config.skipPreview) continue;
        if (stage === 'cache' && this.config.skipCache) continue;
        if (stage === 'analytics' && this.config.skipAnalytics) continue;

        const stageStart = Date.now();
        context.currentStage = stage;

        try {
          const processor = this.stageProcessors.get(stage);
          if (processor) {
            currentContext = await processor(currentContext);
          }
          currentContext.completedStages.push(stage);

          stages.push({
            name: stage,
            duration: Date.now() - stageStart,
            success: true,
          });
          currentContext.stageTimes[stage] = Date.now() - stageStart;
        } catch (error) {
          stages.push({
            name: stage,
            duration: Date.now() - stageStart,
            success: false,
          });
          currentContext.stageTimes[stage] = Date.now() - stageStart;

          // Check if stage is critical
          if (this.isCriticalStage(stage)) {
            currentContext.errors.push(error instanceof Error ? error.message : 'Unknown error');
            break;
          } else {
            // Non-critical: add warning and continue
            if (this.config.collectWarnings) {
              currentContext.warnings.push(`Stage ${stage} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;

      return {
        success: context.errors.length === 0,
        context: currentContext,
        output: currentContext.outputBlob,
        preview: currentContext.previewUrl,
        downloadUrl: currentContext.downloadUrl,
        warnings: context.warnings,
        errors: context.errors,
        duration: context.duration,
        stages,
      };
    } catch (error) {
      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;

      return {
        success: false,
        context: currentContext,
        warnings: context.warnings,
        errors: [error instanceof Error ? error.message : 'Pipeline execution failed'],
        duration: context.duration,
        stages,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // STAGE PROCESSORS
  // ---------------------------------------------------------------------------

  private async processUpload(ctx: PipelineContext): Promise<PipelineContext> {
    // Validate file exists and is readable
    if (!ctx.file || ctx.file.size === 0) {
      throw new Error('Invalid file: empty or null');
    }

    // Check file size limit
    if (ctx.fileSize > this.config.maxFileSize) {
      throw new Error(`File size (${Math.round(ctx.fileSize / 1024 / 1024)}MB) exceeds limit (${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`);
    }

    return ctx;
  }

  private async processValidation(ctx: PipelineContext): Promise<PipelineContext> {
    // Validate extension is known
    if (this.config.validateExtension) {
      const format = formatRegistry.get(ctx.fileExtension);
      if (!format) {
        ctx.warnings.push(`Unknown format: .${ctx.fileExtension}`);
      }
    }

    // Get MIME from extension
    ctx.mimeFromExtension = mimeEngine.getMime(ctx.fileExtension);

    return ctx;
  }

  private async processSignature(ctx: PipelineContext): Promise<PipelineContext> {
    // Read file signature
    const signature = await signatureEngine.readSignature(ctx.file);

    if (signature) {
      const detected = signatureEngine.detect(signature);
      if (detected) {
        ctx.detectedSignature = detected.format;
        ctx.mimeFromSignature = detected.mime;

        // Verify signature matches extension
        if (this.config.validateExtension) {
          const signatureResult = signatureEngine.detectAndVerify(signature, ctx.fileExtension);
          if (!signatureResult.matches && signatureResult.warning) {
            ctx.warnings.push(signatureResult.warning);
          }
        }
      }
    }

    return ctx;
  }

  private async processAlias(ctx: PipelineContext): Promise<PipelineContext> {
    // Resolve extension aliases
    ctx.canonicalExtension = aliasEngine.resolve(ctx.fileExtension);
    ctx.sourceFormat = ctx.canonicalExtension;

    // Check if extension was an alias
    if (aliasEngine.isAlias(ctx.fileExtension)) {
      ctx.warnings.push(`.${ctx.fileExtension} resolved to .${ctx.canonicalExtension}`);
    }

    return ctx;
  }

  private async processFamily(ctx: PipelineContext): Promise<PipelineContext> {
    // Get format family
    const family = familyEngine.getFamily(ctx.sourceFormat);
    if (family) {
      ctx.formatFamily = family.id;
    }

    return ctx;
  }

  private async processCapability(ctx: PipelineContext): Promise<PipelineContext> {
    // Get format capabilities
    const capabilities = capabilityRegistry.getCapabilities(ctx.sourceFormat);
    if (capabilities) {
      ctx.capabilities = capabilities as unknown as Record<string, unknown>;
    }

    // Get conversion warnings
    const conversionWarnings = capabilityRegistry.getConversionWarnings(ctx.sourceFormat, ctx.targetFormat);
    ctx.warnings.push(...conversionWarnings);

    return ctx;
  }

  private async processProvider(ctx: PipelineContext): Promise<PipelineContext> {
    // Determine operation
    ctx.operation = conversionRegistry.inferOperation(ctx.sourceFormat, ctx.targetFormat);

    // Select provider
    const request: ConversionRequest = {
      sourceFormat: ctx.sourceFormat,
      targetFormat: ctx.targetFormat,
      operation: ctx.operation,
      fileSize: ctx.fileSize,
      isPremium: ctx.isPremium,
      isBatch: ctx.isBatch,
      requiresQuality: true,
    };

    const selection = providerFallbackEngine.selectProvider(request);
    ctx.provider = selection.provider;
    ctx.fallbackProvider = selection.fallback ?? undefined;

    return ctx;
  }

  private async processConversion(ctx: PipelineContext): Promise<PipelineContext> {
    // This is a placeholder - actual conversion happens in the conversion service
    // The pipeline orchestrates, the service executes

    ctx.outputFileName = this.generateOutputFileName(ctx.fileName, ctx.targetFormat);

    return ctx;
  }

  private async processPreview(ctx: PipelineContext): Promise<PipelineContext> {
    // Check if preview is supported
    if (ctx.outputBlob) {
      const format = formatRegistry.get(ctx.targetFormat);
      ctx.hasPreview = format?.browserNative ?? false;
    }

    return ctx;
  }

  private async processCache(ctx: PipelineContext): Promise<PipelineContext> {
    // Cache is handled by cache service
    // This stage marks that caching should happen

    return ctx;
  }

  private async processDownload(ctx: PipelineContext): Promise<PipelineContext> {
    // Generate download URL/object URL
    if (ctx.outputBlob) {
      ctx.downloadUrl = URL.createObjectURL(ctx.outputBlob);
    }

    return ctx;
  }

  private async processAnalytics(ctx: PipelineContext): Promise<PipelineContext> {
    // Analytics is handled by analytics service
    // This stage marks that event should be recorded

    return ctx;
  }

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private extractExtension(filename: string): string {
    const ext = filename.split('.').pop() ?? '';
    return ext.toLowerCase().replace(/^\./, '');
  }

  private generateOutputFileName(originalName: string, targetExt: string): string {
    const baseName = originalName.replace(/\.[^.]+$/, '');
    return `${baseName}.${targetExt}`;
  }

  private isCriticalStage(stage: PipelineStage): boolean {
    return ['upload', 'validation', 'conversion'].includes(stage);
  }

  /**
   * Get pipeline stage order
   */
  getStageOrder(): PipelineStage[] {
    return [
      'upload',
      'validation',
      'signature',
      'alias',
      'family',
      'capability',
      'provider',
      'conversion',
      'preview',
      'cache',
      'download',
      'analytics',
    ];
  }

  /**
   * Get estimated duration for pipeline
   */
  estimateDuration(sourceFormat: string, targetFormat: string, fileSize: number): number {
    const operation = conversionRegistry.inferOperation(sourceFormat, targetFormat);

    // Base times by category
    let baseTime = 1000;
    if (operation.startsWith('image')) baseTime = 500;
    else if (operation.startsWith('video')) baseTime = 5000;
    else if (operation.startsWith('audio')) baseTime = 2000;
    else if (operation.startsWith('pdf')) baseTime = 1000;
    else if (operation.startsWith('doc')) baseTime = 3000;
    else if (operation.startsWith('ebook')) baseTime = 2000;

    // Scale by file size
    const sizeMB = fileSize / (1024 * 1024);
    return baseTime + (sizeMB * 100);
  }
}

export const pipelineEngine = new PipelineEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export async function executePipeline(
  file: File,
  targetFormat: string,
  options?: {
    jobId?: string;
    sessionId?: string;
    userId?: string;
    isPremium?: boolean;
    isBatch?: boolean;
    forceProvider?: ProviderType;
  }
): Promise<PipelineResult> {
  return pipelineEngine.execute(file, targetFormat, options);
}

export function getPipelineStages(): PipelineStage[] {
  return pipelineEngine.getStageOrder();
}
