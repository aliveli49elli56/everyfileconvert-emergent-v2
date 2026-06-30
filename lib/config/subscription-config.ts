/**
 * lib/config/subscription-config.ts
 *
 * Phase 6C-1 — THE single source of truth for the subscription system.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ADMIN GUIDE — How to change subscription settings                  ║
 * ║                                                                      ║
 * ║  This file is the ONLY place to edit:                               ║
 * ║   • Plan prices and yearly discounts                                 ║
 * ║   • Daily/file size limits per plan                                  ║
 * ║   • Feature availability per plan                                    ║
 * ║   • Plan visibility (show/hide on pricing page)                      ║
 * ║   • Premium enable/disable (PREMIUM_ENABLED flag)                    ║
 * ║   • Currency, badges, labels                                         ║
 * ║   • Global feature flags (Stripe, PayPal, API, trial, etc.)          ║
 * ║                                                                      ║
 * ║  NO other application file requires modification for the above.      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Rules:
 *   1. All prices are in USD cents (integer). 999 = $9.99
 *   2. All sizes are in megabytes (integer). -1 = unlimited.
 *   3. dailyConversions: -1 = unlimited.
 *   4. No limit value may be defined anywhere else in the codebase.
 *   5. Feature flags: nothing checks raw booleans outside this file.
 *   6. Adding a new plan requires: add entry here, update PlanId in subscription.ts.
 *   7. Processor feature requirements: add entries to PROCESSOR_FEATURE_REQUIREMENTS.
 */

import type {
  AppFeatureFlags,
  PlanDefinition,
  PlanId,
  UsageLimits,
  PlanFeatures,
  FeatureName,
} from '../types/subscription';

// ============================================================================
// §1  GLOBAL FEATURE FLAGS
//     Change these to enable or disable entire features globally.
// ============================================================================

export const FEATURE_FLAGS: AppFeatureFlags = {
  /** Set to true when payment integration is ready. Until then, plans are display-only. */
  PREMIUM_ENABLED: false,

  /** Show "Pro", "Starter", "Business" plan badges on UI elements */
  SHOW_PREMIUM_BADGES: true,

  /** Include /pricing in navigation and show pricing page content */
  SHOW_PRICING_PAGE: true,

  /** Show "Upgrade" CTA buttons when a feature is gated by plan */
  SHOW_UPGRADE_BUTTONS: true,

  /** Show yearly/monthly billing toggle with discount percentage */
  SHOW_YEARLY_DISCOUNT: true,

  /** Enable free trial period for new signups (future) */
  ENABLE_TRIAL: false,

  /** Enable Stripe checkout. Requires PREMIUM_ENABLED = true and Stripe keys. */
  ENABLE_STRIPE: false,

  /** Enable PayPal checkout. Requires PREMIUM_ENABLED = true and PayPal keys. */
  ENABLE_PAYPAL: false,

  /** Enable REST API access for API plan holders (future) */
  ENABLE_API: false,
};

// ============================================================================
// §2  YEARLY DISCOUNT
//     Applied to yearly price display. Edit here only.
// ============================================================================

/** Percentage discount applied when user selects yearly billing (0–100) */
export const YEARLY_DISCOUNT_PERCENT = 20;

/** Number of free trial days (only active when ENABLE_TRIAL = true) */
export const TRIAL_DAYS = 14;

// ============================================================================
// §3  USAGE LIMITS PER PLAN
//     Edit ONLY here to change any size or quota limit.
//     -1 = unlimited.
// ============================================================================

const FREE_LIMITS: UsageLimits = {
  dailyConversions:    10,
  parallelConversions: 1,
  maxFilesPerJob:      1,
  maxImageMB:          50,
  maxDocumentMB:       50,
  maxVideoMB:          100,
  maxAudioMB:          100,
  maxPdfMB:            50,
  maxArchiveMB:        100,
  maxSpreadsheetMB:    50,
  maxPresentationMB:   100,
  maxCadMB:            100,
  maxEbookMB:          50,
  maxSubtitleMB:       20,
  maxCertificateMB:    10,
  maxScientificMB:     100,
  maxMedicalMB:        100,
  maxDiskImageMB:      100,
  maxOtherMB:          100,
  downloadRetentionDays: 0,  // No retention — anonymous, free tier
};

