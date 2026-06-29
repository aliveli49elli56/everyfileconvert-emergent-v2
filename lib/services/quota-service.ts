/**
 * lib/services/quota-service.ts
 * Quota management service
 */

import type { UserTier, QuotaLimits, QuotaUsage } from '../types/services';

// ---------------------------------------------------------------------------
// QUOTA LIMITS BY TIER
// ---------------------------------------------------------------------------

const QUOTA_LIMITS: Record<UserTier, QuotaLimits> = {
  free: {
    dailyConversions: 10,
    monthlyConversions: 50,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFilesPerBatch: 5,
    concurrentJobs: 1,
    premiumFeatures: [],
  },
  premium: {
    dailyConversions: 100,
    monthlyConversions: 1000,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFilesPerBatch: 50,
    concurrentJobs: 3,
    premiumFeatures: ['priority', 'premium-api', 'no-ads', 'batch-priority'],
  },
  enterprise: {
    dailyConversions: Infinity,
    monthlyConversions: Infinity,
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxFilesPerBatch: 500,
    concurrentJobs: 10,
    premiumFeatures: ['priority', 'premium-api', 'no-ads', 'batch-priority', 'api-access', 'custom-integration', 'sla'],
  },
};

// ---------------------------------------------------------------------------
// STORAGE KEYS
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'everyfileconvert_quota_';

// ---------------------------------------------------------------------------
// QUOTA SERVICE
// ---------------------------------------------------------------------------

class QuotaService {
  private tier: UserTier;
  private limits: QuotaLimits;

  constructor() {
    // Default to free tier
    this.tier = 'free';
    this.limits = QUOTA_LIMITS.free;
  }

  /**
   * Set user tier
   */
  setTier(tier: UserTier): void {
    this.tier = tier;
    this.limits = QUOTA_LIMITS[tier];
  }

  /**
   * Get current tier
   */
  getTier(): UserTier {
    return this.tier;
  }

  /**
   * Get limits for current tier
   */
  getLimits(): QuotaLimits {
    return this.limits;
  }

  /**
   * Get current usage
   */
  getUsage(): QuotaUsage {
    if (typeof window === 'undefined') {
      return {
        dailyUsed: 0,
        monthlyUsed: 0,
        resetAt: new Date(),
        tier: this.tier,
      };
    }

    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const monthKey = `${today.getFullYear()}-${today.getMonth()}`;

    const dailyData = this.getStoredData(`daily_${dayKey}`);
    const monthlyData = this.getStoredData(`monthly_${monthKey}`);

    return {
      dailyUsed: dailyData?.count ?? 0,
      monthlyUsed: monthlyData?.count ?? 0,
      resetAt: this.getNextResetTime(),
      tier: this.tier,
    };
  }

  /**
   * Check if conversion is allowed
   */
  canConvert(): { allowed: boolean; reason?: string } {
    const usage = this.getUsage();

    if (usage.dailyUsed >= this.limits.dailyConversions) {
      return { allowed: false, reason: 'Daily conversion limit reached' };
    }

    if (usage.monthlyUsed >= this.limits.monthlyConversions) {
      return { allowed: false, reason: 'Monthly conversion limit reached' };
    }

    return { allowed: true };
  }

  /**
   * Check if file size is allowed
   */
  canProcessSize(size: number): { allowed: boolean; reason?: string } {
    if (size > this.limits.maxFileSize) {
      const maxSizeMB = Math.round(this.limits.maxFileSize / (1024 * 1024));
      return { allowed: false, reason: `File exceeds ${maxSizeMB}MB limit` };
    }
    return { allowed: true };
  }

  /**
   * Check if batch size is allowed
   */
  canProcessBatch(count: number): { allowed: boolean; reason?: string } {
    if (count > this.limits.maxFilesPerBatch) {
      return { allowed: false, reason: `Maximum ${this.limits.maxFilesPerBatch} files per batch` };
    }
    return { allowed: true };
  }

  /**
   * Check if feature is available
   */
  hasFeature(feature: string): boolean {
    return this.limits.premiumFeatures.includes(feature);
  }

  /**
   * Record a conversion
   */
  recordConversion(): void {
    if (typeof window === 'undefined') return;

    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const monthKey = `${today.getFullYear()}-${today.getMonth()}`;

    this.incrementStoredData(`daily_${dayKey}`);
    this.incrementStoredData(`monthly_${monthKey}`);
  }

  /**
   * Get remaining conversions
   */
  getRemaining(): { daily: number; monthly: number } {
    const usage = this.getUsage();
    return {
      daily: Math.max(0, this.limits.dailyConversions - usage.dailyUsed),
      monthly: Math.max(0, this.limits.monthlyConversions - usage.monthlyUsed),
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  private getStoredData(key: string): { count: number; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setStoredData(key: string, data: { count: number; timestamp: number }): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
    } catch {
      // Storage full - ignore
    }
  }

  private incrementStoredData(key: string): void {
    const existing = this.getStoredData(key);
    const data = {
      count: (existing?.count ?? 0) + 1,
      timestamp: Date.now(),
    };
    this.setStoredData(key, data);
  }

  private getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}

export const quotaService = new QuotaService();
