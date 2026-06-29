/**
 * lib/services/analytics-service.ts
 * Analytics tracking service
 */

import type { AnalyticsEvent } from '../types/services';

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  endpoint?: string;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 20,
  flushInterval: 10000, // 10 seconds
};

// ---------------------------------------------------------------------------
// ANALYTICS SERVICE
// ---------------------------------------------------------------------------

class AnalyticsService {
  private config: AnalyticsConfig;
  private queue: AnalyticsEvent[];
  private sessionId: string;
  private flushTimer: ReturnType<typeof setInterval> | null;
  private userId: string | null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.flushTimer = null;
    this.userId = null;

    if (typeof window !== 'undefined') {
      this.startFlushTimer();
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Track an event
   */
  track(
    name: string,
    category: AnalyticsEvent['category'],
    properties: Record<string, unknown> = {}
  ): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId ?? undefined,
      locale: typeof document !== 'undefined' ? document.documentElement.lang : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };

    this.queue.push(event);

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track conversion event
   */
  trackConversion(
    sourceFormat: string,
    targetFormat: string,
    success: boolean,
    duration?: number,
    provider?: string
  ): void {
    this.track('conversion', 'conversion', {
      sourceFormat,
      targetFormat,
      success,
      duration,
      provider,
    });
  }

  /**
   * Track error event
   */
  trackError(
    code: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.track('error', 'error', {
      code,
      message,
      ...context,
    });
  }

  /**
   * Track navigation event
   */
  trackNavigation(path: string, locale: string): void {
    this.track('page_view', 'navigation', {
      path,
      locale,
    });
  }

  /**
   * Track engagement event
   */
  trackEngagement(
    action: string,
    element: string,
    value?: number
  ): void {
    this.track('engagement', 'engagement', {
      action,
      element,
      value,
    });
  }

  /**
   * Track monetization event
   */
  trackMonetization(
    type: 'ad_impression' | 'ad_click' | 'premium_start' | 'premium_upgrade',
    unit: string,
    value?: number
  ): void {
    this.track('monetization', 'monetization', {
      type,
      unit,
      value,
    });
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // For now, log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics]', events);
      }

      // Send to analytics endpoint if configured
      if (this.config.endpoint) {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      }

      // Also push to dataLayer for GTM if available
      if (typeof window !== 'undefined' && 'dataLayer' in window) {
        for (const event of events) {
          (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
            event: event.name,
            ...event.properties,
            sessionId: event.sessionId,
          });
        }
      }

    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const analyticsService = new AnalyticsService();
