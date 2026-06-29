/**
 * lib/core/engine-base.ts
 * Base engine abstraction
 */

import type { ConversionJob, ConversionResult, ConversionProgress, ConversionDomain } from '../types/conversion';

// ---------------------------------------------------------------------------
// ENGINE INTERFACE
// ---------------------------------------------------------------------------

export interface IEngine {
  readonly domain: ConversionDomain;
  readonly name: string;

  /**
   * Process a conversion job
   */
  process(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult>;

  /**
   * Check if engine can handle the operation
   */
  canHandle(operation: string): boolean;

  /**
   * Get supported operations
   */
  getSupportedOperations(): string[];
}

// ---------------------------------------------------------------------------
// ABSTRACT BASE ENGINE
// ---------------------------------------------------------------------------

export abstract class BaseEngine implements IEngine {
  abstract readonly domain: ConversionDomain;
  abstract readonly name: string;

  protected supportedOperations: Set<string>;

  constructor(operations: string[]) {
    this.supportedOperations = new Set(operations);
  }

  abstract process(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult>;

  canHandle(operation: string): boolean {
    return this.supportedOperations.has(operation);
  }

  getSupportedOperations(): string[] {
    return Array.from(this.supportedOperations);
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  protected getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  protected buildOutputFilename(original: string, newExt: string): string {
    const base = original.replace(/\.[^/.]+$/, '');
    return `${base}.${newExt}`;
  }

  protected reportProgress(
    jobId: string,
    progress: number,
    stage: ConversionProgress['stage'],
    onProgress?: (progress: ConversionProgress) => void
  ): void {
    onProgress?.({
      jobId,
      stage,
      progress,
    });
  }
}

// ---------------------------------------------------------------------------
// ENGINE TYPES
// ---------------------------------------------------------------------------

export type EngineClass = new () => IEngine;

export interface EngineConfig {
  domain: ConversionDomain;
  priority: number;
  lazy: boolean;
}
