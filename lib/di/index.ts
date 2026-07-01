/**
 * lib/di/index.ts
 *
 * Central DI barrel:
 *   - Exports ServiceToken, ServiceContainer, ServiceResolver, ServiceRegistration
 *   - Defines the global SERVICE_TOKENS map (all tokens in one place)
 *   - Exports the global container singleton
 *   - Registers all existing Phase 6A–6C services for backward-compatible DI access
 *
 * Backward compatibility guarantee:
 *   Existing direct imports (e.g. `import { subscriptionService } from '...'`)
 *   continue to work unchanged. This file ADDS DI access without removing
 *   any existing export or singleton.
 *
 * Rule: All future infrastructure services MUST use container.register().
 *       Direct instantiation outside the container is prohibited for
 *       new infrastructure services introduced in Phase 6D+.
 */

export { ServiceToken }          from './service-registration';
export type { ServiceRegistration, ServiceScope, ServiceRegistrationMetadata } from './service-registration';
export { ServiceContainer, CircularDependencyError, ServiceNotRegisteredError } from './service-container';
export type { ServiceSnapshot }  from './service-container';
export { ServiceResolver }       from './service-resolver';

import { ServiceToken }    from './service-registration';
import { ServiceContainer } from './service-container';
import { ServiceResolver }  from './service-resolver';

// ---------------------------------------------------------------------------
// WELL-KNOWN SERVICE TOKENS
// (Add new tokens here — one registration per token)
// ---------------------------------------------------------------------------

/**
 * Canonical token registry.
 * Import SERVICE_TOKENS wherever you need type-safe DI token access.
 *
 * @example
 *   import { SERVICE_TOKENS, container } from '@/lib/di';
 *   const sub = container.resolve(SERVICE_TOKENS.SubscriptionService);
 */
