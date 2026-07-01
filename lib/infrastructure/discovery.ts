/**
 * lib/infrastructure/discovery.ts
 *
 * Phase 6D-1 Part 2 — Infrastructure Provider Auto-Discovery
 *
 * Allows infrastructure providers to self-register during initialization.
 * Adding a new provider requires ONLY a registration call — no other code changes.
 *
 * Works in conjunction with:
 *   - ServiceContainer (DI)
 *   - InfrastructureRegistry (Part 1)
 *   - ServerProviderRegistry (Part 2)
 */

import type { ProviderMetadata } from './types';
import type { ServiceContainer } from '../di/service-container';
import type { ServiceToken } from '../di/service-registration';
import type { ServiceScope, ServiceRegistrationMetadata } from '../di/service-registration';

// ---------------------------------------------------------------------------
// PROVIDER DESCRIPTOR
// ---------------------------------------------------------------------------

export interface ProviderDescriptor<T = unknown> {
  /** Unique provider ID (matches ProviderMetadata.id) */
  id: string;
  /** DI token for container registration */
  token: ServiceToken<T>;
  /** Factory function */
  factory: (container: ServiceContainer) => T;
  /** DI scope */
  scope: ServiceScope;
  /** Registration metadata */
  metadata: ServiceRegistrationMetadata;
  /** Infrastructure metadata (health, capabilities, etc.) */
  providerMetadata: ProviderMetadata;
  /** Target registry: 'infrastructure' | 'server' */
  registry: 'infrastructure' | 'server';
  /** Whether to auto-initialize on discovery */
  autoInitialize: boolean;
}

// ---------------------------------------------------------------------------
// DISCOVERY ENGINE
// ---------------------------------------------------------------------------

export class InfrastructureProviderDiscovery {
  private readonly descriptors = new Map<string, ProviderDescriptor<unknown>>();
  private container: ServiceContainer | null = null;
  private discovered = false;

  // ── Setup ──────────────────────────────────────────────────────────────────

  setContainer(c: ServiceContainer): void {
    this.container = c;
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a provider for auto-discovery.
   * This is the ONLY call needed to add a provider to the system.
   * No existing business logic needs modification.
   *
   * @example
   *   providerDiscovery.register({
   *     id:               'my-provider',
   *     token:            MY_PROVIDER_TOKEN,
   *     factory:          () => new MyProvider(),
   *     scope:            'singleton',
   *     metadata:         { name: 'MyProvider', isInfrastructure: true },
   *     providerMetadata: myProvider.getMetadata(),
   *     registry:         'infrastructure',
   *     autoInitialize:   false,
   *   });
   */
  register<T>(descriptor: ProviderDescriptor<T>): void {
    this.descriptors.set(descriptor.id, descriptor as ProviderDescriptor<unknown>);
  }

  // ── Discovery ──────────────────────────────────────────────────────────────

  /**
   * Discover and register all registered providers into the DI container
   * and appropriate registries.
   *
   * Called automatically by InfrastructureHealthManager.initialize().
   * Safe to call multiple times — idempotent.
   */
  async discoverAll(): Promise<{ registered: string[]; skipped: string[] }> {
    if (this.discovered || !this.container) {
      return { registered: [], skipped: Array.from(this.descriptors.keys()) };
    }

    const registered: string[] = [];
    const skipped:    string[] = [];

    for (const [id, descriptor] of Array.from(this.descriptors.entries())) {
      try {
        // Register in DI container if not already registered
        if (!this.container.has(descriptor.token as ServiceToken<unknown>)) {
          this.container.register({
            token:    descriptor.token as ServiceToken<unknown>,
            factory:  descriptor.factory,
            scope:    descriptor.scope,
            metadata: descriptor.metadata,
          });
        }

        // Register in appropriate registry
        if (descriptor.registry === 'infrastructure') {
          const { infrastructureRegistry } = require('../registry/infrastructure-registry');
          infrastructureRegistry.register({
            tokenId:  descriptor.token.id,
            metadata: descriptor.providerMetadata,
          });
        } else if (descriptor.registry === 'server') {
          // Server provider registry is handled separately
        }

        registered.push(id);
      } catch {
        skipped.push(id);
      }
    }

    this.discovered = true;
    return { registered, skipped };
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /** List all registered provider descriptors. */
  list(): ProviderDescriptor<unknown>[] {
    return Array.from(this.descriptors.values());
  }

  /** Get a descriptor by ID. */
  get(id: string): ProviderDescriptor<unknown> | undefined {
    return this.descriptors.get(id);
  }

  /** Count registered descriptors. */
  count(): number {
    return this.descriptors.size;
  }

  /** Reset discovery state (for testing). */
  reset(): void {
    this.discovered = false;
  }
}

// ---------------------------------------------------------------------------
// SINGLETON
// ---------------------------------------------------------------------------

export const providerDiscovery = new InfrastructureProviderDiscovery();
