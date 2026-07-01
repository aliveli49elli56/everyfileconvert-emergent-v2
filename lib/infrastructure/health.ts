/**
 * lib/infrastructure/health.ts
 *
 * Phase 6D-1 — Infrastructure Health & Lifecycle Manager
 *
 * Responsibilities:
 *   - Bootstrap all infrastructure providers in dependency order (topological sort)
 *   - Run health checks and aggregate status
 *   - Expose initialize() / health() / shutdown() lifecycle methods
 *   - Register all providers into the DI container and InfrastructureRegistry
 *
 * Initialization order:
 *   Providers declare their dependencies via ProviderMetadata.dependencies.
 *   The InfrastructureRegistry performs a topological sort to determine
 *   initialization order. Future providers are automatically ordered when
 *   they declare dependencies — no code change needed.
 *
 * Browser mode:
 *   When all ENABLE_* flags are false, every provider is a memory/stub.
 *   initialize() still runs normally — all providers report 'healthy'.
 *   The app behaves identically to pre-Phase 6D behavior.
 */

import type {
  ProviderHealthCheck,
  InfrastructureHealthReport,
  ProviderHealthStatus,
  InfrastructureLifecycleCallback,
} from './types';
import { infrastructureRegistry } from '../registry/infrastructure-registry';
import { container, SERVICE_TOKENS } from '../di';
import { infrastructureFlagEngine } from '../engine/feature-flag-engine';
import { isBrowserOnlyMode } from '../config/infrastructure-config';

// ── Provider imports (Part 1) ─────────────────────────────────────────────
import { stubAuthProvider }          from './providers/auth-provider';
import { stubPaymentProvider }       from './providers/payment-provider';
import { memoryUserRepository }      from './providers/user-repository';
import { memoryDatabaseProvider }    from './providers/database-provider';
import { memoryCacheProvider }       from './providers/cache-provider';
import { memoryQueueProvider }       from './providers/queue-provider';
import { browserStorageProvider }    from './providers/storage-provider';
import { stubNotificationProvider }  from './providers/notification-provider';
import { consoleLogger }             from './providers/logging-provider';
import { consoleMonitoringProvider } from './providers/monitoring-provider';
import { stubSearchProvider }        from './providers/search-provider';
import { stubAIProvider }            from './providers/ai-provider';
import { stubCDNProvider }           from './providers/cdn-provider';

// ── Provider imports (Part 2) ─────────────────────────────────────────────
import { stubBillingProvider }            from './providers/billing-provider';
import {
  stubOAuthProvider,
  stubMagicLinkProvider,
  stubApiKeyProvider,
}                                         from './providers/auth-extended';
import { memoryRedisAdapter }             from './providers/redis-adapter';
import { stubFFmpegServerProvider }       from './providers/server/ffmpeg-server-provider';
import { stubLibreOfficeProvider }        from './providers/server/libreoffice-provider';
import { stubGhostscriptProvider }        from './providers/server/ghostscript-provider';
import { stubSharpProvider }              from './providers/server/sharp-provider';
import { stubPuppeteerProvider }          from './providers/server/puppeteer-provider';
import {
  stubCalibreProvider,
  stubOCRProvider,
  stubAIProcessingProvider,
}                                         from './providers/server/calibre-provider';
import { memoryConversionRepository }     from './providers/repositories/conversion-repository';
import { memoryHistoryRepository }        from './providers/repositories/history-repository';
import { memoryUsageRepository }          from './providers/repositories/usage-repository';
import { memorySubscriptionRepository }   from './providers/repositories/subscription-repository';
import { memoryBullMQProvider }           from './providers/queue/bullmq-provider';
import { workerRegistry as workerReg }    from './providers/queue/worker-registry';
import { stubS3StorageProvider }          from './providers/storage/s3-storage-provider';
import { stubLocalStorageProvider }       from './providers/storage/local-storage-provider';
import { stubMinioStorageProvider }       from './providers/storage/minio-storage-provider';

