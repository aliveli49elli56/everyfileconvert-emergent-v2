/**
 * lib/infrastructure/providers/queue-provider.ts
 *
 * Queue Provider — Interface + Memory Implementation
 *
 * IQueueProvider: job queue interface.
 * MemoryQueueProvider: synchronous in-memory queue when ENABLE_QUEUE = false.
 *
 * Future provider (Phase 6D-2): Bull / BullMQ (Redis-backed)
 * Swap: register BullQueueProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// QUEUE TYPES
// ---------------------------------------------------------------------------

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface QueueJob<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export interface EnqueueOptions {
  delay?: number;
  priority?: number;
  retries?: number;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IQueueProvider {
  getMetadata(): ProviderMetadata;
  enqueue<T = unknown>(queue: string, payload: T, options?: EnqueueOptions): Promise<string>;
  getJob(jobId: string): Promise<QueueJob | null>;
  getQueueStats(queue: string): Promise<{ waiting: number; active: number; completed: number; failed: number }>;
  pause(queue: string): Promise<void>;
  resume(queue: string): Promise<void>;
  clear(queue: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

export class MemoryQueueProvider implements IQueueProvider {
  private readonly jobs = new Map<string, QueueJob>();
  private readonly queues = new Map<string, string[]>();
  private idCounter = 1;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-queue',
    displayName:    'Memory Queue Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       15,
    healthStatus:   'healthy',
    capabilities:   ['enqueue', 'getJob', 'stats', 'pause', 'resume', 'clear'],
    futureProvider: 'bull',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async enqueue<T = unknown>(queue: string, payload: T, _options?: EnqueueOptions): Promise<string> {
    const id  = String(this.idCounter++);
    const job: QueueJob<T> = {
      id,
      queue,
      payload,
      status:    'waiting',
      attempts:  0,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(id, job as QueueJob);
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    this.queues.get(queue)!.push(id);
    return id;
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async getQueueStats(queue: string): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
    const ids = this.queues.get(queue) ?? [];
    const jobs = ids.map(id => this.jobs.get(id)!).filter(Boolean);
    return {
      waiting:   jobs.filter(j => j.status === 'waiting').length,
      active:    jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed:    jobs.filter(j => j.status === 'failed').length,
    };
  }

  async pause(_queue: string): Promise<void> { /* no-op for memory */ }
  async resume(_queue: string): Promise<void> { /* no-op for memory */ }

  async clear(queue: string): Promise<number> {
    const ids = this.queues.get(queue) ?? [];
    const count = ids.length;
    for (const id of ids) this.jobs.delete(id);
    this.queues.delete(queue);
    return count;
  }
}

export const memoryQueueProvider = new MemoryQueueProvider();