const STARTER_LIMITS: UsageLimits = {
  dailyConversions:    50,
  parallelConversions: 3,
  maxFilesPerJob:      5,
  maxImageMB:          200,
  maxDocumentMB:       200,
  maxVideoMB:          500,
  maxAudioMB:          200,
  maxPdfMB:            200,
  maxArchiveMB:        500,
  maxSpreadsheetMB:    200,
  maxPresentationMB:   500,
  maxCadMB:            500,
  maxEbookMB:          200,
  maxSubtitleMB:       100,
  maxCertificateMB:    50,
  maxScientificMB:     500,
  maxMedicalMB:        500,
  maxDiskImageMB:      500,
  maxOtherMB:          500,
  downloadRetentionDays: 7,  // 7-day download retention
};

const PRO_LIMITS: UsageLimits = {
  dailyConversions:    300,
  parallelConversions: 10,
  maxFilesPerJob:      20,
  maxImageMB:          1000,
  maxDocumentMB:       1000,
  maxVideoMB:          5000,
  maxAudioMB:          1000,
  maxPdfMB:            1000,
  maxArchiveMB:        5000,
  maxSpreadsheetMB:    1000,
  maxPresentationMB:   5000,
  maxCadMB:            2000,
  maxEbookMB:          1000,
  maxSubtitleMB:       500,
  maxCertificateMB:    500,
  maxScientificMB:     5000,
  maxMedicalMB:        5000,
  maxDiskImageMB:      10000,
  maxOtherMB:          5000,
  downloadRetentionDays: 30,  // 30-day download retention
};

const BUSINESS_LIMITS: UsageLimits = {
  dailyConversions:    -1,    // unlimited
  parallelConversions: 50,
  maxFilesPerJob:      100,
  maxImageMB:          5000,
  maxDocumentMB:       5000,
  maxVideoMB:          -1,    // unlimited
  maxAudioMB:          5000,
  maxPdfMB:            5000,
  maxArchiveMB:        -1,    // unlimited
  maxSpreadsheetMB:    5000,
  maxPresentationMB:   -1,    // unlimited
  maxCadMB:            10000,
  maxEbookMB:          5000,
  maxSubtitleMB:       2000,
  maxCertificateMB:    2000,
  maxScientificMB:     -1,    // unlimited
  maxMedicalMB:        -1,    // unlimited
  maxDiskImageMB:      -1,    // unlimited
  maxOtherMB:          -1,    // unlimited
  downloadRetentionDays: 90,  // 90-day download retention
};

// ============================================================================
// §4  PLAN FEATURE MATRIX
//     Which capabilities each plan includes.
//     Edit ONLY here to gate or open features per plan.
// ============================================================================

const FREE_FEATURES: PlanFeatures = {
  browserProcessing:  true,
  serverProcessing:   false,
  priorityQueue:      false,
  batchConversion:    false,
  gpuAcceleration:    false,
  ocr:                true,
  backgroundRemoval:  false,
  upscaling:          false,
  watermarkRemoval:   false,
  history:            false,
  apiAccess:          false,
  customBranding:     false,
  adsEnabled:         true,
  downloadHistory:    false,
  conversionHistory:  false,
};

const STARTER_FEATURES: PlanFeatures = {
  browserProcessing:  true,
  serverProcessing:   true,
  priorityQueue:      false,
  batchConversion:    false,
  gpuAcceleration:    false,
  ocr:                true,
  backgroundRemoval:  true,
  upscaling:          false,
  watermarkRemoval:   false,
  history:            true,
  apiAccess:          false,
  customBranding:     false,
  adsEnabled:         true,
  downloadHistory:    true,
  conversionHistory:  true,
};

const PRO_FEATURES: PlanFeatures = {
  browserProcessing:  true,
  serverProcessing:   true,
  priorityQueue:      true,
  batchConversion:    true,
  gpuAcceleration:    false,
  ocr:                true,
  backgroundRemoval:  true,
  upscaling:          true,
  watermarkRemoval:   true,
  history:            true,
  apiAccess:          false,
  customBranding:     false,
  adsEnabled:         false,
  downloadHistory:    true,
  conversionHistory:  true,
};

