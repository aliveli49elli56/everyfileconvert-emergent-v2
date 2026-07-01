/**
 * lib/config/environment.ts
 *
 * Phase 6D-1 — Typed Application Environment Layer
 *
 * Single typed interface for all environment variables consumed by the app.
 *
 * Rules:
 *   - Missing variables in development MUST NOT crash the application.
 *     They fall back to safe development defaults.
 *   - Required variables in production should be validated at deploy time,
 *     not at module import time (to preserve SSR/build compatibility).
 *   - No business logic reads process.env directly — always import from here.
 *   - All NEXT_PUBLIC_* vars are safe for client-side use.
 *   - Server-only vars (no NEXT_PUBLIC_ prefix) are undefined in the browser.
 */

// ---------------------------------------------------------------------------
// ENVIRONMENT TYPES
// ---------------------------------------------------------------------------

export type AppEnvironmentName = 'development' | 'production' | 'test';

export interface AppEnvironment {
  // ── Runtime ────────────────────────────────────────────────────────────────
  /** Current environment name */
  NODE_ENV: AppEnvironmentName;
  /** Whether running in a browser context */
  isBrowser: boolean;
  /** Whether running in a server/SSR context */
  isServer: boolean;

  // ── Application URLs ───────────────────────────────────────────────────────
  /** Public-facing app URL (e.g. https://everyfileconvert.com) */
  APP_URL: string;
  /** App origin for WASM/asset loading (derived from APP_URL or window.location) */
  APP_ORIGIN: string;

  // ── Infrastructure Flags (mirrors InfrastructureConfig) ────────────────────
  ENABLE_AUTH: boolean;
  ENABLE_PAYMENTS: boolean;
  ENABLE_DB: boolean;
  ENABLE_REDIS: boolean;
  ENABLE_SEARCH: boolean;
  ENABLE_AI: boolean;
  ENABLE_CDN: boolean;
  ENABLE_QUEUE: boolean;
  ENABLE_STORAGE: boolean;
  ENABLE_NOTIFICATIONS: boolean;

  // ── Instrumentation ────────────────────────────────────────────────────────
  /** Analytics measurement ID (e.g. Google Analytics) */
  ANALYTICS_ID: string | undefined;
  /** Sentry DSN for error tracking */
  SENTRY_DSN: string | undefined;
}

// ---------------------------------------------------------------------------
// RESOLVER
// ---------------------------------------------------------------------------

function getEnv(key: string, defaultValue?: string): string | undefined {
  if (typeof process === 'undefined') return defaultValue;
  return process.env[key] ?? defaultValue;
}

function getBoolEnv(key: string): boolean {
  return getEnv(key) === 'true';
}

function resolveAppUrl(): string {
  const configured = getEnv('NEXT_PUBLIC_APP_URL');
  if (configured) return configured;
  // Browser fallback: use window.location.origin
  if (typeof window !== 'undefined') return window.location.origin;
  // SSR fallback: localhost for dev
  return 'http://localhost:3000';
}

function resolveEnvironment(): AppEnvironment {
  const rawNode = getEnv('NODE_ENV', 'development') as AppEnvironmentName;
  const appUrl  = resolveAppUrl();

  return {
    // Runtime
    NODE_ENV:  rawNode,
    isBrowser: typeof window !== 'undefined',
    isServer:  typeof window === 'undefined',

    // URLs
    APP_URL:    appUrl,
    APP_ORIGIN: appUrl,

    // Infrastructure flags — all default to false (browser mode)
    ENABLE_AUTH:          getBoolEnv('NEXT_PUBLIC_ENABLE_AUTH'),
    ENABLE_PAYMENTS:      getBoolEnv('NEXT_PUBLIC_ENABLE_PAYMENTS'),
    ENABLE_DB:            getBoolEnv('NEXT_PUBLIC_ENABLE_DB'),
    ENABLE_REDIS:         getBoolEnv('NEXT_PUBLIC_ENABLE_REDIS'),
    ENABLE_SEARCH:        getBoolEnv('NEXT_PUBLIC_ENABLE_SEARCH'),
    ENABLE_AI:            getBoolEnv('NEXT_PUBLIC_ENABLE_AI'),
    ENABLE_CDN:           getBoolEnv('NEXT_PUBLIC_ENABLE_CDN'),
    ENABLE_QUEUE:         getBoolEnv('NEXT_PUBLIC_ENABLE_QUEUE'),
    ENABLE_STORAGE:       getBoolEnv('NEXT_PUBLIC_ENABLE_STORAGE'),
    ENABLE_NOTIFICATIONS: getBoolEnv('NEXT_PUBLIC_ENABLE_NOTIFICATIONS'),

    // Instrumentation — optional, undefined if not set
    ANALYTICS_ID: getEnv('NEXT_PUBLIC_ANALYTICS_ID'),
    SENTRY_DSN:   getEnv('NEXT_PUBLIC_SENTRY_DSN'),
  };
}

// ---------------------------------------------------------------------------
// SINGLETON EXPORT
// ---------------------------------------------------------------------------

/**
 * Typed application environment.
 * Import this instead of reading process.env directly anywhere in the app.
 *
 * @example
 *   import { APP_ENV } from '@/lib/config/environment';
 *   const origin = APP_ENV.APP_ORIGIN;
 *   const isDev  = APP_ENV.NODE_ENV === 'development';
 */
export const APP_ENV: AppEnvironment = resolveEnvironment();

// ---------------------------------------------------------------------------
// CONVENIENCE HELPERS
// ---------------------------------------------------------------------------

export const isDevelopment = (): boolean => APP_ENV.NODE_ENV === 'development';
export const isProduction  = (): boolean => APP_ENV.NODE_ENV === 'production';
export const isTest        = (): boolean => APP_ENV.NODE_ENV === 'test';
export const isBrowser     = (): boolean => typeof window !== 'undefined';
export const isServer      = (): boolean => typeof window === 'undefined';
