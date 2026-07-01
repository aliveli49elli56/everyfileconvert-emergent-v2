/**
 * lib/infrastructure/index.ts
 *
 * Barrel export for the infrastructure layer.
 *
 * Exports:
 *   - Types (ProviderMetadata, health report types, etc.)
 *   - All 13 provider interfaces and their default implementations
 *   - InfrastructureHealthManager singleton
 *   - InfrastructureRegistry singleton
 *
 * Usage:
 *   import { infrastructureHealth } from '@/lib/infrastructure';
 *   import type { ILogger } from '@/lib/infrastructure';
 */

// Types
export type {
  ProviderMetadata,
  ProviderHealthStatus,
  ProviderHealthCheck,
  InfrastructureHealthReport,
  InfrastructureProviderRegistration,
  InfrastructureLifecycleEvent,
  InfrastructureLifecycleCallback,
} from './types';

// Health & Lifecycle
export {
  infrastructureHealth,
} from './health';

export type {
  ReadinessCheck,
  ReadinessReport,
  LivenessReport,
  DependencyNode,
  DependencyGraph,
  ProviderDiagnostic,
  ProviderDiagnosticReport,
  FeatureFlagReport,
} from './health';

// Registry (infrastructure-only, does not affect existing registries)
export { infrastructureRegistry } from '../registry/infrastructure-registry';

// ── Provider interfaces and default implementations ────────────────────────

export type { IAuthProvider, AuthUser, AuthSession, AuthCredentials, AuthResult } from './providers/auth-provider';
export { StubAuthProvider, stubAuthProvider } from './providers/auth-provider';

export type {
  IPaymentProvider, PaymentIntent, Subscription, PaymentResult, CheckoutSessionRequest,
} from './providers/payment-provider';
export { StubPaymentProvider, stubPaymentProvider } from './providers/payment-provider';

export type { IUserRepository, UserRecord, UserCreateInput, UserUpdateInput } from './providers/user-repository';
export { MemoryUserRepository, memoryUserRepository } from './providers/user-repository';

export type { IDatabaseProvider, QueryResult, DatabaseTransaction, DatabaseConnectionStatus } from './providers/database-provider';
export { MemoryDatabaseProvider, memoryDatabaseProvider } from './providers/database-provider';

export type { ICacheProvider, CacheSetOptions, CacheStats } from './providers/cache-provider';
export { MemoryCacheProvider, memoryCacheProvider } from './providers/cache-provider';

export type { IQueueProvider, QueueJob, EnqueueOptions, JobStatus } from './providers/queue-provider';
export { MemoryQueueProvider, memoryQueueProvider } from './providers/queue-provider';

export type { IStorageProvider, StorageObject, UploadOptions, StorageListResult } from './providers/storage-provider';
export { BrowserStorageProvider, browserStorageProvider } from './providers/storage-provider';

export type { INotificationProvider, EmailNotification, PushNotification, NotificationResult } from './providers/notification-provider';
export { StubNotificationProvider, stubNotificationProvider } from './providers/notification-provider';

export type { ILogger, LogLevel, LogContext, LogEntry } from './providers/logging-provider';
export { ConsoleLogger, consoleLogger } from './providers/logging-provider';

export type { IMonitoringProvider, TraceSpan, ErrorContext } from './providers/monitoring-provider';
export { ConsoleMonitoringProvider, consoleMonitoringProvider } from './providers/monitoring-provider';

export type { ISearchProvider, SearchQuery, SearchResult, SearchHit } from './providers/search-provider';
export { StubSearchProvider, stubSearchProvider } from './providers/search-provider';

export type { IAIProvider, AICompletionRequest, AICompletionResult, AIEmbeddingRequest } from './providers/ai-provider';
export { StubAIProvider, stubAIProvider } from './providers/ai-provider';

export type { ICDNProvider, CDNStats, CDNUploadResult, CacheInvalidationRequest } from './providers/cdn-provider';
export { StubCDNProvider, stubCDNProvider } from './providers/cdn-provider';

// ── Part 2 provider interfaces and default implementations ─────────────────

export type {
  IBillingProvider,
  BillingCustomer, BillingSubscription, BillingInvoice,
  BillingCycle, CheckoutSession, WebhookPayload, WebhookValidationResult,
  UsageMeteringRecord, UsageSummary,
} from './providers/billing-provider';
export { StubBillingProvider, stubBillingProvider } from './providers/billing-provider';

export type {
  IOAuthProvider, IMagicLinkProvider, IApiKeyProvider,
  OAuthProvider, OAuthProfile, OAuthAuthorizationUrl, OAuthCallbackResult,
  MagicLinkRequest, MagicLinkResult, MagicLinkVerification,
  ApiKey, ApiKeyScope, ApiKeyValidationResult,
  AuthSessionData,
} from './providers/auth-extended';
export {
  StubOAuthProvider, stubOAuthProvider,
  StubMagicLinkProvider, stubMagicLinkProvider,
  StubApiKeyProvider, stubApiKeyProvider,
} from './providers/auth-extended';

export type { IRedisAdapter, RedisValue, RedisPipelineResult, RedisPipeline } from './providers/redis-adapter';
export { MemoryRedisAdapter, memoryRedisAdapter } from './providers/redis-adapter';

export type {
  IConversionRepository, ConversionRecord, ConversionCreateInput, ConversionUpdateInput,
} from './providers/repositories/conversion-repository';
export { MemoryConversionRepository, memoryConversionRepository } from './providers/repositories/conversion-repository';

export type {
  IHistoryRepository, HistoryRecord, HistoryCreateInput, HistoryEventType,
} from './providers/repositories/history-repository';
export { MemoryHistoryRepository, memoryHistoryRepository } from './providers/repositories/history-repository';

export type {
  IUsageRepository, UsageRecord, UsageCreateInput, UsageAggregate,
} from './providers/repositories/usage-repository';
export { MemoryUsageRepository, memoryUsageRepository } from './providers/repositories/usage-repository';

export type {
  ISubscriptionRepository, SubscriptionRecord, SubscriptionCreateInput,
  SubscriptionUpdateInput, SubscriptionStatus,
} from './providers/repositories/subscription-repository';
export { MemorySubscriptionRepository, memorySubscriptionRepository } from './providers/repositories/subscription-repository';

export type { IBullMQProvider } from './providers/queue/bullmq-provider';
export { MemoryBullMQProvider, memoryBullMQProvider } from './providers/queue/bullmq-provider';

export type { WorkerRegistration } from './providers/queue/worker-registry';
export { WorkerRegistry, workerRegistry } from './providers/queue/worker-registry';

export type { IS3StorageProvider, S3Config, S3UploadOptions, S3UploadResult } from './providers/storage/s3-storage-provider';
export { StubS3StorageProvider, stubS3StorageProvider } from './providers/storage/s3-storage-provider';

export type { ILocalStorageProvider } from './providers/storage/local-storage-provider';
export { StubLocalStorageProvider, stubLocalStorageProvider } from './providers/storage/local-storage-provider';

export type { IMinioStorageProvider, MinioConfig } from './providers/storage/minio-storage-provider';
export { StubMinioStorageProvider, stubMinioStorageProvider } from './providers/storage/minio-storage-provider';
