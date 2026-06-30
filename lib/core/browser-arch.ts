/**
 * lib/core/browser-arch.ts
 *
 * Browser Architecture Foundation — Phase 6A
 *
 * Defines the contracts and metadata stubs for browser-side processing.
 * NO processing logic is implemented here — only the architectural skeleton.
 *
 * Prepares:
 *   - Dynamic import / lazy loading contracts
 *   - Code splitting metadata
 *   - Web Worker loading helpers
 *   - AbortController integration types
 *   - Progress event contracts
 *   - Memory cleanup lifecycle
 *   - Provider lazy initialisation pattern
 *   - Tree-shaking-friendly export shape
 */

// ---------------------------------------------------------------------------
// PROGRESS EVENTS
// ---------------------------------------------------------------------------

export interface ProcessingProgressEvent {
  /** 0–100 completion percentage */
  percent: number;
  /** Human-readable status message */
  message: string;
  /** Current processing stage */
  stage: ProcessingStage;
  /** Bytes processed so far */
  bytesProcessed: number;
  /** Total bytes to process */
  totalBytes: number;
  /** Wall-clock milliseconds elapsed */
  elapsedMs: number;
  /** Estimated milliseconds remaining (−1 if unknown) */
  etaMs: number;
}

export type ProcessingStage =
  | 'idle'
  | 'loading-library'
  | 'reading-input'
  | 'converting'
  | 'encoding-output'
  | 'writing-output'
  | 'cleanup'
  | 'complete'
  | 'error';

export type ProgressCallback = (event: ProcessingProgressEvent) => void;

// ---------------------------------------------------------------------------
// ABORT / CANCEL
// ---------------------------------------------------------------------------

export interface CancellableOperation {
  /** AbortController signal to cancel in-progress work */
  signal: AbortSignal;
  /** Call this to cancel the operation */
  cancel(): void;
}

export function createCancellableOperation(): CancellableOperation {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

// ---------------------------------------------------------------------------
// MEMORY CLEANUP LIFECYCLE
// ---------------------------------------------------------------------------

export interface DisposableResource {
  /**
   * Release all held resources (Object URLs, ArrayBuffers, off-screen canvases, Workers).
   * Must be called when the resource is no longer needed.
   */
  dispose(): void | Promise<void>;
  /** True after dispose() has been called */
  readonly isDisposed: boolean;
}

/**
 * Helper: revoke Object URLs and release ArrayBuffers.
 * Call this after a file has been downloaded or rendered.
 */
export function releaseBlobUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // No-op — URL was already revoked or invalid
  }
}

/**
 * Helper: check approximate memory available (heuristic).
 * Returns estimated free memory in bytes, or −1 if unknown.
 */
export function estimateFreeMemoryBytes(): number {
  // @ts-expect-error — deviceMemory is non-standard
  const deviceMb: number | undefined = navigator?.deviceMemory;
  if (deviceMb === undefined) return -1;
  // Rough heuristic: assume 30% of device RAM is available for conversion
  return deviceMb * 1024 * 1024 * 1024 * 0.3;
}

// ---------------------------------------------------------------------------
// DYNAMIC IMPORT CONTRACTS
// ---------------------------------------------------------------------------

/**
 * A lazy-loaded module descriptor.
 * Consumers call `loader()` to dynamically import the library,
 * enabling code splitting and tree-shaking.
 */
export interface LazyLibraryModule<T = unknown> {
  /** Unique identifier matching LibraryDefinition.id */
  libraryId: string;
  /** Dynamic import factory — imported lazily, never at startup */
  loader: () => Promise<T>;
  /** Approximate bundle size in bytes (used for UX budget warnings) */
  bundleSizeBytes: number;
  /** Whether this module requires SharedArrayBuffer (cross-origin isolation) */
  requiresCrossOriginIsolation: boolean;
  /** Whether this module must run inside a Worker */
  requiresWorker: boolean;
}

/**
 * Registry of lazy library module descriptors.
 * Stubs only — actual `loader` implementations added in Phase 6B.
 *
 * NOTE: Do NOT import any library here. These are factory stubs.
 * Each loader has the webpack chunk name pre-annotated as a comment.
 * Phase 6B will replace the `async () => ({})` bodies with real dynamic imports.
 */