const BUSINESS_FEATURES: PlanFeatures = {
  browserProcessing:  true,
  serverProcessing:   true,
  priorityQueue:      true,
  batchConversion:    true,
  gpuAcceleration:    true,
  ocr:                true,
  backgroundRemoval:  true,
  upscaling:          true,
  watermarkRemoval:   true,
  history:            true,
  apiAccess:          true,
  customBranding:     true,
  adsEnabled:         false,
  downloadHistory:    true,
  conversionHistory:  true,
};

// ============================================================================
// §5  PLAN DEFINITIONS
//     The canonical plan table. Edit prices, badges, and visibility here.
//     Prices are in USD cents. 999 = $9.99/month.
// ============================================================================

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {

  free: {
    id: 'free',
    displayName: 'Free',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    currency: 'USD',
    badge: undefined,
    enabled: true,
    visible: true,
    recommended: false,
    sortOrder: 1,
    limits: FREE_LIMITS,
    features: FREE_FEATURES,
  },

  starter: {
    id: 'starter',
    displayName: 'Starter',
    monthlyPriceCents: 799,      // $7.99/month
    yearlyPriceCents: 639,       // $6.39/month billed yearly → $76.68/year
    currency: 'USD',
    badge: undefined,
    enabled: true,
    visible: true,
    recommended: false,
    sortOrder: 2,
    limits: STARTER_LIMITS,
    features: STARTER_FEATURES,
  },

  pro: {
    id: 'pro',
    displayName: 'Pro',
    monthlyPriceCents: 1499,     // $14.99/month
    yearlyPriceCents: 1199,      // $11.99/month billed yearly → $143.88/year
    currency: 'USD',
    badge: 'Most Popular',
    enabled: true,
    visible: true,
    recommended: true,
    sortOrder: 3,
    limits: PRO_LIMITS,
    features: PRO_FEATURES,
  },

  business: {
    id: 'business',
    displayName: 'Business',
    monthlyPriceCents: 2999,     // $29.99/month
    yearlyPriceCents: 2399,      // $23.99/month billed yearly → $287.88/year
    currency: 'USD',
    badge: 'Best Value',
    enabled: true,
    visible: true,
    recommended: false,
    sortOrder: 4,
    limits: BUSINESS_LIMITS,
    features: BUSINESS_FEATURES,
  },
};

/** Ordered list of plan IDs for display (ascending by sortOrder) */
export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business'];

// ============================================================================
// §6  PROCESSOR FEATURE REQUIREMENTS
//     Maps processor operation IDs to required PlanFeatures.
//     If a processor requires a feature the plan doesn't have → denied.
//     Add new processors here when their feature requirements change.
//     NEVER hardcode feature requirements inside processors.
// ============================================================================

/**
 * Maps processorId → list of PlanFeatures ALL of which must be enabled.
 * If empty array: the processor is available on all plans (no feature gating).
 */
