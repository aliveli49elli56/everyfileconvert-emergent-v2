/**
 * lib/infrastructure/providers/queue/worker-registry.ts
 *
 * Phase 6D-1 Part 2 — Worker Registry
 *
 * Central registry for background job worker handlers.
 * Workers register themselves here and are started/stopped by the queue system.
 *
 * Adding a worker requires only registration — no business logic changes.
 */

import type { JobData, JobResult, IWorker, WorkerHandler, WorkerOptions } from './queue-types';

// ---------------------------------------------------------------------------
// WORKER REGISTRATION
// ---------------------------------------------------------------------------

export interface WorkerRegistration<T extends JobData = JobData, R extends JobResult = JobResult> {
  queueName:   string;
  displayName: string;
  handler:     WorkerHandler<T, R>;
  options:     WorkerOptions;
  enabled:     boolean;
  description?: string;
  tags?:        string[];
}

// ---------------------------------------------------------------------------
// MEMORY WORKER IMPLEMENTATION
// ---------------------------------------------------------------------------

class MemoryWorker<T extends JobData = JobData, R extends JobResult = JobResult> implements IWorker<T, R> {
  queueName:  string;
  handler:    WorkerHandler<T, R>;
  options:    WorkerOptions;
  isRunning:  boolean = false;
  private processed = 0;
  private failed    = 0;
  private startTime = 0;

  constructor(registration: WorkerRegistration<T, R>) {
    this.queueName = registration.queueName;
    this.handler   = registration.handler;
    this.options   = registration.options;
  }

  start(): void {
    this.isRunning = true;
    this.startTime = Date.now();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  async getMetrics() {
    return {
      queueName:   this.queueName,
      processed:   this.processed,
      failed:      this.failed,
      active:      0,
      concurrency: this.options.concurrency ?? 1,
      uptime:      this.isRunning ? Date.now() - this.startTime : 0,
    };
  }
}

// ---------------------------------------------------------------------------
// WORKER REGISTRY CLASS
// ---------------------------------------------------------------------------

export class WorkerRegistry {
  private readonly registrations = new Map<string, WorkerRegistration>();

  /**
   * Register a worker for a queue.
   * Adding a worker requires only this call — no other code changes.
   */
  register<T extends JobData = JobData, R extends JobResult = JobResult>(
    registration: WorkerRegistration<T, R>,
  ): void {
    this.registrations.set(registration.queueName, registration as unknown as WorkerRegistration);
  }

  /**
   * Get a worker registration by queue name.
   */
  get(queueName: string): WorkerRegistration | undefined {
    return this.registrations.get(queueName);
  }

  /**
   * Create a worker instance for a queue.
   */
  createWorker(queueName: string): IWorker | null {
    const reg = this.registrations.get(queueName);
    if (!reg || !reg.enabled) return null;
    return new MemoryWorker(reg);
  }

  /**
   * List all registered workers.
   */
  list(): WorkerRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * List enabled workers.
   */
  listEnabled(): WorkerRegistration[] {
    return Array.from(this.registrations.values()).filter(r => r.enabled);
  }

  /**
   * Check if a queue has a registered worker.
   */
  has(queueName: string): boolean {
    return this.registrations.has(queueName);
  }

  count(): number {
    return this.registrations.size;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON
// ---------------------------------------------------------------------------

export const workerRegistry = new WorkerRegistry();

// ---------------------------------------------------------------------------
// PRE-REGISTERED WORKERS (Phase 6D-2 will provide real handlers)
// ---------------------------------------------------------------------------

// Conversion job worker — handles async file conversions
workerRegistry.register({
  queueName:   'conversions',
  displayName: 'File Conversion Worker',
  description: 'Processes server-side file conversion jobs (FFmpeg, LibreOffice, etc.)',
  handler:     async (job) => {
    // Phase 6D-2: implement real conversion dispatch
    return { processed: false, jobId: job.id };
  },
  options:  { concurrency: 5 },
  enabled:  false,  // Enabled when ENABLE_SERVER_PROVIDERS=true
  tags:     ['conversion', 'server'],
});

// Email notification worker
workerRegistry.register({
  queueName:   'notifications',
  displayName: 'Email Notification Worker',
  description: 'Sends email notifications via SendGrid/Resend',
  handler:     async (job) => {
    // Phase 6D-2: implement real email dispatch
    return { sent: false, jobId: job.id };
  },
  options:  { concurrency: 10 },
  enabled:  false,  // Enabled when ENABLE_NOTIFICATIONS=true
  tags:     ['email', 'notification'],
});

// Subscription sync worker
workerRegistry.register({
  queueName:   'subscription-sync',
  displayName: 'Subscription Sync Worker',
  description: 'Syncs subscription changes from payment webhook events',
  handler:     async (job) => {
    // Phase 6D-2: implement real subscription sync
    return { synced: false, jobId: job.id };
  },
  options:  { concurrency: 2 },
  enabled:  false,  // Enabled when ENABLE_PAYMENTS=true
  tags:     ['subscription', 'payments'],
});