export const SERVICE_TOKENS = {
  // ── Phase 6A–6C existing services ────────────────────────────────────────
  SubscriptionService:     new ServiceToken<import('../services/subscription-service').SubscriptionService>('SubscriptionService'),
  DownloadWorkflowManager: new ServiceToken<import('../types/download-workflow').IDownloadWorkflowManager>('DownloadWorkflowManager'),
  LimitEngine:             new ServiceToken<import('../engine/limit-engine').LimitEngine>('LimitEngine'),
  QuotaEngine:             new ServiceToken<import('../engine/quota-engine').QuotaEngine>('QuotaEngine'),
  PlanResolver:            new ServiceToken<import('../engine/plan-resolver').PlanResolver>('PlanResolver'),
  ProviderSelectionEngine: new ServiceToken<import('../engine/provider-selection-engine').ProviderSelectionEngine>('ProviderSelectionEngine'),

  // ── Phase 6D-1 Part 1 — Infrastructure providers ─────────────────────────
  AuthProvider:            new ServiceToken<import('../infrastructure/providers/auth-provider').IAuthProvider>('AuthProvider'),
  PaymentProvider:         new ServiceToken<import('../infrastructure/providers/payment-provider').IPaymentProvider>('PaymentProvider'),
  UserRepository:          new ServiceToken<import('../infrastructure/providers/user-repository').IUserRepository>('UserRepository'),
  DatabaseProvider:        new ServiceToken<import('../infrastructure/providers/database-provider').IDatabaseProvider>('DatabaseProvider'),
  CacheProvider:           new ServiceToken<import('../infrastructure/providers/cache-provider').ICacheProvider>('CacheProvider'),
  QueueProvider:           new ServiceToken<import('../infrastructure/providers/queue-provider').IQueueProvider>('QueueProvider'),
  StorageProvider:         new ServiceToken<import('../infrastructure/providers/storage-provider').IStorageProvider>('StorageProvider'),
  NotificationProvider:    new ServiceToken<import('../infrastructure/providers/notification-provider').INotificationProvider>('NotificationProvider'),
  Logger:                  new ServiceToken<import('../infrastructure/providers/logging-provider').ILogger>('Logger'),
  MonitoringProvider:      new ServiceToken<import('../infrastructure/providers/monitoring-provider').IMonitoringProvider>('MonitoringProvider'),
  SearchProvider:          new ServiceToken<import('../infrastructure/providers/search-provider').ISearchProvider>('SearchProvider'),
  AIProvider:              new ServiceToken<import('../infrastructure/providers/ai-provider').IAIProvider>('AIProvider'),
  CDNProvider:             new ServiceToken<import('../infrastructure/providers/cdn-provider').ICDNProvider>('CDNProvider'),

  // ── Phase 6D-1 Part 2 — Redis ────────────────────────────────────────────
  RedisAdapter:            new ServiceToken<import('../infrastructure/providers/redis-adapter').IRedisAdapter>('RedisAdapter'),

  // ── Phase 6D-1 Part 2 — Extended Auth ────────────────────────────────────
  OAuthProvider:           new ServiceToken<import('../infrastructure/providers/auth-extended').IOAuthProvider>('OAuthProvider'),
  MagicLinkProvider:       new ServiceToken<import('../infrastructure/providers/auth-extended').IMagicLinkProvider>('MagicLinkProvider'),
  ApiKeyProvider:          new ServiceToken<import('../infrastructure/providers/auth-extended').IApiKeyProvider>('ApiKeyProvider'),

  // ── Phase 6D-1 Part 2 — Billing ──────────────────────────────────────────
  BillingProvider:         new ServiceToken<import('../infrastructure/providers/billing-provider').IBillingProvider>('BillingProvider'),

  // ── Phase 6D-1 Part 2 — Server Providers ─────────────────────────────────
  FFmpegServerProvider:    new ServiceToken<import('../infrastructure/providers/server/ffmpeg-server-provider').IFFmpegServerProvider>('FFmpegServerProvider'),
  LibreOfficeProvider:     new ServiceToken<import('../infrastructure/providers/server/libreoffice-provider').ILibreOfficeProvider>('LibreOfficeProvider'),
  GhostscriptProvider:     new ServiceToken<import('../infrastructure/providers/server/ghostscript-provider').IGhostscriptProvider>('GhostscriptProvider'),
  SharpProvider:           new ServiceToken<import('../infrastructure/providers/server/sharp-provider').ISharpProvider>('SharpProvider'),
  PuppeteerProvider:       new ServiceToken<import('../infrastructure/providers/server/puppeteer-provider').IPuppeteerProvider>('PuppeteerProvider'),
  CalibreProvider:         new ServiceToken<import('../infrastructure/providers/server/calibre-provider').ICalibreProvider>('CalibreProvider'),
  OCRProvider:             new ServiceToken<import('../infrastructure/providers/server/calibre-provider').IOCRProvider>('OCRProvider'),
  AIProcessingProvider:    new ServiceToken<import('../infrastructure/providers/server/calibre-provider').IAIProcessingProvider>('AIProcessingProvider'),

  // ── Phase 6D-1 Part 2 — Repositories ─────────────────────────────────────
  ConversionRepository:    new ServiceToken<import('../infrastructure/providers/repositories/conversion-repository').IConversionRepository>('ConversionRepository'),
  HistoryRepository:       new ServiceToken<import('../infrastructure/providers/repositories/history-repository').IHistoryRepository>('HistoryRepository'),
  UsageRepository:         new ServiceToken<import('../infrastructure/providers/repositories/usage-repository').IUsageRepository>('UsageRepository'),
  SubscriptionRepository:  new ServiceToken<import('../infrastructure/providers/repositories/subscription-repository').ISubscriptionRepository>('SubscriptionRepository'),

  // ── Phase 6D-1 Part 2 — Queue / BullMQ ───────────────────────────────────
  BullMQProvider:          new ServiceToken<import('../infrastructure/providers/queue/bullmq-provider').IBullMQProvider>('BullMQProvider'),
  WorkerRegistry:          new ServiceToken<import('../infrastructure/providers/queue/worker-registry').WorkerRegistry>('WorkerRegistry'),

  // ── Phase 6D-1 Part 2 — Extended Storage ─────────────────────────────────
  S3StorageProvider:       new ServiceToken<import('../infrastructure/providers/storage/s3-storage-provider').IS3StorageProvider>('S3StorageProvider'),
  LocalStorageProvider:    new ServiceToken<import('../infrastructure/providers/storage/local-storage-provider').ILocalStorageProvider>('LocalStorageProvider'),
  MinioStorageProvider:    new ServiceToken<import('../infrastructure/providers/storage/minio-storage-provider').IMinioStorageProvider>('MinioStorageProvider'),

  // ── Phase 6D-1 Part 2 — Engine / Registry ────────────────────────────────
  ServerProviderRegistry:  new ServiceToken<import('../registry/server-provider-registry').ServerProviderRegistry>('ServerProviderRegistry'),
  HybridProviderResolver:  new ServiceToken<import('../engine/hybrid-provider-resolver').HybridProviderResolver>('HybridProviderResolver'),
  ProviderDiscovery:       new ServiceToken<import('../infrastructure/discovery').InfrastructureProviderDiscovery>('ProviderDiscovery'),
} as const;

// ---------------------------------------------------------------------------
// GLOBAL CONTAINER SINGLETON
// ---------------------------------------------------------------------------

/**
 * The application's single DI container.
 * Import from '@/lib/di' to register or resolve services.
 */
export const container = new ServiceContainer();

/**
 * Convenience resolver wrapping the global container.
 */
export const resolver = new ServiceResolver(container);

// ---------------------------------------------------------------------------
// REGISTER EXISTING PHASE 6A–6C SERVICES
//
// These registrations wrap the already-existing module-level singletons.
// They do NOT change how existing code works — direct imports still work.
// They ADD the ability to resolve these services via DI for new code.
// ---------------------------------------------------------------------------

