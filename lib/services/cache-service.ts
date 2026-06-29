/**
 * lib/services/cache-service.ts
 * In-memory and persistent caching service
 */

import type { CacheEntry } from '../types/services';

// ---------------------------------------------------------------------------
// CACHE CONFIGURATION
// ---------------------------------------------------------------------------

interface CacheConfig {
  enabled: boolean;
  defaultTTL: number;
  maxSize: number;
  persistent: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  defaultTTL: 3600000, // 1 hour
  maxSize: 100,
  persistent: false, // Set true when IndexedDB is configured
};

// ---------------------------------------------------------------------------
// CACHE SERVICE
// ---------------------------------------------------------------------------

class CacheService {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry<unknown>>;
  private accessOrder: string[];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new Map();
    this.accessOrder = [];
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check expiry
    if (entry.expiresAt < new Date()) {
      this.delete(key);
      return null;
    }

    // Update access order
    entry.hitCount++;
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set<T>(
    key: string,
    value: T,
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): void {
    if (!this.config.enabled) return;

    // Evict if at capacity
    if (this.memoryCache.size >= this.config.maxSize && !this.memoryCache.has(key)) {
      this.evictLRU();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      tags,
      hitCount: 0,
    };

    this.memoryCache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    if (!this.config.enabled) return false;
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < new Date()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const existed = this.memoryCache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return existed;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.accessOrder = [];
  }

  /**
   * Clear by tag
   */
  clearByTag(tag: string): number {
    let cleared = 0;
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      cleared++;
    }
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let totalHits = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    this.memoryCache.forEach((entry) => {
      totalHits += entry.hitCount;
      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    });

    return {
      size: this.memoryCache.size,
      maxSize: this.config.maxSize,
      hitRate: this.accessOrder.length > 0 ? totalHits / this.accessOrder.length : 0,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Get keys matching pattern
   */
  getKeys(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.memoryCache.keys()).filter(k => regex.test(k));
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    // Find oldest entry with lowest hit count
    let minScore = Infinity;
    let evictKey = this.accessOrder[0];

    for (const key of this.accessOrder) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        const score = entry.hitCount / (Date.now() - entry.createdAt.getTime());
        if (score < minScore) {
          minScore = score;
          evictKey = key;
        }
      }
    }

    this.delete(evictKey);
  }

  // ---------------------------------------------------------------------------
  // CONVERSION RESULT CACHING
  // ---------------------------------------------------------------------------

  /**
   * Generate cache key for conversion
   */
  generateConversionKey(
    sourceHash: string,
    targetFormat: string,
    options: Record<string, unknown>
  ): string {
    const optionsStr = JSON.stringify(options);
    return `conv_${sourceHash}_${targetFormat}_${this.hashString(optionsStr)}`;
  }

  /**
   * Hash a string (simple implementation)
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache a conversion result
   */
  cacheConversionResult(
    key: string,
    result: { blob: Blob; filename: string; mimeType: string }
  ): void {
    // Note: Blobs can't be cached in memory effectively
    // This would need IndexedDB for persistent storage
    this.set(key, {
      filename: result.filename,
      mimeType: result.mimeType,
      size: result.blob.size,
      timestamp: Date.now(),
    }, 3600000, ['conversion']);
  }
}

export const cacheService = new CacheService();
