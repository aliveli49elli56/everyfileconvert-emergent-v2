/**
 * lib/workers/worker-types.ts
 *
 * Phase 6B — Typed message protocol shared by all processing Web Workers.
 * All messages are discriminated unions for type-safe postMessage/onmessage.
 */

// ---------------------------------------------------------------------------
// SHARED PRIMITIVES
// ---------------------------------------------------------------------------

export type WorkerDomain = 'image' | 'video' | 'pdf' | 'ocr';

export type WorkerStage =
  | 'idle'
  | 'loading-library'
  | 'converting'
  | 'encoding-output'
  | 'complete'
  | 'error';

// ---------------------------------------------------------------------------
// MESSAGES: MAIN → WORKER
// ---------------------------------------------------------------------------

export interface WorkerBaseRequest {
  /** Unique job identifier returned in all response messages for this job. */
  jobId: string;
  operation: string;
  options?: Record<string, unknown>;
}

export interface WorkerBufferRequest extends WorkerBaseRequest {
  /** Serialized file contents as ArrayBuffers (transferable). */
  buffers: ArrayBuffer[];
  /** Original file names (for extension detection). */
  filenames: string[];
}

export type WorkerRequest = WorkerBufferRequest;

// ---------------------------------------------------------------------------
// MESSAGES: WORKER → MAIN
// ---------------------------------------------------------------------------

export interface WorkerProgressMessage {
  type: 'progress';
  jobId: string;
  stage: WorkerStage;
  progress: number; // 0–100
  message?: string;
}

export interface WorkerResultMessage {
  type: 'result';
  jobId: string;
  outputBuffer: ArrayBuffer; // transferable
  filename: string;
  mimeType: string;
}

export interface WorkerErrorMessage {
  type: 'error';
  jobId: string;
  error: string;
  errorCode?: string;
}

export interface WorkerCapabilityMessage {
  type: 'capabilities';
  jobId: string;
  supportedFormats: string[];
  supportedOperations: string[];
}

export type WorkerResponse =
  | WorkerProgressMessage
  | WorkerResultMessage
  | WorkerErrorMessage
  | WorkerCapabilityMessage;

// ---------------------------------------------------------------------------
// WORKER HANDLES (main-thread)
// ---------------------------------------------------------------------------

export interface WorkerHandle {
  readonly domain: WorkerDomain;
  readonly worker: Worker;
  post(request: WorkerRequest, transfer?: Transferable[]): void;
  onMessage(handler: (response: WorkerResponse) => void): () => void;
  terminate(): void;
}
