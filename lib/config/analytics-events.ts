/**
 * lib/config/analytics-events.ts
 * Analytics Event Registry - defines all analytics events for the platform
 *
 * Events: upload, validation_success, conversion_start, download, etc.
 */

import type { UserTier } from '../types/services';
import type { FormatCategory } from '../types/formats';
import type { ToolType } from '../registry/tool-identity-registry';

// ---------------------------------------------------------------------------
// EVENT TYPES
// ---------------------------------------------------------------------------

export type AnalyticsEventCategory =
  | 'conversion'
  | 'upload'
  | 'download'
  | 'viewing'
  | 'editing'
  | 'navigation'
  | 'search'
  | 'user'
  | 'system'
  | 'error'
  | 'performance'
  | 'monetization';

export type AnalyticsEventAction =
  | 'upload'
  | 'validate_success'
  | 'validate_failure'
  | 'conversion_start'
  | 'conversion_progress'
  | 'conversion_success'
  | 'conversion_failure'
  | 'conversion_cancel'
  | 'download'
  | 'preview'
  | 'view'
  | 'search'
  | 'click'
  | 'navigate'
  | 'signup'
  | 'login'
  | 'logout'
  | 'upgrade'
  | 'error'
  | 'warning'
  | 'batch_start'
  | 'batch_complete'
  | 'share'
  | 'bookmark'
  | 'feedback';

// ---------------------------------------------------------------------------
// EVENT DEFINITIONS
// ---------------------------------------------------------------------------

export interface AnalyticsEventDefinition {
  name: string;
  category: AnalyticsEventCategory;
  action: AnalyticsEventAction;
  description: string;
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    description: string;
  }>;
  trackOn: 'client' | 'server' | 'both';
  priority: 'critical' | 'high' | 'medium' | 'low';
  sampling?: number; // 0-100 percentage
}

