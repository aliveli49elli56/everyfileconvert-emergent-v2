/**
 * lib/config/limits-config.ts
 * Limits Engine Model - comprehensive limits for all tiers
 *
 * Defines: free/premium/enterprise tiers with daily limits, file sizes, etc.
 */

import type { UserTier } from '../types/services';
import type { FormatCategory } from '../types/formats';

// ---------------------------------------------------------------------------
// LIMIT TYPES
// ---------------------------------------------------------------------------

export interface TierLimits {
  tier: UserTier;
  displayName: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';

  // Conversion limits
  dailyConversions: number;
  monthlyConversions: number;
  maxFileSize: number;
  maxFilesPerBatch: number;
  concurrentJobs: number;

  // Quality limits
  maxResolution: number;
  maxVideoDuration: number; // seconds
  maxAudioDuration: number; // seconds
  maxPageCount: number; // for PDFs

  // Features
  features: string[];
  premiumFeatures: string[];

  // Restrictions
  watermarkOnOutput: boolean;
  showAds: boolean;
  priorityQueue: boolean;

  // API limits
  apiRateLimit?: number; // requests per minute
  apiDailyLimit?: number;
}

export interface FormatLimits {
  format: string;
  maxSize: Record<UserTier, number>;
  maxDuration?: Record<UserTier, number>;
  qualityPresets: QualityPreset[];
}

export interface QualityPreset {
  name: string;
  description: string;
  tier: UserTier;
  settings: Record<string, number | string | boolean>;
}

export interface BatchLimits {
  maxFiles: Record<UserTier, number>;
  maxTotalSize: Record<UserTier, number>;
  concurrentJobs: Record<UserTier, number>;
  queuePriority: Record<UserTier, number>;
}

// ---------------------------------------------------------------------------
// TIER LIMITS CONFIGURATION
// ---------------------------------------------------------------------------

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    tier: 'free',
    displayName: 'Free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    dailyConversions: 10,
    monthlyConversions: 50,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFilesPerBatch: 5,
    concurrentJobs: 1,
    maxResolution: 4096,
    maxVideoDuration: 300, // 5 min
    maxAudioDuration: 600, // 10 min
    maxPageCount: 50,
    features: [
      'image-converter',
      'video-converter',
      'audio-converter',
      'document-converter',
      'basic-viewer',
      'drag-drop-upload',
    ],
    premiumFeatures: [],
    watermarkOnOutput: false,
    showAds: true,
    priorityQueue: false,
    apiRateLimit: 0,
    apiDailyLimit: 0,
  },
  premium: {
    tier: 'premium',
    displayName: 'Premium',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    dailyConversions: 100,
    monthlyConversions: 1000,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFilesPerBatch: 50,
    concurrentJobs: 3,
    maxResolution: 8192,
    maxVideoDuration: 3600, // 1 hour
    maxAudioDuration: 10800, // 3 hours
    maxPageCount: 500,
    features: [
      'image-converter',
      'video-converter',
      'audio-converter',
      'document-converter',
      'ebook-converter',
      'cad-converter',
      'full-viewer',
      'basic-editor',
      'batch-processing',
      'history',
      'cloud-storage',
    ],
    premiumFeatures: [
      'priority',
      'no-ads',
      'high-quality',
      'ocr',
      'ai-upscale',
      'ai-compress',
      'cloud-convert',
    ],
    watermarkOnOutput: false,
    showAds: false,
    priorityQueue: true,
    apiRateLimit: 60,
    apiDailyLimit: 1000,
  },
  enterprise: {
    tier: 'enterprise',
    displayName: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    dailyConversions: Infinity,
    monthlyConversions: Infinity,
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxFilesPerBatch: 500,
    concurrentJobs: 10,
    maxResolution: 16384,
    maxVideoDuration: Infinity,
    maxAudioDuration: Infinity,
    maxPageCount: 10000,
    features: [
      'all-converters',
      'full-viewer',
      'full-editor',
      'batch-processing',
      'unlimited-history',
      'cloud-storage',
      'api-access',
      'webhooks',
      'custom-integration',
    ],
    premiumFeatures: [
      'priority',
      'no-ads',
      'highest-quality',
      'ocr',
      'ai-upscale',
      'ai-compress',
      'cloud-convert',
      'custom-branding',
      'dedicated-support',
      'sla-guarantee',
    ],
    watermarkOnOutput: false,
    showAds: false,
    priorityQueue: true,
    apiRateLimit: 1000,
    apiDailyLimit: Infinity,
  },
};

