/**
 * lib/di/service-container.ts
 *
 * ServiceContainer — the central Dependency Injection container.
 *
 * Responsibilities:
 *   - Accept typed service registrations
 *   - Resolve services lazily (singletons cached, transients fresh each call)
 *   - Detect circular dependencies and throw descriptive errors
 *   - Expose a diagnostic snapshot for health reporting
 *
 * Rule: All future infrastructure services MUST be registered here.
 *       Direct instantiation of infrastructure services outside the
 *       container is prohibited.
 */

import type { ServiceRegistration } from './service-registration';
import { ServiceToken } from './service-registration';

// ---------------------------------------------------------------------------
// ERROR TYPES
// ---------------------------------------------------------------------------

export class CircularDependencyError extends Error {
  constructor(public readonly chain: string[]) {
    super(`Circular dependency: ${chain.join(' → ')}`);
    this.name = 'CircularDependencyError';
  }
}

export class ServiceNotRegisteredError extends Error {
  constructor(token: ServiceToken<unknown>) {
    super(`Service not registered: ${token}`);
    this.name = 'ServiceNotRegisteredError';
  }
}

// ---------------------------------------------------------------------------
// DIAGNOSTIC SNAPSHOT TYPES
// ---------------------------------------------------------------------------

export interface ServiceSnapshot {
  id: string;
  scope: string;
  isCached: boolean;
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    isInfrastructure?: boolean;
    dependsOn?: string[];
  };
}

// ---------------------------------------------------------------------------
// SERVICE CONTAINER
// ---------------------------------------------------------------------------

export class ServiceContainer {
  private readonly registrations = new Map<string, ServiceRegistration<unknown>>();
  private readonly singletons    = new Map<string, unknown>();
  /** Tracks in-progress resolutions to catch circular dependencies */
  private readonly resolving     = new Set<string>();

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a service. Replaces any previous registration for the same token.
   * Invalidates the singleton cache for that token on re-registration.
   *
   * @example
   *   container.register({
   *     token:    LOGGER_TOKEN,
   *     factory:  () => new ConsoleLogger(),
   *     scope:    'singleton',
   *     metadata: { name: 'Logger', isInfrastructure: true },
   *   });
   */
  register<T>(registration: ServiceRegistration<T>): void {
    const id = registration.token.id;
    this.registrations.set(id, registration as ServiceRegistration<unknown>);
    // Invalidate cached singleton when provider is swapped
    this.singletons.delete(id);
  }

  // ── Resolution ─────────────────────────────────────────────────────────────

  /**
   * Resolve a service by its typed token.
   *
   * - Singletons are created once and cached.
   * - Transients are created fresh on every call.
   *
   * @throws ServiceNotRegisteredError when the token has no registration
   * @throws CircularDependencyError   when a dependency cycle is detected
   */
  resolve<T>(token: ServiceToken<T>): T {
    const id = token.id;

    if (this.resolving.has(id)) {
      throw new CircularDependencyError(Array.from(this.resolving).concat(id));
    }

    const reg = this.registrations.get(id);
    if (!reg) throw new ServiceNotRegisteredError(token);

    // Return cached singleton
    if (reg.scope === 'singleton' && this.singletons.has(id)) {
      return this.singletons.get(id) as T;
    }

    // Create instance (with circular-dep guard active)
    this.resolving.add(id);
    let instance: T;
    try {
      instance = (reg as ServiceRegistration<T>).factory(this);
    } finally {
      this.resolving.delete(id);
    }

    if (reg.scope === 'singleton') {
      this.singletons.set(id, instance);
    }

    return instance;
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /** Returns true if the token has been registered. */
  has<T>(token: ServiceToken<T>): boolean {
    return this.registrations.has(token.id);
  }

  /** List all registered service token IDs. */
  listRegistered(): string[] {
    return Array.from(this.registrations.keys());
  }

  // ── Diagnostics ────────────────────────────────────────────────────────────

  /**
   * Returns a diagnostic snapshot of all registrations.
   * Used by InfrastructureHealthManager for health reports.
   */
  snapshot(): ServiceSnapshot[] {
    return Array.from(this.registrations.entries()).map(([id, reg]) => ({
      id,
      scope:    reg.scope,
      isCached: this.singletons.has(id),
      metadata: {
        name:              reg.metadata.name,
        description:       reg.metadata.description,
        tags:              reg.metadata.tags,
        isInfrastructure:  reg.metadata.isInfrastructure,
        dependsOn:         reg.metadata.dependsOn?.map(t => t.id),
      },
    }));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Reset the container — clears all registrations and singleton cache.
   * Primarily used in tests. Do not call in production.
   */
  reset(): void {
    this.registrations.clear();
    this.singletons.clear();
    this.resolving.clear();
  }
}
