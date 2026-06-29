/**
 * lib/providers/pdf-provider.ts
 * pdf-lib provider for PDF operations
 */

import { BaseProvider, providerFactory } from './base-provider';
import type { ProviderCapabilities } from '../types/providers';
import type { ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';

// ---------------------------------------------------------------------------
// CAPABILITIES
// ---------------------------------------------------------------------------

const PDF_CAPABILITIES: ProviderCapabilities = {
  maxFileSize: 200 * 1024 * 1024, // 200MB
  maxFiles: 20,
  supportsFormats: ['pdf'],
  supportsOperations: [
    'pdf:merge',
    'pdf:split',
    'pdf:compress',
    'pdf:protect',
    'pdf:unlock',
    'pdf:rotate',
    'pdf:watermark',
    'pdf:page-numbers',
  ],
  premiumOnly: false,
  requiresAuth: false,
  estimatedSpeed: 'fast',
  qualityRating: 'high',
};

// ---------------------------------------------------------------------------
// PDF PROVIDER
// ---------------------------------------------------------------------------

class PDFProvider extends BaseProvider {
  readonly id = 'pdf-lib';
  readonly name = 'pdf-lib';
  readonly type = 'client' as const;
  readonly capabilities = PDF_CAPABILITIES;

  async execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const { files, operation, options } = job;

    if (!files.length) {
      return this.failure('No files provided', 'INVALID_OPTIONS');
    }

    try {
      this.reportProgress(job.id, 'loading', 10, 'Loading PDF...', onProgress);

      // Use the existing PdfDocEngine for actual processing
      const { PdfDocEngine } = await import('../engine/PdfDocEngine');

      this.reportProgress(job.id, 'processing', 30, 'Processing...', onProgress);

      // Map job to PdfDocEngine format
      const result = await PdfDocEngine.process({
        files,
        op: operation as 'pdf:merge' | 'pdf:split' | 'pdf:compress' | 'pdf:protect' | 'pdf:unlock' | 'pdf:rotate' | 'pdf:to-word' | 'pdf:watermark' | 'pdf:page-numbers' | 'doc:to-pdf' | 'doc:to-text',
        options: options as Parameters<typeof PdfDocEngine.process>[0]['options'],
        onProgress: (pct) => {
          const progress = 30 + Math.round(pct * 0.6);
          this.reportProgress(job.id, 'processing', progress, 'Processing...', onProgress);
        },
      });

      this.reportProgress(job.id, 'complete', 100, 'Complete', onProgress);

      return this.success(result.blob, result.filename, result.mimeType);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF operation failed';
      return this.failure(message, 'CONVERSION_FAILED');
    }
  }

  estimateTime(job: ConversionJob): number {
    // PDF operations are generally fast
    const totalBytes = job.files.reduce((sum, f) => sum + f.size, 0);
    const mb = totalBytes / (1024 * 1024);

    // Merging is O(n), compressing is O(n)
    return mb * 50;
  }

  protected async validateJob(job: ConversionJob): Promise<string[]> {
    const errors: string[] = [];

    // Check file types
    for (const file of job.files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`File "${file.name}" is not a PDF`);
      }
    }

    // Check operation-specific requirements
    if (job.operation === 'pdf:protect') {
      if (!job.options?.password) {
        errors.push('Password required for protection');
      }
    }

    if (job.operation === 'pdf:unlock') {
      if (!job.options?.password) {
        errors.push('Password required to unlock');
      }
    }

    return errors;
  }
}

// Register with factory
providerFactory.register('pdf-lib', PDFProvider);

export { PDFProvider };
