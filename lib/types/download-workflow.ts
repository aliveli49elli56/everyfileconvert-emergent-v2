/**
 * lib/types/download-workflow.ts
 *
 * Phase 6C-2 — Download Workflow Foundation Types
 *
 * Interfaces prepared for the future /download page.
 * These types define the contract that conversion providers must satisfy
 * so that the /download page can be implemented without changing providers.
 *
 * Phase 6C-3 will implement:
 *   - /download page consuming these types
 *   - DownloadWorkflowManager backed by real storage
 *   - Download history persistence
 *
 * Requirement 8: The architecture must allow every completed conversion to
 * redirect to /download without changing provider implementations.
 */

import type { PlanId } from './subscription';

// ---------------------------------------------------------------------------
// CONVERSION SUMMARY
// The metadata produced after a conversion finishes.
// Providers emit this — /download page consumes it.
// ---------------------------------------------------------------------------

export interface ConversionSummary {
  /** Unique job identifier */
  jobId: string;
  /** Original filename */
  inputFilename: string;
  /** Converted filename */
  outputFilename: string;
  /** Input file size in bytes */
  inputSizeBytes: number;
  /** Output file size in bytes */
  outputSizeBytes: number;
  /** Input format extension (e.g. 'mp4') */
  inputFormat: string;
  /** Output format extension (e.g. 'mp3') */
  outputFormat: string;
  /** Provider that performed the conversion */
  providerId: string;
  /** Library that performed the conversion */
  libraryId: string;
  /** Processing environment ('browser' | 'server') */
  processingEnv: 'browser' | 'server';
  /** ISO timestamp of when conversion completed */
  completedAt: string;
  /** Conversion duration in milliseconds */
  durationMs: number;
  /** Whether the output is available for download */
  available: boolean;
  /** ISO timestamp of when the output expires (null = immediate) */
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// DOWNLOAD CONTEXT
// Everything the /download page needs to render — no processor queries needed.
// Matches Requirement 4 from Phase 6C-1: download workflow context.
// ---------------------------------------------------------------------------

export interface DownloadPageContext {
  /** Conversion that produced this download */
  conversion: ConversionSummary;
  /** Resolved user plan at time of download */
  planId: PlanId;
  /** Whether the download is permitted (plan check) */
  downloadPermitted: boolean;
  /** Whether a watermark will be applied to the output */
  applyWatermark: boolean;
  /** Maximum output size permitted for this plan (0 = unlimited) */
  maxOutputSizeBytes: number;
  /** Whether to use async delivery queue */
  useAsyncQueue: boolean;
  /** Whether the plan includes ad display */
  adsEnabled: boolean;
  /** Whether the plan retains download history */
  hasDownloadHistory: boolean;
  /** Number of days the result is retained (0 = no retention) */
  downloadRetentionDays: number;
  /** Whether the user is eligible to upgrade */
  upgradeEligible: boolean;
  /** Next plan above current (null if at maximum) */
  nextPlan: PlanId | null;
}

// ---------------------------------------------------------------------------
// DOWNLOAD READY EVENT
// Fired by conversion providers when a job completes.
// The /download page listens for this to auto-redirect.
// ---------------------------------------------------------------------------

export interface DownloadReadyEvent {
  type: 'download:ready';
  jobId: string;
  summary: ConversionSummary;
  /** Output blob URL (browser) or signed URL (server) */
  downloadUrl: string;
  /** Blob reference for browser-side downloads */
  blob?: Blob;
}

// ---------------------------------------------------------------------------
// DOWNLOAD HISTORY ENTRY
// Phase 6C-3: persisted per-user download record.
// ---------------------------------------------------------------------------

export interface DownloadHistoryEntry {
  /** Unique record ID */
  id: string;
  /** Reference to the conversion job */
  jobId: string;
  /** Output filename */
  filename: string;
  /** Output format */
  format: string;
  /** File size in bytes */
  sizeBytes: number;
  /** ISO timestamp of download */
  downloadedAt: string;
  /** Plan tier at time of download */
  planId: PlanId;
}

// ---------------------------------------------------------------------------
// DOWNLOAD WORKFLOW MANAGER INTERFACE
// Phase 6C-3 will implement this against real storage/DB.
// ---------------------------------------------------------------------------

export interface IDownloadWorkflowManager {
  /**
   * Build a DownloadPageContext for a completed conversion.
   * Queries SubscriptionService — never processors directly.
   */
  buildContext(
    summary: ConversionSummary,
    userId: string | null,
    planId: PlanId,
  ): Promise<DownloadPageContext>;

  /**
   * Record a download event (Phase 6C-3: persist to DB).
   */
  recordDownload(
    userId: string | null,
    summary: ConversionSummary,
  ): Promise<void>;

  /**
   * Get download history for a user (Phase 6C-3: fetch from DB).
   */
  getHistory(userId: string): Promise<DownloadHistoryEntry[]>;

  /**
   * Clean up expired download records.
   */
  cleanupExpired(): Promise<void>;
}

// ---------------------------------------------------------------------------
// ADVERTISEMENT REFRESH CONTEXT
// Used by /download page to refresh ad slots after conversion.
// Requirement 8: ad refresh support must be prepared.
// ---------------------------------------------------------------------------

export interface AdRefreshContext {
  /** Whether ads should be shown on this download */
  showAds: boolean;
  /** Ad units to refresh after download completes */
  adUnits: string[];
  /** Conversion-specific targeting data (future AdSense custom params) */
  targeting: {
    inputFormat: string;
    outputFormat: string;
    category: string;
    planId: PlanId;
  };
}
