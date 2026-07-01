/**
 * lib/di/service-resolver.ts
 *
 * ServiceResolver — higher-level resolution helper built on ServiceContainer.
 *
 * Adds:
 *   - tryResolve()  — optional resolution returning null instead of throwing
 *   - lazy()        — deferred accessor resolved on first access
 *   - resolveAll()  — batch resolution for dependency arrays
 *   - has()         — proxy to container.has()
 *
 * Use ServiceResolver when you need optional or lazy infrastructure services.
 */

import { ServiceContainer, ServiceNotRegisteredError } from './service-container';
import { ServiceToken } from './service-registration';

export class ServiceResolver {
  constructor(private readonly container: ServiceContainer) {}

  // ── Core Resolution ────────────────────────────────────────────────────────

  /**
   * Resolve a service. Throws if not registered.
   */
  resolve<T>(token: ServiceToken<T>): T {
    return this.container.resolve(token);
  }

  /**
   * Resolve a service, returning null if not registered.
   * Use for optional infrastructure services where browser fallback applies.
   *
   * @example
   *   const redis = resolver.tryResolve(REDIS_TOKEN);
   *   const cache = redis ?? new MemoryCacheProvider();
   */
  tryResolve<T>(token: ServiceToken<T>): T | null {
    try {
      return this.container.resolve(token);
    } catch (err) {
      if (err instanceof ServiceNotRegisteredError) return null;
      throw err;
    }
  }

  /**
   * Create a lazy accessor: the service is resolved on first call only.
   * Subsequent calls return the same cached instance.
   *
   * @example
   *   const getLogger = resolver.lazy(LOGGER_TOKEN);
   *   // …later, at call site:
   *   getLogger().info('hello');
   */
  lazy<T>(token: ServiceToken<T>): () => T {
    let cached: T | undefined;
    return () => {
      if (cached === undefined) cached = this.container.resolve(token);
      return cached;
    };
  }

  /**
   * Resolve multiple services in one call.
   * Preserves tuple types so TypeScript knows the result types.
   *
   * @example
   *   const [logger, cache] = resolver.resolveAll([LOGGER_TOKEN, CACHE_TOKEN]);
   */
  resolveAll<T extends readonly ServiceToken<unknown>[]>(
    tokens: T,
  ): { [K in keyof T]: T[K] extends ServiceToken<infer U> ? U : never } {
    return (tokens as unknown as ServiceToken<unknown>[]).map(
      (t: ServiceToken<unknown>) => this.container.resolve(t),
    ) as never;
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /** Returns true if the token is registered in the container. */
  has<T>(token: ServiceToken<T>): boolean {
    return this.container.has(token);
  }
}
