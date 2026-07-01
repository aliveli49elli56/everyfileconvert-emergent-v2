/**
 * lib/config/infrastructure-config.ts
 *
 * Phase 6D-1 — Infrastructure Configuration
 * Updated: Phase 6D-1 Part 2 (added ENABLE_SERVER_PROVIDERS, ENABLE_DOCKER, ENABLE_MONITORING)
 *
 * Single source of truth for all infrastructure feature flags.
 * All ENABLE_* flags are false in development/browser mode.
 *
 * Rules:
 *   - When a flag is false, the corresponding service automatically falls
 *     back to its Memory/Stub/Browser implementation.
 *   - The application MUST function identically with all flags false.
 *   - Flip to true only when the real provider is wired in Phase 6D-2+.
 *   - No business logic outside this file may check raw env vars for
 *     infrastructure decisions — always read from INFRASTRUCTURE_CONFIG.
 *
 * Browser mode preservation:
 *   All flags false → every provider uses Memory/Browser defaults →
 *   app behaves exactly as it did before Phase 6D.
 *
 * Docker is OPTIONAL. The application runs perfectly with npm run dev.
 */

// ---------------------------------------------------------------------------
// INFRASTRUCTURE CONFIG TYPE
// ---------------------------------------------------------------------------

export interface InfrastructureConfig {
  // ── Phase 6D-1 Part 1 flags ───────────────────────────────────────────────
  /** Enable real Auth provider (Auth.js / Clerk). false = StubAuthProvider */
  ENABLE_AUTH: boolean;
  /** Enable real Payment provider (Stripe / PayPal). false = StubPaymentProvider */
  ENABLE_PAYMENTS: boolean;
  /** Enable real Database provider (PostgreSQL / Supabase). false = MemoryDatabaseProvider */
  ENABLE_DB: boolean;
  /** Enable real Cache provider (Redis). false = MemoryCacheProvider */
  ENABLE_REDIS: boolean;
  /** Enable real Search provider (Elasticsearch). false = StubSearchProvider */
  ENABLE_SEARCH: boolean;
  /** Enable real AI provider (OpenAI). false = StubAIProvider */
  ENABLE_AI: boolean;
  /** Enable real CDN provider (Cloudflare). false = StubCDNProvider */
  ENABLE_CDN: boolean;
  /** Enable real Queue provider (BullMQ/Redis). false = MemoryQueueProvider */
  ENABLE_QUEUE: boolean;
  /** Enable real Storage provider (S3/MinIO). false = BrowserStorageProvider */
  ENABLE_STORAGE: boolean;
  /** Enable real Notification provider (SendGrid). false = StubNotificationProvider */
  ENABLE_NOTIFICATIONS: boolean;

  // ── Phase 6D-1 Part 2 flags ───────────────────────────────────────────────
  /**
   * Enable server-side processing providers (FFmpeg, LibreOffice, Sharp, etc.).
   * false = All server providers return StubServerProvider (browser mode only).
   * true = Routes eligible conversions to server providers via HybridProviderResolver.
   */
  ENABLE_SERVER_PROVIDERS: boolean;
  /**
   * Enable Docker-based deployment infrastructure.
   * Does NOT affect application functionality — purely signals Docker runtime.
   * Application continues running identically with npm run dev when false.
   */
  ENABLE_DOCKER: boolean;
  /**
   * Enable full monitoring integration (DataDog, Sentry, etc.).
   * false = ConsoleMonitoringProvider (logs to console in dev).
   */
  ENABLE_MONITORING: boolean;
  /**
   * Enable local file system storage (Node.js fs-based).
   * false = BrowserStorageProvider (in-memory, browser-safe).
   */
  ENABLE_LOCAL_STORAGE: boolean;
}

// ---------------------------------------------------------------------------
// RUNTIME CONFIG RESOLVER
// ---------------------------------------------------------------------------

