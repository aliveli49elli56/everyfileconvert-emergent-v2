/**
 * lib/infrastructure/providers/repositories/index.ts
 * Barrel export for all PostgreSQL-ready repository interfaces and memory implementations.
 */

export type { ConversionRecord, ConversionCreateInput, ConversionUpdateInput, IConversionRepository } from './conversion-repository';
export { MemoryConversionRepository, memoryConversionRepository } from './conversion-repository';

export type { HistoryRecord, HistoryCreateInput, HistoryEventType, IHistoryRepository } from './history-repository';
export { MemoryHistoryRepository, memoryHistoryRepository } from './history-repository';

export type { UsageRecord, UsageCreateInput, UsageAggregate, IUsageRepository } from './usage-repository';
export { MemoryUsageRepository, memoryUsageRepository } from './usage-repository';

export type { SubscriptionRecord, SubscriptionCreateInput, SubscriptionUpdateInput, SubscriptionStatus, ISubscriptionRepository } from './subscription-repository';
export { MemorySubscriptionRepository, memorySubscriptionRepository } from './subscription-repository';
