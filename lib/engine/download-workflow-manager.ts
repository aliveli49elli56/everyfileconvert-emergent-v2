/**
 * lib/engine/download-workflow-manager.ts
 *
 * Phase 6C-3 — Download Workflow Manager
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SINGLE ENTRY POINT FOR ALL DOWNLOAD OPERATIONS                     ║
 * ║                                                                      ║
 * ║  Every conversion provider must:                                    ║
 * ║   1. Build a ConversionSummary                                      ║
 * ║   2. Call downloadWorkflowManager.storeJob(summary, blob, url)      ║
 * ║   3. Redirect to /${locale}/download?jobId=${summary.jobId}         ║
 * ║                                                                      ║
 * ║  No provider may call triggerFileDownload() directly anymore.       ║
 * ║  No provider may create <a> elements and click them.                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Current implementation (Phase 6C-3):
 *   - In-memory job store (Map) — survives client-side navigation, not refreshes
 *   - sessionStorage backup for ConversionSummary metadata (survives navigation)
 *   - localStorage for download history (survives refreshes)
 *   - Timer-based cleanup for expired blob URLs
 *
 * Future (Phase 6D+):
 *   - Redis-backed job store (replaces Map)
 *   - Database-backed history (replaces localStorage)
 *   - S3/cloud storage for file retention beyond session
 *   - JWT/session-aware userId resolution
 *   - Stripe/PayPal quota integration
 *   - Priority queue routing for paid plans
 */

import type { PlanId } from '../types/subscription';
import type {
  ConversionSummary,
  DownloadPageContext,
  DownloadHistoryEntry,
  IDownloadWorkflowManager,
} from '../types/download-workflow';
import { subscriptionService } from '../services/subscription-service';
import { DEFAULT_PLAN_ID } from '../config/subscription-config';

// ---------------------------------------------------------------------------
// INTERNAL JOB ENTRY
// ---------------------------------------------------------------------------

/**
 * Internal record stored per completed conversion job.
 * Phase 6C-3: browser memory only.
 * Phase 6D: will be replaced with database record ID.
 */
interface JobEntry {
  /** Conversion metadata */
  summary: ConversionSummary;
  /** Object URL pointing to the output blob (valid while tab is open) */
  blobUrl: string;
  /** The actual blob — kept for re-download without re-conversion */
  blob?: Blob;
  /** Unix timestamp of job creation */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// STORAGE KEYS
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'efc_download_history_v1';
const SESSION_KEY_PREFIX = 'efc_job_';
const MAX_HISTORY_ENTRIES = 50;

// ---------------------------------------------------------------------------
// DOWNLOAD WORKFLOW MANAGER
// ---------------------------------------------------------------------------

class DownloadWorkflowManagerImpl implements IDownloadWorkflowManager {

  /** In-memory job store. Survives client-side navigation within the same tab. */
  private readonly jobStore = new Map<string, JobEntry>();

  /** Cached history — synced to localStorage */
  private historyCache: DownloadHistoryEntry[] = [];
  private historyLoaded = false;

  // ── IDownloadWorkflowManager ─────────────────────────────────────────────

  /**
   * Build a DownloadPageContext for the /download page.
   *
   * Reads ALL subscription data from SubscriptionService.
   * Never queries plan names or compares plan IDs directly.
   * Never reads from subscription-config.ts directly.
   *
   * Phase 6D: will resolve planId from JWT session.
   */
  async buildContext(
    summary: ConversionSummary,
    userId: string | null,
    planId: PlanId = DEFAULT_PLAN_ID,
  ): Promise<DownloadPageContext> {
    const workflow  = subscriptionService.getDownloadContext(planId);
    const features  = subscriptionService.getPlanFeatures(planId);
    const limits    = subscriptionService.getEffectiveLimits(planId);
    const upgrade   = subscriptionService.getUpgradeEligibility(planId);

    return {
      conversion:            summary,
      planId,
      downloadPermitted:     workflow.workflow.permitted,
      applyWatermark:        workflow.workflow.applyWatermark,
      maxOutputSizeBytes:    workflow.workflow.maxOutputSizeBytes,
      useAsyncQueue:         workflow.workflow.useAsyncQueue,
      // Requirement: adsEnabled MUST come from subscriptionService.shouldShowAds()
      adsEnabled:            subscriptionService.shouldShowAds(planId),
      hasDownloadHistory:    features.downloadHistory,
      downloadRetentionDays: limits.downloadRetentionDays,
      upgradeEligible:       upgrade.eligible,
      nextPlan:              upgrade.nextPlan,
    };
  }

