/**
 * lib/core/provider-engine.ts
 * Provider Engine - Abstract interface for all conversion providers
 * Manages provider lifecycle, execution, and fallback chains
 */

import type {
  IConversionProvider,
  ProviderConfig,
  ProviderCapabilities,
  ProviderHealth,
  ProviderSelectionResult,
} from '../types/providers';
import type { ConversionJob, ConversionResult, ConversionProgress } from '../types/conversion';
import type { ProcessingEngine as ProcessingEngineType } from '../types/formats';

// ---------------------------------------------------------------------------
// PROVIDER ENGINE INTERFACE
// ---------------------------------------------------------------------------

export type ProcessingEngine = ProcessingEngineType;

export interface IProviderEngine {
  readonly id: ProcessingEngine;
  readonly name: string;
  readonly type: 'client' | 'server' | 'external';
  readonly capabilities: ProviderCapabilities;

  initialize(): Promise<boolean>;
  isReady(): boolean;
  execute(job: ConversionJob, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult>;
  getHealth(): Promise<ProviderHealth>;
  dispose?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// PROVIDER EXECUTION CONTEXT
// ---------------------------------------------------------------------------

export interface ProviderExecutionContext {
  jobId: string;
  startTime: number;
  attempts: number;
  maxAttempts: number;
  fallbackChain: ProcessingEngine[];
}

// ---------------------------------------------------------------------------
// PROVIDER ENGINE BASE
// ---------------------------------------------------------------------------

export abstract class ProviderEngine implements IProviderEngine {
  abstract readonly id: ProcessingEngine;
  abstract readonly name: string;
  abstract readonly type: 'client' | 'server' | 'external';
  abstract readonly capabilities: ProviderCapabilities;

  protected ready: boolean = false;
  protected health: ProviderHealth | null = null;

  async initialize(): Promise<boolean> {
    this.ready = true;
    return true;
  }

  isReady(): boolean {
    return this.ready;
  }

  abstract execute(
    job: ConversionJob,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult>;

  async getHealth(): Promise<ProviderHealth> {
    if (this.health) {
      return this.health;
    }
    return {
      id: this.id,
      status: this.ready ? 'healthy' : 'down',
      lastCheck: new Date(),
    };
  }

  protected createSuccessResult(
    blob: Blob,
    filename: string,
    mimeType: string,
    duration?: number
  ): ConversionResult {
    return {
      success: true,
      blob,
      filename,
      mimeType,
      duration,
      provider: this.name,
    };
  }

  protected createErrorResult(
    error: string,
    errorCode: ConversionResult['errorCode'],
    duration?: number
  ): ConversionResult {
    return {
      success: false,
      error,
      errorCode,
      duration,
      provider: this.name,
    };
  }

  async dispose?(): Promise<void> {
    this.ready = false;
  }
}

// ---------------------------------------------------------------------------
// PROVIDER ENGINE REGISTRY
// ---------------------------------------------------------------------------

class ProviderEngineRegistry {
  private engines: Map<ProcessingEngine, IProviderEngine> = new Map();
  private configs: Map<ProcessingEngine, ProviderConfig> = new Map();
  private healthChecks: Map<ProcessingEngine, ProviderHealth> = new Map();
  private initialized: boolean = false;

  /** Register a provider engine */
  register(engine: IProviderEngine, config?: ProviderConfig): void {
    this.engines.set(engine.id, engine);
    if (config) {
      this.configs.set(engine.id, config);
    }
  }

  /** Initialize all registered engines */
  async initializeAll(): Promise<void> {
    const results = await Promise.allSettled(
      Array.from(this.engines.values()).map(async (engine) => {
        try {
          const success = await engine.initialize();
          if (success) {
            const health = await engine.getHealth();
            this.healthChecks.set(engine.id, health);
          }
          return { id: engine.id, success };
        } catch (error) {
          return { id: engine.id, success: false, error };
        }
      })
    );

    this.initialized = true;
  }

  /** Get engine by ID */
  get(id: ProcessingEngine): IProviderEngine | undefined {
    return this.engines.get(id);
  }

  /** Get all engines */
  getAll(): IProviderEngine[] {
    return Array.from(this.engines.values());
  }

  /** Get engines by type */
  getByType(type: 'client' | 'server' | 'external'): IProviderEngine[] {
    return Array.from(this.engines.values()).filter(e => e.type === type);
  }

  /** Get ready engines */
  getReady(): IProviderEngine[] {
    return Array.from(this.engines.values()).filter(e => e.isReady());
  }

  /** Select best engine for job */
  selectBest(job: ConversionJob): ProviderSelectionResult | null {
    const ready = this.getReady();
    const eligible = ready.filter(engine => {
      const caps = engine.capabilities;

      // Check file size
      const maxSize = Math.max(...job.files.map(f => f.size));
      if (maxSize > caps.maxFileSize) return false;

      // Check file count
      if (job.files.length > caps.maxFiles) return false;

      // Check premium requirement
      if (caps.premiumOnly && job.mode !== 'premium') return false;

      // Check operation support
      const [domain] = job.operation.split(':');
      const opSupported = caps.supportsOperations.some(op =>
        op.startsWith(domain) || op === job.operation
      );
      if (!opSupported) return false;

      // Check format support
      const ext = job.files[0]?.name.split('.').pop()?.toLowerCase();
      if (ext && caps.supportsFormats.length > 0) {
        if (!caps.supportsFormats.includes(ext)) return false;
      }

      return true;
    });

    if (eligible.length === 0) {
      return null;
    }

    // Sort by type priority: client > server > external
    const typePriority: Record<string, number> = { client: 0, server: 1, external: 2 };
    eligible.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

    const primary = eligible[0];
    const fallbacks = eligible.slice(1, 4);

    return {
      primary: primary.id,
      fallbacks: fallbacks.map(e => e.id),
      reason: `Selected ${primary.name} as primary provider`,
    };
  }

  /** Execute with fallback */
  async executeWithFallback(
    job: ConversionJob,
    selection: ProviderSelectionResult,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const context: ProviderExecutionContext = {
      jobId: job.id,
      startTime: Date.now(),
      attempts: 0,
      maxAttempts: selection.fallbacks.length + 1,
      fallbackChain: [selection.primary as ProcessingEngine, ...selection.fallbacks as ProcessingEngine[]],
    };

    for (const engineId of context.fallbackChain) {
      const engine = this.engines.get(engineId);
      if (!engine || !engine.isReady()) continue;

      context.attempts++;

      try {
        onProgress?.({
          jobId: job.id,
          stage: 'processing',
          progress: 0,
          message: `Processing with ${engine.name}...`,
        });

        const result = await engine.execute(job, onProgress);

        if (result.success) {
          return result;
        }

        // If result is failure but no fallback left, return the error
        if (context.attempts >= context.maxAttempts) {
          return result;
        }

        // Try next fallback
        onProgress?.({
          jobId: job.id,
          stage: 'processing',
          progress: 0,
          message: `${engine.name} failed, trying fallback...`,
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        // If no fallback left, return error
        if (context.attempts >= context.maxAttempts) {
          return {
            success: false,
            error: `All providers failed. Last error: ${message}`,
            errorCode: 'CONVERSION_FAILED',
            duration: Date.now() - context.startTime,
          };
        }
      }
    }

    return {
      success: false,
      error: 'No suitable provider available',
      errorCode: 'UNSUPPORTED_FORMAT',
      duration: Date.now() - context.startTime,
    };
  }

  /** Check health of all engines */
  async checkHealth(): Promise<Record<ProcessingEngine, ProviderHealth>> {
    const results: Record<ProcessingEngine, ProviderHealth> = {} as any;

    await Promise.all(
      Array.from(this.engines.entries()).map(async ([id, engine]) => {
        try {
          const health = await engine.getHealth();
          results[id] = health;
          this.healthChecks.set(id, health);
        } catch (error) {
          results[id] = {
            id,
            status: 'down',
            lastCheck: new Date(),
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return results;
  }

  /** Get cached health status */
  getHealthStatus(): Map<ProcessingEngine, ProviderHealth> {
    return new Map(this.healthChecks);
  }

  /** Dispose all engines */
  async disposeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.engines.values()).map(async (engine) => {
        if (engine.dispose) {
          await engine.dispose();
        }
      })
    );
    this.initialized = false;
  }
}

export const providerEngineRegistry = new ProviderEngineRegistry();
