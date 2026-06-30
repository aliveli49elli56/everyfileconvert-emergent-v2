/**
 * lib/engine/quota-engine.ts
 *
 * Phase 6C-1 — In-Memory Quota Engine
 *
 * Implements IQuotaProvider using in-memory counters only.
 * Satisfies all IQuotaProvider contract methods with zero persistence.
 *
 * Phase 6C-2 replacement:
 *   - Swap _usageStore for Redis INCR / EXPIRE commands keyed on userId+date
 *   - Replace recordConversion with a Redis INCR call
 *   - Replace checkQuota with a Redis GET call
 *   - Export interface stays identical — no caller changes needed
 *
 * Requirement 6: all limit thresholds read from LimitEngine (never hardcoded).
 */

import type {
  PlanId,
  LimitCheckResult,
  QuotaState,
  IQuotaProvider,
} from '../types/subscription';
import { limitEngine } from './limit-engine';

// ---------------------------------------------------------------------------
// IN-MEMORY USAGE STORE
// Note: resets on every page reload / server restart.
// Phase 6C-2: replace with Redis / database persistence.
// ---------------------------------------------------------------------------

interface UsageEntry {
  /** Number of conversions performed in the current tracking window */
  conversions: number;
  /** Total bytes processed in the current tracking window */
  bytesProcessed: number;
  /** ISO timestamp of when this tracking window was created */
  periodStart: string;
}

const _store = new Map<string, UsageEntry>();

function _getOrCreate(userId: string | null): UsageEntry {
  const key = userId ?? '__anonymous__';
  if (!_store.has(key)) {
    _store.set(key, {
      conversions:    0,
      bytesProcessed: 0,
      periodStart:    new Date().toISOString(),
    });
  }
  return _store.get(key)!;
}

// ---------------------------------------------------------------------------
// QUOTA ENGINE CLASS
// ---------------------------------------------------------------------------

export class QuotaEngine implements IQuotaProvider {

  /**
   * Get current quota state for a user on a given plan.
   * Reads current usage from in-memory store; limits from LimitEngine.
   * Requirement 6: all limits come from subscription-config.ts via LimitEngine.
   */
  async checkQuota(userId: string | null, planId: PlanId): Promise<QuotaState> {
    const usage = _getOrCreate(userId);
    return limitEngine.buildQuotaState(planId, usage.conversions);
  }

  /**
   * Check whether a user can perform a conversion right now.
   * Returns a structured LimitCheckResult — callers check `allowed` only.
   *
   * Phase 6C-1: always permits (counters tracked but not enforced).
   * Phase 6C-2: enforce when auth and real quota tracking are available.
   */
  async canConvert(userId: string | null, planId: PlanId): Promise<LimitCheckResult> {
    const quota = await this.checkQuota(userId, planId);
    if (!quota.hasQuota) {
      const nextPlan = limitEngine.getUpgradeEligibility(planId).nextPlan;
      return {
        allowed:    false,
        reason:     `Daily conversion limit (${quota.maxConversions}) reached. Resets at ${quota.resetsAt}`,
        requiredPlan: nextPlan ?? undefined,
        limitValue: quota.maxConversions,
        actualValue: quota.maxConversions - (
          quota.remainingConversions === -1 ? 0 : quota.remainingConversions
        ),
      };
    }
    return { allowed: true };
  }

  /**
   * Record a completed conversion.
   * Phase 6C-1: increments in-memory counter only.
   * Phase 6C-2: persist to Redis (INCR userId:date) or database.
   */
  async recordConversion(userId: string | null, fileSizeBytes: number): Promise<void> {
    const entry = _getOrCreate(userId);
    entry.conversions    += 1;
    entry.bytesProcessed += fileSizeBytes;
  }

  /**
   * Reset usage for a user (admin / testing utility).
   * Phase 6C-2: also flush Redis keys for this user.
   */
  async resetUsage(userId: string | null): Promise<void> {
    _store.delete(userId ?? '__anonymous__');
  }

  /**
   * Get raw usage snapshot for a user.
   * Exposed for debugging / admin panels — not for limit enforcement.
   */
  async getUsageSnapshot(userId: string | null): Promise<UsageEntry> {
    return { ..._getOrCreate(userId) };
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/** Global QuotaEngine singleton. */
export const quotaEngine = new QuotaEngine();
