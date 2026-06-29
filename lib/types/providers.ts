/**
 * lib/types/providers.ts
 * Provider abstraction types
 */

import type { ConversionJob, ConversionResult, ConversionProgress } from './conversion';

/** Provider capability flags */
export interface ProviderCapabilities {
  maxFileSize: number;
  maxFiles: number;
  supportsFormats: string[];
  supportsOperations: string[];
  premiumOnly: boolean;
  requiresAuth: boolean;
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  qualityRating: 'high' | 'medium' | 'low';
}

/** Provider configuration */
export interface ProviderConfig {
  id: string;
  name: string;
  type: 'client' | 'server' | 'external';
  priority: number;
  enabled: boolean;
  premiumOnly: boolean;
  capabilities: ProviderCapabilities;
  endpoint?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

/** Abstract provider interface */
export interface IConversionProvider {
  readonly id: string;
  readonly name: string;
  readonly type: 'client' | 'server' | 'external';
  readonly capabilities: ProviderCapabilities;

  /** Check if this provider can handle the job */
  canHandle(job: ConversionJob): Promise<boolean>;

  /** Execute conversion */
  execute(job: ConversionJob, onProgress?: (p: ConversionProgress) => void): Promise<ConversionResult>;

  /** Get estimated processing time */
  estimateTime(job: ConversionJob): number;

  /** Validate job before processing */
  validate(job: ConversionJob): Promise<{ valid: boolean; errors: string[] }>;
}

/** Provider health status */
export interface ProviderHealth {
  id: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastCheck: Date;
  errorRate?: number;
  message?: string;
}

/** Provider selection result */
export interface ProviderSelection {
  provider: IConversionProvider;
  reason: string;
  alternatives: IConversionProvider[];
}

/** Provider engine selection result */
export interface ProviderSelectionResult {
  primary: string;
  fallbacks: string[];
  reason: string;
}