export const ANALYTICS_EVENTS: Record<string, AnalyticsEventDefinition> = {
  // ── Upload Events ──────────────────────────────────────────────────────────
  upload_start: {
    name: 'upload_start',
    category: 'upload',
    action: 'upload',
    description: 'File upload started',
    parameters: {
      fileSize: { type: 'number', required: true, description: 'File size in bytes' },
      fileName: { type: 'string', required: false, description: 'Original filename' },
      fileExtension: { type: 'string', required: true, description: 'File extension' },
      fileType: { type: 'string', required: true, description: 'MIME type' },
      source: { type: 'string', required: true, description: 'Upload source (drag-drop, file-picker, url)' },
      batchId: { type: 'string', required: false, description: 'Batch ID if part of batch' },
    },
    trackOn: 'both',
    priority: 'high',
  },
  upload_complete: {
    name: 'upload_complete',
    category: 'upload',
    action: 'upload',
    description: 'File upload completed',
    parameters: {
      fileSize: { type: 'number', required: true, description: 'File size in bytes' },
      duration: { type: 'number', required: true, description: 'Upload duration in ms' },
      success: { type: 'boolean', required: true, description: 'Upload succeeded' },
    },
    trackOn: 'both',
    priority: 'high',
  },

  // ── Validation Events ─────────────────────────────────────────────────────
  validate_success: {
    name: 'validate_success',
    category: 'conversion',
    action: 'validate_success',
    description: 'File validation successful',
    parameters: {
      fileExtension: { type: 'string', required: true, description: 'File extension' },
      detectedFormat: { type: 'string', required: false, description: 'Detected actual format' },
      signatureValid: { type: 'boolean', required: false, description: 'File signature matched extension' },
    },
    trackOn: 'both',
    priority: 'medium',
  },
  validate_failure: {
    name: 'validate_failure',
    category: 'error',
    action: 'validate_failure',
    description: 'File validation failed',
    parameters: {
      fileExtension: { type: 'string', required: true, description: 'File extension' },
      errorCode: { type: 'string', required: true, description: 'Error code' },
      errorMessage: { type: 'string', required: true, description: 'Error message' },
    },
    trackOn: 'both',
    priority: 'high',
  },

  // ── Conversion Events ──────────────────────────────────────────────────────
  conversion_start: {
    name: 'conversion_start',
    category: 'conversion',
    action: 'conversion_start',
    description: 'Conversion started',
    parameters: {
      jobId: { type: 'string', required: true, description: 'Unique job ID' },
      sourceFormat: { type: 'string', required: true, description: 'Source format' },
      targetFormat: { type: 'string', required: true, description: 'Target format' },
      fileSize: { type: 'number', required: true, description: 'File size in bytes' },
      provider: { type: 'string', required: true, description: 'Conversion provider' },
      toolId: { type: 'string', required: true, description: 'Tool identity ID' },
      slug: { type: 'string', required: true, description: 'URL slug' },
      category: { type: 'string', required: true, description: 'Format category' },
      isPremium: { type: 'boolean', required: true, description: 'Premium conversion' },
      isBatch: { type: 'boolean', required: false, description: 'Part of batch' },
      options: { type: 'object', required: false, description: 'Conversion options' },
    },
    trackOn: 'both',
    priority: 'critical',
  },
  conversion_progress: {
    name: 'conversion_progress',
    category: 'conversion',
    action: 'conversion_progress',
    description: 'Conversion progress update',
    parameters: {
      jobId: { type: 'string', required: true, description: 'Job ID' },
      progress: { type: 'number', required: true, description: 'Progress percentage' },
      stage: { type: 'string', required: true, description: 'Current stage' },
    },
    trackOn: 'client',
    priority: 'low',
    sampling: 10, // Only track 10% of progress events
  },
  conversion_success: {
    name: 'conversion_success',
    category: 'conversion',
    action: 'conversion_success',
    description: 'Conversion completed successfully',
    parameters: {
      jobId: { type: 'string', required: true, description: 'Job ID' },
      sourceFormat: { type: 'string', required: true, description: 'Source format' },
      targetFormat: { type: 'string', required: true, description: 'Target format' },
      originalSize: { type: 'number', required: true, description: 'Original file size' },
      outputSize: { type: 'number', required: true, description: 'Output file size' },
      duration: { type: 'number', required: true, description: 'Conversion duration ms' },
      provider: { type: 'string', required: true, description: 'Provider used' },
      fromCache: { type: 'boolean', required: false, description: 'Served from cache' },
    },
    trackOn: 'both',
    priority: 'critical',
  },
  conversion_failure: {
    name: 'conversion_failure',
    category: 'error',
    action: 'conversion_failure',
    description: 'Conversion failed',
    parameters: {
      jobId: { type: 'string', required: true, description: 'Job ID' },
      sourceFormat: { type: 'string', required: true, description: 'Source format' },
      targetFormat: { type: 'string', required: true, description: 'Target format' },
      errorCode: { type: 'string', required: true, description: 'Error code' },
      errorMessage: { type: 'string', required: true, description: 'Error message' },
      stage: { type: 'string', required: false, description: 'Failed stage' },
      provider: { type: 'string', required: false, description: 'Provider used' },
    },
    trackOn: 'both',
    priority: 'critical',
  },

  // ── Download Events ────────────────────────────────────────────────────────
  download: {
    name: 'download',
    category: 'download',
    action: 'download',
    description: 'File downloaded',
    parameters: {
      jobId: { type: 'string', required: true, description: 'Job ID' },
      sourceFormat: { type: 'string', required: true, description: 'Source format' },
      targetFormat: { type: 'string', required: true, description: 'Target format' },
      fileSize: { type: 'number', required: true, description: 'Downloaded file size' },
      downloadType: { type: 'string', required: true, description: 'Type of download' },
    },
    trackOn: 'both',
    priority: 'high',
  },

  // ── Navigation Events ──────────────────────────────────────────────────────
  page_view: {
    name: 'page_view',
    category: 'navigation',
    action: 'view',
    description: 'Page viewed',
    parameters: {
      path: { type: 'string', required: true, description: 'Page path' },
      locale: { type: 'string', required: true, description: 'Page locale' },
      referrer: { type: 'string', required: false, description: 'Referrer URL' },
    },
    trackOn: 'both',
    priority: 'medium',
  },
  tool_page_view: {
    name: 'tool_page_view',
    category: 'navigation',
    action: 'view',
    description: 'Tool page viewed',
    parameters: {
      slug: { type: 'string', required: true, description: 'Tool slug' },
      toolId: { type: 'string', required: true, description: 'Tool ID' },
      toolType: { type: 'string', required: true, description: 'Tool type' },
      category: { type: 'string', required: true, description: 'Format category' },
    },
    trackOn: 'both',
    priority: 'high',
  },

  // ── Search Events ──────────────────────────────────────────────────────────
  search: {
    name: 'search',
    category: 'search',
    action: 'search',
    description: 'Search performed',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
      resultsCount: { type: 'number', required: false, description: 'Number of results' },
      source: { type: 'string', required: false, description: 'Search source' },
    },
    trackOn: 'client',
    priority: 'medium',
  },

  // ── User Events ────────────────────────────────────────────────────────────
  user_signup: {
    name: 'user_signup',
    category: 'user',
    action: 'signup',
    description: 'User signed up',
    parameters: {
      tier: { type: 'string', required: true, description: 'Selected tier' },
      source: { type: 'string', required: false, description: 'Signup source' },
    },
    trackOn: 'server',
    priority: 'critical',
  },
  user_upgrade: {
    name: 'user_upgrade',
    category: 'monetization',
    action: 'upgrade',
    description: 'User upgraded tier',
    parameters: {
      fromTier: { type: 'string', required: true, description: 'Previous tier' },
      toTier: { type: 'string', required: true, description: 'New tier' },
    },
    trackOn: 'server',
    priority: 'critical',
  },

  // ── Error Events ──────────────────────────────────────────────────────────
  system_error: {
    name: 'system_error',
    category: 'error',
    action: 'error',
    description: 'System error occurred',
    parameters: {
      errorType: { type: 'string', required: true, description: 'Error type' },
      errorMessage: { type: 'string', required: true, description: 'Error message' },
      component: { type: 'string', required: false, description: 'Component that errored' },
      stack: { type: 'string', required: false, description: 'Error stack trace' },
    },
    trackOn: 'both',
    priority: 'high',
  },

  // ── Performance Events ─────────────────────────────────────────────────────
  performance_metric: {
    name: 'performance_metric',
    category: 'performance',
    action: 'view',
    description: 'Performance metric recorded',
    parameters: {
      metric: { type: 'string', required: true, description: 'Metric name' },
      value: { type: 'number', required: true, description: 'Metric value' },
      unit: { type: 'string', required: false, description: 'Metric unit' },
      page: { type: 'string', required: false, description: 'Page URL' },
    },
    trackOn: 'client',
    priority: 'low',
    sampling: 20,
  },
};

