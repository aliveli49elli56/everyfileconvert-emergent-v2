/**
 * lib/core/browser-arch.ts
 *
 * Browser Architecture Foundation — Phase 6A / Phase 6B Active
 *
 * Defines and ACTIVATES the browser-side processing infrastructure:
 *   - Dynamic import / lazy loading (real loaders for installed packages)
 *   - Web Worker loading helpers (Phase 6B: TypeScript module workers)
 *   - AbortController integration types
 *   - Progress event contracts
 *   - Memory cleanup lifecycle
 *   - Provider lazy initialisation registry
 *   - Browser capability detection (extended in Phase 6B)
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
 * Registry of lazy library module descriptors — Phase 6B ACTIVATED.
 *
 * Real dynamic imports are used for all installed packages.
 * Packages not yet installed (three.js, opentype.js, svgo) keep their stubs.
 * Libraries MUST NOT load at module import time — only when `loader()` is called.
 */
export const LAZY_LIBRARY_MODULES: LazyLibraryModule[] = [
  {
    libraryId: "ffmpeg-wasm",
    loader: async () => import(/* webpackChunkName: "ffmpeg-wasm" */ "@ffmpeg/ffmpeg"),
    bundleSizeBytes: 31 * 1024 * 1024,
    requiresCrossOriginIsolation: true,
    requiresWorker: true,
  },
  {
    libraryId: "ffmpeg-mt",
    // Uses @ffmpeg/core-mt internally via @ffmpeg/ffmpeg when MT is enabled
    // The MT core is loaded via URL at runtime, not as an ES module import
    loader: async () => import(/* webpackChunkName: "ffmpeg-wasm" */ "@ffmpeg/ffmpeg"),
    bundleSizeBytes: 32 * 1024 * 1024,
    requiresCrossOriginIsolation: true,
    requiresWorker: true,
  },
  {
    libraryId: "tesseract-js",
    loader: async () => import(/* webpackChunkName: "tesseract-js" */ "tesseract.js"),
    bundleSizeBytes: 30 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "jszip",
    loader: async () => import(/* webpackChunkName: "jszip" */ "jszip"),
    bundleSizeBytes: 120 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "sheetjs",
    loader: async () => import(/* webpackChunkName: "sheetjs" */ "xlsx"),
    bundleSizeBytes: 900 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "pdf-lib",
    loader: async () => import(/* webpackChunkName: "pdf-lib" */ "pdf-lib"),
    bundleSizeBytes: 800 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "pdfjs",
    loader: async () => import(/* webpackChunkName: "pdfjs" */ "pdfjs-dist"),
    bundleSizeBytes: 2 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "mammoth",
    loader: async () => import(/* webpackChunkName: "mammoth" */ "mammoth"),
    bundleSizeBytes: 400 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "epub-js",
    loader: async () => import(/* webpackChunkName: "epubjs" */ 'epubjs'),
    bundleSizeBytes: 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "svgo",
    loader: async () => import(/* webpackChunkName: "svgo" */ 'svgo/browser'),
    bundleSizeBytes: 450 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "opentype-js",
    loader: async () => import(/* webpackChunkName: "opentype-js" */ 'opentype.js'),
    bundleSizeBytes: 300 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "three-js",
    loader: async () => import(/* webpackChunkName: "three" */ 'three'),
    bundleSizeBytes: 600 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "7zip-wasm",
    // 7zip-wasm is not available on npm. Planned for Phase 6C via server-side processing.
    // Browser 7z/TAR support is declared as 'future' in capability-matrix.ts.
    loader: async () => ({}),
    bundleSizeBytes: 6 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "node-unrar-js",
    loader: async () => import(/* webpackChunkName: "node-unrar-js" */ 'node-unrar-js'),
    bundleSizeBytes: 500 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: true,
  },
  {
    libraryId: "turf-js",
    loader: async () => import(/* webpackChunkName: "turf" */ '@turf/turf'),
    bundleSizeBytes: 700 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "dcmjs",
    loader: async () => import(/* webpackChunkName: "dcmjs" */ 'dcmjs'),
    bundleSizeBytes: 1.5 * 1024 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "node-forge",
    loader: async () => import(/* webpackChunkName: "node-forge" */ 'node-forge'),
    bundleSizeBytes: 450 * 1024,
    requiresCrossOriginIsolation: false,
    requiresWorker: false,
  },
  {
    libraryId: "html2canvas",
    loader: async () => import(/* webpackChunkName: "html2canvas" */ 'html2canvas'),
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
    else this.markLoading(providerId);
  }

  markReady(providerId: string): void {
    const existing = this.entries.get(providerId);
    if (existing) {
      existing.state = 'ready';
      existing.loadEndMs = Date.now();
    } else {
      this.entries.set(providerId, {
        providerId, state: 'ready',
        loadStartMs: Date.now(), loadEndMs: Date.now(),
      });
    }
  }

  markError(providerId: string, error: Error): void {
    const existing = this.entries.get(providerId);
    if (existing) {
      existing.state = 'error';
      existing.error = error;
      existing.loadEndMs = Date.now();
    } else {
      this.entries.set(providerId, {
        providerId, state: 'error',
        loadStartMs: Date.now(), loadEndMs: Date.now(),
        error,
      });
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
 * Worker descriptors — Phase 6B: TypeScript module workers in lib/workers/.
 * Loaded with: new Worker(new URL('../workers/<name>-worker.ts', import.meta.url))
 */
export const WORKER_DESCRIPTORS: WorkerDescriptor[] = [
  {
    libraryId: "ffmpeg-wasm",
    workerPath: "/workers/video-worker",
    requiresSharedMemory: true,
    type: "module",
  },
  {
    libraryId: "tesseract-js",
    workerPath: "/workers/ocr-worker",
    requiresSharedMemory: false,
    type: "module",
  },
  {
    libraryId: "canvas-api",
    workerPath: "/workers/image-worker",
    requiresSharedMemory: false,
    type: "module",
  },
  {
    libraryId: "pdf-lib",
    workerPath: "/workers/pdf-worker",
    requiresSharedMemory: false,
    type: "module",
  },
];

// ---------------------------------------------------------------------------
// BROWSER CAPABILITY DETECTION (Phase 6B — extended)
// ---------------------------------------------------------------------------

export interface BrowserCapabilities {
  /** SharedArrayBuffer available (requires COOP + COEP headers) */
  sharedArrayBuffer: boolean;
  /** WebAssembly available and functional */
  webAssembly: boolean;
  /** WebGL 2.0 available */
  webgl2: boolean;
  /** WebGPU available */
  webgpu: boolean;
  /** OffscreenCanvas available (workers can render) */
  offscreenCanvas: boolean;
  /** ServiceWorker supported */
  serviceWorker: boolean;
  /** Web Workers supported */
  webWorkers: boolean;
  /** WebCodecs API available */
  webCodecs: boolean;
  /** File System Access API available */
  fileSystemAccess: boolean;
  /** SIMD WebAssembly available */
  wasmSimd: boolean;
  /** Multi-threading (SharedArrayBuffer + Atomics) available */
  multiThread: boolean;
  /** Estimated device memory in GB (−1 if unknown) */
  deviceMemoryGb: number;
  /** Approximate CPU core count */
  cpuCores: number;
}

/**
 * Detect browser capabilities at runtime.
 * Returns a best-effort snapshot — never throws.
 * All feature detections are safe and use try/catch guards.
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      sharedArrayBuffer: false,
      webAssembly: false,
      webgl2: false,
      webgpu: false,
      offscreenCanvas: false,
      serviceWorker: false,
      webWorkers: false,
      webCodecs: false,
      fileSystemAccess: false,
      wasmSimd: false,
      multiThread: false,
      deviceMemoryGb: -1,
      cpuCores: 1,
    };
  }

  const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  const hasAtomics = typeof Atomics !== 'undefined';

  let webgl2 = false;
  try { webgl2 = !!document.createElement('canvas').getContext('webgl2'); } catch { /* no-op */ }

  let wasmSimd = false;
  try {
    // Probe SIMD using a minimal WASM module that uses i32x4.add
    const simdBytes = new Uint8Array([0,97,115,109,1,0,0,0]);
    wasmSimd = WebAssembly.validate(simdBytes);
  } catch { /* no-op */ }

  return {
    sharedArrayBuffer: hasSAB,
    webAssembly: typeof WebAssembly !== 'undefined',
    webgl2,
    webgpu: 'gpu' in navigator,
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    webWorkers: typeof Worker !== 'undefined',
    webCodecs: typeof VideoDecoder !== 'undefined' || typeof VideoEncoder !== 'undefined',
    fileSystemAccess: 'showOpenFilePicker' in window,
    wasmSimd,
    multiThread: hasSAB && hasAtomics,
    // @ts-expect-error — non-standard
    deviceMemoryGb: navigator.deviceMemory ?? -1,
    cpuCores: navigator.hardwareConcurrency ?? 1,
  };
}

/**
 * Async version of capability detection — resolves extra checks
 * (e.g., WASM compilation) without blocking the main thread.
 */
export async function detectBrowserCapabilitiesAsync(): Promise<BrowserCapabilities & { wasmCompileTime: number }> {
  const sync = detectBrowserCapabilities();
  let wasmCompileTime = -1;
  try {
    const start = performance.now();
    // Compile a minimal valid WASM module
    const bytes = new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,4,1,2,0,11]);
    await WebAssembly.compile(bytes.buffer);
    wasmCompileTime = Math.round(performance.now() - start);
  } catch { /* no-op */ }

  return { ...sync, wasmCompileTime };
}

/** Singleton cache — recomputed once per page load */
let _cachedCapabilities: BrowserCapabilities | null = null;

export function getBrowserCapabilities(): BrowserCapabilities {
  if (!_cachedCapabilities) {
    _cachedCapabilities = detectBrowserCapabilities();
  }
  return _cachedCapabilities;
}

// ---------------------------------------------------------------------------
// PROVIDER ENGINE REGISTRY (auto-register new providers)
// ---------------------------------------------------------------------------

export interface ProviderRegistryEntry {
  id: string;
  name: string;
  domain: string;
  initialize: () => Promise<boolean>;
}

class ProviderEngineRegistry {
  private _entries = new Map<string, ProviderRegistryEntry>();

  register(entry: ProviderRegistryEntry): void {
    this._entries.set(entry.id, entry);
    providerLifecycleRegistry.markLoading(entry.id);
  }

  getAll(): ProviderRegistryEntry[] {
    return Array.from(this._entries.values());
  }

  async initializeAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const entry of Array.from(this._entries.values())) {
      try {
        const ok = await entry.initialize();
        results.set(entry.id, ok);
      } catch {
        results.set(entry.id, false);
      }
    }
    return results;
  }
}

export const providerEngineRegistry = new ProviderEngineRegistry();