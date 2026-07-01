/**
 * lib/infrastructure/providers/repositories/conversion-repository.ts
 *
 * Conversion Repository — Interface + Memory Implementation
 *
 * Stores conversion job records (history, status, results).
 * Future provider: PostgreSQL table `conversions`.
 */

import type { ProviderMetadata } from '../../types';

export interface ConversionRecord {
  id:            string;
  userId?:       string;
  sessionId:     string;
  inputFormat:   string;
  outputFormat:  string;
  inputFilename: string;
  outputFilename: string;
  inputSizeBytes: number;
  outputSizeBytes?: number;
  status:        'pending' | 'processing' | 'completed' | 'failed';
  provider:      string;
  executionMode: 'browser' | 'server' | 'hybrid';
  durationMs?:   number;
  error?:        string;
  createdAt:     string;
  completedAt?:  string;
}

export type ConversionCreateInput = Omit<ConversionRecord, 'id' | 'createdAt'>;
export type ConversionUpdateInput = Partial<Omit<ConversionRecord, 'id' | 'createdAt' | 'sessionId'>>;

export interface IConversionRepository {
  getMetadata(): ProviderMetadata;
  create(input: ConversionCreateInput): Promise<ConversionRecord>;
  findById(id: string): Promise<ConversionRecord | null>;
  findBySession(sessionId: string): Promise<ConversionRecord[]>;
  findByUser(userId: string, limit?: number): Promise<ConversionRecord[]>;
  update(id: string, input: ConversionUpdateInput): Promise<ConversionRecord | null>;
  delete(id: string): Promise<boolean>;
  getStats(userId?: string): Promise<{ total: number; completed: number; failed: number }>;
}

export class MemoryConversionRepository implements IConversionRepository {
  private readonly store = new Map<string, ConversionRecord>();
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-conversion-repository',
    displayName:    'Memory Conversion Repository',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       6,
    healthStatus:   'healthy',
    capabilities:   ['create', 'find', 'update', 'delete', 'stats'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async create(input: ConversionCreateInput): Promise<ConversionRecord> {
    const record: ConversionRecord = { ...input, id: String(this.idCounter++), createdAt: new Date().toISOString() };
    this.store.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<ConversionRecord | null> { return this.store.get(id) ?? null; }

  async findBySession(sessionId: string): Promise<ConversionRecord[]> {
    return Array.from(this.store.values()).filter(r => r.sessionId === sessionId);
  }

  async findByUser(userId: string, limit = 50): Promise<ConversionRecord[]> {
    return Array.from(this.store.values()).filter(r => r.userId === userId).slice(-limit);
  }

  async update(id: string, input: ConversionUpdateInput): Promise<ConversionRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> { return this.store.delete(id); }

  async getStats(userId?: string): Promise<{ total: number; completed: number; failed: number }> {
    const records = userId
      ? Array.from(this.store.values()).filter(r => r.userId === userId)
      : Array.from(this.store.values());
    return {
      total:     records.length,
      completed: records.filter(r => r.status === 'completed').length,
      failed:    records.filter(r => r.status === 'failed').length,
    };
  }
}

export const memoryConversionRepository = new MemoryConversionRepository();
