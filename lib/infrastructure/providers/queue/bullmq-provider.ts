/**
 * lib/infrastructure/providers/queue/bullmq-provider.ts
 *
 * Phase 6D-1 Part 2 — BullMQ Provider Interface + Memory Implementation
 *
 * IBullMQProvider: BullMQ-compatible queue interface.
 * MemoryBullMQProvider: in-process memory implementation (no Redis required).
 *
 * Future provider (Phase 6D-2): BullMQ with Redis backend.
 * Swap: register BullMQRedisProvider → no business logic changes.
 */

import type { ProviderMetadata } from '../../types';
import type {
  IJob, JobData, JobResult, QueueStats, EnqueueJobOptions,
  IJobScheduler, ScheduledJob,
} from './queue-types';

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IBullMQProvider {
  getMetadata(): ProviderMetadata;
  /** Add a job to the named queue */
  enqueue<T extends JobData = JobData>(queueName: string, jobName: string, options: EnqueueJobOptions<T>): Promise<string>;
  /** Get job by ID */
  getJob(jobId: string): Promise<IJob | null>;
  /** Get queue statistics */
  getStats(queueName: string): Promise<QueueStats>;
  /** Pause a queue */
  pause(queueName: string): Promise<void>;
  /** Resume a paused queue */
  resume(queueName: string): Promise<void>;
  /** Drain a queue (remove waiting jobs) */
  drain(queueName: string): Promise<void>;
  /** Clean completed/failed jobs */
  clean(queueName: string, grace: number, status: 'completed' | 'failed'): Promise<number>;
  /** Get job scheduler */
  getScheduler(): IJobScheduler;
  /** Health check */
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

class MemoryJobScheduler implements IJobScheduler {
  private readonly scheduled = new Map<string, ScheduledJob>();
  private idCounter = 1;

  async schedule(job: Omit<ScheduledJob, 'id'>): Promise<string> {
    const id = String(this.idCounter++);
    this.scheduled.set(id, { ...job, id });
    return id;
  }

  async unschedule(id: string): Promise<boolean> { return this.scheduled.delete(id); }

  async pause(id: string): Promise<void> {
    const job = this.scheduled.get(id);
    if (job) { this.scheduled.set(id, { ...job, enabled: false }); }
  }

  async resume(id: string): Promise<void> {
    const job = this.scheduled.get(id);
    if (job) { this.scheduled.set(id, { ...job, enabled: true }); }
  }

  async list(): Promise<ScheduledJob[]> {
    return Array.from(this.scheduled.values());
  }
}

export class MemoryBullMQProvider implements IBullMQProvider {
  private readonly jobs  = new Map<string, IJob>();
  private readonly queues = new Map<string, string[]>();
  private idCounter = 1;
  private readonly scheduler = new MemoryJobScheduler();

  private readonly metadata: ProviderMetadata = {
    id:             'memory-bullmq',
    displayName:    'Memory BullMQ Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       15,
    healthStatus:   'healthy',
    capabilities:   ['enqueue', 'priority', 'delay', 'retry', 'schedule', 'pause', 'drain'],
    futureProvider: 'bullmq-redis',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async enqueue<T extends JobData = JobData>(
    queueName: string,
    jobName: string,
    options: EnqueueJobOptions<T>,
  ): Promise<string> {
    const id = options.jobId ?? String(this.idCounter++);
    const job: IJob<T> = {
      id,
      name:        jobName,
      queue:       queueName,
      data:        options.data,
      status:      'waiting',
      priority:    options.priority ?? 3,
      attempts:    0,
      maxAttempts: options.retry?.maxAttempts ?? 3,
      createdAt:   Date.now(),
      delay:       options.delay,
    };
    this.jobs.set(id, job as IJob);
    if (!this.queues.has(queueName)) this.queues.set(queueName, []);
    this.queues.get(queueName)!.push(id);
    return id;
  }

  async getJob(jobId: string): Promise<IJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async getStats(queueName: string): Promise<QueueStats> {
    const ids  = this.queues.get(queueName) ?? [];
    const jobs = ids.map(id => this.jobs.get(id)!).filter(Boolean);
    return {
      name:      queueName,
      waiting:   jobs.filter(j => j.status === 'waiting').length,
      active:    jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed:    jobs.filter(j => j.status === 'failed').length,
      delayed:   jobs.filter(j => j.status === 'delayed').length,
      paused:    jobs.filter(j => j.status === 'paused').length,
      isPaused:  false,
    };
  }

  async pause(_queueName: string): Promise<void> { /* no-op */ }
  async resume(_queueName: string): Promise<void> { /* no-op */ }

  async drain(queueName: string): Promise<void> {
    const ids = this.queues.get(queueName) ?? [];
    ids.forEach(id => this.jobs.delete(id));
    this.queues.delete(queueName);
  }

  async clean(queueName: string, _grace: number, status: 'completed' | 'failed'): Promise<number> {
    const ids = this.queues.get(queueName) ?? [];
    let count = 0;
    ids.forEach(id => {
      const job = this.jobs.get(id);
      if (job?.status === status) { this.jobs.delete(id); count++; }
    });
    return count;
  }

  getScheduler(): IJobScheduler { return this.scheduler; }

  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    return { ok: true, latencyMs: 0 };
  }
}

export const memoryBullMQProvider = new MemoryBullMQProvider();
