/**
 * lib/engine/feature-flag-engine.ts
 *
 * Phase 6D-1 — Infrastructure Feature Flag Engine
 *
 * EXTENDS the existing lib/config/feature-flags.ts pattern without modifying it.
 * The existing FeatureFlagEngine handles product/subscription feature flags.
 * This engine handles INFRASTRUCTURE feature flags (ENABLE_AUTH, ENABLE_REDIS, etc.)
 *
 * Rules:
 *   - Does not modify, replace, or re-export from feature-flags.ts
 *   - Reads infrastructure flags from infrastructure-config.ts
 *   - Supports runtime override for testing and gradual rollout
 *   - All infrastructure flags default to false (browser mode)
 */

import {
  INFRASTRUCTURE_CONFIG,
  type InfrastructureConfig,
} from '../config/infrastructure-config';

// ---------------------------------------------------------------------------
// INFRASTRUCTURE FLAG TYPE
// ---------------------------------------------------------------------------

export type InfrastructureFlag = keyof InfrastructureConfig;

export interface InfrastructureFlagEvaluation {
  flag: InfrastructureFlag;
  enabled: boolean;
  source: 'config' | 'override' | 'default';
  fallback: string;
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

/**
 * Evaluates infrastructure feature flags at runtime.
 * Supports temporary overrides (for testing / gradual rollout).
 *
 * @example
 *   import { infrastructureFlagEngine } from '@/lib/engine/feature-flag-engine';
 *   if (infrastructureFlagEngine.isEnabled('ENABLE_REDIS')) {
 *     // use Redis
 *   } else {
 *     // use MemoryCacheProvider
 *   }
 */
export class InfrastructureFeatureFlagEngine {
  private overrides = new Map<InfrastructureFlag, boolean>();

  /** Fallback description when a flag is disabled */
  private readonly fallbackMap: Record<InfrastructureFlag, string> = {
    ENABLE_AUTH:             'StubAuthProvider (no auth)',
    ENABLE_PAYMENTS:         'StubPaymentProvider (no payments)',
    ENABLE_DB:               'MemoryDatabaseProvider',
    ENABLE_REDIS:            'MemoryCacheProvider',
    ENABLE_SEARCH:           'StubSearchProvider',
    ENABLE_AI:               'StubAIProvider',
    ENABLE_CDN:              'StubCDNProvider',
    ENABLE_QUEUE:            'MemoryQueueProvider',
    ENABLE_STORAGE:          'BrowserStorageProvider',
    ENABLE_NOTIFICATIONS:    'StubNotificationProvider',
    ENABLE_SERVER_PROVIDERS: 'StubServerProvider (browser-only mode)',
    ENABLE_DOCKER:           'Direct process (no Docker)',
    ENABLE_MONITORING:       'ConsoleMonitoringProvider',
    ENABLE_LOCAL_STORAGE:    'BrowserStorageProvider',
  };

  // ── Evaluation ─────────────────────────────────────────────────────────────

  /**
   * Returns true if the infrastructure flag is enabled.
   * Override takes precedence over config value.
   */
  isEnabled(flag: InfrastructureFlag): boolean {
    if (this.overrides.has(flag)) {
      return this.overrides.get(flag)!;
    }
    return INFRASTRUCTURE_CONFIG[flag];
  }

  /**
   * Full evaluation with source tracking (for diagnostics).
   */
  evaluate(flag: InfrastructureFlag): InfrastructureFlagEvaluation {
    if (this.overrides.has(flag)) {
      return {
        flag,
        enabled:  this.overrides.get(flag)!,
        source:   'override',
        fallback: this.fallbackMap[flag],
      };
    }
    const enabled = INFRASTRUCTURE_CONFIG[flag];
    return {
      flag,
      enabled,
      source:   enabled ? 'config' : 'default',
      fallback: this.fallbackMap[flag],
    };
  }

  /**
   * Evaluate all flags and return the full report.
   * Used by InfrastructureHealthManager for diagnostics.
   */
  evaluateAll(): InfrastructureFlagEvaluation[] {
    return (Object.keys(INFRASTRUCTURE_CONFIG) as InfrastructureFlag[]).map(
      flag => this.evaluate(flag),
    );
  }

  // ── Override (Testing / Gradual Rollout) ───────────────────────────────────

  /**
   * Temporarily override a flag at runtime.
   * Useful for A/B testing, gradual rollout, or integration tests.
   */
  override(flag: InfrastructureFlag, value: boolean): void {
    this.overrides.set(flag, value);
  }

  /** Remove a runtime override and revert to config value. */
  clearOverride(flag: InfrastructureFlag): void {
    this.overrides.delete(flag);
  }

  /** Remove all runtime overrides. */
  clearAllOverrides(): void {
    this.overrides.clear();
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /** List all currently enabled infrastructure flags. */
  getEnabledFlags(): InfrastructureFlag[] {
    return (Object.keys(INFRASTRUCTURE_CONFIG) as InfrastructureFlag[]).filter(
      flag => this.isEnabled(flag),
    );
  }

  /** List all currently disabled infrastructure flags (using memory fallbacks). */
  getDisabledFlags(): InfrastructureFlag[] {
    return (Object.keys(INFRASTRUCTURE_CONFIG) as InfrastructureFlag[]).filter(
      flag => !this.isEnabled(flag),
    );
  }
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

export const infrastructureFlagEngine = new InfrastructureFeatureFlagEngine();

// Convenience export
export function isInfrastructureEnabled(flag: InfrastructureFlag): boolean {
  return infrastructureFlagEngine.isEnabled(flag);
}
