/**
 * lib/infrastructure/providers/redis-adapter.ts
 *
 * Phase 6D-1 Part 2 — Redis Adapter Interface + Memory Implementation
 *
 * IRedisAdapter: generic Redis command interface.
 * MemoryRedisAdapter: Map-based in-memory implementation (no Redis needed).
 *
 * Switching to real Redis requires ONLY DI re-registration:
 *   container.register({ token: SERVICE_TOKENS.RedisAdapter, factory: () => new IORedisAdapter(config) });
 *
 * IMPORTANT: This is the low-level Redis adapter.
 * ICacheProvider (cache-provider.ts) is the high-level cache abstraction.
 * Business logic should use ICacheProvider, not IRedisAdapter directly.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// REDIS TYPES
// ---------------------------------------------------------------------------

export type RedisValue = string | number | Buffer;

export interface RedisPipelineResult {
  error:  Error | null;
  result: RedisValue | null;
}

export interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: RedisValue, options?: { ex?: number; nx?: boolean; xx?: boolean }): Promise<boolean>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  incrby(key: string, increment: number): Promise<number>;
  decr(key: string): Promise<number>;
  decrby(key: string, decrement: number): Promise<number>;
  hset(key: string, field: string, value: RedisValue): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hmset(key: string, data: Record<string, RedisValue>): Promise<void>;
  hmget(key: string, ...fields: string[]): Promise<Array<string | null>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  hgetall(key: string): Promise<Record<string, string> | null>;
  lpush(key: string, ...values: RedisValue[]): Promise<number>;
  rpush(key: string, ...values: RedisValue[]): Promise<number>;
  lpop(key: string): Promise<string | null>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  sadd(key: string, ...members: RedisValue[]): Promise<number>;
  srem(key: string, ...members: RedisValue[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: RedisValue): Promise<boolean>;
  zadd(key: string, score: number, member: RedisValue): Promise<number>;
  zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]>;
  zrem(key: string, ...members: RedisValue[]): Promise<number>;
  zscore(key: string, member: RedisValue): Promise<number | null>;
  keys(pattern: string): Promise<string[]>;
  scan(cursor: number, options?: { match?: string; count?: number }): Promise<{ cursor: number; keys: string[] }>;
  flushdb(): Promise<void>;
  ping(): Promise<'PONG'>;
  info(): Promise<string>;
}

// ---------------------------------------------------------------------------
// INTERFACE WITH METADATA
// ---------------------------------------------------------------------------

export interface IRedisAdapter extends RedisAdapter {
  getMetadata(): ProviderMetadata;
  pipeline(): RedisPipeline;
  disconnect(): Promise<void>;
}

export interface RedisPipeline {
  get(key: string): RedisPipeline;
  set(key: string, value: RedisValue, options?: { ex?: number }): RedisPipeline;
  del(...keys: string[]): RedisPipeline;
  incr(key: string): RedisPipeline;
  expire(key: string, seconds: number): RedisPipeline;
  exec(): Promise<RedisPipelineResult[]>;
}

// ---------------------------------------------------------------------------
// MEMORY IMPLEMENTATION
// ---------------------------------------------------------------------------

class MemoryPipeline implements RedisPipeline {
  private commands: Array<() => Promise<RedisValue | null>> = [];
  private adapter: MemoryRedisAdapter;

  constructor(adapter: MemoryRedisAdapter) { this.adapter = adapter; }

  get(key: string): RedisPipeline {
    this.commands.push(() => this.adapter.get(key));
    return this;
  }

  set(key: string, value: RedisValue, options?: { ex?: number }): RedisPipeline {
    this.commands.push(async () => { await this.adapter.set(key, value, options); return null; });
    return this;
  }

  del(...keys: string[]): RedisPipeline {
    this.commands.push(async () => this.adapter.del(...keys));
    return this;
  }

  incr(key: string): RedisPipeline {
    this.commands.push(() => this.adapter.incr(key));
    return this;
  }

  expire(key: string, seconds: number): RedisPipeline {
    this.commands.push(async () => { await this.adapter.expire(key, seconds); return null; });
    return this;
  }

  async exec(): Promise<RedisPipelineResult[]> {
    const results: RedisPipelineResult[] = [];
    for (const cmd of this.commands) {
      try {
        const result = await cmd();
        results.push({ error: null, result: result as RedisValue | null });
      } catch (error) {
        results.push({ error: error as Error, result: null });
      }
    }
    return results;
  }
}

interface MemoryEntry { value: string; expiresAt?: number; }

export class MemoryRedisAdapter implements IRedisAdapter {
  private readonly store = new Map<string, MemoryEntry>();
  private readonly sets  = new Map<string, Set<string>>();
  private readonly lists = new Map<string, string[]>();
  private readonly hashes = new Map<string, Map<string, string>>();
  private readonly zsets  = new Map<string, Map<string, number>>();

  private readonly metadata: ProviderMetadata = {
    id:             'memory-redis',
    displayName:    'Memory Redis Adapter',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       2,
    healthStatus:   'healthy',
    capabilities:   ['get-set', 'hash', 'list', 'set', 'sorted-set', 'expire', 'pipeline', 'pub-sub'],
    futureProvider: 'redis',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  pipeline(): RedisPipeline { return new MemoryPipeline(this); }

  private isExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<string | null> {
    const e = this.store.get(key);
    if (!e || this.isExpired(e)) { this.store.delete(key); return null; }
    return e.value;
  }

  async set(key: string, value: RedisValue, options?: { ex?: number; nx?: boolean; xx?: boolean }): Promise<boolean> {
    if (options?.nx && this.store.has(key)) return false;
    if (options?.xx && !this.store.has(key)) return false;
    this.store.set(key, {
      value:     String(value),
      expiresAt: options?.ex ? Date.now() + options.ex * 1000 : undefined,
    });
    return true;
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    keys.forEach(k => { if (this.store.delete(k)) count++; });
    return count;
  }

  async exists(...keys: string[]): Promise<number> {
    return keys.filter(k => this.store.has(k)).length;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const e = this.store.get(key);
    if (!e) return false;
    this.store.set(key, { ...e, expiresAt: Date.now() + seconds * 1000 });
    return true;
  }

  async ttl(key: string): Promise<number> {
    const e = this.store.get(key);
    if (!e) return -2;
    if (!e.expiresAt) return -1;
    return Math.max(0, Math.floor((e.expiresAt - Date.now()) / 1000));
  }

  async incr(key: string): Promise<number> { return this.incrby(key, 1); }

  async incrby(key: string, n: number): Promise<number> {
    const cur = parseInt((await this.get(key)) ?? '0', 10);
    const next = cur + n;
    await this.set(key, next);
    return next;
  }

  async decr(key: string): Promise<number> { return this.decrby(key, 1); }

  async decrby(key: string, n: number): Promise<number> { return this.incrby(key, -n); }

  async hset(key: string, field: string, value: RedisValue): Promise<number> {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    const h = this.hashes.get(key)!;
    const isNew = !h.has(field);
    h.set(field, String(value));
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hmset(key: string, data: Record<string, RedisValue>): Promise<void> {
    for (const [f, v] of Object.entries(data)) { await this.hset(key, f, v); }
  }

  async hmget(key: string, ...fields: string[]): Promise<Array<string | null>> {
    const h = this.hashes.get(key);
    return fields.map(f => h?.get(f) ?? null);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const h = this.hashes.get(key);
    if (!h) return 0;
    let count = 0;
    fields.forEach(f => { if (h.delete(f)) count++; });
    return count;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const h = this.hashes.get(key);
    if (!h || h.size === 0) return null;
    const result: Record<string, string> = {};
    h.forEach((v, k) => { result[k] = v; });
    return result;
  }

  async lpush(key: string, ...values: RedisValue[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const l = this.lists.get(key)!;
    values.forEach(v => l.unshift(String(v)));
    return l.length;
  }

  async rpush(key: string, ...values: RedisValue[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const l = this.lists.get(key)!;
    values.forEach(v => l.push(String(v)));
    return l.length;
  }

  async lpop(key: string): Promise<string | null> { return this.lists.get(key)?.shift() ?? null; }
  async rpop(key: string): Promise<string | null> { return this.lists.get(key)?.pop() ?? null; }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const l = this.lists.get(key) ?? [];
    return l.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async sadd(key: string, ...members: RedisValue[]): Promise<number> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    const s = this.sets.get(key)!;
    let count = 0;
    members.forEach(m => { if (!s.has(String(m))) { s.add(String(m)); count++; } });
    return count;
  }

  async srem(key: string, ...members: RedisValue[]): Promise<number> {
    const s = this.sets.get(key);
    if (!s) return 0;
    let count = 0;
    members.forEach(m => { if (s.delete(String(m))) count++; });
    return count;
  }

  async smembers(key: string): Promise<string[]> { return Array.from(this.sets.get(key) ?? []); }

  async sismember(key: string, member: RedisValue): Promise<boolean> {
    return this.sets.get(key)?.has(String(member)) ?? false;
  }

  async zadd(key: string, score: number, member: RedisValue): Promise<number> {
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    const z = this.zsets.get(key)!;
    const isNew = !z.has(String(member));
    z.set(String(member), score);
    return isNew ? 1 : 0;
  }

  async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]> {
    const z = this.zsets.get(key);
    if (!z) return [];
    const sorted = Array.from(z.entries()).sort((a, b) => options?.rev ? b[1] - a[1] : a[1] - b[1]);
    return sorted.slice(start, stop === -1 ? undefined : stop + 1).map(([m]) => m);
  }

  async zrem(key: string, ...members: RedisValue[]): Promise<number> {
    const z = this.zsets.get(key);
    if (!z) return 0;
    let count = 0;
    members.forEach(m => { if (z.delete(String(m))) count++; });
    return count;
  }

  async zscore(key: string, member: RedisValue): Promise<number | null> {
    return this.zsets.get(key)?.get(String(member)) ?? null;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  async scan(cursor: number, options?: { match?: string; count?: number }): Promise<{ cursor: number; keys: string[] }> {
    const allKeys = await this.keys(options?.match ?? '*');
    const count   = options?.count ?? 10;
    const start   = cursor;
    const end     = Math.min(start + count, allKeys.length);
    return { cursor: end >= allKeys.length ? 0 : end, keys: allKeys.slice(start, end) };
  }

  async flushdb(): Promise<void> {
    this.store.clear();
    this.sets.clear();
    this.lists.clear();
    this.hashes.clear();
    this.zsets.clear();
  }

  async ping(): Promise<'PONG'> { return 'PONG'; }

  async info(): Promise<string> {
    return `# Memory Redis Adapter\nused_memory:${this.store.size}\nconnected:true\n`;
  }

  async disconnect(): Promise<void> { /* no-op */ }
}

export const memoryRedisAdapter = new MemoryRedisAdapter();
