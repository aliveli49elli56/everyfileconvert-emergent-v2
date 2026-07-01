/**
 * lib/infrastructure/types.ts
 *
 * Phase 6D-1 — Shared Infrastructure Types
 *
 * Defines ProviderMetadata and related types used across all infrastructure
 * providers. Every infrastructure provider MUST implement ProviderMetadata.
 *
 * This metadata will be used by:
 *   - InfrastructureRegistry (provider catalog)
 *   - InfrastructureHealthManager (health reports)
 *   - Future monitoring, diagnostics, and deployment systems
 */

// ---------------------------------------------------------------------------
// PROVIDER HEALTH STATUS
// ---------------------------------------------------------------------------

export type ProviderHealthStatus =
  | 'healthy'       // Provider is running and responding normally
  | 'degraded'      // Provider is running but with reduced performance
  | 'unavailable'   // Provider is unreachable or erroring
  | 'unknown';      // Health has not been checked yet (default for stubs)

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

/**
 * Standardized metadata interface that every infrastructure provider must expose.
 *
 * This metadata drives:
 *   - Registry cataloging
 *   - Health reporting
 *   - Dependency ordering during initialization
 *   - Future monitoring dashboards
 *   - Deployment readiness checks
 */
export interface ProviderMetadata {
  /** Unique identifier for this provider (kebab-case, e.g. 'memory-cache') */
  id: string;
  /** Human-readable display name (e.g. 'Memory Cache Provider') */
  displayName: string;
  /** Semantic version of this provider implementation */
  version: string;
  /**
   * Whether this provider is currently active.
   * Tied to the corresponding ENABLE_* flag in InfrastructureConfig.
   */
  enabled: boolean;
  /**
   * IDs of other providers this one depends on.
   * Used for initialization ordering (topological sort).
   * Empty for most stubs — set for real providers in Phase 6D-2+.
   */
  dependencies: string[];
  /**
   * Priority for initialization order when dependencies are equal.
   * Lower number = initialized earlier. Range: 0–100.
   */
  priority: number;
  /** Current health status (updated by InfrastructureHealthManager) */
  healthStatus: ProviderHealthStatus;
  /**
   * List of capabilities this provider exposes.
   * Used for feature discovery and compatibility checks.
   * @example ['authenticate', 'createSession', 'validateToken']
   */
  capabilities: string[];
  /**
   * Identifier of the real provider this stub will be replaced by in Phase 6D-2+.
   * null if this IS the real provider (e.g. ConsoleLogger has no future provider).
   * @example 'stripe', 'redis', 'postgres', 'auth.js', null
   */
  futureProvider: string | null;
}

// ---------------------------------------------------------------------------
// PROVIDER REGISTRATION (for InfrastructureRegistry)
// ---------------------------------------------------------------------------

/**
 * A provider plus its associated ServiceToken for DI container lookup.
 */
export interface InfrastructureProviderRegistration {
  metadata: ProviderMetadata;
  /** String token ID matching the ServiceToken used in the DI container */
  tokenId: string;
}

// ---------------------------------------------------------------------------
// HEALTH REPORT TYPES
// ---------------------------------------------------------------------------

export interface ProviderHealthCheck {
  providerId: string;
  displayName: string;
  status: ProviderHealthStatus;
  enabled: boolean;
  capabilities: string[];
  futureProvider: string | null;
  checkedAt: string;
  latencyMs?: number;
  error?: string;
}

export interface InfrastructureHealthReport {
  /** Overall health: healthy if all enabled providers are healthy */
  overallStatus: ProviderHealthStatus;
  /** ISO timestamp of when this report was generated */
  generatedAt: string;
  /** Total providers registered */
  totalProviders: number;
  /** Number of enabled (real) providers */
  enabledProviders: number;
  /** Number of stub/memory fallback providers */
  stubProviders: number;
  /** Per-provider health checks */
  providers: ProviderHealthCheck[];
  /** Whether running in pure browser/memory mode */
  isBrowserOnlyMode: boolean;
}

// ---------------------------------------------------------------------------
// LIFECYCLE EVENTS
// ---------------------------------------------------------------------------

export type InfrastructureLifecycleEvent =
  | 'initializing'
  | 'initialized'
  | 'health-check'
  | 'degraded'
  | 'shutting-down'
  | 'shutdown';

export interface InfrastructureLifecycleCallback {
  (event: InfrastructureLifecycleEvent, metadata?: unknown): void;
}