// ---------------------------------------------------------------------------
// BATCH LIMITS
// ---------------------------------------------------------------------------

export const BATCH_LIMITS: BatchLimits = {
  maxFiles: {
    free: 5,
    premium: 50,
    enterprise: 500,
  },
  maxTotalSize: {
    free: 500 * 1024 * 1024, // 500MB
    premium: 10 * 1024 * 1024 * 1024, // 10GB
    enterprise: 100 * 1024 * 1024 * 1024, // 100GB
  },
  concurrentJobs: {
    free: 1,
    premium: 3,
    enterprise: 10,
  },
  queuePriority: {
    free: 1,
    premium: 5,
    enterprise: 10,
  },
};

// ---------------------------------------------------------------------------
// CATEGORY-SPECIFIC LIMITS
// ---------------------------------------------------------------------------

export const CATEGORY_LIMITS: Record<FormatCategory, { maxFileSize: Record<UserTier, number> }> = {
  image: {
    maxFileSize: {
      free: 50 * 1024 * 1024, // 50MB
      premium: 500 * 1024 * 1024, // 500MB
      enterprise: 5 * 1024 * 1024 * 1024, // 5GB
    },
  },
  raw: {
    maxFileSize: {
      free: 100 * 1024 * 1024,
      premium: 2 * 1024 * 1024 * 1024,
      enterprise: 10 * 1024 * 1024 * 1024,
    },
  },
  video: {
    maxFileSize: {
      free: 100 * 1024 * 1024,
      premium: 2 * 1024 * 1024 * 1024,
      enterprise: 10 * 1024 * 1024 * 1024,
    },
  },
  audio: {
    maxFileSize: {
      free: 50 * 1024 * 1024,
      premium: 1 * 1024 * 1024 * 1024,
      enterprise: 5 * 1024 * 1024 * 1024,
    },
  },
  document: {
    maxFileSize: {
      free: 50 * 1024 * 1024,
      premium: 500 * 1024 * 1024,
      enterprise: 5 * 1024 * 1024 * 1024,
    },
  },
  vector: {
    maxFileSize: {
      free: 20 * 1024 * 1024,
      premium: 200 * 1024 * 1024,
      enterprise: 2 * 1024 * 1024 * 1024,
    },
  },
  cad: {
    maxFileSize: {
      free: 50 * 1024 * 1024,
      premium: 500 * 1024 * 1024,
      enterprise: 5 * 1024 * 1024 * 1024,
    },
  },
  icon: {
    maxFileSize: {
      free: 10 * 1024 * 1024,
      premium: 50 * 1024 * 1024,
      enterprise: 500 * 1024 * 1024,
    },
  },
  archive: {
    maxFileSize: {
      free: 100 * 1024 * 1024,
      premium: 2 * 1024 * 1024 * 1024,
      enterprise: 10 * 1024 * 1024 * 1024,
    },
  },
  font: {
    maxFileSize: {
      free: 10 * 1024 * 1024,
      premium: 100 * 1024 * 1024,
      enterprise: 1 * 1024 * 1024 * 1024,
    },
  },
  gis: {
    maxFileSize: {
      free: 50 * 1024 * 1024,
      premium: 500 * 1024 * 1024,
      enterprise: 5 * 1024 * 1024 * 1024,
    },
  },
  email: {
    maxFileSize: {
      free: 20 * 1024 * 1024,
      premium: 100 * 1024 * 1024,
      enterprise: 1 * 1024 * 1024 * 1024,
    },
  },
  code: {
    maxFileSize: {
      free: 5 * 1024 * 1024,
      premium: 50 * 1024 * 1024,
      enterprise: 500 * 1024 * 1024,
    },
  },
  ebook: {
    maxFileSize: {
      free: 50 * 1024 * 1024,
      premium: 500 * 1024 * 1024,
      enterprise: 5 * 1024 * 1024 * 1024,
    },
  },
};

