/**
 * lib/config/feature-flags.ts
 * Feature Flag Engine - manages feature toggles for the platform
 *
 * Controls: viewer, editor, processor, batch, premium, history, queue, ads, ocr, etc.
 */

import type { UserTier } from '../types/services';

// ---------------------------------------------------------------------------
// FEATURE FLAG TYPES
// ---------------------------------------------------------------------------

export type FeatureFlag =
  | 'viewer'
  | 'editor'
  | 'processor'
  | 'batch'
  | 'premium'
  | 'history'
  | 'queue'
  | 'ads'
  | 'ocr'
  | 'ai-upscale'
  | 'ai-compress'
  | 'cloud-convert'
  | 'api-access'
  | 'custom-branding'
  | 'analytics'
  | 'export-logs'
  | 'priority-support'
  | 'custom-integration'
  | 'offline-mode'
  | 'drag-drop'
  | 'file-preview'
  | 'progress-tracking'
  | 'email-notification'
  | 'webhook-support'
  | 'bulk-download'
  | 'zip-archives'
  | 'concurrent-jobs'
  | 'auto-delete'
  | 'privacy-mode';

export interface FeatureFlagConfig {
  id: FeatureFlag;
  name: string;
  description: string;
  enabled: boolean;
  tier: UserTier;
  rollout: number; // 0-100 percentage
  dependencies: FeatureFlag[];
  conflictWith: FeatureFlag[];
}

// ---------------------------------------------------------------------------
// FEATURE FLAG DEFINITIONS
// ---------------------------------------------------------------------------

export const FEATURE_FLAGS: FeatureFlagConfig[] = [
  // ── Core Features ────────────────────────────────────────────────────────────
  {
    id: 'viewer',
    name: 'File Viewer',
    description: 'View files before and after conversion',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'editor',
    name: 'Basic Editor',
    description: 'Edit files before conversion',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: ['viewer'],
    conflictWith: [],
  },
  {
    id: 'processor',
    name: 'File Processor',
    description: 'Process files with multiple operations',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'batch',
    name: 'Batch Processing',
    description: 'Process multiple files at once',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'drag-drop',
    name: 'Drag & Drop Upload',
    description: 'Upload files by dragging',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'file-preview',
    name: 'File Preview',
    description: 'Preview files before conversion',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: ['viewer'],
    conflictWith: [],
  },
  {
    id: 'progress-tracking',
    name: 'Progress Tracking',
    description: 'See conversion progress in real-time',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },

  // ── Premium Features ─────────────────────────────────────────────────────────
  {
    id: 'premium',
    name: 'Premium Conversion',
    description: 'Access premium-quality conversions',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'ocr',
    name: 'OCR Text Extraction',
    description: 'Extract text from images and scanned PDFs',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'ai-upscale',
    name: 'AI Upscale',
    description: 'Enhance image resolution with AI',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'ai-compress',
    name: 'AI Smart Compress',
    description: 'Optimize compression with AI',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'cloud-convert',
    name: 'Cloud Conversion',
    description: 'Convert large files in the cloud',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'history',
    name: 'Conversion History',
    description: 'Track your conversion history',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: ['privacy-mode'],
  },
  {
    id: 'queue',
    name: 'Conversion Queue',
    description: 'Queue multiple conversions',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'concurrent-jobs',
    name: 'Concurrent Jobs',
    description: 'Run multiple conversions simultaneously',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: 'Get priority support',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },

  // ── Enterprise Features ──────────────────────────────────────────────────────
  {
    id: 'api-access',
    name: 'API Access',
    description: 'Access conversion via API',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'webhook-support',
    name: 'Webhook Support',
    description: 'Receive notifications via webhooks',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: ['api-access'],
    conflictWith: [],
  },
  {
    id: 'custom-branding',
    name: 'Custom Branding',
    description: 'Apply custom branding',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'custom-integration',
    name: 'Custom Integration',
    description: 'Integrate with custom systems',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: ['api-access'],
    conflictWith: [],
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Detailed conversion analytics',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: ['privacy-mode'],
  },
  {
    id: 'export-logs',
    name: 'Export Logs',
    description: 'Export detailed conversion logs',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: ['analytics'],
    conflictWith: [],
  },
  {
    id: 'bulk-download',
    name: 'Bulk Download',
    description: 'Download all converted files as ZIP',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'zip-archives',
    name: 'ZIP Archive Conversion',
    description: 'Convert files inside ZIP archives',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'auto-delete',
    name: 'Auto Delete',
    description: 'Automatically delete converted files',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },
  {
    id: 'email-notification',
    name: 'Email Notifications',
    description: 'Get notified via email when done',
    enabled: true,
    tier: 'enterprise',
    rollout: 100,
    dependencies: [],
    conflictWith: [],
  },

  // ── Ad-related ───────────────────────────────────────────────────────────────
  {
    id: 'ads',
    name: 'Advertisements',
    description: 'Show advertisements',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: ['premium'],
  },

  // ── Special Features ─────────────────────────────────────────────────────────
  {
    id: 'offline-mode',
    name: 'Offline Mode',
    description: 'Work without internet connection',
    enabled: true,
    tier: 'free',
    rollout: 100,
    dependencies: [],
    conflictWith: ['cloud-convert'],
  },
  {
    id: 'privacy-mode',
    name: 'Privacy Mode',
    description: 'Enhanced privacy - no data retention',
    enabled: true,
    tier: 'premium',
    rollout: 100,
    dependencies: [],
    conflictWith: ['history', 'analytics'],
  },
];

