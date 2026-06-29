/**
 * lib/engine/provider-fallback-engine.ts
 * Provider Fallback Engine - selects best provider for conversion operations
 *
 * Fallback chain: Canvas → Sharp → FFmpeg → LibreOffice → CloudConvert
 */

import type { ProcessingEngine, FormatCategory } from '../types/formats';
import type { ProviderConfig, ProviderCapabilities } from '../types/providers';
import { providerRegistry } from '../registry/provider-registry';
import { formatRegistry } from '../registry/format-registry';

// ---------------------------------------------------------------------------
// PROVIDER TYPES
// ---------------------------------------------------------------------------

export type ProviderType = 'canvas' | 'sharp' | 'ffmpeg' | 'pdf-lib' | 'jszip' | 'web-audio' | 'libreoffice' | 'cloudconvert' | 'premium-api';

export interface ProviderFallbackConfig {
  id: ProviderType;
  name: string;
  type: 'client' | 'server' | 'external';
  priority: number;
  enabled: boolean;
  supportedCategories: FormatCategory[];
  supportedOperations: string[];
  supportedFormats: string[];
  maxFileSize: number;
  qualityRating: 'high' | 'medium' | 'low';
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  fallbackProvider?: ProviderType;
}

export interface ConversionRequest {
  sourceFormat: string;
  targetFormat: string;
  operation: string;
  fileSize: number;
  isPremium: boolean;
  isBatch: boolean;
  requiresQuality: boolean;
}

