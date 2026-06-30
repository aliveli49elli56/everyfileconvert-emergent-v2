/**
 * lib/engine/limit-engine.ts
 *
 * Phase 6C-1 — Centralized Limit Engine
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SINGLE RUNTIME ARBITER FOR ALL SUBSCRIPTION LIMIT DECISIONS        ║
 * ║                                                                      ║
 * ║  Reads ONLY from /lib/config/subscription-config.ts.                ║
 * ║  No limit value, plan name, or feature flag may be consulted        ║
 * ║  from any other source.                                              ║
 * ║                                                                      ║
 * ║  Requirement compliance:                                             ║
 * ║   Req 1 — Audio limits resolved via CATEGORY_LIMIT_MAP              ║
 * ║   Req 2 — Premium visibility decoupled from purchasing              ║
 * ║   Req 3 — Single source of truth (subscription-config.ts only)      ║
 * ║   Req 4 — Download workflow context exposed for /download page      ║
 * ║   Req 5 — Processors query this engine; no plan names in processors ║
 * ║   Req 6 — Daily limits fully configurable via config only           ║
 * ║   Req 7 — Category-based upload limits via Format Registry          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   import { limitEngine } from '@/lib/engine/limit-engine';
 *   const result = limitEngine.canUseProcessor('free', 'image:background-remove');
 *   const maxBytes = limitEngine.getMaxUploadBytesByExtension('free', 'mp3');
 */

import type {
  PlanId,
  FeatureName,
  LimitCheckResult,
  UpgradeRecommendation,
  QuotaState,
  DownloadWorkflow,
  PlanDefinition,
} from '../types/subscription';

import {
  PLAN_DEFINITIONS,
  PLAN_HIERARCHY,
  PROCESSOR_FEATURE_REQUIREMENTS,
  CATEGORY_LIMIT_MAP,
  FEATURE_FLAGS,
  DEFAULT_PLAN_ID,
  getMinimumPlanForFeature,
  getMinimumPlanForProcessor,
  getNextPlan,
  isAtLeast,
} from '../config/subscription-config';

import { formatRegistry } from '../registry/format-registry';

// ---------------------------------------------------------------------------
// LIMIT ENGINE CLASS
// ---------------------------------------------------------------------------

export class LimitEngine {

  // ── Feature Checks ──────────────────────────────────────────────────────

  /**
   * Check if a plan has a specific feature enabled.
   * Requirement 3: reads only from PLAN_DEFINITIONS in subscription-config.ts.
   * Requirement 5: processors call this — no plan names inside processors.
   */
  canUseFeature(planId: PlanId, feature: FeatureName): LimitCheckResult {
    const plan = PLAN_DEFINITIONS[planId];
    if (plan.features[feature]) {
      return { allowed: true };
    }
    const requiredPlan = getMinimumPlanForFeature(feature);
    return {
      allowed: false,
      reason: `Feature '${feature}' requires the ${
        requiredPlan
          ? PLAN_DEFINITIONS[requiredPlan].displayName
          : 'a higher'
      } plan`,
      requiredPlan: requiredPlan ?? undefined,
      requiredFeature: feature,
    };
  }