export const PROCESSOR_FEATURE_REQUIREMENTS: Record<string, FeatureName[]> = {
  // Image — basic operations: available to all
  'image:convert':         [],
  'image:resize':          [],
  'image:crop':            [],
  'image:rotate':          [],
  'image:flip':            [],
  'image:compress':        [],
  'image:watermark':       [],
  'image:metadata-remove': [],
  'image:thumbnail':       [],
  'image:preview':         [],
  'image:color-adjust':    [],

  // Image — premium operations
  'image:background-remove': ['backgroundRemoval'],
  'image:upscale':           ['upscaling'],
  'image:watermark-remove':  ['watermarkRemoval'],

  // RAW — server processing required
  'raw:develop': ['serverProcessing'],
  'raw:convert': ['serverProcessing'],

  // Vector — basic: all plans
  'vector:convert':   [],
  'vector:optimize':  [],
  'vector:rasterize': [],

  // Video — browser processing: free; server: starter+
  'video:convert':       [],
  'video:compress':      [],
  'video:trim':          [],
  'video:merge':         [],
  'video:extract-audio': [],
  'video:gif':           [],
  'video:crop':          [],
  'video:rotate':        [],
  'video:reverse':       [],
  'video:subtitle':      [],

  // Audio — all plans
  'audio:convert':   [],
  'audio:trim':      [],
  'audio:normalize': [],
  'audio:merge':     [],
  'audio:pitch':     [],
  'audio:speed':     [],
  'audio:volume':    [],
  'audio:compress':  [],

  // PDF — all plans
  'pdf:merge':         [],
  'pdf:split':         [],
  'pdf:compress':      [],
  'pdf:protect':       [],
  'pdf:unlock':        [],
  'pdf:rotate':        [],
  'pdf:watermark':     [],
  'pdf:page-numbers':  [],
  'pdf:to-image':      [],
  'pdf:ocr':           ['ocr'],

  // OCR
  'ocr:recognize':    ['ocr'],
  'ocr:pdf-to-text':  ['ocr'],

  // Document — all plans
  'doc:convert':        [],
  'doc:to-pdf':         [],
  'doc:to-text':        [],
  'doc:extract-images': [],

  // Spreadsheet — all plans
  'spreadsheet:convert':  [],
  'spreadsheet:to-pdf':   [],
  'spreadsheet:merge':    [],
  'spreadsheet:to-json':  [],
  'spreadsheet:filter':   [],

  // Presentation — server required for full fidelity
  'presentation:convert':        ['serverProcessing'],
  'presentation:to-pdf':         ['serverProcessing'],
  'presentation:extract-images': ['serverProcessing'],

  // Ebook — all plans
  'ebook:convert':        [],
  'ebook:extract-images': [],

  // Archive — all plans
  'archive:compress': [],
  'archive:extract':  [],
  'archive:convert':  [],
  'archive:list':     [],

  // Font — all plans
  'font:convert':  [],
  'font:subset':   [],
  'font:preview':  [],
  'font:metadata': [],

  // GIS — all plans
  'gis:convert':  [],
  'gis:project':  [],
  'gis:simplify': [],

  // Webpage — all plans
  'webpage:to-pdf':          [],
  'webpage:screenshot':      [],
  'webpage:full-screenshot': [],
  'webpage:to-text':         [],
  'webpage:to-markdown':     [],
  'webpage:to-image':        [],

  // Subtitle — all plans
  'subtitle:convert': [],
  'subtitle:sync':    [],
  'subtitle:translate': ['serverProcessing'], // External AI/NMT service

  // Certificate — all plans
  'certificate:convert':     [],
  'certificate:inspect':     [],
  'certificate:extract-key': [],

  // 3D / CAD — all plans (browser partial)
  '3d:convert':  [],
  '3d:compress': [],
  '3d:optimize': [],
  '3d:preview':  [],
  'cad:convert': [],
  'cad:to-pdf':  ['serverProcessing'],
  'cad:preview': [],

  // Email — all plans
  'email:convert': [],
  'email:extract': [],

  // Code — all plans
  'code:convert': [],
  'code:format':  [],
  'code:minify':  [],

  // Scientific — all plans
  'scientific:convert':   [],
  'scientific:visualize': [],

  // Medical — all plans (HIPAA note: server for de-identification)
  'medical:convert':   [],
  'medical:anonymize': ['serverProcessing'],

  // Disk — server only
  'disk:convert': ['serverProcessing'],
  'disk:extract': ['serverProcessing'],

  // Batch — requires batchConversion feature
  'batch:convert': ['batchConversion'],

  // API — requires apiAccess
  'api:convert': ['apiAccess'],
};

// ============================================================================
// §7  FILE CATEGORY → LIMIT KEY MAPPING
//     Maps FormatCategory values to UsageLimits property keys.
//     Used by LimitEngine.getMaxUploadMB().
//     NEVER define this mapping inside the engine or providers.
// ============================================================================

/**
 * Maps file category (from FormatCategory / format-registry) to
 * the corresponding UsageLimits key.
 */