  /**
   * Record a completed download to history.
   * Phase 6C-3: persists to localStorage (anonymous, per-device).
   * Phase 6D: will persist to database with userId.
   */
  async recordDownload(
    userId: string | null,
    summary: ConversionSummary,
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    const planId = userId
      ? DEFAULT_PLAN_ID  // Phase 6D: resolve from session
      : DEFAULT_PLAN_ID;

    const entry: DownloadHistoryEntry = {
      id:           `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId:        summary.jobId,
      filename:     summary.outputFilename,
      format:       summary.outputFormat,
      sizeBytes:    summary.outputSizeBytes,
      downloadedAt: new Date().toISOString(),
      planId,
    };

    this._ensureHistoryLoaded();
    this.historyCache = [entry, ...this.historyCache].slice(0, MAX_HISTORY_ENTRIES);
    this._saveHistory();
  }

  /**
   * Get download history for a user.
   * Phase 6C-3: reads from localStorage (anonymous / per-device).
   * Phase 6D: reads from database using userId.
   */
  async getHistory(_userId: string): Promise<DownloadHistoryEntry[]> {
    if (typeof window === 'undefined') return [];
    this._ensureHistoryLoaded();
    return [...this.historyCache];
  }

  /**
   * Remove expired download records and revoke stale blob URLs.
   * Phase 6C-3: 24-hour window for anonymous free users.
   * Phase 6D: per-plan retention from subscription-config.ts.
   */
  async cleanupExpired(): Promise<void> {
    if (typeof window === 'undefined') return;

    const cutoffMs = 24 * 60 * 60 * 1000; // 24h free tier
    const now = Date.now();

    // Clean history
    this._ensureHistoryLoaded();
    this.historyCache = this.historyCache.filter(
      e => now - new Date(e.downloadedAt).getTime() < cutoffMs,
    );
    this._saveHistory();

    // Revoke expired blob URLs and remove from memory
    for (const jobId of Array.from(this.jobStore.keys())) {
      const entry = this.jobStore.get(jobId);
      if (!entry) continue;
      if (now - entry.createdAt > cutoffMs) {
        if (entry.blobUrl) {
          try { URL.revokeObjectURL(entry.blobUrl); } catch { /* ignore */ }
        }
        this.jobStore.delete(jobId);
        this._removeSessionEntry(jobId);
      }
    }
  }

  // ── Browser-Specific Methods ──────────────────────────────────────────────

  /**
   * Store a completed conversion job.
   * Must be called by every conversion provider before redirecting to /download.
   *
   * @param summary - ConversionSummary produced by the conversion provider
   * @param blob    - Output Blob (optional — used for re-download without re-conversion)
   * @param blobUrl - Object URL pointing to the output (must already exist)
   * @returns The jobId — use to build: /${locale}/download?jobId=${jobId}
   *
   * @example
   *   const blobUrl = URL.createObjectURL(blob);
   *   const jobId = downloadWorkflowManager.storeJob(summary, blob, blobUrl);
   *   router.push(`/${locale}/download?jobId=${jobId}`);
   */
  storeJob(
    summary: ConversionSummary,
    blob: Blob | null,
    blobUrl: string,
  ): string {
    const entry: JobEntry = {
      summary,
      blobUrl,
      blob: blob ?? undefined,
      createdAt: Date.now(),
    };
    this.jobStore.set(summary.jobId, entry);
    // Persist metadata for navigation recovery (not the blob itself)
    this._saveSessionEntry(summary.jobId, summary);
    return summary.jobId;
  }

  /**
   * Retrieve a stored job by ID.
   * Returns the in-memory entry (with live blob URL) if still available.
   * Falls back to sessionStorage metadata (blob URL will be empty string).
   * Returns null if the job was never stored or has been garbage-collected.
   *
   * Callers must check isBlobAvailable(jobId) before attempting to download.
   */
  getJob(jobId: string): JobEntry | null {
    // Try in-memory first (blob URL still valid)
    const inMemory = this.jobStore.get(jobId);
    if (inMemory) return inMemory;

    // Fall back to sessionStorage metadata (survives navigation, not refresh)
    const summary = this._loadSessionEntry(jobId);
    if (summary) {
      return {
        summary,
        blobUrl: '',  // blob is gone after page refresh
        createdAt: Date.now(),
      };
    }
    return null;
  }

  /**
   * Get the download URL for a job.
   * Returns null if the blob is no longer available.
   */
  getDownloadUrl(jobId: string): string | null {
    const entry = this.jobStore.get(jobId);
    return entry?.blobUrl || null;
  }

  /**
   * Whether the blob for a job is still in memory (not revoked or refreshed away).
   */
  isBlobAvailable(jobId: string): boolean {
    return this.jobStore.has(jobId) && !!this.jobStore.get(jobId)?.blobUrl;
  }

  /**
   * Generate a unique job ID.
   * Phase 6D: will use database-generated IDs (UUID / ULID).
   */
  generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current history count (for UI indicators).
   */
  getHistoryCount(): number {
    if (typeof window === 'undefined') return 0;
    this._ensureHistoryLoaded();
    return this.historyCache.length;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private _saveSessionEntry(jobId: string, summary: ConversionSummary): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        `${SESSION_KEY_PREFIX}${jobId}`,
        JSON.stringify(summary),
      );
    } catch { /* sessionStorage unavailable */ }
  }

  private _loadSessionEntry(jobId: string): ConversionSummary | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${jobId}`);
      return raw ? (JSON.parse(raw) as ConversionSummary) : null;
    } catch { return null; }
  }

