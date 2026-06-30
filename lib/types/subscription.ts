/**
 * lib/types/subscription.ts
 *
 * Phase 6C-1 — Subscription Foundation
 *
 * Canonical TypeScript types for the subscription architecture.
 * All subscription-related types live here.
 * Do not define subscription types elsewhere.
 */

// ---------------------------------------------------------------------------
// PLAN IDENTIFIERS
// ---------------------------------------------------------------------------

export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export type UserType = 'anonymous' | 'registered' | 'premium' | 'admin';

// ---------------------------------------------------------------------------
// USAGE LIMITS
// ---------------------------------------------------------------------------

/**
 * Every configurable usage limit for a plan.
 * All values are in whole units (MB for sizes, counts for conversions).
 * Use -1 to indicate "unlimited".
 * No limit value may be hardcoded outside subscription-config.ts.
 */
export interface UsageLimits {
  /** Maximum file conversions allowed per 24-hour window. -1 = unlimited */
  dailyConversions: number;
  /** Maximum simultaneous conversion jobs */
  parallelConversions: number;
  /** Maximum files per single conversion job (batch) */
  maxFilesPerJob: number;
  /** Max upload size in MB for image files */
  maxImageMB: number;
  /** Max upload size in MB for document files (docx, doc, odt, rtf, etc.) */
  maxDocumentMB: number;
  /** Max upload size in MB for video files */
  maxVideoMB: number;
  /** Max upload size in MB for audio files */
  maxAudioMB: number;
  /** Max upload size in MB for PDF files */
  maxPdfMB: number;
  /** Max upload size in MB for archive files (zip, rar, 7z, etc.) */
  maxArchiveMB: number;
  /** Max upload size in MB for spreadsheet files (xlsx, csv, etc.) */
  maxSpreadsheetMB: number;
  /** Max upload size in MB for presentation files (pptx, etc.) */
  maxPresentationMB: number;
  /** Max upload size in MB for CAD/3D files */
  maxCadMB: number;
  /** Max upload size in MB for ebook files (epub, mobi, etc.) */
  maxEbookMB: number;
  /** Max upload size in MB for subtitle files (srt, vtt, etc.) */
  maxSubtitleMB: number;
  /** Max upload size in MB for certificate files (pem, der, etc.) */
  maxCertificateMB: number;
  /** Max upload size in MB for scientific data files (hdf5, mat, etc.) */
  maxScientificMB: number;
  /** Max upload size in MB for medical image files (dcm, dicom, etc.) */
  maxMedicalMB: number;
  /** Max upload size in MB for disk image files (iso, vmdk, etc.) */
  maxDiskImageMB: number;
  /** Max upload size in MB for all other file types */
  maxOtherMB: number;
}

// ---------------------------------------------------------------------------
// PLAN FEATURE MATRIX
// ---------------------------------------------------------------------------

/**
 * Feature capability names — used as keys across the entire system.
 * All capability names must be defined here, not scattered in components.
 */
export type FeatureName =
  | 'browserProcessing'
  | 'serverProcessing'
  | 'priorityQueue'
  | 'batchConversion'
  | 'gpuAcceleration'
  | 'ocr'
  | 'backgroundRemoval'
  | 'upscaling'
  | 'watermarkRemoval'
  | 'history'
  | 'apiAccess'
  | 'customBranding'
  | 'adsEnabled'
  | 'downloadHistory'
  | 'conversionHistory';

/**
 * Feature capability matrix for a plan.
 * Defines what a plan can and cannot do.
 * All values come from subscription-config.ts.
 */
export type PlanFeatures = Record<FeatureName, boolean>;

// ---------------------------------------------------------------------------
// GLOBAL FEATURE FLAGS
// ---------------------------------------------------------------------------

/**
 * Application-level feature flags.
 * Controls which features are globally enabled/disabled.
 * Source of truth: subscription-config.ts FEATURE_FLAGS.
 * Nothing in the application should check raw booleans outside the config.
 */
