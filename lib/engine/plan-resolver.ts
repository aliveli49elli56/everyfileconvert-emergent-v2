/**
 * lib/engine/plan-resolver.ts
 *
 * Phase 6C-1 — Plan Resolver (Stub)
 *
 * Implements ISubscriptionProvider.
 * Resolves the active plan for a user. Phase 6C-1: all users get FREE plan.
 *
 * Phase 6C-2 replacement:
 *   - Decode JWT token → extract userId + planId from claims
 *   - Verify planExpiresAt against current UTC time
 *   - Fall back to DEFAULT_PLAN_ID for expired / unauthenticated users
 *   - Export interface stays identical — no caller changes needed
 *
 * Requirement 3: DEFAULT_PLAN_ID and PLAN_DEFINITIONS come exclusively
 * from subscription-config.ts. No plan name is referenced here directly.
 */

import type {
  PlanId,
  PlanDefinition,
  UserContext,
  ISubscriptionProvider,
} from '../types/subscription';

import {
  PLAN_DEFINITIONS,
  DEFAULT_PLAN_ID,
} from '../config/subscription-config';

// ---------------------------------------------------------------------------
// PLAN RESOLVER CLASS
// ---------------------------------------------------------------------------

export class PlanResolver implements ISubscriptionProvider {

  /**
   * Get the full plan definition for a user.
   *
   * Phase 6C-1: always returns the FREE plan definition.
   * Phase 6C-2: decode JWT / query DB to resolve actual plan.
   */
  async getUserPlan(userId: string | null): Promise<PlanDefinition> {
    return PLAN_DEFINITIONS[this._resolvePlanId(userId)];
  }

  /**
   * Build a fully hydrated UserContext for a user.
   *
   * Phase 6C-1: anonymous FREE context for all users.
   * Phase 6C-2: populate from JWT + subscription record.
   */
  async getUserContext(userId: string | null): Promise<UserContext> {
    const planId = this._resolvePlanId(userId);
    return {
      type:          userId ? 'registered' : 'anonymous',
      planId,
      userId:        userId ?? null,
      planActive:    true,
      planExpiresAt: null,  // Perpetual for free; Phase 6C-2 sets expiry
    };
  }

  /**
   * Whether the user's plan is currently active (not expired).
   *
   * Phase 6C-1: always true (free plan never expires).
   * Phase 6C-2: compare planExpiresAt to Date.now().
   */
  async isPlanActive(userId: string | null): Promise<boolean> {
    return true;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Resolve the plan ID for a user.
   *
   * Phase 6C-1: always DEFAULT_PLAN_ID.
   * Phase 6C-2: look up from JWT payload or database row.
   *
   * @param _userId - Currently unused; present for Phase 6C-2 compatibility.
   */
  private _resolvePlanId(_userId: string | null): PlanId {
    // Phase 6C-2: replace with real lookup
    return DEFAULT_PLAN_ID;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/** Global PlanResolver singleton. */
export const planResolver = new PlanResolver();
