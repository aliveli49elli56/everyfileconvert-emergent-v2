/**
 * lib/services/subscription-service.ts
 *
 * Phase 6C-2 — Subscription Service Facade
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  THE ONLY INTERFACE UI COMPONENTS SHOULD USE                        ║
 * ║                                                                      ║
 * ║  UI components, Pages, and Providers must NEVER:                    ║
 * ║   • Import directly from subscription-config.ts                    ║
 * ║   • Import directly from limit-engine.ts                           ║
 * ║   • Compare plan names (FREE, STARTER, PRO, BUSINESS)              ║
 * ║   • Check `if (premium)` or `if (isPremium)`                       ║
 * ║                                                                      ║
 * ║  Instead, ALL checks go through this service:                       ║
 * ║   subscription.canUseFeature(planId, feature)                      ║
 * ║   subscription.getPlanFeatures(planId)                             ║
 * ║   subscription.getEffectiveLimits(planId)                          ║
 * ║   subscription.shouldShowAds(planId)                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Requirement 1: Advertisement visibility controlled entirely through here.
 * Requirement 3: No component may compare plan names directly.
 * Requirement 4: Download workflow context exposed for /download page.
 * Requirement 5: Processors query canUseFeature — never plan names.
 * Requirement 7: Future billing (Stripe/PayPal) plugs in via this service.
 */

import type {
  PlanId,
  PlanDefinition,
  PlanFeatures,
  UsageLimits,
  FeatureName,
  LimitCheckResult,
  QuotaState,
  UpgradeRecommendation,
} from '../types/subscription';

import {
  PLAN_DEFINITIONS,
  PLAN_HIERARCHY,
  FEATURE_FLAGS,
  DEFAULT_PLAN_ID,
  formatPrice,
  getYearlyTotal,
  getMonthlySavings,
  YEARLY_DISCOUNT_PERCENT,
} from '../config/subscription-config';

import { limitEngine } from '../engine/limit-engine';
import { quotaEngine } from '../engine/quota-engine';
import { planResolver } from '../engine/plan-resolver';

// ---------------------------------------------------------------------------
// SUBSCRIPTION SERVICE CLASS
// ---------------------------------------------------------------------------

export class SubscriptionService {

  // ── Plan Resolution ───────────────────────────────────────────────────────

  /**
   * Get the current plan for a user.
   * Phase 6C-2: all users get FREE (PlanResolver stub).
   * Phase 6C-3: will resolve from JWT session.
   */
  async getCurrentPlan(userId: string | null = null): Promise<PlanDefinition> {
    return planResolver.getUserPlan(userId);
  }

  /**
   * Get all plans visible on the pricing page, sorted by tier.
   * Reads visibility from subscription-config.ts via LimitEngine.
   */
  getVisiblePlans(): PlanDefinition[] {
    return limitEngine.getVisiblePlans();
  }

  /**
   * Get a specific plan's full definition.
   */
  getPlan(planId: PlanId): PlanDefinition {
    return limitEngine.getPlanDefinition(planId);
  }

  // ── Feature Queries ────────────────────────────────────────────────────────

  /**
   * Check whether a plan has a feature enabled.
   *
   * Requirement 3: UI components call this — never compare plan names directly.
   * Requirement 5: Processors call this — no plan names inside processors.
   *
   * @example
   *   subscription.canUseFeature('free', 'serverProcessing') // false
   *   subscription.canUseFeature('pro', 'batchConversion')   // true
   */
  canUseFeature(planId: PlanId, feature: FeatureName): boolean {
    return limitEngine.canUseFeature(planId, feature).allowed;
  }

  /**
   * Get the full feature matrix for a plan.
   * Reads from PLAN_DEFINITIONS[planId].features in subscription-config.ts.
   *
   * @example
   *   const features = subscription.getPlanFeatures('pro');
   *   if (features.batchConversion) { ... }
   */
  getPlanFeatures(planId: PlanId): PlanFeatures {
    return PLAN_DEFINITIONS[planId].features;
  }

