/**
 * lib/infrastructure/providers/repositories/history-repository.ts
 *
 * History Repository — Interface + Memory Implementation
 *
 * Tracks user activity history (page views, feature usage, downloads).
 * Future provider: PostgreSQL table `history`.
 */

import type { ProviderMetadata } from '../../types';

export type HistoryEventType =
  | 'conversion_started'
  | 'conversion_completed'
  | 'file_downloaded'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'page_viewed'
  | 'feature_used';

export interface HistoryRecord {
  id:          string;
  userId?:     string;
  sessionId:   string;
  eventType:   HistoryEventType;
  metadata:    Record<string, unknown>;
  ipAddress?:  string;
  userAgent?:  string;
  createdAt:   string;
}

export type HistoryCreateInput = Omit<HistoryRecord, 'id' | 'createdAt'>;

export interface IHistoryRepository {
  getMetadata(): ProviderMetadata;
  record(input: HistoryCreateInput): Promise<HistoryRecord>;
  findByUser(userId: string, limit?: number): Promise<HistoryRecord[]>;
  findBySession(sessionId: string): Promise<HistoryRecord[]>;
  findByEventType(eventType: HistoryEventType, limit?: number): Promise<HistoryRecord[]>;
  delete(id: string): Promise<boolean>;
  purgeOlderThan(date: string): Promise<number>;
}

export class MemoryHistoryRepository implements IHistoryRepository {
  private readonly store: HistoryRecord[] = [];
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-history-repository',
    displayName:    'Memory History Repository',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       7,
    healthStatus:   'healthy',
    capabilities:   ['record', 'find', 'purge'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async record(input: HistoryCreateInput): Promise<HistoryRecord> {
    const record: HistoryRecord = { ...input, id: String(this.idCounter++), createdAt: new Date().toISOString() };
    this.store.push(record);
    return record;
  }

  async findByUser(userId: string, limit = 100): Promise<HistoryRecord[]> {
    return this.store.filter(r => r.userId === userId).slice(-limit);
  }

  async findBySession(sessionId: string): Promise<HistoryRecord[]> {
    return this.store.filter(r => r.sessionId === sessionId);
  }

  async findByEventType(eventType: HistoryEventType, limit = 100): Promise<HistoryRecord[]> {
    return this.store.filter(r => r.eventType === eventType).slice(-limit);
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.store.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.store.splice(idx, 1);
    return true;
  }

  async purgeOlderThan(date: string): Promise<number> {
    const before = this.store.filter(r => r.createdAt < date).length;
    this.store.splice(0, this.store.length, ...this.store.filter(r => r.createdAt >= date));
    return before;
  }
}

export const memoryHistoryRepository = new MemoryHistoryRepository();