  /**
   * Check whether a global application feature flag is enabled.
   * Requirement 3: reads from FEATURE_FLAGS in subscription-config.ts only.
   */
  isAppFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
    return FEATURE_FLAGS[flag];
  }

  // ── Processor Checks ────────────────────────────────────────────────────

  /**
   * Check whether a plan can use a specific processor.
   *
   * Requirement 5: ONLY path processors should use to check subscription logic.
   * No processor may reference FREE, STARTER, PRO, or BUSINESS by name.
   * Reads required features from PROCESSOR_FEATURE_REQUIREMENTS.
   *
   * Returns LimitCheckResult — processors pattern-match on `allowed` only.
   */
  canUseProcessor(planId: PlanId, processorId: string): LimitCheckResult {
    const required = PROCESSOR_FEATURE_REQUIREMENTS[processorId] ?? [];
    if (required.length === 0) return { allowed: true };

    const plan = PLAN_DEFINITIONS[planId];
    for (const feature of required) {
      if (!plan.features[feature]) {
        const requiredPlan = getMinimumPlanForProcessor(processorId);
        return {
          allowed: false,
          reason: `Processor '${processorId}' requires '${feature}' (${
            PLAN_DEFINITIONS[requiredPlan].displayName
          }+ plan)`,
          requiredPlan,
          requiredFeature: feature,
        };
      }
    }
    return { allowed: true };
  }

  /**
   * Get the minimum plan required to use a processor.
   * Requirement 5: the canonical resolver for processor-to-plan mapping.
   */
  getRequiredPlanForProcessor(processorId: string): PlanId {
    return getMinimumPlanForProcessor(processorId);
  }

  // ── Upload Size Limits ───────────────────────────────────────────────────

  /**
   * Get maximum upload size in MB for a plan + category.
   * Returns -1 for unlimited.
   *
   * Requirement 3: reads exclusively from PLAN_DEFINITIONS[planId].limits
   * via the CATEGORY_LIMIT_MAP defined in subscription-config.ts.
   *
   * Requirement 1: audio category resolves to `maxAudioMB` (e.g. 100 MB free).
   */
  getMaxUploadMB(planId: PlanId, category: string): number {
    const limitKey = CATEGORY_LIMIT_MAP[category.toLowerCase()] ?? 'maxOtherMB';
    const limits = PLAN_DEFINITIONS[planId].limits;
    return limits[limitKey] as number;
  }

  /**
   * Get maximum upload size in bytes for a plan + category.
   * Returns -1 for unlimited.
   */
  getMaxUploadBytes(planId: PlanId, category: string): number {
    const mb = this.getMaxUploadMB(planId, category);
    return mb === -1 ? -1 : mb * 1024 * 1024;
  }

  /**
   * Resolve maximum upload size in MB by file extension.
   *
   * Requirement 7: extension → category via Format Registry →
   * limit key via CATEGORY_LIMIT_MAP.
   * No extension-based hardcoding is permitted in processors or validators.
   *
   * Example: 'mp3' → 'audio' → maxAudioMB
   *          'png' → 'image' → maxImageMB
   *          'docx' → 'document' → maxDocumentMB
   */
  getMaxUploadMBByExtension(planId: PlanId, ext: string): number {
    const format = formatRegistry.get(ext.toLowerCase());
    const category: string = format?.category ?? 'other';
    return this.getMaxUploadMB(planId, category);
  }

  /**
   * Resolve maximum upload size in bytes by file extension.
   * Requirement 7: category-based resolution via Format Registry.
   */
  getMaxUploadBytesByExtension(planId: PlanId, ext: string): number {
    const mb = this.getMaxUploadMBByExtension(planId, ext);
    return mb === -1 ? -1 : mb * 1024 * 1024;
  }

  /**
   * Check whether a file size is within the plan limit for a given category.
   * Returns a structured LimitCheckResult for callers to pattern-match on.
   */
  checkFileSizeAllowed(
    planId: PlanId,
    category: string,
    fileSizeBytes: number,
  ): LimitCheckResult {
    const maxBytes = this.getMaxUploadBytes(planId, category);
    if (maxBytes === -1) return { allowed: true };
    if (fileSizeBytes <= maxBytes) return { allowed: true };

    const maxMB  = (maxBytes / (1024 * 1024)).toFixed(0);
    const actMB  = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      reason: `File size (${actMB} MB) exceeds the ${maxMB} MB limit for the ${
        PLAN_DEFINITIONS[planId].displayName
      } plan`,
      limitValue: maxBytes,
      actualValue: fileSizeBytes,
      requiredPlan: this._planThatAllows(category, fileSizeBytes),
    };
  }

  /**
   * Check whether a file size is allowed — resolves category from extension.
   *
   * Requirement 7: the canonical entry point for size validation.
   * Callers pass (planId, ext, bytes) — never a hardcoded limit.
   */
  checkFileSizeAllowedByExtension(
    planId: PlanId,
    ext: string,
    fileSizeBytes: number,
  ): LimitCheckResult {
    const format   = formatRegistry.get(ext.toLowerCase());
    const category: string = format?.category ?? 'other';
    return this.checkFileSizeAllowed(planId, category, fileSizeBytes);
  }

  // ── Quota / Daily Limits ─────────────────────────────────────────────────

  /**
   * Get daily conversion limit for a plan.
   * Returns -1 for unlimited.
   *
   * Requirement 6: changing this limit requires only subscription-config.ts.
   * No code change is ever needed to adjust daily limits.
   */
  getDailyLimit(planId: PlanId): number {
    return PLAN_DEFINITIONS[planId].limits.dailyConversions;
  }

  /**
   * Get maximum parallel conversions for a plan.
   * Requirement 6: fully configurable via subscription-config.ts only.
   */
  getParallelLimit(planId: PlanId): number {
    return PLAN_DEFINITIONS[planId].limits.parallelConversions;
  }

  /**
   * Get maximum files per batch job for a plan.
   * Requirement 6: fully configurable via subscription-config.ts only.
   */
  getMaxFilesPerJob(planId: PlanId): number {
    return PLAN_DEFINITIONS[planId].limits.maxFilesPerJob;
  }

  // ── Plan Visibility & Purchasing (Requirement 2) ─────────────────────────

  /**
   * Whether a plan should be shown on the pricing page.
   *
   * Requirement 2: plans remain visible even when PREMIUM_ENABLED = false.
   * Visibility is controlled by plan.visible only — not by PREMIUM_ENABLED.
   */
  isPlanVisible(planId: PlanId): boolean {
    return PLAN_DEFINITIONS[planId].visible;
  }

  /**
   * Whether a plan can currently be purchased.
   *
   * Requirement 2: PREMIUM_ENABLED = false → purchasable = false.
   * Plans remain visible and renderable — only checkout is gated.
   * Toggleing PREMIUM_ENABLED to true re-enables purchases without code change.
   */
  isPlanPurchasable(planId: PlanId): boolean {
    if (planId === 'free') return false; // Free is always free
    if (!FEATURE_FLAGS.PREMIUM_ENABLED) return false;
    return PLAN_DEFINITIONS[planId].enabled;
  }

  /**
   * Whether the application is operating in "Coming Soon" mode.
   *
   * Requirement 2: when true, pricing page renders fully but checkout is
   * disabled. Controlled exclusively by PREMIUM_ENABLED in subscription-config.ts.
   * No code changes are needed — toggle the flag.
   */
  isComingSoonMode(): boolean {
    return !FEATURE_FLAGS.PREMIUM_ENABLED;
  }

  /**
   * Return all plans visible on the pricing page, sorted by sortOrder.
   * Requirement 2: all visible plans render regardless of PREMIUM_ENABLED.
   */
  getVisiblePlans(): PlanDefinition[] {
    return Object.values(PLAN_DEFINITIONS)
      .filter(p => p.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ── Upgrade Recommendations ──────────────────────────────────────────────

  /**
   * Build an upgrade recommendation when a feature is gated.
   * Used by UI upgrade CTAs — no business logic in UI components.
   */
  getUpgradeRecommendation(
    currentPlanId: PlanId,
    feature: FeatureName,
  ): UpgradeRecommendation {
    const next         = getNextPlan(currentPlanId);
    const requiredPlan = getMinimumPlanForFeature(feature) ?? 'starter';

    // Pick the lower of "next plan" vs "minimum required" — prefer smallest upgrade
    let targetPlan: PlanId = requiredPlan;
    if (next && isAtLeast(next, requiredPlan)) {
      targetPlan = next;
    }

    return {
      targetPlan,
      featureName: feature,
      reason: `'${feature}' is not available on the ${
        PLAN_DEFINITIONS[currentPlanId].displayName
      } plan`,
      ctaText: `Upgrade to ${PLAN_DEFINITIONS[targetPlan].displayName}`,
    };
  }

  // ── Download Workflow Preparation (Requirement 4) ─────────────────────────

  /**
   * Get download workflow descriptor for a plan.
   *
   * Requirement 4: /download page queries this — never processors directly.
   * Phase 6C-1: permissive defaults (no watermark, no async queue).
   * Phase 6C-2: implement per-plan watermarking, size limits, queue routing.
   */
  getDownloadWorkflow(planId: PlanId): DownloadWorkflow {
    return {
      permitted: true,
      applyWatermark: false,       // Phase 6C-2: apply per plan.features
      maxOutputSizeBytes: 0,       // 0 = unlimited in Phase 6C-1
      useAsyncQueue: false,        // Phase 6C-2: route large jobs to queue
    };
  }

  /**
   * Whether the plan includes download history access.
   * Requirement 4: /download page queries this, not processors.
   */
  hasDownloadHistory(planId: PlanId): boolean {
    return PLAN_DEFINITIONS[planId].features.downloadHistory;
  }

  /**
   * Whether the plan includes conversion history access.
   * Requirement 4: /download page queries this, not processors.
   */
  hasConversionHistory(planId: PlanId): boolean {
    return PLAN_DEFINITIONS[planId].features.conversionHistory;
  }

  /**
   * Get upgrade eligibility for a plan.
   * Returns the next tier available, or null if already at maximum.
   * Requirement 4: /download page may suggest upgrade; decision made here.
   */
  getUpgradeEligibility(planId: PlanId): { eligible: boolean; nextPlan: PlanId | null } {
    const next = getNextPlan(planId);
    return { eligible: next !== null, nextPlan: next };
  }

  /**
   * Get complete download context — all data required by the /download page.
   *
   * Requirement 4: the download workflow must never query processors directly
   * for subscription information. This single call provides everything needed:
   *   - current plan definition
   *   - download workflow descriptor
   *   - history access flags
   *   - upgrade eligibility
   *   - quota limits
   *   - coming-soon / purchasable status
   */
  getDownloadContext(planId: PlanId) {
    return {
      planId,
      planDefinition:      PLAN_DEFINITIONS[planId],
      workflow:            this.getDownloadWorkflow(planId),
      hasDownloadHistory:  this.hasDownloadHistory(planId),
      hasConversionHistory: this.hasConversionHistory(planId),
      upgradeEligibility:  this.getUpgradeEligibility(planId),
      maxFilesPerJob:      this.getMaxFilesPerJob(planId),
      dailyLimit:          this.getDailyLimit(planId),
      isPurchasable:       this.isPlanPurchasable(planId),
      isComingSoon:        this.isComingSoonMode(),
    };
  }

  // ── Quota State Helpers ──────────────────────────────────────────────────

  /**
   * Build a QuotaState for a plan given current usage.
   * Phase 6C-1: called by QuotaEngine with in-memory counters.
   * Phase 6C-2: called with real counters from Redis/database.
   *
   * Requirement 6: all limits read from subscription-config.ts.
   */
  buildQuotaState(planId: PlanId, currentConversions: number = 0): QuotaState {
    const max       = this.getDailyLimit(planId);
    const remaining = max === -1 ? -1 : Math.max(0, max - currentConversions);
    const percent   = max === -1 ? -1 : Math.min(100, Math.round((currentConversions / max) * 100));

    const now      = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
    ));

    return {
      hasQuota:             max === -1 || currentConversions < max,
      remainingConversions: remaining,
      maxConversions:       max,
      usagePercent:         percent,
      resetsAt:             tomorrow.toISOString(),
    };
  }

  // ── Plan Definition Access ───────────────────────────────────────────────

  /**
   * Get the full plan definition for a plan ID.
   * Requirement 3: single source of truth — reads from subscription-config.ts.
   */
  getPlanDefinition(planId: PlanId): PlanDefinition {
    return PLAN_DEFINITIONS[planId];
  }

  /**
   * Get the plan hierarchy (ascending by tier).
   * Requirement 3: order is defined only in subscription-config.ts.
   */
  getPlanHierarchy(): readonly PlanId[] {
    return PLAN_HIERARCHY;
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  /** Find the minimum plan that permits a given file size in a category. */
  private _planThatAllows(
    category: string,
    fileSizeBytes: number,
  ): PlanId | undefined {
    for (const planId of PLAN_HIERARCHY) {
      const maxBytes = this.getMaxUploadBytes(planId, category);
      if (maxBytes === -1 || fileSizeBytes <= maxBytes) return planId;
    }
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Global LimitEngine singleton.
 * Import and call directly — do not instantiate independently.
 *
 * @example
 *   import { limitEngine } from '@/lib/engine/limit-engine';
 *   const ok = limitEngine.canUseProcessor('free', 'pdf:ocr');
 *   const mb = limitEngine.getMaxUploadMBByExtension('pro', 'mp4');
 */
export const limitEngine = new LimitEngine();