// ---------------------------------------------------------------------------
// ANALYTICS EVENT INTERFACE
// ---------------------------------------------------------------------------

export interface AnalyticsEvent {
  name: string;
  timestamp: Date;
  parameters: Record<string, unknown>;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  sessionId: string;
  userId?: string;
  tier: UserTier;
  locale: string;
  userAgent: string;
  referrer?: string;
  page: string;
}

// ---------------------------------------------------------------------------
// ANALYTICS ENGINE CLASS
// ---------------------------------------------------------------------------

class AnalyticsEventEngine {
  private eventDefinitions: Map<string, AnalyticsEventDefinition>;
  private context: AnalyticsContext | null = null;

  constructor() {
    this.eventDefinitions = new Map(Object.entries(ANALYTICS_EVENTS));
  }

  /**
   * Set analytics context
   */
  setContext(context: AnalyticsContext): void {
    this.context = context;
  }

  /**
   * Get event definition
   */
  getEventDefinition(name: string): AnalyticsEventDefinition | undefined {
    return this.eventDefinitions.get(name);
  }

  /**
   * Validate event parameters
   */
  validateEvent(name: string, parameters: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const definition = this.eventDefinitions.get(name);
    if (!definition) {
      return { valid: false, errors: [`Unknown event: ${name}`] };
    }

    const errors: string[] = [];

    for (const [key, spec] of Object.entries(definition.parameters)) {
      if (spec.required && parameters[key] === undefined) {
        errors.push(`Missing required parameter: ${key}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create event payload
   */
  createEvent(name: string, parameters: Record<string, unknown>): AnalyticsEvent | null {
    const definition = this.eventDefinitions.get(name);
    if (!definition) return null;

    // Check sampling
    if (definition.sampling && Math.random() * 100 > definition.sampling) {
      return null;
    }

    return {
      name,
      timestamp: new Date(),
      parameters,
      context: this.context ?? {
        sessionId: 'unknown',
        tier: 'free',
        locale: 'en',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        page: '',
      },
    };
  }

  /**
   * Check if event should be tracked on current platform
   */
  shouldTrack(name: string, platform: 'client' | 'server'): boolean {
    const definition = this.eventDefinitions.get(name);
    if (!definition) return false;

    return definition.trackOn === 'both' || definition.trackOn === platform;
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: AnalyticsEventCategory): AnalyticsEventDefinition[] {
    return Array.from(this.eventDefinitions.values()).filter(e => e.category === category);
  }

  /**
   * Get events by priority
   */
  getEventsByPriority(priority: AnalyticsEventDefinition['priority']): AnalyticsEventDefinition[] {
    return Array.from(this.eventDefinitions.values()).filter(e => e.priority === priority);
  }

  /**
   * Get all event names
   */
  getAllEventNames(): string[] {
    return Array.from(this.eventDefinitions.keys());
  }
}

export const analyticsEventEngine = new AnalyticsEventEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getEventDefinition(name: string): AnalyticsEventDefinition | undefined {
  return analyticsEventEngine.getEventDefinition(name);
}

export function createAnalyticsEvent(name: string, parameters: Record<string, unknown>): AnalyticsEvent | null {
  return analyticsEventEngine.createEvent(name, parameters);
}

export function validateAnalyticsEvent(name: string, parameters: Record<string, unknown>) {
  return analyticsEventEngine.validateEvent(name, parameters);
}


// ---------------------------------------------------------------------------
// PHASE 7 — Product & UX Expansion event constants
// ---------------------------------------------------------------------------

export const PHASE7_EVENTS = {
  RECOMMENDED_CONVERTER_CLICKED: 'recommended_converter_clicked',
  RECOMMENDED_TOOL_CLICKED:      'recommended_tool_clicked',
  INTERNAL_LINK_CLICKED:         'internal_link_clicked',
  POPULAR_CONVERSION_CLICKED:    'popular_conversion_clicked',
  TRENDING_CONVERSION_CLICKED:   'trending_conversion_clicked',
  CATEGORY_PAGE_VIEWED:          'category_page_viewed',
  SEARCH_USED:                   'search_used',
  SEARCH_RESULT_CLICKED:         'search_result_clicked',
  PRESET_SELECTED:               'preset_selected',
  CROP_APPLIED:                  'crop_applied',
  RESIZE_APPLIED:                'resize_applied',
  DOWNLOAD_FUNNEL_CTA_CLICKED:   'download_funnel_cta_clicked',
  CONVERSION_SUGGESTION_SHOWN:   'conversion_suggestion_shown',
  CONVERSION_SUGGESTION_CLICKED: 'conversion_suggestion_clicked',
} as const;

export type Phase7EventName = typeof PHASE7_EVENTS[keyof typeof PHASE7_EVENTS];
