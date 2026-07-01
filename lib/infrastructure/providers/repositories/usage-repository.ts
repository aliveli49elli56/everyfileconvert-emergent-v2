/**
 * lib/infrastructure/providers/repositories/usage-repository.ts
 *
 * Usage Repository — Interface + Memory Implementation
 *
 * Tracks feature/quota usage per user per billing period.
 * Future provider: PostgreSQL table `usage_records`.
 */

import type { ProviderMetadata } from '../../types';

export interface UsageRecord {
  id:          string;
  userId:      string;
  metricName:  string;
  quantity:    number;
  periodStart: string;
  periodEnd:   string;
  metadata?:   Record<string, unknown>;
  createdAt:   string;
}

export type UsageCreateInput = Omit<UsageRecord, 'id' | 'createdAt'>;

export interface UsageAggregate {
  userId:      string;
  metricName:  string;
  total:       number;
  periodStart: string;
  periodEnd:   string;
  limit?:      number;
  percentUsed?: number;
}

export interface IUsageRepository {
  getMetadata(): ProviderMetadata;
  record(input: UsageCreateInput): Promise<UsageRecord>;
  increment(userId: string, metricName: string, quantity?: number): Promise<UsageRecord>;
  getAggregate(userId: string, metricName: string, periodStart: string, periodEnd: string): Promise<UsageAggregate>;
  findByUser(userId: string, metricName?: string): Promise<UsageRecord[]>;
  reset(userId: string, metricName: string, periodStart: string): Promise<void>;
  purgeOlderThan(date: string): Promise<number>;
}

export class MemoryUsageRepository implements IUsageRepository {
  private readonly store = new Map<string, UsageRecord>();
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-usage-repository',
    displayName:    'Memory Usage Repository',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       8,
    healthStatus:   'healthy',
    capabilities:   ['record', 'increment', 'aggregate', 'find', 'reset'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async record(input: UsageCreateInput): Promise<UsageRecord> {
    const record: UsageRecord = { ...input, id: String(this.idCounter++), createdAt: new Date().toISOString() };
    this.store.set(record.id, record);
    return record;
  }

  async increment(userId: string, metricName: string, quantity = 1): Promise<UsageRecord> {
    const now = new Date().toISOString();
    const periodStart = now.substring(0, 7) + '-01T00:00:00.000Z';
    const periodEnd   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();
    return this.record({ userId, metricName, quantity, periodStart, periodEnd });
  }

  async getAggregate(userId: string, metricName: string, periodStart: string, periodEnd: string): Promise<UsageAggregate> {
    const records = Array.from(this.store.values()).filter(r =>
      r.userId === userId &&
      r.metricName === metricName &&
      r.periodStart >= periodStart &&
      r.periodEnd <= periodEnd,
    );
    return { userId, metricName, total: records.reduce((sum, r) => sum + r.quantity, 0), periodStart, periodEnd };
  }

  async findByUser(userId: string, metricName?: string): Promise<UsageRecord[]> {
    return Array.from(this.store.values()).filter(r =>
      r.userId === userId && (!metricName || r.metricName === metricName),
    );
  }

  async reset(userId: string, metricName: string, periodStart: string): Promise<void> {
    Array.from(this.store.entries()).forEach(([id, r]) => {
      if (r.userId === userId && r.metricName === metricName && r.periodStart === periodStart) {
        this.store.delete(id);
      }
    });
  }

  async purgeOlderThan(date: string): Promise<number> {
    let count = 0;
    Array.from(this.store.entries()).forEach(([id, r]) => {
      if (r.createdAt < date) { this.store.delete(id); count++; }
    });
    return count;
  }
}

export const memoryUsageRepository = new MemoryUsageRepository();
