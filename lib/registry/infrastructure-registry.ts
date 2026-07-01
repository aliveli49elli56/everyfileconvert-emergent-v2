/**
 * lib/registry/infrastructure-registry.ts
 *
 * Phase 6D-1 — Infrastructure Registry
 *
 * A DEDICATED registry for infrastructure providers only.
 *
 * Design principles:
 *   - ADDITIVE: does not modify or replace any existing registry
 *     (format-registry, conversion-registry, processor-registry, etc. untouched)
 *   - METADATA-DRIVEN: adding a new provider requires registration only
 *     No existing business logic needs modification when a new provider is added
 *   - Integrates with the DI ServiceContainer for service resolution
 *   - Provides health reporting, dependency graph, and metadata access
 *
 * Existing registries remain completely unchanged:
 *   FormatRegistry, ProcessorRegistry, LibraryRegistry,
 *   ConversionRegistry, CategoryRegistry, etc.
 */

import type { ProviderMetadata, InfrastructureProviderRegistration } from '../infrastructure/types';
import type { ServiceContainer } from '../di/service-container';

// ---------------------------------------------------------------------------
// REGISTRY ENTRY
// ---------------------------------------------------------------------------

interface RegistryEntry {
  registration: InfrastructureProviderRegistration;
  registeredAt: string;
}

// ---------------------------------------------------------------------------
// INFRASTRUCTURE REGISTRY CLASS
// ---------------------------------------------------------------------------

/**
 * Registry for all infrastructure service providers.
 *
 * Usage:
 *   infrastructureRegistry.register({ metadata, tokenId });
 *   infrastructureRegistry.get('memory-cache');
 *   infrastructureRegistry.getHealthReport();
 *
 * Adding a new provider requires only calling register() — no business
 * logic changes, no existing code modifications.
 */
export class InfrastructureRegistry {
  private readonly entries = new Map<string, RegistryEntry>();
  private container: ServiceContainer | null = null;

  // ── Setup ──────────────────────────────────────────────────────────────────

  /**
   * Wire the registry to a DI ServiceContainer.
   * Call once during app initialization.
   */
  setContainer(c: ServiceContainer): void {
    this.container = c;
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register an infrastructure provider.
   *
   * This is the ONLY thing needed to add a new provider to the system.
   * No existing code requires modification.
   *
   * @example
   *   infrastructureRegistry.register({
   *     tokenId:  'CacheProvider',
   *     metadata: memoryCacheProvider.getMetadata(),
   *   });
   */
  register(registration: InfrastructureProviderRegistration): void {
    this.entries.set(registration.metadata.id, {
      registration,
      registeredAt: new Date().toISOString(),
    });
  }

  // ── Retrieval ──────────────────────────────────────────────────────────────

  /**
   * Get a registration by provider ID.
   */
  get(id: string): InfrastructureProviderRegistration | undefined {
    return this.entries.get(id)?.registration;
  }

  /**
   * Get all registered provider metadata.
   */
  getAll(): InfrastructureProviderRegistration[] {
    return Array.from(this.entries.values()).map(e => e.registration);
  }

  /**
   * Get metadata for a single provider.
   */
  getProviderMetadata(id: string): ProviderMetadata | undefined {
    return this.entries.get(id)?.registration.metadata;
  }

  /**
   * Get all provider metadata objects.
   */
  getAllMetadata(): ProviderMetadata[] {
    return Array.from(this.entries.values()).map(e => e.registration.metadata);
  }

  // ── Infrastructure Service List ────────────────────────────────────────────

  /**
   * Get all registered infrastructure services with their metadata.
   * Used by health manager and diagnostics.
   */
  getInfrastructureServices(): Array<InfrastructureProviderRegistration & { registeredAt: string }> {
    return Array.from(this.entries.values()).map(e => ({
      ...e.registration,
      registeredAt: e.registeredAt,
    }));
  }

  // ── Health Report ──────────────────────────────────────────────────────────

  /**
   * Generate a health summary across all registered providers.
   */
  getHealthReport(): {
    total: number;
    enabled: number;
    disabled: number;
    healthy: number;
    degraded: number;
    unavailable: number;
    unknown: number;
    providers: Array<{ id: string; status: string; enabled: boolean }>;
  } {
    const all = this.getAllMetadata();
    return {
      total:       all.length,
      enabled:     all.filter(p => p.enabled).length,
      disabled:    all.filter(p => !p.enabled).length,
      healthy:     all.filter(p => p.healthStatus === 'healthy').length,
      degraded:    all.filter(p => p.healthStatus === 'degraded').length,
      unavailable: all.filter(p => p.healthStatus === 'unavailable').length,
      unknown:     all.filter(p => p.healthStatus === 'unknown').length,
      providers:   all.map(p => ({ id: p.id, status: p.healthStatus, enabled: p.enabled })),
    };
  }

  // ── Dependency Graph ───────────────────────────────────────────────────────

  /**
   * Build a dependency graph for all registered providers.
   * Returns adjacency list: { providerId → [dependencyId, ...] }
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    Array.from(this.entries.values()).forEach(entry => {
      const { metadata } = entry.registration;
      graph[metadata.id] = metadata.dependencies;
    });
    return graph;
  }

  /**
   * Topological sort of providers by their declared dependencies.
   * Used by InfrastructureHealthManager to determine initialization order.
   * Providers with no dependencies are initialized first.
   */
  getInitializationOrder(): string[] {
    const graph = this.getDependencyGraph();
    const visited  = new Set<string>();
    const sorted: string[] = [];

    const visit = (id: string, path: Set<string>) => {
      if (path.has(id)) {
        // Circular dependency — skip gracefully
        return;
      }
      if (visited.has(id)) return;
      path.add(id);
      for (const dep of (graph[id] ?? [])) {
        visit(dep, path);
      }
      path.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    for (const id of Object.keys(graph)) {
      visit(id, new Set());
    }

    return sorted;
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /**
   * Check if a provider is registered by ID.
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Count registered providers.
   */
  count(): number {
    return this.entries.size;
  }

  /**
   * Get providers sorted by priority (lower number = higher priority).
   */
  getByPriority(): ProviderMetadata[] {
    return this.getAllMetadata().sort((a, b) => a.priority - b.priority);
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Global infrastructure registry singleton.
 * Import and call register() to add new infrastructure providers.
 */
export const infrastructureRegistry = new InfrastructureRegistry();