export interface AppFeatureFlags {
  /** Enable premium plan purchases. When false, plans remain visible but checkout is disabled. */
  PREMIUM_ENABLED: boolean;
  /** Show "Pro", "Starter" etc. badges on UI elements */
  SHOW_PREMIUM_BADGES: boolean;
  /** Show the /pricing page in navigation */
  SHOW_PRICING_PAGE: boolean;
  /** Show "Upgrade" CTA buttons throughout the app */
  SHOW_UPGRADE_BUTTONS: boolean;
  /** Show yearly pricing toggle with discount */
  SHOW_YEARLY_DISCOUNT: boolean;
  /** Enable free trial period for new signups */
  ENABLE_TRIAL: boolean;
  /** Enable Stripe checkout integration */
  ENABLE_STRIPE: boolean;
  /** Enable PayPal checkout integration */
  ENABLE_PAYPAL: boolean;
  /** Enable REST API access for API plan holders */
  ENABLE_API: boolean;
}

// ---------------------------------------------------------------------------
// PLAN DEFINITION
// ---------------------------------------------------------------------------

/**
 * Complete definition of a subscription plan.
 * All fields are configurable. Nothing may be hardcoded.
 */
export interface PlanDefinition {
  /** Canonical plan identifier */
  id: PlanId;
  /** Display name shown in UI */
  displayName: string;
  /** Monthly price in USD cents (e.g. 999 = $9.99). 0 = free */
  monthlyPriceCents: number;
  /** Yearly price per month in USD cents (discounted). 0 = free */
  yearlyPriceCents: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Optional badge text shown on plan card (e.g. "Most Popular") */
  badge?: string;
  /**
   * Whether new users can subscribe to this plan.
   * When false, plan is read-only (existing subscribers keep access).
   */
  enabled: boolean;
  /** Whether this plan is shown on the pricing page */
  visible: boolean;
  /** Whether to highlight this plan as recommended */
  recommended: boolean;
  /** Display order on pricing page (ascending) */
  sortOrder: number;
  /** Usage limits for this plan */
  limits: UsageLimits;
  /** Feature capability matrix for this plan */
  features: PlanFeatures;
}

// ---------------------------------------------------------------------------
// USER CONTEXT
// ---------------------------------------------------------------------------

/**
 * Resolved user context used by the Limit Engine and hooks.
 * Prepared for anonymous, registered, premium, and admin users.
 * Phase 6C-2 will populate this from authentication state.
 */
export interface UserContext {
  /** Type of user — determines plan resolution strategy */
  type: UserType;
  /** Resolved plan ID */
  planId: PlanId;
  /** User identifier (null for anonymous) */
  userId: string | null;
  /** Whether the plan is currently active (not expired) */
  planActive: boolean;
  /** ISO timestamp of plan expiry (null = perpetual / free) */
  planExpiresAt: string | null;
}

// ---------------------------------------------------------------------------
// QUOTA & USAGE
// ---------------------------------------------------------------------------

/**
 * Current usage snapshot for a user within their billing period.
 * Phase 6C-2 will persist this. Phase 6C-1 uses in-memory stubs.
 */
export interface UsageSnapshot {
  /** Total conversions in the current daily window */
  conversions: number;
  /** Total bytes processed in the current daily window */
  bytesProcessed: number;
  /** ISO timestamp of current period start */
  periodStart: string;
  /** Current count of active parallel jobs */
  activeJobs: number;
}

/**
 * Resolved quota state — what remains for the user.
 */
export interface QuotaState {
  /** Whether the user has remaining quota */
  hasQuota: boolean;
  /** Remaining conversions in current period. -1 = unlimited */
  remainingConversions: number;
  /** Maximum conversions allowed. -1 = unlimited */
  maxConversions: number;
  /** Percentage of daily quota used (0–100). -1 = unlimited */
  usagePercent: number;
  /** ISO timestamp when quota resets */
  resetsAt: string;
}

// ---------------------------------------------------------------------------
// LIMIT CHECK RESULTS
// ---------------------------------------------------------------------------

/**
 * Result of a limit check. Returned by LimitEngine methods.
 * All checks return this type — callers pattern-match on `allowed`.
 */
export interface LimitCheckResult {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Human-readable reason for denial. Only set when allowed === false */
  reason?: string;
  /** Required plan to allow this operation */
  requiredPlan?: PlanId;
  /** Required feature for this operation */
  requiredFeature?: FeatureName;
  /** Current limit value that was exceeded */
  limitValue?: number;
  /** Actual value that exceeded the limit */
  actualValue?: number;
}

