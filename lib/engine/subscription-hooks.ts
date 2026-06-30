/**
 * lib/engine/subscription-hooks.ts
 *
 * Phase 6B Part 2 — Subscription / Plan Extension Points
 *
 * Prepares the architecture for Phase 6B Part 3 (Subscription System).
 * All interfaces and hooks are defined here so that:
 *   1. No provider refactoring is needed when billing is added.
 *   2. Subscription checks plug in at a single point (the Selection Engine).
 *   3. Feature flags, usage tracking, and plan restrictions compose cleanly.
 *
 * IMPORTANT: This file contains ZERO business logic.
 * All functions are stubs that return permissive defaults.
 * Phase 6B Part 3 will replace these stubs with real implementations.
 *
 * DO NOT implement billing, limits, or plan logic in this file.
 */

// ---------------------------------------------------------------------------
// TYPES — Provider Extension Interfaces
// ---------------------------------------------------------------------------

/**
 * User plan descriptor.
 * Phase 6B Part 3 will wire this to the actual subscription database.
 */
export interface UserPlan {
  /** User identifier (anonymous | authenticated) */
  userId: string;
  /** Subscription tier */
  tier: 'free' | 'pro' | 'enterprise';
  /** ISO timestamp of plan expiry (null = perpetual) */
  expiresAt: string | null;
  /** Feature flags enabled for this plan */
  features: string[];
}

/**
 * Usage snapshot for rate-limiting.
 * Phase 6B Part 3 will persist this via UsageTracker.
 */
export interface UsageSnapshot {
  /** Number of conversions in current billing period */
  conversions: number;
  /** Total bytes processed in current billing period */
  bytesProcessed: number;
  /** Period start (ISO timestamp) */
  periodStart: string;
}

/**
 * Feature flag descriptor.
 * Flags gate provider capabilities by plan tier.
 */
export interface FeatureFlag {
  /** Unique feature identifier (e.g., 'high-quality-video', 'batch-processing') */
  id: string;
  /** Minimum plan tier required */
  requiredTier: 'free' | 'pro' | 'enterprise';
  /** Human-readable description */
  description: string;
}

/**
 * Plan restriction applied to a specific operation.
 * Returned by checkPlanRestriction().
 */
export interface PlanRestriction {
  /** Whether the operation is permitted for the current plan */
  permitted: boolean;
  /** Reason for denial (only when permitted === false) */
  reason?: string;
  /** Tier required to unlock this operation */
  requiredTier?: 'pro' | 'enterprise';
  /** Feature flag ID that gates this operation */
  featureFlagId?: string;
}

/**
 * Download workflow descriptor.
 * Phase 6B Part 3 will extend this with watermark / size-limit logic.
 */
export interface DownloadWorkflow {
  /** Whether the download is permitted without modification */
  permitted: boolean;
  /** Whether a watermark should be applied */
  applyWatermark: boolean;
  /** Maximum output file size for this tier (0 = unlimited) */
  maxOutputSizeBytes: number;
  /** Whether the result should be queued for async delivery */
  useAsyncQueue: boolean;
}

// ---------------------------------------------------------------------------
// EXTENSION POINT INTERFACES
// (Implemented by Phase 6B Part 3 — stubs provided here)
// ---------------------------------------------------------------------------

/**
 * ISubscriptionProvider — checks user plan and feature access.
 * Phase 6B Part 3: implement against real subscription service.
 */
export interface ISubscriptionProvider {
  getUserPlan(userId: string): Promise<UserPlan>;
  checkPlanRestriction(userId: string, featureFlagId: string): Promise<PlanRestriction>;
  isFeatureEnabled(plan: UserPlan, featureFlagId: string): boolean;
}

/**
 * IUsageTracker — records and enforces usage limits.
 * Phase 6B Part 3: implement against database or Redis.
 */
export interface IUsageTracker {
  recordConversion(userId: string, bytes: number): Promise<void>;
  getUsage(userId: string): Promise<UsageSnapshot>;
  isWithinLimits(userId: string, plan: UserPlan): Promise<boolean>;
}

/**
 * IDownloadWorkflowProvider — determines download behaviour by tier.
 * Phase 6B Part 3: implement watermarking, size limits, async queues.
 */
export interface IDownloadWorkflowProvider {
  resolveWorkflow(userId: string, plan: UserPlan, outputSizeBytes: number): Promise<DownloadWorkflow>;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATIONS (permissive — all operations allowed)
// Replace with real implementations in Phase 6B Part 3.
// ---------------------------------------------------------------------------

export const stubSubscriptionProvider: ISubscriptionProvider = {
  async getUserPlan(userId: string): Promise<UserPlan> {
    return {
      userId,
      tier: 'free',
      expiresAt: null,
      features: ['all'],
    };
  },

  async checkPlanRestriction(_userId: string, _featureFlagId: string): Promise<PlanRestriction> {
    return { permitted: true };
  },

  isFeatureEnabled(_plan: UserPlan, _featureFlagId: string): boolean {
    return true;
  },
};

export const stubUsageTracker: IUsageTracker = {
  async recordConversion(_userId: string, _bytes: number): Promise<void> {
    // Phase 6B Part 3: persist to database
  },

  async getUsage(_userId: string): Promise<UsageSnapshot> {
    return {
      conversions: 0,
      bytesProcessed: 0,
      periodStart: new Date().toISOString(),
    };
  },

  async isWithinLimits(_userId: string, _plan: UserPlan): Promise<boolean> {
    return true;
  },
};

export const stubDownloadWorkflowProvider: IDownloadWorkflowProvider = {
  async resolveWorkflow(_userId: string, _plan: UserPlan, _outputSizeBytes: number): Promise<DownloadWorkflow> {
    return {
      permitted: true,
      applyWatermark: false,
      maxOutputSizeBytes: 0,
      useAsyncQueue: false,
    };
  },
};

// ---------------------------------------------------------------------------
// ACTIVE PROVIDERS — swap these out in Phase 6B Part 3
// ---------------------------------------------------------------------------

export const activeSubscriptionProvider: ISubscriptionProvider = stubSubscriptionProvider;
export const activeUsageTracker: IUsageTracker = stubUsageTracker;
export const activeDownloadWorkflowProvider: IDownloadWorkflowProvider = stubDownloadWorkflowProvider;