export interface ProviderSelectionResult {
  provider: ProviderType;
  fallback: ProviderType | null;
  reason: string;
  estimatedTime: number;
  quality: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// PROVIDER CONFIGURATIONS
// ---------------------------------------------------------------------------

export const PROVIDER_FALLBACK_CONFIGS: ProviderFallbackConfig[] = [
  // ── Client-side providers (higher priority) ────────────────────────────────
  {
    id: 'canvas',
    name: 'Canvas API',
    type: 'client',
    priority: 10,
    enabled: true,
    supportedCategories: ['image', 'raw', 'vector', 'icon'],
    supportedOperations: ['image:convert', 'image:resize', 'image:crop', 'image:rotate', 'image:flip', 'image:compress'],
    supportedFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'heif', 'svg', 'ico', 'icns', 'avif'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    qualityRating: 'high',
    estimatedSpeed: 'fast',
    fallbackProvider: 'sharp',
  },
  {
    id: 'sharp',
    name: 'Sharp (Server)',
    type: 'server',
    priority: 11,
    enabled: false, // Not yet configured
    supportedCategories: ['image', 'raw', 'vector'],
    supportedOperations: ['image:convert', 'image:resize', 'image:crop', 'image:rotate', 'image:compress'],
    supportedFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'heif', 'svg', 'avif', 'raw', 'cr2', 'nef', 'arw', 'dng'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    qualityRating: 'high',
    estimatedSpeed: 'fast',
    fallbackProvider: 'canvas',
  },
  {
    id: 'ffmpeg',
    name: 'FFmpeg.wasm',
    type: 'client',
    priority: 20,
    enabled: true,
    supportedCategories: ['video', 'audio'],
    supportedOperations: ['video:convert', 'video:trim', 'video:compress', 'video:rotate', 'video:extract-audio', 'video:gif', 'audio:convert', 'audio:trim', 'audio:compress', 'audio:normalize'],
    supportedFormats: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'mpeg', 'mpg', 'm4v', '3gp', 'ogv', 'ts', 'f4v', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'opus', 'ac3', 'amr', 'caf'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    qualityRating: 'high',
    estimatedSpeed: 'medium',
    fallbackProvider: 'cloudconvert',
  },
  {
    id: 'pdf-lib',
    name: 'pdf-lib',
    type: 'client',
    priority: 30,
    enabled: true,
    supportedCategories: ['document'],
    supportedOperations: ['pdf:merge', 'pdf:split', 'pdf:compress', 'pdf:rotate', 'pdf:watermark'],
    supportedFormats: ['pdf'],
    maxFileSize: 200 * 1024 * 1024, // 200MB
    qualityRating: 'high',
    estimatedSpeed: 'fast',
    fallbackProvider: 'libreoffice',
  },
  {
    id: 'jszip',
    name: 'JSZip',
    type: 'client',
    priority: 31,
    enabled: true,
    supportedCategories: ['document', 'archive'],
    supportedOperations: ['ebook:convert', 'archive:extract', 'archive:create'],
    supportedFormats: ['epub', 'zip'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    qualityRating: 'medium',
    estimatedSpeed: 'fast',
    fallbackProvider: 'cloudconvert',
  },
  {
    id: 'web-audio',
    name: 'Web Audio API',
    type: 'client',
    priority: 32,
    enabled: true,
    supportedCategories: ['audio'],
    supportedOperations: ['audio:normalize', 'audio:trim', 'audio:merge'],
    supportedFormats: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    qualityRating: 'high',
    estimatedSpeed: 'fast',
    fallbackProvider: 'ffmpeg',
  },

  // ── Server-side providers ──────────────────────────────────────────────────
  {
    id: 'libreoffice',
    name: 'LibreOffice Server',
    type: 'server',
    priority: 40,
    enabled: false, // Not yet deployed
    supportedCategories: ['document'],
    supportedOperations: ['doc:convert', 'doc:to-pdf', 'pdf:to-word', 'doc:merge'],
    supportedFormats: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'pdf', 'txt', 'html'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    qualityRating: 'high',
    estimatedSpeed: 'medium',
    fallbackProvider: 'cloudconvert',
  },

  // ── External providers (lowest priority, highest capability) ──────────────
  {
    id: 'cloudconvert',
    name: 'CloudConvert API',
    type: 'external',
    priority: 50,
    enabled: false, // Requires API key
    supportedCategories: ['image', 'video', 'audio', 'document', 'archive', 'cad', 'vector'],
    supportedOperations: ['*'], // Supports all operations
    supportedFormats: [], // Empty = all formats
    maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
    qualityRating: 'high',
    estimatedSpeed: 'medium',
    fallbackProvider: undefined,
  },
  {
    id: 'premium-api',
    name: 'Premium Conversion API',
    type: 'external',
    priority: 51,
    enabled: false, // Premium feature
    supportedCategories: ['image', 'video', 'audio', 'document', 'archive', 'cad', 'vector'],
    supportedOperations: ['*'], // Supports all operations
    supportedFormats: [], // Empty = all formats
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    qualityRating: 'high',
    estimatedSpeed: 'fast',
    fallbackProvider: undefined,
  },
];

// ---------------------------------------------------------------------------
// OPERATION PROVIDER MAPPING
// ---------------------------------------------------------------------------

const OPERATION_PROVIDERS: Record<string, ProviderType[]> = {
  'image:convert': ['canvas', 'sharp', 'cloudconvert'],
  'image:resize': ['canvas', 'sharp', 'cloudconvert'],
  'image:crop': ['canvas', 'sharp'],
  'image:rotate': ['canvas', 'sharp'],
  'image:flip': ['canvas', 'sharp'],
  'image:compress': ['canvas', 'sharp', 'cloudconvert'],
  'image:watermark': ['canvas', 'sharp'],
  'video:convert': ['ffmpeg', 'cloudconvert', 'premium-api'],
  'video:trim': ['ffmpeg', 'cloudconvert'],
  'video:compress': ['ffmpeg', 'cloudconvert'],
  'video:rotate': ['ffmpeg', 'cloudconvert'],
  'video:extract-audio': ['ffmpeg', 'cloudconvert'],
  'video:gif': ['ffmpeg', 'canvas'],
  'audio:convert': ['ffmpeg', 'web-audio', 'cloudconvert'],
  'audio:trim': ['ffmpeg', 'web-audio'],
  'audio:compress': ['ffmpeg', 'cloudconvert'],
  'audio:normalize': ['web-audio', 'ffmpeg'],
  'pdf:merge': ['pdf-lib'],
  'pdf:split': ['pdf-lib'],
  'pdf:compress': ['pdf-lib', 'cloudconvert'],
  'pdf:rotate': ['pdf-lib'],
  'pdf:watermark': ['pdf-lib'],
  'doc:convert': ['libreoffice', 'cloudconvert'],
  'doc:to-pdf': ['libreoffice', 'cloudconvert'],
  'ebook:convert': ['jszip', 'cloudconvert'],
  'archive:extract': ['jszip'],
  'archive:create': ['jszip'],
};

// ---------------------------------------------------------------------------
// PROVIDER FALLBACK ENGINE CLASS
// ---------------------------------------------------------------------------

class ProviderFallbackEngine {
  private providers: Map<ProviderType, ProviderFallbackConfig>;
  private providerOrder: ProviderType[];

  constructor() {
    this.providers = new Map(
      PROVIDER_FALLBACK_CONFIGS.map(p => [p.id, p])
    );
    this.providerOrder = PROVIDER_FALLBACK_CONFIGS
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.id);
  }

  /**
   * Select best provider for conversion request
   */
  selectProvider(request: ConversionRequest): ProviderSelectionResult {
    const candidates = this.getEligibleProviders(request);

    if (candidates.length === 0) {
      return {
        provider: 'cloudconvert',
        fallback: null,
        reason: 'No enabled provider supports this conversion',
        estimatedTime: 30000,
        quality: 'high',
      };
    }

    // Sort by priority (lower = better)
    const sorted = candidates.sort((a, b) => {
      const configA = this.providers.get(a)!;
      const configB = this.providers.get(b)!;

      // Prefer client-side for small files
      if (request.fileSize < 50 * 1024 * 1024) {
        if (configA.type === 'client' && configB.type !== 'client') return -1;
        if (configA.type !== 'client' && configB.type === 'client') return 1;
      }

      // Consider quality preference
      if (request.requiresQuality) {
        const qualityOrder = { high: 0, medium: 1, low: 2 };
        const qualA = qualityOrder[configA.qualityRating];
        const qualB = qualityOrder[configB.qualityRating];
        if (qualA !== qualB) return qualA - qualB;
      }

      return configA.priority - configB.priority;
    });

    const selected = sorted[0];
    const config = this.providers.get(selected)!;

    return {
      provider: selected,
      fallback: config.fallbackProvider ?? null,
      reason: `Selected ${config.name} for ${request.operation}`,
      estimatedTime: this.estimateTime(config, request),
      quality: config.qualityRating,
    };
  }

  /**
   * Get all eligible providers for request
   */
  private getEligibleProviders(request: ConversionRequest): ProviderType[] {
    const operationProviders = OPERATION_PROVIDERS[request.operation] ?? [];

    return this.providerOrder.filter(providerId => {
      const config = this.providers.get(providerId);
      if (!config || !config.enabled) return false;

      // Check format support
      if (config.supportedFormats.length > 0) {
        if (!config.supportedFormats.includes(request.sourceFormat)) return false;
        if (!config.supportedFormats.includes(request.targetFormat) && request.targetFormat !== request.sourceFormat) {
          // Source check only for some operations
          if (request.operation.includes('extract') || request.operation.includes('to-')) {
            return false;
          }
        }
      }

      // Check file size
      if (request.fileSize > config.maxFileSize) return false;

      // Check operation support
      if (!config.supportedOperations.includes(request.operation) && !config.supportedOperations.includes('*')) {
        return false;
      }

      // Check premium requirement
      if (!request.isPremium && providerId === 'premium-api') return false;

      // Check batch support
      if (request.isBatch && config.type === 'client') {
        // Client-side batch is slower, prefer server
        return false;
      }

      return true;
    });
  }

  /**
   * Estimate processing time
   */
  private estimateTime(config: ProviderFallbackConfig, request: ConversionRequest): number {
    const baseTime = config.estimatedSpeed === 'fast' ? 1000 : config.estimatedSpeed === 'medium' ? 5000 : 15000;
    const fileSizeMB = request.fileSize / (1024 * 1024);

    // Scale by file size
    let time = baseTime + (fileSizeMB * 100);

    // Video takes longer
    if (request.operation.startsWith('video')) {
      time *= 3;
    }

    // Audio is fast
    if (request.operation.startsWith('audio')) {
      time *= 0.5;
    }

    // Client-side is faster for small files
    if (config.type === 'client' && fileSizeMB < 20) {
      time *= 0.7;
    }

    return Math.round(time);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerId: ProviderType): ProviderFallbackConfig | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerId: ProviderType): boolean {
    return this.providers.get(providerId)?.enabled ?? false;
  }