function registerExistingServices(): void {
  // SubscriptionService
  container.register({
    token:   SERVICE_TOKENS.SubscriptionService,
    factory: () => {
      const { subscriptionService } = require('../services/subscription-service');
      return subscriptionService;
    },
    scope: 'singleton',
    metadata: {
      name:             'SubscriptionService',
      description:      'Facade for all subscription, plan, and feature-flag queries',
      tags:             ['subscription', 'core'],
      isInfrastructure: false,
    },
  });

  // DownloadWorkflowManager
  container.register({
    token:   SERVICE_TOKENS.DownloadWorkflowManager,
    factory: () => {
      const { downloadWorkflowManager } = require('../engine/download-workflow-manager');
      return downloadWorkflowManager;
    },
    scope: 'singleton',
    metadata: {
      name:             'DownloadWorkflowManager',
      description:      'Manages post-conversion download jobs and redirects',
      tags:             ['download', 'core'],
      isInfrastructure: false,
    },
  });

  // LimitEngine
  container.register({
    token:   SERVICE_TOKENS.LimitEngine,
    factory: () => {
      const { limitEngine } = require('../engine/limit-engine');
      return limitEngine;
    },
    scope: 'singleton',
    metadata: {
      name:             'LimitEngine',
      description:      'Runtime arbiter for subscription limit decisions',
      tags:             ['subscription', 'core'],
      isInfrastructure: false,
    },
  });

  // QuotaEngine
  container.register({
    token:   SERVICE_TOKENS.QuotaEngine,
    factory: () => {
      const { quotaEngine } = require('../engine/quota-engine');
      return quotaEngine;
    },
    scope: 'singleton',
    metadata: {
      name:             'QuotaEngine',
      description:      'In-memory quota tracking (Redis-ready interface)',
      tags:             ['quota', 'core'],
      isInfrastructure: false,
    },
  });

  // PlanResolver
  container.register({
    token:   SERVICE_TOKENS.PlanResolver,
    factory: () => {
      const { planResolver } = require('../engine/plan-resolver');
      return planResolver;
    },
    scope: 'singleton',
    metadata: {
      name:             'PlanResolver',
      description:      'Resolves the active subscription plan for a user (Auth-ready)',
      tags:             ['subscription', 'auth', 'core'],
      isInfrastructure: false,
    },
  });

  // ProviderSelectionEngine
  container.register({
    token:   SERVICE_TOKENS.ProviderSelectionEngine,
    factory: () => {
      const { providerSelectionEngine } = require('../engine/provider-selection-engine');
      return providerSelectionEngine;
    },
    scope: 'singleton',
    metadata: {
      name:             'ProviderSelectionEngine',
      description:      'Metadata-driven provider selection for all conversion requests',
      tags:             ['engine', 'core'],
      isInfrastructure: false,
    },
  });
}

// Execute registration immediately when this module is imported.
// Safe to call multiple times — container.register() is idempotent per token.
registerExistingServices();

// ---------------------------------------------------------------------------
// REGISTER PHASE 6D-1 PART 2 ENGINE / REGISTRY SERVICES
//
// These are non-infrastructure engine/registry services introduced in Part 2.
// Infrastructure providers (billing, redis, oauth, bullmq, repos, server
// providers, extended storage) are registered by InfrastructureHealthManager
// in health.ts — following the same separation used for Part 1.
// ---------------------------------------------------------------------------

function registerPart2Services(): void {
  // ServerProviderRegistry — pre-populated with 8 server provider stubs
  container.register({
    token:   SERVICE_TOKENS.ServerProviderRegistry,
    factory: () => {
      const { serverProviderRegistry } = require('../registry/server-provider-registry');
      return serverProviderRegistry;
    },
    scope: 'singleton',
    metadata: {
      name:             'ServerProviderRegistry',
      description:      'Metadata-driven registry for server-side processing providers',
      tags:             ['registry', 'server'],
      isInfrastructure: false,
    },
  });

  // HybridProviderResolver — delegates to ProviderSelectionEngine, decides execution mode only
  container.register({
    token:   SERVICE_TOKENS.HybridProviderResolver,
    factory: () => {
      const { hybridProviderResolver } = require('../engine/hybrid-provider-resolver');
      return hybridProviderResolver;
    },
    scope: 'singleton',
    metadata: {
      name:             'HybridProviderResolver',
      description:      'Browser/server execution mode resolver (delegates to ProviderSelectionEngine)',
      tags:             ['engine', 'hybrid'],
      isInfrastructure: false,
    },
  });

  // ProviderDiscovery — auto-discovery engine for provider registration
  container.register({
    token:   SERVICE_TOKENS.ProviderDiscovery,
    factory: () => {
      const { providerDiscovery } = require('../infrastructure/discovery');
      return providerDiscovery;
    },
    scope: 'singleton',
    metadata: {
      name:             'ProviderDiscovery',
      description:      'Infrastructure provider auto-discovery engine',
      tags:             ['discovery', 'registry'],
      isInfrastructure: true,
    },
  });
}

registerPart2Services();
