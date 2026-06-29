/**
 * lib/providers/base-provider.ts
 * Base provider implementation
 */

import type {
  IConversionProvider,
  ProviderCapabilities,
  ProviderHealth,
} from '../types/providers';
import type { ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';

// ---------------------------------------------------------------------------
// ABSTRACT BASE PROVIDER
// ---------------------------------------------------------------------------

export abstract class BaseProvider implements IConversionProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: 'client' | 'server' | 'external';
  abstract readonly capabilities: ProviderCapabilities;

  /**
   * Check if this provider can handle the job
   */
  async canHandle(job: ConversionJob): Promise<boolean> {
    // Check file count
    if (job.files.length > this.capabilities.maxFiles) {
      return false;
    }

    // Check file sizes
    for (const file of job.files) {
      if (file.size > this.capabilities.maxFileSize) {
        return false;
      }
    }

    // Check operation support
    const [domain] = job.operation.split(':');
    const opSupported = this.capabilities.supportsOperations.some(op =>
      op.startsWith(domain) || op === job.operation
    );
    if (!opSupported) {
      return false;
    }

    // Check premium requirement
    if (this.capabilities.premiumOnly && job.mode !== 'premium') {
      return false;
    }

    return true;
  }

  /**
   * Execute the conversion - must be implemented by subclass
   */
  abstract execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult>;

  /**
   * Estimate processing time
   */
  estimateTime(job: ConversionJob): number {
    // Default estimation based on file size
    const totalBytes = job.files.reduce((sum, f) => sum + f.size, 0);
    const mb = totalBytes / (1024 * 1024);

    switch (this.capabilities.estimatedSpeed) {
      case 'fast': return mb * 100; // 100ms per MB
      case 'medium': return mb * 500; // 500ms per MB
      case 'slow': return mb * 2000; // 2s per MB
    }
  }

  /**
   * Validate job before processing
   */
  async validate(job: ConversionJob): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required parameters
    if (!job.files.length) {
      errors.push('No files provided');
    }

    // Check file sizes against capability
    for (const file of job.files) {
      if (file.size > this.capabilities.maxFileSize) {
        const maxMB = Math.round(this.capabilities.maxFileSize / (1024 * 1024));
        errors.push(`File "${file.name}" exceeds ${maxMB}MB limit`);
      }
    }

    // Check file count
    if (job.files.length > this.capabilities.maxFiles) {
      errors.push(`Maximum ${this.capabilities.maxFiles} files allowed`);
    }

    // Check premium requirement
    if (this.capabilities.premiumOnly && job.mode !== 'premium') {
      errors.push('Premium subscription required');
    }

    // Run subclass validation
    const subclassErrors = await this.validateJob(job);
    errors.push(...subclassErrors);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Subclass-specific validation - override to add custom validation
   */
  protected async validateJob(_job: ConversionJob): Promise<string[]> {
    return [];
  }

  /**
   * Get health status - override for server/external providers
   */
  async getHealth(): Promise<ProviderHealth> {
    return {
      id: this.id,
      status: 'healthy',
      lastCheck: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  /**
   * Create a successful result
   */
  protected success(
    blob: Blob,
    filename: string,
    mimeType: string
  ): ConversionResult {
    return { success: true, blob, filename, mimeType };
  }

  /**
   * Create a failure result
   */
  protected failure(
    error: string,
    errorCode: ConversionResult['errorCode']
  ): ConversionResult {
    return { success: false, error, errorCode };
  }

  /**
   * Report progress
   */
  protected reportProgress(
    jobId: string,
    stage: ConversionProgress['stage'],
    progress: number,
    message?: string,
    onProgress?: (p: ConversionProgress) => void
  ): void {
    onProgress?.({
      jobId,
      stage,
      progress,
      message,
    });
  }
}

// ---------------------------------------------------------------------------
// PROVIDER FACTORY
// ---------------------------------------------------------------------------

export type ProviderClass = new () => IConversionProvider;

class ProviderFactory {
  private providers: Map<string, ProviderClass> = new Map();

  /**
   * Register a provider class
   */
  register(id: string, providerClass: ProviderClass): void {
    this.providers.set(id, providerClass);
  }

  /**
   * Create a provider instance
   */
  create(id: string): IConversionProvider | undefined {
    const ProviderClass = this.providers.get(id);
    return ProviderClass ? new ProviderClass() : undefined;
  }

  /**
   * Get all registered provider IDs
   */
  getRegisteredIds(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerFactory = new ProviderFactory();