// ---------------------------------------------------------------------------
// LIMITS ENGINE CLASS
// ---------------------------------------------------------------------------

class LimitsEngine {
  private tierLimits: Map<UserTier, TierLimits>;
  private userTier: UserTier = 'free';

  constructor() {
    this.tierLimits = new Map(Object.entries(TIER_LIMITS) as [UserTier, TierLimits][]);
  }

  /**
   * Set current user tier
   */
  setTier(tier: UserTier): void {
    this.userTier = tier;
  }

  /**
   * Get current tier
   */
  getTier(): UserTier {
    return this.userTier;
  }

  /**
   * Get limits for tier
   */
  getLimits(tier?: UserTier): TierLimits {
    return TIER_LIMITS[tier ?? this.userTier];
  }

  /**
   * Check if conversion is allowed
   */
  canConvert(dailyUsed: number, monthlyUsed: number, tier?: UserTier): {
    allowed: boolean;
    reason?: string;
    remaining?: { daily: number; monthly: number };
  } {
    const limits = this.getLimits(tier ?? this.userTier);
    const remaining = {
      daily: limits.dailyConversions === Infinity ? Infinity : limits.dailyConversions - dailyUsed,
      monthly: limits.monthlyConversions === Infinity ? Infinity : limits.monthlyConversions - monthlyUsed,
    };

    if (remaining.daily <= 0) {
      return { allowed: false, reason: 'Daily limit reached', remaining };
    }

    if (remaining.monthly <= 0) {
      return { allowed: false, reason: 'Monthly limit reached', remaining };
    }

    return { allowed: true, remaining };
  }

  /**
   * Check if file size is allowed
   */
  canProcessSize(size: number, tier?: UserTier): { allowed: boolean; reason?: string } {
    const limits = this.getLimits(tier ?? this.userTier);
    if (size > limits.maxFileSize) {
      const maxSizeMB = Math.round(limits.maxFileSize / (1024 * 1024));
      return { allowed: false, reason: `File exceeds ${maxSizeMB}MB limit` };
    }
    return { allowed: true };
  }

  /**
   * Check if batch size is allowed
   */
  canProcessBatch(count: number, totalSize: number, tier?: UserTier): { allowed: boolean; reason?: string } {
    const limits = this.getLimits(tier ?? this.userTier);
    const batchLimits = BATCH_LIMITS;
    const effectiveTier = tier ?? this.userTier;

    if (count > limits.maxFilesPerBatch) {
      return { allowed: false, reason: `Maximum ${limits.maxFilesPerBatch} files per batch` };
    }

    if (totalSize > batchLimits.maxTotalSize[effectiveTier]) {
      const maxSizeGB = Math.round(batchLimits.maxTotalSize[effectiveTier] / (1024 * 1024 * 1024));
      return { allowed: false, reason: `Batch total exceeds ${maxSizeGB}GB limit` };
    }

    return { allowed: true };
  }

  /**
   * Check if feature is available
   */
  hasFeature(feature: string, tier?: UserTier): boolean {
    const limits = this.getLimits(tier ?? this.userTier);
    return limits.features.includes(feature) || limits.premiumFeatures.includes(feature);
  }

  /**
   * Check if premium feature is available
   */
  hasPremiumFeature(feature: string, tier?: UserTier): boolean {
    const limits = this.getLimits(tier ?? this.userTier);
    return limits.premiumFeatures.includes(feature);
  }