export const CATEGORY_LIMIT_MAP: Record<string, keyof UsageLimits> = {
  // Primary categories from format-registry.ts
  'image':        'maxImageMB',
  'document':     'maxDocumentMB',
  'video':        'maxVideoMB',
  'audio':        'maxAudioMB',
  'pdf':          'maxPdfMB',
  'archive':      'maxArchiveMB',
  'spreadsheet':  'maxSpreadsheetMB',
  'presentation': 'maxPresentationMB',
  'cad':          'maxCadMB',
  '3d':           'maxCadMB',       // 3D files share CAD limit
  'ebook':        'maxEbookMB',
  'subtitle':     'maxSubtitleMB',
  'certificate':  'maxCertificateMB',
  'scientific':   'maxScientificMB',
  'medical':      'maxMedicalMB',
  'disk-image':   'maxDiskImageMB',
  'disk':         'maxDiskImageMB',
  'raw':          'maxImageMB',      // RAW photos share image limit
  'vector':       'maxImageMB',      // Vector graphics share image limit
  'font':         'maxOtherMB',
  'gis':          'maxOtherMB',
  'email':        'maxDocumentMB',
  'code':         'maxOtherMB',
  'data':         'maxOtherMB',
  'executable':   'maxOtherMB',
  'other':        'maxOtherMB',
};

// ============================================================================
// §8  DEFAULT PLAN
//     The plan assigned to anonymous / unauthenticated users.
//     Phase 6C-2: change to 'free' or resolve from session.
// ============================================================================

export const DEFAULT_PLAN_ID: PlanId = 'free';

// ============================================================================
// §9  PLAN HIERARCHY
//     Used to compare plans (e.g., isAtLeastPro).
//     Lower index = lower tier.
// ============================================================================

export const PLAN_HIERARCHY: PlanId[] = ['free', 'starter', 'pro', 'business'];

/**
 * Returns true if `planId` is at least as powerful as `minimumPlan`.
 * Example: isAtLeast('pro', 'starter') → true
 */
export function isAtLeast(planId: PlanId, minimumPlan: PlanId): boolean {
  return PLAN_HIERARCHY.indexOf(planId) >= PLAN_HIERARCHY.indexOf(minimumPlan);
}

/**
 * Returns the next plan above `planId`, or null if already at maximum.
 */
export function getNextPlan(planId: PlanId): PlanId | null {
  const idx = PLAN_HIERARCHY.indexOf(planId);
  return idx < PLAN_HIERARCHY.length - 1 ? PLAN_HIERARCHY[idx + 1] : null;
}

/**
 * Find the minimum plan that has a specific feature enabled.
 * Returns null if no plan has this feature.
 */
export function getMinimumPlanForFeature(feature: FeatureName): PlanId | null {
  for (const planId of PLAN_HIERARCHY) {
    if (PLAN_DEFINITIONS[planId].features[feature]) return planId;
  }
  return null;
}

/**
 * Find the minimum plan that satisfies ALL required features for a processor.
 */
export function getMinimumPlanForProcessor(processorId: string): PlanId {
  const required = PROCESSOR_FEATURE_REQUIREMENTS[processorId] ?? [];
  if (required.length === 0) return 'free';

  for (const planId of PLAN_HIERARCHY) {
    const features = PLAN_DEFINITIONS[planId].features;
    if (required.every(f => features[f])) return planId;
  }
  return 'business'; // If no plan satisfies, require highest
}

// ============================================================================
// §10 PRICE FORMATTING HELPERS
//     All price display logic reads from PLAN_DEFINITIONS.
//     These are pure functions — no business logic.
// ============================================================================

/**
 * Format a price in cents to a display string.
 * Example: formatPrice(999, 'USD') → '$9.99'
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) return 'Free';
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Get the yearly total price (monthly rate × 12).
 */
export function getYearlyTotal(planId: PlanId): number {
  return PLAN_DEFINITIONS[planId].yearlyPriceCents * 12;
}

/**
 * Get the monthly savings when choosing yearly billing.
 */
export function getMonthlySavings(planId: PlanId): number {
  const p = PLAN_DEFINITIONS[planId];
  return p.monthlyPriceCents - p.yearlyPriceCents;
}

// ============================================================================
// §11 VISIBLE PLANS LIST
//     Returns plans visible on the pricing page, in sortOrder.
// ============================================================================

export function getVisiblePlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS)
    .filter(p => p.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