export const LAZY_LIBRARY_MODULES: LazyLibraryModule[] = [
  {
    libraryId: "ffmpeg-wasm",
    // Phase 6B: import(/* webpackChunkName: "ffmpeg-wasm" */ "@ffmpeg/ffmpeg")
    loader: async () => ({}),
    bundleSizeBytes: 31 * 1024 * 1024,
    requiresCrossOriginIsolation: true,
    requiresWorker: true,
  },
  {
    libraryId: "tesseract-js",
    // Phase 6B: import(/* webpackChunkName: "tesseract-js" */ "tesseract.js")
    loader: async () => ({}),
    bundleSizeBytes: 30 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "jszip",
    // Phase 6B: import(/* webpackChunkName: "jszip" */ "jszip")
    loader: async () => ({}),
    bundleSizeBytes: 120 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "sheetjs",
    // Phase 6B: import(/* webpackChunkName: "sheetjs" */ "xlsx")
    loader: async () => ({}),
    bundleSizeBytes: 900 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "pdf-lib",
    // Phase 6B: import(/* webpackChunkName: "pdf-lib" */ "pdf-lib")
    loader: async () => ({}),
    bundleSizeBytes: 800 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "pdfjs",
    // Phase 6B: import(/* webpackChunkName: "pdfjs" */ "pdfjs-dist")
    loader: async () => ({}),
    bundleSizeBytes: 2 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "mammoth",
    // Phase 6B: import(/* webpackChunkName: "mammoth" */ "mammoth")
    loader: async () => ({}),
    bundleSizeBytes: 400 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "svgo",
    // Phase 6B: import(/* webpackChunkName: "svgo" */ "svgo")
    loader: async () => ({}),
    bundleSizeBytes: 450 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "opentype-js",
    // Phase 6B: import(/* webpackChunkName: "opentype" */ "opentype.js")
    loader: async () => ({}),
    bundleSizeBytes: 300 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "threejs",
    // Phase 6B: import(/* webpackChunkName: "threejs" */ "three")
    loader: async () => ({}),
    bundleSizeBytes: 600 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "7zip-wasm",
    // Phase 6B: import(/* webpackChunkName: "7zip-wasm" */ "7zip-wasm")
    loader: async () => ({}),
    bundleSizeBytes: 6 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "node-unrar-js",
    // Phase 6B: import(/* webpackChunkName: "unrar-wasm" */ "node-unrar-js")
    loader: async () => ({}),
    bundleSizeBytes: 500 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "turfjs",
    // Phase 6B: import(/* webpackChunkName: "turf" */ "@turf/turf")
    loader: async () => ({}),
    bundleSizeBytes: 700 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "dcmjs",
    // Phase 6B: import(/* webpackChunkName: "dcmjs" */ "dcmjs")
    loader: async () => ({}),
    bundleSizeBytes: 1.5 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "node-forge",
    // Phase 6B: import(/* webpackChunkName: "node-forge" */ "node-forge")
    loader: async () => ({}),
    bundleSizeBytes: 450 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "html2canvas",
    // Phase 6B: import(/* webpackChunkName: "html2canvas" */ "html2canvas")
    loader: async () => ({}),
    bundleSizeBytes: 500 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
];

// Fast lookup by library ID
export const LAZY_MODULE_MAP = new Map<string, LazyLibraryModule>(
  LAZY_LIBRARY_MODULES.map(m => [m.libraryId, m])
);

// ---------------------------------------------------------------------------
// PROVIDER LAZY INITIALISATION PATTERN
// ---------------------------------------------------------------------------

/**
 * Lifecycle states of a lazily-initialised provider.
 * Providers start as 'unloaded' and transition through these states.
 */
export type ProviderLifecycleState =
  | 'unloaded'      // Not yet requested
  | 'loading'       // Dynamic import in progress
  | 'initialising'  // Module loaded; running setup (WASM compilation, etc.)
  | 'ready'         // Fully operational
  | 'error'         // Initialisation failed
  | 'disposed';     // Deliberately torn down

/**
 * Metadata tracked for each lazily-loaded provider.
 */
export interface ProviderLifecycleEntry {
  providerId: string;
  state: ProviderLifecycleState;
  loadStartMs: number;
  loadEndMs: number;
  error?: Error;
}

/**
 * Singleton registry that tracks which providers have been lazily loaded.
 * Providers call `markReady(id)` after successful initialisation.
 * Business logic calls `isReady(id)` before dispatching work.
 *
 * NOTE: This is the metadata skeleton only. Actual wiring happens in Phase 6B.
 */
export class ProviderLifecycleRegistry {
  private entries = new Map<string, ProviderLifecycleEntry>();

  markLoading(providerId: string): void {
    this.entries.set(providerId, {
      providerId,
      state: 'loading',
      loadStartMs: Date.now(),
      loadEndMs: 0,
    });
  }

  markInitialising(providerId: string): void {
    const entry = this.entries.get(providerId);
    if (entry) entry.state = 'initialising';
  }

  markReady(providerId: string): void {
    const entry = this.entries.get(providerId);
    if (entry) {
      entry.state = 'ready';
      entry.loadEndMs = Date.now();
    }
  }

  markError(providerId: string, error: Error): void {
    const entry = this.entries.get(providerId);
    if (entry) {
      entry.state = 'error';
      entry.error = error;
      entry.loadEndMs = Date.now();
    }
  }

  markDisposed(providerId: string): void {
    const entry = this.entries.get(providerId);
    if (entry) entry.state = 'disposed';
  }

  isReady(providerId: string): boolean {
    return this.entries.get(providerId)?.state === 'ready';
  }

  getState(providerId: string): ProviderLifecycleState {
    return this.entries.get(providerId)?.state ?? 'unloaded';
  }

  getAll(): ProviderLifecycleEntry[] {
    return Array.from(this.entries.values());
  }
}

export const providerLifecycleRegistry = new ProviderLifecycleRegistry();

// ---------------------------------------------------------------------------
// WEB WORKER LOADING
// ---------------------------------------------------------------------------

/**
 * Worker bundle descriptor.
 * Each heavy WASM library should have its own Worker to avoid blocking the UI thread.
 */
export interface WorkerDescriptor {
  /** Library this worker serves */
  libraryId: string;
  /** Worker script path (relative to /public/workers/) */
  workerPath: string;
  /** Whether SharedArrayBuffer is needed (requires COOP+COEP headers) */
  requiresSharedMemory: boolean;
  /** Type of Worker */
  type: 'module' | 'classic';
}

/**
 * Worker descriptors — stubs for Phase 6B implementation.
 * Paths reference /public/workers/<name>.worker.js which do not exist yet.
 */
export const WORKER_DESCRIPTORS: WorkerDescriptor[] = [
  {
    libraryId: "ffmpeg-wasm",
    workerPath: "/workers/ffmpeg.worker.js",
    requiresSharedMemory: true,
    type: "module",
  },
  {
    libraryId: "tesseract-js",
    workerPath: "/workers/tesseract.worker.js",
    requiresSharedMemory: false,
    type: "module",
  },
  {
    libraryId: "7zip-wasm",
    workerPath: "/workers/sevenzip.worker.js",
    requiresSharedMemory: false,
    type: "module",
  },
  {
    libraryId: "node-unrar-js",
    workerPath: "/workers/unrar.worker.js",
    requiresSharedMemory: false,
    type: "module",
  },
  {
    libraryId: "pdfjs",
    workerPath: "/workers/pdfjs.worker.js",
    requiresSharedMemory: false,
    type: "classic",
  },
];

// ---------------------------------------------------------------------------
// BROWSER CAPABILITY DETECTION (metadata stubs)
// ---------------------------------------------------------------------------

export interface BrowserCapabilities {
  /** SharedArrayBuffer available (requires COOP + COEP headers) */
  sharedArrayBuffer: boolean;
  /** WebGL 2.0 available */
  webgl2: boolean;
  /** WebGPU available */
  webgpu: boolean;
  /** OffscreenCanvas available */
  offscreenCanvas: boolean;
  /** ServiceWorker supported */
  serviceWorker: boolean;
  /** Estimated device memory in GB (−1 if unknown) */
  deviceMemoryGb: number;
  /** Approximate CPU core count */
  cpuCores: number;
}

/**
 * Detect browser capabilities at runtime.
 * Returns a best-effort snapshot — never throws.
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      sharedArrayBuffer: false,
      webgl2: false,
      webgpu: false,
      offscreenCanvas: false,
      serviceWorker: false,
      deviceMemoryGb: -1,
      cpuCores: 1,
    };
  }

  return {
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    webgl2: (() => {
      try {
        return !!document.createElement('canvas').getContext('webgl2');
      } catch {
        return false;
      }
    })(),
    webgpu: 'gpu' in navigator,
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    // @ts-expect-error — non-standard
    deviceMemoryGb: navigator.deviceMemory ?? -1,
    cpuCores: navigator.hardwareConcurrency ?? 1,
  };
}
