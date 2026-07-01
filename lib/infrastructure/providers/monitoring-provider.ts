/**
 * lib/infrastructure/providers/monitoring-provider.ts
 *
 * Monitoring Provider — Interface + Console Implementation
 *
 * IMonitoringProvider: APM / metrics / error-tracking interface.
 * ConsoleMonitoringProvider: logs to console when ENABLE_MONITORING = false.
 *
 * Future provider (Phase 6D-2): DataDog / Sentry
 * Swap: register DataDogMonitoringProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// MONITORING TYPES
// ---------------------------------------------------------------------------

export interface MetricOptions {
  tags?: Record<string, string>;
  sampleRate?: number;
}

export interface SpanOptions {
  service?: string;
  resource?: string;
  tags?: Record<string, string>;
}

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  finish(error?: Error): void;
  setTag(key: string, value: unknown): void;
}

export interface ErrorContext {
  userId?: string;
  url?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IMonitoringProvider {
  getMetadata(): ProviderMetadata;
  increment(metric: string, value?: number, options?: MetricOptions): void;
  gauge(metric: string, value: number, options?: MetricOptions): void;
  histogram(metric: string, value: number, options?: MetricOptions): void;
  startSpan(name: string, options?: SpanOptions): TraceSpan;
  captureError(error: Error, context?: ErrorContext): void;
  setUser(userId: string, attributes?: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// CONSOLE IMPLEMENTATION
// ---------------------------------------------------------------------------

export class ConsoleMonitoringProvider implements IMonitoringProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'console-monitoring',
    displayName:    'Console Monitoring Provider',
    version:        '1.0.0',
    enabled:        true,
    dependencies:   [],
    priority:       0,
    healthStatus:   'healthy',
    capabilities:   ['metrics', 'tracing', 'errorTracking', 'userContext'],
    futureProvider: 'datadog',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  increment(metric: string, value = 1, options?: MetricOptions): void {
    if (process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[metrics] increment ${metric} +${value}`, options?.tags ?? {});
    }
  }

  gauge(metric: string, value: number, options?: MetricOptions): void {
    if (process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[metrics] gauge ${metric} = ${value}`, options?.tags ?? {});
    }
  }

  histogram(metric: string, value: number, options?: MetricOptions): void {
    if (process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[metrics] histogram ${metric} = ${value}`, options?.tags ?? {});
    }
  }

  startSpan(name: string, options?: SpanOptions): TraceSpan {
    const id        = Math.random().toString(36).slice(2);
    const startTime = Date.now();
    return {
      id,
      name,
      startTime,
      finish: (error?: Error) => {
        const duration = Date.now() - startTime;
        if (process.env['NODE_ENV'] === 'development') {
          // eslint-disable-next-line no-console
          console.debug(`[trace] ${name} ${duration}ms${error ? ` ERROR: ${error.message}` : ''}`, options);
        }
      },
      setTag: () => { /* no-op */ },
    };
  }

  captureError(error: Error, context?: ErrorContext): void {
    // eslint-disable-next-line no-console
    console.error('[monitoring] Error captured:', error.message, context ?? {});
  }

  setUser(_userId: string, _attributes?: Record<string, unknown>): void {
    // no-op for console implementation
  }
}

export const consoleMonitoringProvider = new ConsoleMonitoringProvider();
