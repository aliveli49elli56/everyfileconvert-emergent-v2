/**
 * lib/infrastructure/providers/cache-provider.ts
 *
 * Cache Provider — Interface + Memory Implementation
 *
 * ICacheProvider: Redis-compatible cache interface.
 * MemoryCacheProvider: in-memory Map-based cache when ENABLE_REDIS = false.
 *
 * Future provider (Phase 6D-2): Redis (via ioredis / upstash)
 * Swap: register RedisCacheProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// CACHE TYPES
// ---------------------------------------------------------------------------

export interface CacheSetOptions {
  /** Time-to-live in seconds. Omit for no expiry. */
  ttl?: number;
  /** Only set if key does not already exist */
  nx?: boolean;
}

export interface CacheStats {
  hitRate:  number;
  size:     number;
  maxSize?: number;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ICacheProvider {
  getMetadata(): ProviderMetadata;
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: CacheSetOptions): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<number>;
  increment(key: string, by?: number): Promise<number>;
  getStats(): Promise<CacheStats>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: unknown;
  expiresAt?: number;
}

export class MemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, CacheEntry>();
  private hits   = 0;
  private misses = 0;

  private readonly metadata: ProviderMetadata = {
    id:             'memory-cache',
    displayName:    'Memory Cache Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       2,
    healthStatus:   'healthy',
    capabilities:   ['get', 'set', 'delete', 'exists', 'clear', 'increment', 'ttl'],
    futureProvider: 'redis',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) { this.misses++; return null; }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value as T;
  }

  async set(key: string, value: unknown, options?: CacheSetOptions): Promise<boolean> {
    if (options?.nx && this.store.has(key)) return false;
    this.store.set(key, {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : undefined,
    });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(pattern?: string): Promise<number> {
    if (!pattern) {
      const count = this.store.size;
      this.store.clear();
      return count;
    }
    let count = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));
    Array.from(this.store.keys()).forEach(key => {
      if (regex.test(key)) { this.store.delete(key); count++; }
    });
    return count;
  }

  async increment(key: string, by = 1): Promise<number> {
    const existing = await this.get<number>(key);
    const next = (existing ?? 0) + by;
    await this.set(key, next);
    return next;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.hits + this.misses;
    return {
      hitRate: total > 0 ? this.hits / total : 0,
      size:    this.store.size,
    };
  }
}

export const memoryCacheProvider = new MemoryCacheProvider();
