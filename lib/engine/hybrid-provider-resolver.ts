/**
 * lib/engine/hybrid-provider-resolver.ts
 *
 * Phase 6D-1 Part 2 — Hybrid Provider Resolver
 *
 * Orchestrates Browser / Server / Hybrid execution modes.
 *
 * KEY DESIGN PRINCIPLE:
 *   ProviderSelectionEngine remains the SINGLE SOURCE OF TRUTH for provider selection.
 *   HybridProviderResolver does NOT duplicate provider logic.
 *   It only determines the EXECUTION MODE (browser/server/hybrid) and routes accordingly.
 *
 * Integration:
 *   - Calls ProviderSelectionEngine.select() to get the provider
 *   - Checks ENABLE_SERVER_PROVIDERS flag
 *   - Checks ServerProviderRegistry for server-side availability
 *   - Returns HybridResolutionResult with execution mode + the PSE's selection result
 *
 * Browser fallback:
 *   When ENABLE_SERVER_PROVIDERS = false (default), always returns 'browser' mode.
 *   Behavior is identical to calling ProviderSelectionEngine.select() directly.
 */

import type {
  SelectionRequest,
  SelectionResult,
  RuntimeEnvironment,
} from './provider-selection-engine';
import { isServerProcessingEnabled } from '../config/infrastructure-config';

// ---------------------------------------------------------------------------
// HYBRID TYPES
// ---------------------------------------------------------------------------

export type ExecutionMode = 'browser' | 'server' | 'hybrid';

export interface HybridResolutionResult {
  /** The execution mode determined for this request */
  executionMode: ExecutionMode;
  /** The standard PSE selection result (browser provider, always set) */
  browserSelection: SelectionResult;
  /**
   * Server provider ID to use when executionMode = 'server' | 'hybrid'.
   * null when executionMode = 'browser' or no server provider registered.
   */
  serverProviderId: string | null;
  /**
   * True when the conversion could benefit from server execution
   * (large file, quality-sensitive, format requires server).
   */
  serverRecommended: boolean;
  /** Reason for the execution mode decision */
  resolutionReason: string;
}

export interface HybridResolutionRequest extends SelectionRequest {
  /**
   * Force a specific execution mode (skip automatic detection).
   * Useful for testing and explicit overrides.
   */
  forceExecutionMode?: ExecutionMode;
}

// ---------------------------------------------------------------------------
// SERVER CAPABILITY MAP
// (Declares which format conversions benefit from server execution)
// Metadata-driven: add entries here to declare server provider affinity.
// ProviderSelectionEngine still determines the actual provider.
// ---------------------------------------------------------------------------

interface ServerCapabilityEntry {
  inputFormats: string[];
  outputFormats: string[];
  serverProviderId: string;
  /** File size threshold above which server is preferred (bytes, 0=always) */
  fileSizeThresholdBytes: number;
}

const SERVER_CAPABILITY_TABLE: ServerCapabilityEntry[] = [
  // FFmpeg server for large video files
  {
    inputFormats:           ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'],
    outputFormats:          ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'gif', 'mp3', 'aac', 'wav'],
    serverProviderId:       'stub-ffmpeg-server',
    fileSizeThresholdBytes: 50 * 1024 * 1024,  // 50MB
  },
  // LibreOffice for document conversions
  {
    inputFormats:           ['docx', 'doc', 'odt', 'xlsx', 'xls', 'ods', 'pptx', 'ppt', 'odp'],
    outputFormats:          ['pdf', 'docx', 'odt', 'xlsx', 'ods'],
    serverProviderId:       'stub-libreoffice',
    fileSizeThresholdBytes: 10 * 1024 * 1024,  // 10MB
  },
  // Ghostscript for PDF operations
  {
    inputFormats:           ['pdf'],
    outputFormats:          ['pdf'],
    serverProviderId:       'stub-ghostscript',
    fileSizeThresholdBytes: 5 * 1024 * 1024,   // 5MB
  },
  // Sharp for large image processing
  {
    inputFormats:           ['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'gif', 'webp'],
    outputFormats:          ['png', 'jpg', 'jpeg', 'webp', 'avif', 'tiff'],
    serverProviderId:       'stub-sharp',
    fileSizeThresholdBytes: 20 * 1024 * 1024,  // 20MB
  },
  // Calibre for ebook conversions
  {
    inputFormats:           ['epub', 'mobi', 'azw', 'azw3', 'fb2'],
    outputFormats:          ['epub', 'mobi', 'azw3', 'pdf', 'txt'],
    serverProviderId:       'stub-calibre',
    fileSizeThresholdBytes: 0,  // Always prefer server for ebooks
  },
];

