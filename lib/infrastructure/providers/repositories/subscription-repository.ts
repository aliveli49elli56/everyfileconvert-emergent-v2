/**
 * lib/infrastructure/providers/repositories/subscription-repository.ts
 *
 * Subscription Repository — Interface + Memory Implementation
 *
 * Persists subscription state per user.
 * Future provider: PostgreSQL table `subscriptions`.
 */

import type { ProviderMetadata } from '../../types';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' | 'expired';

export interface SubscriptionRecord {
  id:               string;
  userId:           string;
  planId:           string;
  status:           SubscriptionStatus;
  billingCycle?:    'monthly' | 'yearly';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?:        string;
  canceledAt?:      string;
  externalId?:      string;  // Stripe/PayPal subscription ID
  metadata?:        Record<string, unknown>;
  createdAt:        string;
  updatedAt:        string;
}

export type SubscriptionCreateInput = Omit<SubscriptionRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type SubscriptionUpdateInput = Partial<Omit<SubscriptionRecord, 'id' | 'userId' | 'createdAt'>>;

export interface ISubscriptionRepository {
  getMetadata(): ProviderMetadata;
  findById(id: string): Promise<SubscriptionRecord | null>;
  findByUser(userId: string): Promise<SubscriptionRecord | null>;
  findByExternalId(externalId: string): Promise<SubscriptionRecord | null>;
  create(input: SubscriptionCreateInput): Promise<SubscriptionRecord>;
  update(id: string, input: SubscriptionUpdateInput): Promise<SubscriptionRecord | null>;
  cancel(id: string): Promise<SubscriptionRecord | null>;
  delete(id: string): Promise<boolean>;
  listActive(limit?: number): Promise<SubscriptionRecord[]>;
}

export class MemorySubscriptionRepository implements ISubscriptionRepository {
  private readonly store = new Map<string, SubscriptionRecord>();
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-subscription-repository',
    displayName:    'Memory Subscription Repository',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       9,
    healthStatus:   'healthy',
    capabilities:   ['find', 'create', 'update', 'cancel', 'list-active'],
    futureProvider: 'postgres',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async findById(id: string): Promise<SubscriptionRecord | null> { return this.store.get(id) ?? null; }

  async findByUser(userId: string): Promise<SubscriptionRecord | null> {
    const active = Array.from(this.store.values()).find(r => r.userId === userId && r.status === 'active');
    return active ?? Array.from(this.store.values()).find(r => r.userId === userId) ?? null;
  }

  async findByExternalId(externalId: string): Promise<SubscriptionRecord | null> {
    return Array.from(this.store.values()).find(r => r.externalId === externalId) ?? null;
  }

  async create(input: SubscriptionCreateInput): Promise<SubscriptionRecord> {
    const now    = new Date().toISOString();
    const record: SubscriptionRecord = { ...input, id: String(this.idCounter++), createdAt: now, updatedAt: now };
    this.store.set(record.id, record);
    return record;
  }

  async update(id: string, input: SubscriptionUpdateInput): Promise<SubscriptionRecord | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async cancel(id: string): Promise<SubscriptionRecord | null> {
    return this.update(id, { status: 'canceled', canceledAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<boolean> { return this.store.delete(id); }

  async listActive(limit = 100): Promise<SubscriptionRecord[]> {
    return Array.from(this.store.values()).filter(r => r.status === 'active').slice(0, limit);
  }
}

export const memorySubscriptionRepository = new MemorySubscriptionRepository();