  /**
   * Get the full LimitCheckResult for a feature (includes reason and requiredPlan).
   * Use this when you need the upgrade recommendation alongside the boolean.
   */
  checkFeature(planId: PlanId, feature: FeatureName): LimitCheckResult {
    return limitEngine.canUseFeature(planId, feature);
  }

  /**
   * Get the upgrade recommendation for a gated feature.
   */
  getUpgradeRecommendation(
    planId: PlanId,
    feature: FeatureName,
  ): UpgradeRecommendation {
    return limitEngine.getUpgradeRecommendation(planId, feature);
  }

  // ── Limit Queries ──────────────────────────────────────────────────────────

  /**
   * Get the full effective limits for a plan.
   * Reads from PLAN_DEFINITIONS[planId].limits in subscription-config.ts.
   *
   * @example
   *   const limits = subscription.getEffectiveLimits('free');
   *   limits.dailyConversions // 10
   *   limits.maxVideoMB       // 100
   *   limits.maxAudioMB       // 100
   */
  getEffectiveLimits(planId: PlanId): UsageLimits {
    return PLAN_DEFINITIONS[planId].limits;
  }

  /**
   * Get maximum upload size in MB for a plan + category.
   * Requirement 7: category-based resolution via Format Registry.
   */
  getMaxUploadMB(planId: PlanId, category: string): number {
    return limitEngine.getMaxUploadMB(planId, category);
  }

  /**
   * Get maximum upload size in MB for a plan + file extension.
   * Extension → Format Registry category → limit.
   */
  getMaxUploadMBByExtension(planId: PlanId, ext: string): number {
    return limitEngine.getMaxUploadMBByExtension(planId, ext);
  }

  /**
   * Get daily conversion limit for a plan.
   * Returns -1 for unlimited.
   */
  getDailyLimit(planId: PlanId): number {
    return limitEngine.getDailyLimit(planId);
  }

  /**
   * Get download retention days for a plan.
   */
  getDownloadRetentionDays(planId: PlanId): number {
    return PLAN_DEFINITIONS[planId].limits.downloadRetentionDays;
  }

  // ── Advertisement Queries (Requirement 1) ─────────────────────────────────

  /**
   * Whether ads should be shown for a given plan.
   *
   * Requirement 1: ALL advertisement visibility decisions go through here.
   * No page may check: `if (plan === 'pro')` or `if (isPremium)`.
   * Future AdSense integration must only call: subscription.shouldShowAds(planId)
   *
   * @example
   *   // In AdSlot component:
   *   const show = subscriptionService.shouldShowAds(DEFAULT_PLAN_ID);
   *   if (!show) return null;
   */
  shouldShowAds(planId: PlanId): boolean {
    return limitEngine.canUseFeature(planId, 'adsEnabled').allowed;
  }

  // ── Plan Visibility & Purchasing (Requirement 2) ───────────────────────────

  /**
   * Whether a plan is visible on the pricing page.
   * Plans remain visible even when PREMIUM_ENABLED = false.
   */
  isPlanVisible(planId: PlanId): boolean {
    return limitEngine.isPlanVisible(planId);
  }

  /**
   * Whether a plan can currently be purchased.
   * Returns false when PREMIUM_ENABLED = false (Coming Soon mode).
   */
  isPlanPurchasable(planId: PlanId): boolean {
    return limitEngine.isPlanPurchasable(planId);
  }

  /**
   * Whether the app is in Coming Soon mode (PREMIUM_ENABLED = false).
   * Requirement 5: toggle in subscription-config.ts only — no code change needed.
   */
  isComingSoonMode(): boolean {
    return limitEngine.isComingSoonMode();
  }