// ---------------------------------------------------------------------------
// FEATURE FLAG ENGINE CLASS
// ---------------------------------------------------------------------------

class FeatureFlagEngine {
  private flags: Map<FeatureFlag, FeatureFlagConfig>;
  private tierHierarchy: Record<UserTier, number> = {
    free: 0,
    premium: 1,
    enterprise: 2,
  };

  constructor() {
    this.flags = new Map(FEATURE_FLAGS.map(f => [f.id, f]));
  }

  /**
   * Check if feature is enabled for tier
   */
  isEnabled(feature: FeatureFlag, tier: UserTier = 'free'): boolean {
    const flag = this.flags.get(feature);
    if (!flag) return false;

    // Check if flag is enabled
    if (!flag.enabled) return false;

    // Check tier access
    const tierLevel = this.tierHierarchy[tier];
    const requiredLevel = this.tierHierarchy[flag.tier];
    if (tierLevel < requiredLevel) return false;

    // Check rollout (if random percentage)
    if (flag.rollout < 100) {
      const random = Math.random() * 100;
      if (random > flag.rollout) return false;
    }

    // Check dependencies
    for (const dep of flag.dependencies) {
      if (!this.isEnabled(dep, tier)) return false;
    }

    // Check conflicts
    for (const conflict of flag.conflictWith) {
      if (this.isEnabled(conflict, tier)) return false;
    }

    return true;
  }

  /**
   * Get all features available for tier
   */
  getAvailableFeatures(tier: UserTier): FeatureFlagConfig[] {
    return FEATURE_FLAGS.filter(f => this.isEnabled(f.id, tier));
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(feature: FeatureFlag): FeatureFlagConfig | undefined {
    return this.flags.get(feature);
  }

  /**
   * Get all features grouped by tier
   */
  getFeaturesByTier(): Record<UserTier, FeatureFlagConfig[]> {
    return {
      free: FEATURE_FLAGS.filter(f => f.tier === 'free'),
      premium: FEATURE_FLAGS.filter(f => f.tier === 'premium'),
      enterprise: FEATURE_FLAGS.filter(f => f.tier === 'enterprise'),
    };
  }

  /**
   * Check if moving from tier A to tier B unlocks new features
   */
  getNewFeatures(fromTier: UserTier, toTier: UserTier): FeatureFlagConfig[] {
    const newFeatures: FeatureFlagConfig[] = [];
    const fromLevel = this.tierHierarchy[fromTier];
    const toLevel = this.tierHierarchy[toTier];

    if (toLevel <= fromLevel) return [];

    for (const flag of FEATURE_FLAGS) {
      const flagLevel = this.tierHierarchy[flag.tier];
      if (flagLevel > fromLevel && flagLevel <= toLevel) {
        newFeatures.push(flag);
      }
    }

    return newFeatures;
  }

  /**
   * Get feature dependencies
   */
  getDependencies(feature: FeatureFlag): FeatureFlag[] {
    const flag = this.flags.get(feature);
    return flag?.dependencies ?? [];
  }

  /**
   * Get features that depend on this feature
   */
  getDependents(feature: FeatureFlag): FeatureFlag[] {
    return FEATURE_FLAGS
      .filter(f => f.dependencies.includes(feature))
      .map(f => f.id);
  }

  /**
   * Get conflicting features
   */
  getConflicts(feature: FeatureFlag): FeatureFlag[] {
    const flag = this.flags.get(feature);
    return flag?.conflictWith ?? [];
  }

  /**
   * Override feature flag (for testing/preview)
   */
  overrideFeature(feature: FeatureFlag, enabled: boolean): void {
    const flag = this.flags.get(feature);
    if (flag) {
      flag.enabled = enabled;
    }
  }

  /**
   * Get feature rollout percentage
   */
  getRollout(feature: FeatureFlag): number {
    const flag = this.flags.get(feature);
    return flag?.rollout ?? 0;
  }

  /**
   * Set feature rollout percentage (for gradual rollout)
   */
  setRollout(feature: FeatureFlag, percentage: number): void {
    const flag = this.flags.get(feature);
    if (flag) {
      flag.rollout = Math.max(0, Math.min(100, percentage));
    }
  }
}

export const featureFlagEngine = new FeatureFlagEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function isFeatureEnabled(feature: FeatureFlag, tier?: UserTier): boolean {
  return featureFlagEngine.isEnabled(feature, tier);
}

export function getAvailableFeatures(tier: UserTier): FeatureFlagConfig[] {
  return featureFlagEngine.getAvailableFeatures(tier);
}

export function getFeaturesForTier(): Record<UserTier, FeatureFlagConfig[]> {
  return featureFlagEngine.getFeaturesByTier();
}