  /**
   * Get category-specific max file size
   */
  getMaxFileSizeForCategory(category: FormatCategory, tier?: UserTier): number {
    const categoryLimits = CATEGORY_LIMITS[category];
    return categoryLimits?.maxFileSize[tier ?? this.userTier] ?? this.getLimits(tier).maxFileSize;
  }

  /**
   * Check if resolution is allowed
   */
  canProcessResolution(width: number, height: number, tier?: UserTier): { allowed: boolean; reason?: string } {
    const limits = this.getLimits(tier ?? this.userTier);
    const maxDim = Math.max(width, height);
    if (maxDim > limits.maxResolution) {
      return { allowed: false, reason: `Maximum resolution is ${limits.maxResolution}px` };
    }
    return { allowed: true };
  }

  /**
   * Check if duration is allowed
   */
  canProcessDuration(duration: number, isVideo: boolean, tier?: UserTier): { allowed: boolean; reason?: string } {
    const limits = this.getLimits(tier ?? this.userTier);
    const maxDuration = isVideo ? limits.maxVideoDuration : limits.maxAudioDuration;

    if (duration > maxDuration) {
      const maxMin = Math.round(maxDuration / 60);
      return { allowed: false, reason: `Maximum duration is ${maxMin} minutes` };
    }
    return { allowed: true };
  }

  /**
   * Get watermark requirement
   */
  requiresWatermark(tier?: UserTier): boolean {
    return this.getLimits(tier).watermarkOnOutput;
  }

  /**
   * Get ad requirement
   */
  shouldShowAds(tier?: UserTier): boolean {
    return this.getLimits(tier).showAds;
  }

  /**
   * Get queue priority
   */
  getQueuePriority(tier?: UserTier): number {
    return BATCH_LIMITS.queuePriority[tier ?? this.userTier];
  }

  /**
   * Get concurrent job limit
   */
  getMaxConcurrentJobs(tier?: UserTier): number {
    return this.getLimits(tier).concurrentJobs;
  }

  /**
   * Compare tiers for upgrade prompt
   */
  getUpgradeComparison(fromTier: UserTier, toTier: UserTier): {
    newFeatures: string[];
    increasedLimits: { key: string; from: number | string; to: number | string }[];
  } {
    const from = TIER_LIMITS[fromTier];
    const to = TIER_LIMITS[toTier];
    const newFeatures: string[] = [];
    const increasedLimits: { key: string; from: number | string; to: number | string }[] = [];

    // Find new features
    for (const feature of to.premiumFeatures) {
      if (!from.premiumFeatures.includes(feature)) {
        newFeatures.push(feature);
      }
    }

    // Find increased limits
    if (to.dailyConversions > from.dailyConversions) {
      increasedLimits.push({
        key: 'dailyConversions',
        from: from.dailyConversions === Infinity ? 'Unlimited' : from.dailyConversions,
        to: to.dailyConversions === Infinity ? 'Unlimited' : to.dailyConversions,
      });
    }
    if (to.maxFileSize > from.maxFileSize) {
      increasedLimits.push({
        key: 'maxFileSize',
        from: `${Math.round(from.maxFileSize / (1024 * 1024))}MB`,
        to: `${Math.round(to.maxFileSize / (1024 * 1024))}MB`,
      });
    }
    if (to.concurrentJobs > from.concurrentJobs) {
      increasedLimits.push({
        key: 'concurrentJobs',
        from: from.concurrentJobs,
        to: to.concurrentJobs,
      });
    }

    return { newFeatures, increasedLimits };
  }
}

export const limitsEngine = new LimitsEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getTierLimits(tier?: UserTier): TierLimits {
  return limitsEngine.getLimits(tier);
}

export function canConvert(dailyUsed: number, monthlyUsed: number, tier?: UserTier) {
  return limitsEngine.canConvert(dailyUsed, monthlyUsed, tier);
}

export function canProcessSize(size: number, tier?: UserTier) {
  return limitsEngine.canProcessSize(size, tier);
}

export function hasFeature(feature: string, tier?: UserTier): boolean {
  return limitsEngine.hasFeature(feature, tier);
}