/**
 * Reads ENABLE_* flags from environment variables.
 * Missing vars default to false — this is intentional for dev/browser mode.
 * No application startup failure on missing infrastructure env vars.
 */
function resolveInfrastructureConfig(): InfrastructureConfig {
  const flag = (envVar: string): boolean => {
    if (typeof process === 'undefined') return false;
    return process.env[envVar] === 'true';
  };

  return {
    // Part 1 flags (unchanged)
    ENABLE_AUTH:             flag('NEXT_PUBLIC_ENABLE_AUTH'),
    ENABLE_PAYMENTS:         flag('NEXT_PUBLIC_ENABLE_PAYMENTS'),
    ENABLE_DB:               flag('NEXT_PUBLIC_ENABLE_DB'),
    ENABLE_REDIS:            flag('NEXT_PUBLIC_ENABLE_REDIS'),
    ENABLE_SEARCH:           flag('NEXT_PUBLIC_ENABLE_SEARCH'),
    ENABLE_AI:               flag('NEXT_PUBLIC_ENABLE_AI'),
    ENABLE_CDN:              flag('NEXT_PUBLIC_ENABLE_CDN'),
    ENABLE_QUEUE:            flag('NEXT_PUBLIC_ENABLE_QUEUE'),
    ENABLE_STORAGE:          flag('NEXT_PUBLIC_ENABLE_STORAGE'),
    ENABLE_NOTIFICATIONS:    flag('NEXT_PUBLIC_ENABLE_NOTIFICATIONS'),
    // Part 2 flags (new)
    ENABLE_SERVER_PROVIDERS: flag('NEXT_PUBLIC_ENABLE_SERVER_PROVIDERS'),
    ENABLE_DOCKER:           flag('NEXT_PUBLIC_ENABLE_DOCKER'),
    ENABLE_MONITORING:       flag('NEXT_PUBLIC_ENABLE_MONITORING'),
    ENABLE_LOCAL_STORAGE:    flag('NEXT_PUBLIC_ENABLE_LOCAL_STORAGE'),
  };
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Application-wide infrastructure configuration.
 * All flags are false unless the corresponding NEXT_PUBLIC_ENABLE_* env var
 * is set to 'true'.
 *
 * @example
 *   import { INFRASTRUCTURE_CONFIG } from '@/lib/config/infrastructure-config';
 *   if (INFRASTRUCTURE_CONFIG.ENABLE_REDIS) { ... } else { // use MemoryCacheProvider }
 */
export const INFRASTRUCTURE_CONFIG: InfrastructureConfig = resolveInfrastructureConfig();

// ---------------------------------------------------------------------------
// CONVENIENCE HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns true only when ALL infrastructure services are disabled.
 * Represents pure browser/memory mode — the current default.
 */
export function isBrowserOnlyMode(): boolean {
  return Object.values(INFRASTRUCTURE_CONFIG).every(v => !v);
}

/**
 * Returns a human-readable summary of enabled infrastructure services.
 * Used in health reports and diagnostic output.
 */
export function getEnabledInfrastructureServices(): string[] {
  return (Object.entries(INFRASTRUCTURE_CONFIG) as [string, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => key.replace('ENABLE_', ''));
}

/**
 * Returns the count of enabled infrastructure services.
 */
export function getEnabledInfrastructureCount(): number {
  return Object.values(INFRASTRUCTURE_CONFIG).filter(Boolean).length;
}

/**
 * Returns true when any server-side processing is enabled.
 */
export function isServerProcessingEnabled(): boolean {
  return INFRASTRUCTURE_CONFIG.ENABLE_SERVER_PROVIDERS;
}

/**
 * Returns the server provider API URL from environment.
 * Only relevant when ENABLE_SERVER_PROVIDERS = true.
 */
export function getServerProviderApiUrl(): string {
  if (typeof process === 'undefined') return '';
  return (process.env['SERVER_PROVIDER_API_URL'] as string | undefined) ?? '';
}