  /**
   * Get fallback chain for operation
   */
  getFallbackChain(operation: string): ProviderType[] {
    const providers = OPERATION_PROVIDERS[operation] ?? [];
    return providers.filter(p => this.providers.get(p)?.enabled ?? false);
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    request: ConversionRequest,
    executor: (provider: ProviderType) => Promise<T>
  ): Promise<{ result: T; provider: ProviderType; attempts: ProviderType[] }> {
    const selection = this.selectProvider(request);
    const attempts: ProviderType[] = [];
    let currentProvider: ProviderType | null = selection.provider;

    while (currentProvider) {
      attempts.push(currentProvider);
      try {
        const result = await executor(currentProvider);
        return { result, provider: currentProvider, attempts };
      } catch (error) {
        // Try fallback
        const config = this.providers.get(currentProvider);
        currentProvider = config?.fallbackProvider ?? null;
      }
    }

    throw new Error(`All providers failed: ${attempts.join(' → ')}`);
  }

  /**
   * Get all enabled providers
   */
  getEnabledProviders(): ProviderFallbackConfig[] {
    return PROVIDER_FALLBACK_CONFIGS.filter(p => p.enabled);
  }

  /**
   * Check if format conversion requires external provider
   */
  requiresExternalProvider(source: string, target: string): boolean {
    // CAD formats require server
    if (['dwg', 'dxf', 'step', 'stp', 'stl', 'obj', 'fbx'].includes(source)) {
      return true;
    }

    // Design formats require server
    if (['ai', 'eps', 'psd', 'cdr', 'indd'].includes(source)) {
      return true;
    }

    // Office formats require LibreOffice for some conversions
    if (['doc', 'xls', 'ppt'].includes(source) && !['pdf', 'txt'].includes(target)) {
      return true;
    }

    return false;
  }
}

export const providerFallbackEngine = new ProviderFallbackEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function selectProvider(request: ConversionRequest): ProviderSelectionResult {
  return providerFallbackEngine.selectProvider(request);
}

export function getProviderConfig(provider: ProviderType): ProviderFallbackConfig | undefined {
  return providerFallbackEngine.getProviderConfig(provider);
}

export function isProviderAvailable(provider: ProviderType): boolean {
  return providerFallbackEngine.isProviderAvailable(provider);
}

export function getFallbackChain(operation: string): ProviderType[] {
  return providerFallbackEngine.getFallbackChain(operation);
}
