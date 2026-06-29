/**
 * lib/types/services.ts
 * Service layer types
 */

import type { ConversionErrorCode } from './conversion';

/** User tier */
export type UserTier = 'free' | 'premium' | 'enterprise';

/** Quota limits */
export interface QuotaLimits {
  dailyConversions: number;
  monthlyConversions: number;
  maxFileSize: number;
  maxFilesPerBatch: number;
  concurrentJobs: number;
  premiumFeatures: string[];
}

/** Quota usage */
export interface QuotaUsage {
  dailyUsed: number;
  monthlyUsed: number;
  resetAt: Date;
  tier: UserTier;
}

/** Analytics event */
export interface AnalyticsEvent {
  name: string;
  category: 'conversion' | 'navigation' | 'error' | 'engagement' | 'monetization';
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  locale?: string;
  userAgent?: string;
  referrer?: string;
}

/** Ad configuration */
export interface AdConfig {
  unitId: string;
  format: 'banner' | 'sidebar' | 'infeed' | 'popup';
  width: number;
  height: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'inline';
  lazy?: boolean;
  responsive?: boolean;
}

/** Cache entry */
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  tags: string[];
  hitCount: number;
}

/** Service configuration */
export interface ServiceConfig {
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  analytics: {
    enabled: boolean;
    endpoint?: string;
    batchSize: number;
    flushInterval: number;
  };
  quota: {
    enabled: boolean;
    strictMode: boolean;
  };
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ConversionErrorCode;
    message: string;
  };
  meta?: {
    cached?: boolean;
    duration?: number;
    provider?: string;
  };
}

/** Download configuration */
export interface DownloadConfig {
  expiresIn: number;
  maxAttempts: number;
  requireAuth: boolean;
}