  /**
   * Whether a global app feature is enabled.
   */
  isAppFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
    return limitEngine.isAppFeatureEnabled(flag);
  }

  // ── Pricing Display ────────────────────────────────────────────────────────

  /**
   * Get display price for a plan and billing cycle.
   * Reads from subscription-config.ts — no hardcoded prices in components.
   *
   * @example
   *   subscription.getPriceDisplay('pro', 'monthly') // '$14.99'
   *   subscription.getPriceDisplay('pro', 'yearly')  // '$11.99'
   */
  getPriceDisplay(planId: PlanId, billing: 'monthly' | 'yearly'): string {
    const plan = PLAN_DEFINITIONS[planId];
    const cents = billing === 'yearly' ? plan.yearlyPriceCents : plan.monthlyPriceCents;
    return formatPrice(cents, plan.currency);
  }

  /**
   * Get yearly total display (monthly rate × 12).
   * @example subscription.getYearlyTotalDisplay('pro') // '$143.88'
   */
  getYearlyTotalDisplay(planId: PlanId): string {
    const plan = PLAN_DEFINITIONS[planId];
    const total = getYearlyTotal(planId);
    return formatPrice(total, plan.currency);
  }

  /**
   * Get the monthly savings when choosing yearly billing.
   * @example subscription.getMonthlySavingsDisplay('pro') // '$3.00'
   */
  getMonthlySavingsDisplay(planId: PlanId): string {
    const plan = PLAN_DEFINITIONS[planId];
    const savings = getMonthlySavings(planId);
    return formatPrice(savings, plan.currency);
  }

  /**
   * Get the yearly discount percentage.
   */
  getYearlyDiscountPercent(): number {
    return YEARLY_DISCOUNT_PERCENT;
  }

  // ── Quota Queries ─────────────────────────────────────────────────────────

  /**
   * Get current quota state for a user.
   */
  async getQuotaState(
    userId: string | null,
    planId: PlanId,
  ): Promise<QuotaState> {
    return quotaEngine.checkQuota(userId, planId);
  }

  /**
   * Check if a user can convert right now.
   */
  async canConvert(
    userId: string | null,
    planId: PlanId,
  ): Promise<LimitCheckResult> {
    return quotaEngine.canConvert(userId, planId);
  }

  // ── Download Workflow Context (Requirement 4) ──────────────────────────────

  /**
   * Get complete download context for the /download page.
   *
   * Requirement 4: the /download page must never query processors directly.
   * This single method provides everything needed for the download workflow.
   */
  getDownloadContext(planId: PlanId) {
    return limitEngine.getDownloadContext(planId);
  }

  /**
   * Whether the plan has download history access.
   */
  hasDownloadHistory(planId: PlanId): boolean {
    return limitEngine.hasDownloadHistory(planId);
  }

  /**
   * Whether the plan has conversion history access.
   */
  hasConversionHistory(planId: PlanId): boolean {
    return limitEngine.hasConversionHistory(planId);
  }

  /**
   * Get upgrade eligibility for a plan.
   */
  getUpgradeEligibility(planId: PlanId) {
    return limitEngine.getUpgradeEligibility(planId);
  }

  // ── Future Billing Compatibility (Requirement 7) ───────────────────────────

  /**
   * Get the Stripe price ID for a plan and billing cycle.
   * Phase 6C-3: wire to actual Stripe Price IDs.
   * Returns undefined until Stripe is integrated.
   */
  getStripePriceId(
    _planId: PlanId,
    _billing: 'monthly' | 'yearly',
  ): string | undefined {
    // Phase 6C-3: return process.env[`STRIPE_PRICE_${planId.toUpperCase()}_${billing.toUpperCase()}`]
    return undefined;
  }

  /**
   * Get the PayPal plan ID for a plan and billing cycle.
   * Phase 6C-3: wire to actual PayPal Plan IDs.
   */
  getPaypalPlanId(
    _planId: PlanId,
    _billing: 'monthly' | 'yearly',
  ): string | undefined {
    // Phase 6C-3: return from config/environment
    return undefined;
  }

  /**
   * Check if a coupon code is valid (Phase 6C-3).
   */
  async validateCoupon(
    _code: string,
    _planId: PlanId,
  ): Promise<{ valid: boolean; discount?: number }> {
    // Phase 6C-3: validate against Stripe/PayPal coupon APIs
    return { valid: false };
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Global SubscriptionService singleton.
 * This is the ONLY entry point for subscription queries in UI components.
 *
 * @example
 *   import { subscriptionService } from '@/lib/services/subscription-service';
 *   const features = subscriptionService.getPlanFeatures('free');
 *   const showAds  = subscriptionService.shouldShowAds('free');
 */
export const subscriptionService = new SubscriptionService();