// ── Part 2 expanded health types ────────────────────────────────────────────

export interface ReadinessCheck {
  name:    string;
  ok:      boolean;
  reason?: string;
}

export interface ReadinessReport {
  ready:        boolean;
  checks:       ReadinessCheck[];
  failedChecks: string[];
  generatedAt:  string;
}

export interface LivenessReport {
  alive:              boolean;
  uptimeMs:           number;
  isBrowserMode:      boolean;
  registeredServices: number;
}

export interface DependencyNode {
  id:          string;
  displayName: string;
  dependsOn:   string[];
  dependents:  string[];
  enabled:     boolean;
  priority:    number;
}

export interface DependencyGraph {
  nodes:               DependencyNode[];
  edges:               Array<{ from: string; to: string }>;
  initializationOrder: string[];
  totalNodes:          number;
  totalEdges:          number;
}

export interface ProviderDiagnostic {
  id:                      string;
  displayName:             string;
  version:                 string;
  enabled:                 boolean;
  healthStatus:            ProviderHealthStatus;
  capabilities:            string[];
  futureProvider:          string | null;
  isRegisteredInContainer: boolean;
  isCached:                boolean;
  priority:                number;
  dependencies:            string[];
  tags:                    string[];
}

export interface ProviderDiagnosticReport {
  generatedAt:           string;
  totalProviders:        number;
  registeredInContainer: number;
  cachedSingletons:      number;
  enabledProviders:      number;
  providers:             ProviderDiagnostic[];
}

export interface FeatureFlagReport {
  generatedAt:   string;
  flags:         import('../engine/feature-flag-engine').InfrastructureFlagEvaluation[];
  enabledCount:  number;
  disabledCount: number;
  isBrowserMode: boolean;
}

// ---------------------------------------------------------------------------
// LIFECYCLE MANAGER
// ---------------------------------------------------------------------------

class InfrastructureHealthManager {
  private initialized = false;
  private lifecycleCallbacks: InfrastructureLifecycleCallback[] = [];
  private lastReport: InfrastructureHealthReport | null = null;
  private readonly startedAt = Date.now();

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  onLifecycleEvent(cb: InfrastructureLifecycleCallback): void {
    this.lifecycleCallbacks.push(cb);
  }

  private emit(event: Parameters<InfrastructureLifecycleCallback>[0], metadata?: unknown): void {
    for (const cb of this.lifecycleCallbacks) {
      try { cb(event, metadata); } catch { /* lifecycle callbacks must not crash app */ }
    }
  }

  // ── Registration ───────────────────────────────────────────────────────────

