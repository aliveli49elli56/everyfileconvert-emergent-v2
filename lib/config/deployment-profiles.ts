/**
 * lib/config/deployment-profiles.ts
 *
 * Phase 6D-1 Part 2 — Deployment Profiles
 *
 * Configuration profiles for Development, Preview, and Production environments.
 * Compatible with: Hetzner, Docker Compose, Kubernetes, Nginx, Caddy,
 *                  reverse proxy, horizontal scaling, multiple instances.
 *
 * Profile selection is automatic based on NODE_ENV and deployment signals.
 * All profiles default to browser-only mode (ENABLE_* all false).
 */

// ---------------------------------------------------------------------------
// DEPLOYMENT PROFILE TYPE
// ---------------------------------------------------------------------------

export type DeploymentProfileName = 'development' | 'preview' | 'production';

export interface DeploymentConfig {
  /** Profile name */
  name: DeploymentProfileName;
  /** Human-readable description */
  description: string;

  // ── Service Configuration ─────────────────────────────────────────────────
  /** Database connection URL (empty = memory mode) */
  databaseUrl: string;
  /** Redis connection URL (empty = memory mode) */
  redisUrl: string;
  /** Server provider API base URL (empty = browser-only) */
  serverProviderApiUrl: string;

  // ── Logging ───────────────────────────────────────────────────────────────
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Whether to log full request/response bodies */
  verboseLogging: boolean;

  // ── Performance ───────────────────────────────────────────────────────────
  /** Max concurrent server-side conversions (0 = unlimited) */
  maxConcurrentConversions: number;
  /** Response timeout in ms for server providers */
  serverProviderTimeoutMs: number;

  // ── Caching ───────────────────────────────────────────────────────────────
  /** Cache TTL for conversion results in seconds */
  conversionCacheTtlSeconds: number;
  /** Cache TTL for subscription data in seconds */
  subscriptionCacheTtlSeconds: number;

  // ── Deployment ────────────────────────────────────────────────────────────
  /** Number of application instances (for horizontal scaling) */
  instanceCount: number;
  /** Whether this deployment supports sticky sessions */
  stickySessions: boolean;
  /** Whether this deployment is behind a reverse proxy */
  behindProxy: boolean;

  // ── Feature Toggles ───────────────────────────────────────────────────────
  /** Show debug UI (error boundaries, provider info) */
  debugUi: boolean;
  /** Enable Next.js performance profiling */
  nextjsProfiling: boolean;

  // ── Kubernetes ────────────────────────────────────────────────────────────
  /** Kubernetes readiness probe path */
  readinessProbePath: string;
  /** Kubernetes liveness probe path */
  livenessProbePath: string;
}

// ---------------------------------------------------------------------------
// PROFILE DEFINITIONS
// ---------------------------------------------------------------------------

const DEVELOPMENT_PROFILE: DeploymentConfig = {
  name:                         'development',
  description:                  'Local development — npm run dev, no external services required',
  databaseUrl:                  '',
  redisUrl:                     '',
  serverProviderApiUrl:         '',
  logLevel:                     'debug',
  verboseLogging:               true,
  maxConcurrentConversions:     0,
  serverProviderTimeoutMs:      30000,
  conversionCacheTtlSeconds:    0,    // No caching in dev
  subscriptionCacheTtlSeconds:  0,
  instanceCount:                1,
  stickySessions:               false,
  behindProxy:                  false,
  debugUi:                      true,
  nextjsProfiling:              false,
  readinessProbePath:           '/en',
  livenessProbePath:            '/en',
};

const PREVIEW_PROFILE: DeploymentConfig = {
  name:                         'preview',
  description:                  'Preview / staging environment — Emergent preview or staging server',
  databaseUrl:                  typeof process !== 'undefined' ? (process.env['DATABASE_URL'] ?? '') : '',
  redisUrl:                     typeof process !== 'undefined' ? (process.env['REDIS_URL'] ?? '') : '',
  serverProviderApiUrl:         typeof process !== 'undefined' ? (process.env['SERVER_PROVIDER_API_URL'] ?? '') : '',
  logLevel:                     'info',
  verboseLogging:               false,
  maxConcurrentConversions:     10,
  serverProviderTimeoutMs:      60000,
  conversionCacheTtlSeconds:    300,
  subscriptionCacheTtlSeconds:  60,
  instanceCount:                1,
  stickySessions:               false,
  behindProxy:                  true,
  debugUi:                      false,
  nextjsProfiling:              false,
  readinessProbePath:           '/en',
  livenessProbePath:            '/en',
};

const PRODUCTION_PROFILE: DeploymentConfig = {
  name:                         'production',
  description:                  'Production — Hetzner / Docker Compose / Kubernetes',
  databaseUrl:                  typeof process !== 'undefined' ? (process.env['DATABASE_URL'] ?? '') : '',
  redisUrl:                     typeof process !== 'undefined' ? (process.env['REDIS_URL'] ?? '') : '',
  serverProviderApiUrl:         typeof process !== 'undefined' ? (process.env['SERVER_PROVIDER_API_URL'] ?? '') : '',
  logLevel:                     'warn',
  verboseLogging:               false,
  maxConcurrentConversions:     50,
  serverProviderTimeoutMs:      120000,
  conversionCacheTtlSeconds:    3600,
  subscriptionCacheTtlSeconds:  300,
  instanceCount:                typeof process !== 'undefined' ? parseInt(process.env['INSTANCE_COUNT'] ?? '1', 10) : 1,
  stickySessions:               false,   // Stateless — Redis/DB-backed sessions
  behindProxy:                  true,
  debugUi:                      false,
  nextjsProfiling:              false,
  readinessProbePath:           '/en',
  livenessProbePath:            '/en',
};

// ---------------------------------------------------------------------------
// PROFILE RESOLVER
// ---------------------------------------------------------------------------

function resolveDeploymentProfile(): DeploymentConfig {
  if (typeof process === 'undefined') return DEVELOPMENT_PROFILE;

  const env = process.env['NODE_ENV'];
  const deployEnv = process.env['DEPLOY_ENV'];

  if (deployEnv === 'production' || env === 'production') {
    return PRODUCTION_PROFILE;
  }
  if (deployEnv === 'preview' || process.env['EMERGENT_PREVIEW'] === 'true') {
    return PREVIEW_PROFILE;
  }
  return DEVELOPMENT_PROFILE;
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORTS
// ---------------------------------------------------------------------------

/**
 * Active deployment profile.
 * Resolved automatically from NODE_ENV and DEPLOY_ENV.
 */
export const DEPLOYMENT_PROFILE: DeploymentConfig = resolveDeploymentProfile();

/**
 * Explicitly get a deployment profile by name.
 * Useful for diagnostics and health reports.
 */
export function getDeploymentProfile(name: DeploymentProfileName): DeploymentConfig {
  switch (name) {
    case 'production':  return PRODUCTION_PROFILE;
    case 'preview':     return PREVIEW_PROFILE;
    default:            return DEVELOPMENT_PROFILE;
  }
}

/**
 * All profiles for reporting/diagnostics.
 */
export const ALL_DEPLOYMENT_PROFILES: Record<DeploymentProfileName, DeploymentConfig> = {
  development: DEVELOPMENT_PROFILE,
  preview:     PREVIEW_PROFILE,
  production:  PRODUCTION_PROFILE,
};