  private _removeSessionEntry(jobId: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${jobId}`);
    } catch { /* ignore */ }
  }

  private _ensureHistoryLoaded(): void {
    if (this.historyLoaded || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.historyCache = raw ? (JSON.parse(raw) as DownloadHistoryEntry[]) : [];
    } catch {
      this.historyCache = [];
    }
    this.historyLoaded = true;
  }

  private _saveHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.historyCache));
    } catch { /* quota exceeded */ }
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Global DownloadWorkflowManager singleton.
 *
 * This is the ONLY entry point for download job management.
 * All conversion providers must use this before redirecting to /download.
 *
 * @example — In a conversion provider, after processing completes:
 *
 *   const blobUrl = URL.createObjectURL(resultBlob);
 *   const summary: ConversionSummary = {
 *     jobId:        downloadWorkflowManager.generateJobId(),
 *     inputFilename:  file.name,
 *     outputFilename: `converted.${targetExt}`,
 *     inputSizeBytes:  file.size,
 *     outputSizeBytes: resultBlob.size,
 *     inputFormat:  sourceExt,
 *     outputFormat: targetExt,
 *     providerId:   'CanvasImageProvider',
 *     libraryId:    'canvas-api',
 *     processingEnv: 'browser',
 *     completedAt:  new Date().toISOString(),
 *     durationMs:   Date.now() - startTime,
 *     available:    true,
 *     expiresAt:    null,
 *   };
 *   downloadWorkflowManager.storeJob(summary, resultBlob, blobUrl);
 *   router.push(`/${locale}/download?jobId=${summary.jobId}`);
 */
export const downloadWorkflowManager = new DownloadWorkflowManagerImpl();
