/**
 * lib/infrastructure/providers/queue/queue-types.ts
 *
 * Phase 6D-1 Part 2 — BullMQ-compatible Queue Type Definitions
 *
 * Shared types for queue, jobs, workers, retry policies, and scheduling.
 * Compatible with future BullMQ implementation (no changes needed when wired).
 */

// ---------------------------------------------------------------------------
// JOB TYPES
// ---------------------------------------------------------------------------

export type JobStatus =
  | 'waiting'
  | 'waiting-children'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'prioritized';

export type JobPriority = 1 | 2 | 3 | 4 | 5;  // 1 = highest, 5 = lowest

export interface JobData {
  [key: string]: unknown;
}

export interface JobResult {
  [key: string]: unknown;
}

export interface IJob<T extends JobData = JobData, R extends JobResult = JobResult> {
  id: string;
  name: string;
  queue: string;
  data: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
  delay?: number;
  result?: R;
  failedReason?: string;
  stacktrace?: string[];
  progress?: number;
}

// ---------------------------------------------------------------------------
// RETRY POLICY
// ---------------------------------------------------------------------------

export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Backoff strategy */
  backoff: 'fixed' | 'exponential';
  /** Base delay in ms */
  delayMs: number;
  /** Jitter: randomize delay ± jitterMs */
  jitterMs?: number;
  /** Maximum delay cap in ms */
  maxDelayMs?: number;
  /** Only retry on specific error types */
  retryOn?: string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoff:     'exponential',
  delayMs:     1000,
  maxDelayMs:  30000,
};

// ---------------------------------------------------------------------------
// JOB OPTIONS
// ---------------------------------------------------------------------------

export interface EnqueueJobOptions<T extends JobData = JobData> {
  jobId?: string;
  priority?: JobPriority;
  delay?: number;          // ms before job becomes eligible
  retry?: RetryPolicy;
  ttl?: number;            // ms before job expires from queue
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  data: T;
}

// ---------------------------------------------------------------------------
// WORKER TYPES
// ---------------------------------------------------------------------------

export type WorkerHandler<T extends JobData = JobData, R extends JobResult = JobResult> =
  (job: IJob<T, R>) => Promise<R>;

export interface WorkerOptions {
  concurrency?: number;
  priority?: JobPriority;
  limiter?: {
    max: number;
    duration: number;
  };
}

export interface IWorker<T extends JobData = JobData, R extends JobResult = JobResult> {
  queueName: string;
  handler:   WorkerHandler<T, R>;
  options:   WorkerOptions;
  isRunning: boolean;
  start(): void;
  stop(): Promise<void>;
  getMetrics(): Promise<WorkerMetrics>;
}

export interface WorkerMetrics {
  queueName:    string;
  processed:    number;
  failed:       number;
  active:       number;
  concurrency:  number;
  uptime:       number;
}

// ---------------------------------------------------------------------------
// JOB SCHEDULER
// ---------------------------------------------------------------------------

export interface ScheduledJob {
  id: string;
  name: string;
  queue: string;
  cron?: string;
  repeatEveryMs?: number;
  data: JobData;
  lastRunAt?: number;
  nextRunAt?: number;
  enabled: boolean;
}

export interface IJobScheduler {
  schedule(job: Omit<ScheduledJob, 'id'>): Promise<string>;
  unschedule(id: string): Promise<boolean>;
  pause(id: string): Promise<void>;
  resume(id: string): Promise<void>;
  list(): Promise<ScheduledJob[]>;
}

// ---------------------------------------------------------------------------
// QUEUE STATS
// ---------------------------------------------------------------------------

export interface QueueStats {
  name:       string;
  waiting:    number;
  active:     number;
  completed:  number;
  failed:     number;
  delayed:    number;
  paused:     number;
  isPaused:   boolean;
}
