/**
 * lib/registry/provider-registry.ts
 * Provider configuration and selection
 */

import type {
  ProviderConfig,
  ProviderCapabilities,
  IConversionProvider,
} from '../types/providers';
import type { ConversionJob } from '../types/conversion';

// ---------------------------------------------------------------------------
// BUILTIN PROVIDER CONFIGURATIONS
// ---------------------------------------------------------------------------

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  // Client-side providers (priority 100-199)
  {
    id: 'canvas',
    name: 'Canvas API',
    type: 'client',
    priority: 100,
    enabled: true,
    premiumOnly: false,
    capabilities: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFiles: 50,
      supportsFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'heif', 'svg', 'ico', 'icns'],
      supportsOperations: ['image:convert', 'image:crop', 'image:resize', 'image:rotate', 'image:flip', 'image:compress', 'image:blur', 'image:watermark', 'image:color-adjust'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'fast',
      qualityRating: 'high',
    },
  },
  {
    id: 'ffmpeg',
    name: 'FFmpeg.wasm',
    type: 'client',
    priority: 110,
    enabled: true,
    premiumOnly: false,
    capabilities: {
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxFiles: 10,
      supportsFormats: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'mpeg', 'mpg', 'm4v', '3gp', 'ogv', 'ts', 'f4v', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'opus', 'ac3', 'amr', 'caf'],
      supportsOperations: ['video:convert', 'video:trim', 'video:compress', 'video:rotate', 'video:extract-audio', 'video:gif', 'video:crop', 'video:reverse', 'video:subtitle', 'video:merge', 'audio:convert', 'audio:trim', 'audio:compress', 'audio:normalize', 'audio:merge', 'audio:speed', 'audio:pitch'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'medium',
      qualityRating: 'high',
    },
  },
  {
    id: 'pdf-lib',
    name: 'pdf-lib',
    type: 'client',
    priority: 120,
    enabled: true,
    premiumOnly: false,
    capabilities: {
      maxFileSize: 200 * 1024 * 1024, // 200MB
      maxFiles: 20,
      supportsFormats: ['pdf'],
      supportsOperations: ['pdf:merge', 'pdf:split', 'pdf:compress', 'pdf:protect', 'pdf:unlock', 'pdf:rotate', 'pdf:watermark', 'pdf:page-numbers'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'fast',
      qualityRating: 'high',
    },
  },
  {
    id: 'jszip',
    name: 'JSZip',
    type: 'client',
    priority: 130,
    enabled: true,
    premiumOnly: false,
    capabilities: {
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 10,
      supportsFormats: ['epub'],
      supportsOperations: ['ebook:convert'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'fast',
      qualityRating: 'medium',
    },
  },
  {
    id: 'web-audio',
    name: 'Web Audio API',
    type: 'client',
    priority: 140,
    enabled: true,
    premiumOnly: false,
    capabilities: {
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 10,
      supportsFormats: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
      supportsOperations: ['audio:normalize', 'audio:speed'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'fast',
      qualityRating: 'high',
    },
  },

  // Server-side providers (priority 200-299)
  {
    id: 'libreoffice',
    name: 'LibreOffice Server',
    type: 'server',
    priority: 200,
    enabled: false, // Not yet deployed
    premiumOnly: false,
    capabilities: {
      maxFileSize: 100 * 1024 * 1024,
      maxFiles: 5,
      supportsFormats: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'pdf'],
      supportsOperations: ['doc:to-pdf', 'doc:convert', 'pdf:to-word'],
      premiumOnly: false,
      requiresAuth: false,
      estimatedSpeed: 'medium',
      qualityRating: 'high',
    },
    timeout: 60000,
    retries: 2,
  },

  // Premium API providers (priority 300-399)
  {
    id: 'premium-api',
    name: 'Premium Conversion API',
    type: 'external',
    priority: 300,
    enabled: false, // Not yet configured
    premiumOnly: true,
    capabilities: {
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
      maxFiles: 100,
      supportsFormats: [], // All formats
      supportsOperations: [], // All operations
      premiumOnly: true,
      requiresAuth: true,
      estimatedSpeed: 'fast',
      qualityRating: 'high',
    },
    timeout: 120000,
    retries: 3,
  },
];

// ---------------------------------------------------------------------------
// REGISTRY CLASS
// ---------------------------------------------------------------------------

class ProviderRegistry {
  private providers: Map<string, ProviderConfig>;
  private implementations: Map<string, IConversionProvider>;

  constructor() {
    this.providers = new Map(PROVIDER_CONFIGS.map(p => [p.id, p]));
    this.implementations = new Map();
  }

  /** Get provider configuration */
  getConfig(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  /** Get all enabled providers */
  getEnabled(): ProviderConfig[] {
    return PROVIDER_CONFIGS.filter(p => p.enabled);
  }

  /** Get providers by type */
  getByType(type: 'client' | 'server' | 'external'): ProviderConfig[] {
    return PROVIDER_CONFIGS.filter(p => p.type === type && p.enabled);
  }

  /** Register provider implementation */
  register(id: string, implementation: IConversionProvider): void {
    this.implementations.set(id, implementation);
  }

  /** Get provider implementation */
  getImplementation(id: string): IConversionProvider | undefined {
    return this.implementations.get(id);
  }

  /** Select best provider for job */
  selectBest(job: ConversionJob): ProviderConfig | null {
    const enabled = this.getEnabled();
    const eligible = enabled.filter(config => {
      const caps = config.capabilities;

      // Check file size
      const maxSize = Math.max(...job.files.map(f => f.size));
      if (maxSize > caps.maxFileSize) return false;

      // Check file count
      if (job.files.length > caps.maxFiles) return false;

      // Check premium requirement
      if (caps.premiumOnly && job.mode !== 'premium') return false;

      return true;
    });

    // Sort by priority (lower = better)
    eligible.sort((a, b) => a.priority - b.priority);

    return eligible[0] || null;
  }
}

export const providerRegistry = new ProviderRegistry();