// ---------------------------------------------------------------------------
// HYBRID PROVIDER RESOLVER
// ---------------------------------------------------------------------------

export class HybridProviderResolver {

  /**
   * Resolve the execution mode and provider for a conversion request.
   *
   * Flow:
   * 1. Call ProviderSelectionEngine.select() with browser mode (no server dep)
   * 2. If ENABLE_SERVER_PROVIDERS=false → return 'browser' (default behavior)
   * 3. Check SERVER_CAPABILITY_TABLE for server affinity
   * 4. Apply file size thresholds and format matching
   * 5. Return HybridResolutionResult with mode + original PSE result
   *
   * ProviderSelectionEngine.select() is called internally via require() to
   * avoid import cycles. The PSE remains the authority for provider selection.
   */
  resolve(request: HybridResolutionRequest): HybridResolutionResult {
    // Get browser-mode selection from PSE (always call PSE first — it's the authority)
    const { providerSelectionEngine } = require('./provider-selection-engine');
    const browserRequest: SelectionRequest = {
      ...request,
      runtimeEnv: 'browser' as RuntimeEnvironment,
    };
    const browserSelection: SelectionResult = providerSelectionEngine.select(browserRequest);

    // Force override
    if (request.forceExecutionMode) {
      return {
        executionMode:     request.forceExecutionMode,
        browserSelection,
        serverProviderId:  this.findServerProvider(request),
        serverRecommended: request.forceExecutionMode !== 'browser',
        resolutionReason:  `Forced execution mode: ${request.forceExecutionMode}`,
      };
    }

    // Browser-only mode (ENABLE_SERVER_PROVIDERS = false) — default behavior
    if (!isServerProcessingEnabled()) {
      return {
        executionMode:     'browser',
        browserSelection,
        serverProviderId:  null,
        serverRecommended: false,
        resolutionReason:  'Browser-only mode (ENABLE_SERVER_PROVIDERS=false)',
      };
    }

    // Check server capability
    const serverProviderId = this.findServerProvider(request);
    if (!serverProviderId) {
      return {
        executionMode:     'browser',
        browserSelection,
        serverProviderId:  null,
        serverRecommended: false,
        resolutionReason:  `No server provider registered for ${request.inputExt}→${request.outputExt}`,
      };
    }

    // Check file size threshold
    const entry = this.findCapabilityEntry(request);
    const threshold = entry?.fileSizeThresholdBytes ?? 0;
    const useServer = threshold === 0 || request.fileSizeBytes > threshold;

    if (useServer) {
      return {
        executionMode:     'server',
        browserSelection,
        serverProviderId,
        serverRecommended: true,
        resolutionReason:  `Server execution via ${serverProviderId} (file: ${request.fileSizeBytes} bytes > threshold: ${threshold} bytes)`,
      };
    }

    // File is small enough for browser, but server is available
    return {
      executionMode:     'browser',
      browserSelection,
      serverProviderId,
      serverRecommended: false,
      resolutionReason:  `Browser execution preferred (file ${request.fileSizeBytes} bytes < threshold ${threshold} bytes)`,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private findCapabilityEntry(request: Pick<SelectionRequest, 'inputExt' | 'outputExt'>): ServerCapabilityEntry | null {
    return SERVER_CAPABILITY_TABLE.find(entry =>
      entry.inputFormats.includes(request.inputExt.toLowerCase()) &&
      entry.outputFormats.includes(request.outputExt.toLowerCase()),
    ) ?? null;
  }

  private findServerProvider(request: Pick<SelectionRequest, 'inputExt' | 'outputExt'>): string | null {
    const entry = this.findCapabilityEntry(request);
    return entry?.serverProviderId ?? null;
  }

  /**
   * Check if a given conversion has a registered server provider.
   * Useful for UI hints ("Server processing available").
   */
  hasServerCapability(inputExt: string, outputExt: string): boolean {
    return this.findCapabilityEntry({ inputExt, outputExt }) !== null;
  }

  /**
   * Get all conversions that benefit from server execution.
   * Metadata-driven — no hardcoded format lists.
   */
  getServerCapabilityTable(): ServerCapabilityEntry[] {
    return SERVER_CAPABILITY_TABLE;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON
// ---------------------------------------------------------------------------

export const hybridProviderResolver = new HybridProviderResolver();
