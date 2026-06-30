/**
 * lib/engine/subscription-hooks.ts
 *
 * Phase 6C-1 — Subscription / Plan Extension Points
 *
 * This file re-exports the active engine instances introduced in Phase 6C-1
 * and retains Phase 6B backward-compatible stub interfaces.
 *
 * Architecture:
 *   - LimitEngine  → canUseFeature / canUseProcessor / upload limits
 *   - QuotaEngine  → daily conversion tracking (in-memory Phase 6C-1)
 *   - PlanResolver → resolves user plan (always FREE in Phase 6C-1)
 *
 * Phase 6C-2 swap guide:
 *   Replace planResolver with a JWT-backed implementation.
 *   Replace quotaEngine with a Redis-backed implementation.
 *   No other files require modification.
 */

// ---------------------------------------------------------------------------
// PHASE 6C-1 ENGINE EXPORTS (primary)
// ---------------------------------------------------------------------------

export { limitEngine }   from './limit-engine';
export { quotaEngine }   from './quota-engine';
export { planResolver }  from './plan-resolver';

export type { LimitEngine }  from './limit-engine';
export type { QuotaEngine }  from './quota-engine';
export type { PlanResolver } from './plan-resolver';

// ---------------------------------------------------------------------------
// PHASE 6B BACKWARD-COMPATIBLE TYPES
// Retained so that any existing import of these types continues to compile.
// Phase 6C-2 consumers should migrate to types in lib/types/subscription.ts.
// ---------------------------------------------------------------------------

/**
 * @deprecated Use UserContext from lib/types/subscription.ts
 */
export interface UserPlan {
  userId:    string;
  tier:      'free' | 'pro' | 'enterprise';
  expiresAt: string | null;
  features:  string[];
}

/**
 * @deprecated Use UsageSnapshot from lib/types/subscription.ts
 */
export interface UsageSnapshotLegacy {
  conversions:    number;
  bytesProcessed: number;
  periodStart:    string;
}

/**
 * @deprecated Use FeatureName from lib/types/subscription.ts
 */
export interface FeatureFlag {
  id:           string;
  requiredTier: 'free' | 'pro' | 'enterprise';
  description:  string;
}

/**
 * @deprecated Use LimitCheckResult from lib/types/subscription.ts
 */
export interface PlanRestriction {
  permitted:       boolean;
  reason?:         string;
  requiredTier?:   'pro' | 'enterprise';
  featureFlagId?:  string;
}

/**
 * @deprecated Use DownloadWorkflow from lib/types/subscription.ts
 */
export interface DownloadWorkflowLegacy {
  permitted:          boolean;
  applyWatermark:     boolean;
  maxOutputSizeBytes: number;
  useAsyncQueue:      boolean;
}

// ---------------------------------------------------------------------------
// PHASE 6B BACKWARD-COMPATIBLE INTERFACES
// Retained so that existing provider implementations compile unchanged.
// ---------------------------------------------------------------------------

/** @deprecated Implement ISubscriptionProvider from lib/types/subscription.ts */
export interface ISubscriptionProvider {
  getUserPlan(userId: string): Promise<UserPlan>;
  checkPlanRestriction(userId: string, featureFlagId: string): Promise<PlanRestriction>;
  isFeatureEnabled(plan: UserPlan, featureFlagId: string): boolean;
}

/** @deprecated Implement IQuotaProvider from lib/types/subscription.ts */
export interface IUsageTracker {
  recordConversion(userId: string, bytes: number): Promise<void>;
  getUsage(userId: string): Promise<UsageSnapshotLegacy>;
  isWithinLimits(userId: string, plan: UserPlan): Promise<boolean>;
}

/** @deprecated Implement IDownloadWorkflowProvider from lib/types/subscription.ts */
export interface IDownloadWorkflowProvider {
  resolveWorkflow(
    userId: string,
    plan: UserPlan,
    outputSizeBytes: number,
  ): Promise<DownloadWorkflowLegacy>;
}

// ---------------------------------------------------------------------------
// PHASE 6B STUB IMPLEMENTATIONS (permissive defaults)
// These remain available for any code that still imports them directly.
// ---------------------------------------------------------------------------

export const stubSubscriptionProvider: ISubscriptionProvider = {
  async getUserPlan(userId: string): Promise<UserPlan> {
    return { userId, tier: 'free', expiresAt: null, features: ['all'] };
  },
  async checkPlanRestriction(
    _userId: string,
    _featureFlagId: string,
  ): Promise<PlanRestriction> {
    return { permitted: true };
  },
  isFeatureEnabled(_plan: UserPlan, _featureFlagId: string): boolean {
    return true;
  },
};

export const stubUsageTracker: IUsageTracker = {
  async recordConversion(_userId: string, _bytes: number): Promise<void> {},
  async getUsage(_userId: string): Promise<UsageSnapshotLegacy> {
    return { conversions: 0, bytesProcessed: 0, periodStart: new Date().toISOString() };
  },
  async isWithinLimits(_userId: string, _plan: UserPlan): Promise<boolean> {
    return true;
  },
};

export const stubDownloadWorkflowProvider: IDownloadWorkflowProvider = {
  async resolveWorkflow(
    _userId: string,
    _plan: UserPlan,
    _outputSizeBytes: number,
  ): Promise<DownloadWorkflowLegacy> {
    return { permitted: true, applyWatermark: false, maxOutputSizeBytes: 0, useAsyncQueue: false };
  },
};

// ---------------------------------------------------------------------------
// ACTIVE PROVIDERS — Phase 6C-1 engines are now canonical
// Phase 6C-2: replace with real implementations
// ---------------------------------------------------------------------------

export const activeSubscriptionProvider = stubSubscriptionProvider;
export const activeUsageTracker         = stubUsageTracker;
export const activeDownloadWorkflowProvider = stubDownloadWorkflowProvider;