// ---------------------------------------------------------------------------
// UPGRADE CONTEXT
// ---------------------------------------------------------------------------

/**
 * Upgrade recommendation returned when a feature is gated.
 * Used by UI to show upgrade CTAs without coupling to business logic.
 */
export interface UpgradeRecommendation {
  /** The plan the user should upgrade to */
  targetPlan: PlanId;
  /** The feature that triggered this recommendation */
  featureName: FeatureName | string;
  /** Human-readable reason for the recommendation */
  reason: string;
  /** Short upgrade call-to-action text */
  ctaText: string;
}

// ---------------------------------------------------------------------------
// PROVIDER INTERFACES — Usage Tracking
// ---------------------------------------------------------------------------

/**
 * IUsageTracker — records and reads usage.
 * Phase 6C-1: in-memory stub.
 * Phase 6C-2: persistence via database / Redis.
 */
export interface IUsageTracker {
  recordConversion(userId: string | null, fileSizeBytes: number): Promise<void>;
  getUsage(userId: string | null): Promise<UsageSnapshot>;
  resetUsage(userId: string | null): Promise<void>;
}

/**
 * ISubscriptionProvider — resolves current plan for a user.
 * Phase 6C-1: config-driven (anonymous → free).
 * Phase 6C-2: database-backed.
 */
export interface ISubscriptionProvider {
  getUserPlan(userId: string | null): Promise<PlanDefinition>;
  getUserContext(userId: string | null): Promise<UserContext>;
  isPlanActive(userId: string | null): Promise<boolean>;
}

/**
 * ILimitProvider — answers limit queries for a given plan.
 * Reads exclusively from subscription-config.ts via LimitEngine.
 */
export interface ILimitProvider {
  getMaxUploadMB(planId: PlanId, category: string): number;
  getMaxParallelJobs(planId: PlanId): number;
  getDailyConversionLimit(planId: PlanId): number;
  canUseFeature(planId: PlanId, feature: FeatureName): boolean;
}

/**
 * IQuotaProvider — tracks and enforces quota against limits.
 */
export interface IQuotaProvider {
  checkQuota(userId: string | null, planId: PlanId): Promise<QuotaState>;
  canConvert(userId: string | null, planId: PlanId): Promise<LimitCheckResult>;
  recordConversion(userId: string | null, fileSizeBytes: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// PROVIDER INTERFACES — Download Workflow
// ---------------------------------------------------------------------------

/**
 * IDownloadWorkflowProvider — determines download behaviour per plan.
 * Phase 6C-1: stub returns permissive defaults.
 * Phase 6C-2: applies watermarks, size limits, queue routing.
 */
export interface IDownloadWorkflowProvider {
  resolveWorkflow(
    userId: string | null,
    planId: PlanId,
    outputSizeBytes: number,
  ): Promise<DownloadWorkflow>;
}

/**
 * IDownloadHistoryProvider — reads/writes download history.
 * Phase 6C-1: no persistence.
 * Phase 6C-2: database-backed.
 */
export interface IDownloadHistoryProvider {
  getHistory(userId: string): Promise<DownloadHistoryEntry[]>;
  recordDownload(userId: string, entry: DownloadHistoryEntry): Promise<void>;
  clearHistory(userId: string): Promise<void>;
}

/**
 * IDownloadPermissionProvider — gates download based on plan.
 */
export interface IDownloadPermissionProvider {
  canDownload(userId: string | null, planId: PlanId): Promise<LimitCheckResult>;
  requiresWatermark(planId: PlanId): boolean;
  maxDownloadSizeBytes(planId: PlanId): number;
}

export interface DownloadWorkflow {
  permitted: boolean;
  applyWatermark: boolean;
  maxOutputSizeBytes: number; // 0 = unlimited
  useAsyncQueue: boolean;
  reason?: string;
}

export interface DownloadHistoryEntry {
  id: string;
  filename: string;
  format: string;
  sizeBytes: number;
  downloadedAt: string; // ISO timestamp
  url?: string;
}