  private registerAllProviders(): void {
    const isEnabled = (flag: Parameters<typeof infrastructureFlagEngine.isEnabled>[0]) =>
      infrastructureFlagEngine.isEnabled(flag);

    // ── Auth ─────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.AuthProvider,
      factory: () => stubAuthProvider,
      scope:   'singleton',
      metadata: { name: 'AuthProvider', isInfrastructure: true, tags: ['auth'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.AuthProvider.id,
      metadata: {
        ...stubAuthProvider.getMetadata(),
        enabled: isEnabled('ENABLE_AUTH'),
      },
    });

    // ── Payments ─────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.PaymentProvider,
      factory: () => stubPaymentProvider,
      scope:   'singleton',
      metadata: { name: 'PaymentProvider', isInfrastructure: true, tags: ['payments'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.PaymentProvider.id,
      metadata: {
        ...stubPaymentProvider.getMetadata(),
        enabled: isEnabled('ENABLE_PAYMENTS'),
      },
    });

    // ── User Repository ───────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.UserRepository,
      factory: () => memoryUserRepository,
      scope:   'singleton',
      metadata: { name: 'UserRepository', isInfrastructure: true, tags: ['db', 'repository'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.UserRepository.id,
      metadata: {
        ...memoryUserRepository.getMetadata(),
        enabled: isEnabled('ENABLE_DB'),
      },
    });

    // ── Database ─────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.DatabaseProvider,
      factory: () => memoryDatabaseProvider,
      scope:   'singleton',
      metadata: { name: 'DatabaseProvider', isInfrastructure: true, tags: ['db'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.DatabaseProvider.id,
      metadata: {
        ...memoryDatabaseProvider.getMetadata(),
        enabled: isEnabled('ENABLE_DB'),
      },
    });

    // ── Cache ─────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.CacheProvider,
      factory: () => memoryCacheProvider,
      scope:   'singleton',
      metadata: { name: 'CacheProvider', isInfrastructure: true, tags: ['cache', 'redis'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.CacheProvider.id,
      metadata: {
        ...memoryCacheProvider.getMetadata(),
        enabled: isEnabled('ENABLE_REDIS'),
      },
    });

    // ── Queue ─────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.QueueProvider,
      factory: () => memoryQueueProvider,
      scope:   'singleton',
      metadata: { name: 'QueueProvider', isInfrastructure: true, tags: ['queue'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.QueueProvider.id,
      metadata: {
        ...memoryQueueProvider.getMetadata(),
        enabled: isEnabled('ENABLE_QUEUE'),
      },
    });

    // ── Storage ───────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.StorageProvider,
      factory: () => browserStorageProvider,
      scope:   'singleton',
      metadata: { name: 'StorageProvider', isInfrastructure: true, tags: ['storage', 's3'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.StorageProvider.id,
      metadata: {
        ...browserStorageProvider.getMetadata(),
        enabled: isEnabled('ENABLE_STORAGE'),
      },
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.NotificationProvider,
      factory: () => stubNotificationProvider,
      scope:   'singleton',
      metadata: { name: 'NotificationProvider', isInfrastructure: true, tags: ['notifications', 'email'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.NotificationProvider.id,
      metadata: {
        ...stubNotificationProvider.getMetadata(),
        enabled: isEnabled('ENABLE_NOTIFICATIONS'),
      },
    });

    // ── Logger ────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.Logger,
      factory: () => consoleLogger,
      scope:   'singleton',
      metadata: { name: 'Logger', isInfrastructure: true, tags: ['logging'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.Logger.id,
      metadata: { ...consoleLogger.getMetadata() },  // always enabled
    });

    // ── Monitoring ────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.MonitoringProvider,
      factory: () => consoleMonitoringProvider,
      scope:   'singleton',
      metadata: { name: 'MonitoringProvider', isInfrastructure: true, tags: ['monitoring', 'apm'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.MonitoringProvider.id,
      metadata: { ...consoleMonitoringProvider.getMetadata() },  // always enabled
    });

    // ── Search ────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.SearchProvider,
      factory: () => stubSearchProvider,
      scope:   'singleton',
      metadata: { name: 'SearchProvider', isInfrastructure: true, tags: ['search'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.SearchProvider.id,
      metadata: {
        ...stubSearchProvider.getMetadata(),
        enabled: isEnabled('ENABLE_SEARCH'),
      },
    });

    // ── AI ────────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.AIProvider,
      factory: () => stubAIProvider,
      scope:   'singleton',
      metadata: { name: 'AIProvider', isInfrastructure: true, tags: ['ai'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.AIProvider.id,
      metadata: {
        ...stubAIProvider.getMetadata(),
        enabled: isEnabled('ENABLE_AI'),
      },
    });

    // ── CDN ────────────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.CDNProvider,
      factory: () => stubCDNProvider,
      scope:   'singleton',
      metadata: { name: 'CDNProvider', isInfrastructure: true, tags: ['cdn'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.CDNProvider.id,
      metadata: {
        ...stubCDNProvider.getMetadata(),
        enabled: isEnabled('ENABLE_CDN'),
      },
    });

    // Wire registry to container for cross-lookup
    infrastructureRegistry.setContainer(container);

    // Register all Part 2 providers
    this.registerPart2Providers();
  }

  // ── Part 2 Provider Registration ───────────────────────────────────────────

  /**
   * Registers all Phase 6D-1 Part 2 infrastructure providers.
   * Called from registerAllProviders() — completely additive.
   * Every provider falls back to Memory/Stub when ENABLE_* is false.
   */
  private registerPart2Providers(): void {
    const isEnabled = (flag: Parameters<typeof infrastructureFlagEngine.isEnabled>[0]) =>
      infrastructureFlagEngine.isEnabled(flag);

    // ── Billing ────────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.BillingProvider,
      factory: () => stubBillingProvider,
      scope:   'singleton',
      metadata: { name: 'BillingProvider', isInfrastructure: true, tags: ['billing', 'payments'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.BillingProvider.id,
      metadata: { ...stubBillingProvider.getMetadata(), enabled: isEnabled('ENABLE_PAYMENTS') },
    });

    // ── Redis Adapter ──────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.RedisAdapter,
      factory: () => memoryRedisAdapter,
      scope:   'singleton',
      metadata: { name: 'RedisAdapter', isInfrastructure: true, tags: ['redis', 'cache'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.RedisAdapter.id,
      metadata: { ...memoryRedisAdapter.getMetadata(), enabled: isEnabled('ENABLE_REDIS') },
    });

    // ── OAuth Provider ────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.OAuthProvider,
      factory: () => stubOAuthProvider,
      scope:   'singleton',
      metadata: { name: 'OAuthProvider', isInfrastructure: true, tags: ['auth', 'oauth'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.OAuthProvider.id,
      metadata: { ...stubOAuthProvider.getMetadata(), enabled: isEnabled('ENABLE_AUTH') },
    });

    // ── Magic Link Provider ────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.MagicLinkProvider,
      factory: () => stubMagicLinkProvider,
      scope:   'singleton',
      metadata: { name: 'MagicLinkProvider', isInfrastructure: true, tags: ['auth', 'magic-link'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.MagicLinkProvider.id,
      metadata: { ...stubMagicLinkProvider.getMetadata(), enabled: isEnabled('ENABLE_AUTH') },
    });

    // ── API Key Provider ───────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.ApiKeyProvider,
      factory: () => stubApiKeyProvider,
      scope:   'singleton',
      metadata: { name: 'ApiKeyProvider', isInfrastructure: true, tags: ['auth', 'api-key'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.ApiKeyProvider.id,
      metadata: { ...stubApiKeyProvider.getMetadata(), enabled: isEnabled('ENABLE_AUTH') },
    });

    // ── BullMQ Provider ────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.BullMQProvider,
      factory: () => memoryBullMQProvider,
      scope:   'singleton',
      metadata: { name: 'BullMQProvider', isInfrastructure: true, tags: ['queue', 'bullmq'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.BullMQProvider.id,
      metadata: { ...memoryBullMQProvider.getMetadata(), enabled: isEnabled('ENABLE_QUEUE') },
    });

    // ── Worker Registry ────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.WorkerRegistry,
      factory: () => workerReg,
      scope:   'singleton',
      metadata: { name: 'WorkerRegistry', isInfrastructure: true, tags: ['queue', 'workers'] },
    });

    // ── S3 Storage ────────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.S3StorageProvider,
      factory: () => stubS3StorageProvider,
      scope:   'singleton',
      metadata: { name: 'S3StorageProvider', isInfrastructure: true, tags: ['storage', 's3'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.S3StorageProvider.id,
      metadata: { ...stubS3StorageProvider.getMetadata(), enabled: isEnabled('ENABLE_STORAGE') },
    });

    // ── Local Storage ─────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.LocalStorageProvider,
      factory: () => stubLocalStorageProvider,
      scope:   'singleton',
      metadata: { name: 'LocalStorageProvider', isInfrastructure: true, tags: ['storage', 'local'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.LocalStorageProvider.id,
      metadata: { ...stubLocalStorageProvider.getMetadata(), enabled: isEnabled('ENABLE_LOCAL_STORAGE') },
    });

    // ── MinIO Storage ─────────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.MinioStorageProvider,
      factory: () => stubMinioStorageProvider,
      scope:   'singleton',
      metadata: { name: 'MinioStorageProvider', isInfrastructure: true, tags: ['storage', 'minio'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.MinioStorageProvider.id,
      metadata: { ...stubMinioStorageProvider.getMetadata(), enabled: isEnabled('ENABLE_STORAGE') },
    });

    // ── Conversion Repository ─────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.ConversionRepository,
      factory: () => memoryConversionRepository,
      scope:   'singleton',
      metadata: { name: 'ConversionRepository', isInfrastructure: true, tags: ['db', 'repository'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.ConversionRepository.id,
      metadata: { ...memoryConversionRepository.getMetadata(), enabled: isEnabled('ENABLE_DB') },
    });

    // ── History Repository ────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.HistoryRepository,
      factory: () => memoryHistoryRepository,
      scope:   'singleton',
      metadata: { name: 'HistoryRepository', isInfrastructure: true, tags: ['db', 'repository'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.HistoryRepository.id,
      metadata: { ...memoryHistoryRepository.getMetadata(), enabled: isEnabled('ENABLE_DB') },
    });

    // ── Usage Repository ──────────────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.UsageRepository,
      factory: () => memoryUsageRepository,
      scope:   'singleton',
      metadata: { name: 'UsageRepository', isInfrastructure: true, tags: ['db', 'repository'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.UsageRepository.id,
      metadata: { ...memoryUsageRepository.getMetadata(), enabled: isEnabled('ENABLE_DB') },
    });

    // ── Subscription Repository ───────────────────────────────────────────
    container.register({
      token:   SERVICE_TOKENS.SubscriptionRepository,
      factory: () => memorySubscriptionRepository,
      scope:   'singleton',
      metadata: { name: 'SubscriptionRepository', isInfrastructure: true, tags: ['db', 'repository'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.SubscriptionRepository.id,
      metadata: { ...memorySubscriptionRepository.getMetadata(), enabled: isEnabled('ENABLE_DB') },
    });

    // ── Server Providers ──────────────────────────────────────────────────
    // Registered in container for DI access. Also in infrastructureRegistry for
    // health monitoring. serverProviderRegistry (separate) handles format routing.

    container.register({
      token:   SERVICE_TOKENS.FFmpegServerProvider,
      factory: () => stubFFmpegServerProvider,
      scope:   'singleton',
      metadata: { name: 'FFmpegServerProvider', isInfrastructure: true, tags: ['server', 'video', 'audio'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.FFmpegServerProvider.id,
      metadata: { ...stubFFmpegServerProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.LibreOfficeProvider,
      factory: () => stubLibreOfficeProvider,
      scope:   'singleton',
      metadata: { name: 'LibreOfficeProvider', isInfrastructure: true, tags: ['server', 'document'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.LibreOfficeProvider.id,
      metadata: { ...stubLibreOfficeProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.GhostscriptProvider,
      factory: () => stubGhostscriptProvider,
      scope:   'singleton',
      metadata: { name: 'GhostscriptProvider', isInfrastructure: true, tags: ['server', 'pdf'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.GhostscriptProvider.id,
      metadata: { ...stubGhostscriptProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.SharpProvider,
      factory: () => stubSharpProvider,
      scope:   'singleton',
      metadata: { name: 'SharpProvider', isInfrastructure: true, tags: ['server', 'image'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.SharpProvider.id,
      metadata: { ...stubSharpProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.PuppeteerProvider,
      factory: () => stubPuppeteerProvider,
      scope:   'singleton',
      metadata: { name: 'PuppeteerProvider', isInfrastructure: true, tags: ['server', 'document', 'pdf'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.PuppeteerProvider.id,
      metadata: { ...stubPuppeteerProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.CalibreProvider,
      factory: () => stubCalibreProvider,
      scope:   'singleton',
      metadata: { name: 'CalibreProvider', isInfrastructure: true, tags: ['server', 'ebook'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.CalibreProvider.id,
      metadata: { ...stubCalibreProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.OCRProvider,
      factory: () => stubOCRProvider,
      scope:   'singleton',
      metadata: { name: 'OCRProvider', isInfrastructure: true, tags: ['server', 'ocr'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.OCRProvider.id,
      metadata: { ...stubOCRProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });

    container.register({
      token:   SERVICE_TOKENS.AIProcessingProvider,
      factory: () => stubAIProcessingProvider,
      scope:   'singleton',
      metadata: { name: 'AIProcessingProvider', isInfrastructure: true, tags: ['server', 'ai'] },
    });
    infrastructureRegistry.register({
      tokenId:  SERVICE_TOKENS.AIProcessingProvider.id,
      metadata: { ...stubAIProcessingProvider.getMetadata(), enabled: isEnabled('ENABLE_SERVER_PROVIDERS') },
    });
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  /**
   * Initialize all infrastructure providers in dependency order.
   * Safe to call multiple times — only runs once.
   *
   * Browser mode: all providers are memory/stubs → completes instantly.
   * Server mode: real providers connect to their external services.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.emit('initializing');

    this.registerAllProviders();

    // Get initialization order from registry (topological sort on dependencies)
    const order = infrastructureRegistry.getInitializationOrder();

    // Resolve providers in dependency order to warm singleton cache
    for (const providerId of order) {
      const entry = infrastructureRegistry.get(providerId);
      if (!entry) continue;
      try {
        // Touch the container to trigger singleton creation
        // (providers are registered by tokenId which maps to SERVICE_TOKENS)
        const token = Object.values(SERVICE_TOKENS).find(t => t.id === entry.tokenId);
        if (token && container.has(token)) {
          container.resolve(token as import('../di/service-registration').ServiceToken<unknown>);
        }
      } catch {
        // Provider initialization failure should not block browser mode
        consoleLogger.warn(`Infrastructure provider init warning: ${providerId}`);
      }
    }

    this.initialized = true;
    this.emit('initialized', {
      providerCount: infrastructureRegistry.count(),
      isBrowserMode: isBrowserOnlyMode(),
    });
  }

  // ── Health Check ───────────────────────────────────────────────────────────

  /**
   * Run a health check against all registered providers.
   * For memory/stub providers, health is always 'healthy'.
   * For real providers (Phase 6D-2+), ping actual services.
   */
  async health(): Promise<InfrastructureHealthReport> {
    if (!this.initialized) await this.initialize();

    this.emit('health-check');

    const providers: ProviderHealthCheck[] = [];
    const now = new Date().toISOString();

    for (const registration of infrastructureRegistry.getInfrastructureServices()) {
      const { metadata } = registration;
      const startTime = Date.now();

      let status: ProviderHealthStatus = metadata.healthStatus;
      let error: string | undefined;

      try {
        // Memory/stub providers are inherently healthy
        // Real providers (future) will override this with actual pings
        if (!metadata.enabled || metadata.healthStatus === 'unknown') {
          status = metadata.enabled ? 'healthy' : 'unknown';
        }
      } catch (e) {
        status = 'unavailable';
        error  = e instanceof Error ? e.message : String(e);
      }

      providers.push({
        providerId:     metadata.id,
        displayName:    metadata.displayName,
        status,
        enabled:        metadata.enabled,
        capabilities:   metadata.capabilities,
        futureProvider: metadata.futureProvider,
        checkedAt:      now,
        latencyMs:      Date.now() - startTime,
        error,
      });
    }

    const enabledCount = providers.filter(p => p.enabled).length;
    const unhealthy    = providers.filter(p => p.status === 'unavailable' || p.status === 'degraded');
    const overallStatus: ProviderHealthStatus =
      unhealthy.length > 0 ? 'degraded' : 'healthy';

    const report: InfrastructureHealthReport = {
      overallStatus,
      generatedAt:       now,
      totalProviders:    providers.length,
      enabledProviders:  enabledCount,
      stubProviders:     providers.length - enabledCount,
      providers,
      isBrowserOnlyMode: isBrowserOnlyMode(),
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Get the most recent health report without re-running checks.
   */
  getLastReport(): InfrastructureHealthReport | null {
    return this.lastReport;
  }

  // ── Shutdown ───────────────────────────────────────────────────────────────

  /**
   * Gracefully shut down all infrastructure providers.
   * For memory/stub providers, this is a no-op.
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    this.emit('shutting-down');

    // Shut down providers in reverse initialization order
    const order = [...infrastructureRegistry.getInitializationOrder()].reverse();

    for (const providerId of order) {
      const entry = infrastructureRegistry.get(providerId);
      if (!entry) continue;
      try {
        // Providers with a close() method get called (e.g. database)
        const token = Object.values(SERVICE_TOKENS).find(t => t.id === entry.tokenId);
        if (token && container.has(token)) {
          const instance = container.resolve(token as import('../di/service-registration').ServiceToken<unknown>);
          if (instance && typeof (instance as Record<string, unknown>)['close'] === 'function') {
            await (instance as { close: () => Promise<void> }).close();
          }
        }
      } catch {
        // Shutdown errors are logged but do not block remaining shutdowns
      }
    }

    this.initialized = false;
    this.emit('shutdown');
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  isInitialized(): boolean {
    return this.initialized;
  }

  // ── Readiness Probe ────────────────────────────────────────────────────────

  /**
   * Kubernetes-compatible readiness probe.
   * Returns ready=true when all required services are initialized and healthy.
   * In browser/stub mode: always ready (no external dependencies required).
   */
  async readinessProbe(): Promise<ReadinessReport> {
    if (!this.initialized) await this.initialize();

    const now = new Date().toISOString();
    const checks: ReadinessCheck[] = [];

    // Check 1: DI container has registered services
    const registeredCount = container.listRegistered().length;
    checks.push({
      name:   'di-container',
      ok:     registeredCount > 0,
      reason: registeredCount === 0 ? 'DI container has no registrations' : undefined,
    });

    // Check 2: Infrastructure registry has providers
    const infraCount = infrastructureRegistry.count();
    checks.push({
      name:   'infrastructure-registry',
      ok:     infraCount > 0,
      reason: infraCount === 0 ? 'No providers in infrastructure registry' : undefined,
    });

    // Check 3: Health manager initialized
    checks.push({
      name: 'health-manager',
      ok:   this.initialized,
      reason: !this.initialized ? 'Health manager not yet initialized' : undefined,
    });

    // Check 4: Browser mode is always fully ready (no external deps)
    if (isBrowserOnlyMode()) {
      checks.push({ name: 'browser-mode', ok: true });
    }

    const failedChecks = checks.filter(c => !c.ok).map(c => c.name);

    return {
      ready:        failedChecks.length === 0,
      checks,
      failedChecks,
      generatedAt:  now,
    };
  }

  // ── Liveness Probe ─────────────────────────────────────────────────────────

  /**
   * Kubernetes-compatible liveness probe.
   * Lightweight — just confirms the process is alive and the health manager
   * is running. Does NOT re-initialize or run full health checks.
   */
  livenessProbe(): LivenessReport {
    return {
      alive:              true,   // If this runs, the process is alive
      uptimeMs:           Date.now() - this.startedAt,
      isBrowserMode:      isBrowserOnlyMode(),
      registeredServices: container.listRegistered().length,
    };
  }

  // ── Dependency Graph ────────────────────────────────────────────────────────

  /**
   * Returns the directed acyclic graph (DAG) of provider dependencies.
   * Useful for visualizing initialization order and diagnosing ordering issues.
   */
  getDependencyGraph(): DependencyGraph {
    const registrations = infrastructureRegistry.getInfrastructureServices();
    const dependentMap  = new Map<string, string[]>();

    const nodes: DependencyNode[] = registrations.map(reg => {
      const { metadata } = reg;
      const deps = metadata.dependencies ?? [];
      deps.forEach(dep => {
        if (!dependentMap.has(dep)) dependentMap.set(dep, []);
        dependentMap.get(dep)!.push(metadata.id);
      });
      return {
        id:          metadata.id,
        displayName: metadata.displayName,
        dependsOn:   deps,
        dependents:  [],  // filled in below
        enabled:     metadata.enabled,
        priority:    metadata.priority,
      };
    });

    // Backfill dependents
    nodes.forEach(node => {
      node.dependents = dependentMap.get(node.id) ?? [];
    });

    const edges: Array<{ from: string; to: string }> = [];
    nodes.forEach(node => {
      node.dependsOn.forEach(dep => edges.push({ from: node.id, to: dep }));
    });

    return {
      nodes,
      edges,
      initializationOrder: infrastructureRegistry.getInitializationOrder(),
      totalNodes:          nodes.length,
      totalEdges:          edges.length,
    };
  }

  // ── Provider Diagnostics ────────────────────────────────────────────────────

  /**
   * Returns a detailed diagnostic snapshot of all registered providers.
   * Includes DI container registration status, cache state, and metadata.
   */
  getProviderDiagnostics(): ProviderDiagnosticReport {
    const now          = new Date().toISOString();
    const registrations = infrastructureRegistry.getInfrastructureServices();
    const containerSnapshot = container.snapshot();

    const snapshotMap = new Map<string, typeof containerSnapshot[0]>();
    containerSnapshot.forEach(snap => snapshotMap.set(snap.id, snap));

    const providers: ProviderDiagnostic[] = registrations.map(reg => {
      const { metadata, tokenId } = reg;
      const snap = snapshotMap.get(tokenId);
      return {
        id:                      metadata.id,
        displayName:             metadata.displayName,
        version:                 metadata.version,
        enabled:                 metadata.enabled,
        healthStatus:            metadata.healthStatus,
        capabilities:            metadata.capabilities,
        futureProvider:          metadata.futureProvider,
        isRegisteredInContainer: !!snap,
        isCached:                snap?.isCached ?? false,
        priority:                metadata.priority,
        dependencies:            metadata.dependencies ?? [],
        tags:                    snap?.metadata.tags ?? [],
      };
    });

    return {
      generatedAt:             now,
      totalProviders:          providers.length,
      registeredInContainer:   providers.filter(p => p.isRegisteredInContainer).length,
      cachedSingletons:        providers.filter(p => p.isCached).length,
      enabledProviders:        providers.filter(p => p.enabled).length,
      providers,
    };
  }

  // ── Feature Flag Report ─────────────────────────────────────────────────────

  /**
   * Returns the current state of all 14 infrastructure feature flags.
   * In development/browser mode, all flags are false (stubs/memory providers).
   * Toggle a flag to true to switch from stub to real provider (Phase 6D-2+).
   */
  getFeatureFlagReport(): FeatureFlagReport {
    const flags = infrastructureFlagEngine.evaluateAll();
    return {
      generatedAt:   new Date().toISOString(),
      flags,
      enabledCount:  flags.filter(f => f.enabled).length,
      disabledCount: flags.filter(f => !f.enabled).length,
      isBrowserMode: isBrowserOnlyMode(),
    };
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const infrastructureHealth = new InfrastructureHealthManager();
