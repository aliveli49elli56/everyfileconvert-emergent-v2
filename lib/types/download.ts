/**
 * lib/types/download.ts
 * Download Profile Model - defines download configurations and profiles
 *
 * Handles: original file, converted file, preview, thumbnail, sizes, timing
 */

// ---------------------------------------------------------------------------
// DOWNLOAD PROFILE TYPES
// ---------------------------------------------------------------------------

export type DownloadType =
  | 'original'
  | 'converted'
  | 'preview'
  | 'thumbnail'
  | 'archive'
  | 'difference'
  | 'metadata';

export type DownloadQuality = 'original' | 'high' | 'medium' | 'low';

export interface DownloadProfile {
  id: string;
  name: string;
  type: DownloadType;
  quality: DownloadQuality;
  format: string;
  includeMetadata: boolean;
  includePreview: boolean;
  maxFileSize?: number;
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
  };
  naming: DownloadNamingConfig;
  expiration: number; // seconds until link expires
}

export interface DownloadNamingConfig {
  prefix?: string;
  suffix?: string;
  includeTimestamp: boolean;
  includeRandomId: boolean;
  preserveOriginalName: boolean;
  customTemplate?: string; // e.g., "{name}_{date}_{random}"
}

export interface DownloadResult {
  id: string;
  url: string;
  blob?: Blob;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: DownloadType;
  generatedAt: Date;
  expiresAt?: Date;
  checksum: string;
}

export interface DownloadOptions {
  profile: DownloadType | DownloadProfile;
  quality?: DownloadQuality;
  format?: string;
  filename?: string;
  inline?: boolean;
  expirySeconds?: number;
}

export interface DownloadTiming {
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  bytesPerSecond?: number;
  retries: number;
  fromCache: boolean;
}

export interface DownloadConfig {
  maxSizeBytes: number;
  defaultExpiry: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

// ---------------------------------------------------------------------------
// PREDEFINED DOWNLOAD PROFILES
// ---------------------------------------------------------------------------

export const DOWNLOAD_PROFILES: Record<DownloadType, DownloadProfile> = {
  original: {
    id: 'original',
    name: 'Original File',
    type: 'original',
    quality: 'original',
    format: '', // Keep original format
    includeMetadata: true,
    includePreview: false,
    naming: {
      preserveOriginalName: true,
      includeTimestamp: false,
      includeRandomId: false,
    },
    expiration: 3600, // 1 hour
  },
  converted: {
    id: 'converted',
    name: 'Converted File',
    type: 'converted',
    quality: 'high',
    format: '', // Target format
    includeMetadata: true,
    includePreview: false,
    naming: {
      preserveOriginalName: false,
      includeTimestamp: false,
      includeRandomId: false,
      suffix: '_converted',
    },
    expiration: 3600 * 24, // 24 hours
  },
  preview: {
    id: 'preview',
    name: 'Preview Image',
    type: 'preview',
    quality: 'medium',
    format: 'jpg',
    includeMetadata: false,
    includePreview: false,
    resize: {
      width: 800,
      height: 600,
      maintainAspectRatio: true,
    },
    naming: {
      preserveOriginalName: false,
      includeTimestamp: false,
      includeRandomId: true,
      suffix: '_preview',
    },
    expiration: 300, // 5 minutes
  },
  thumbnail: {
    id: 'thumbnail',
    name: 'Thumbnail',
    type: 'thumbnail',
    quality: 'low',
    format: 'jpg',
    includeMetadata: false,
    includePreview: false,
    resize: {
      width: 150,
      height: 150,
      maintainAspectRatio: true,
    },
    naming: {
      preserveOriginalName: false,
      includeTimestamp: false,
      includeRandomId: true,
      suffix: '_thumb',
    },
    expiration: 3600,
  },
  archive: {
    id: 'archive',
    name: 'ZIP Archive',
    type: 'archive',
    quality: 'original',
    format: 'zip',
    includeMetadata: true,
    includePreview: false,
    naming: {
      preserveOriginalName: false,
      includeTimestamp: true,
      includeRandomId: false,
      prefix: 'converted_files',
      suffix: '',
    },
    expiration: 3600 * 2, // 2 hours
  },
  difference: {
    id: 'difference',
    name: 'Difference Map',
    type: 'difference',
    quality: 'high',
    format: 'png',
    includeMetadata: false,
    includePreview: false,
    naming: {
      preserveOriginalName: false,
      includeTimestamp: false,
      includeRandomId: true,
      suffix: '_diff',
    },
    expiration: 300,
  },
  metadata: {
    id: 'metadata',
    name: 'Metadata Export',
    type: 'metadata',
    quality: 'original',
    format: 'json',
    includeMetadata: true,
    includePreview: false,
    naming: {
      preserveOriginalName: false,
      includeTimestamp: false,
      includeRandomId: false,
      suffix: '_metadata',
    },
    expiration: 600,
  },
};

// ---------------------------------------------------------------------------
// DOWNLOAD CONFIGURATION
// ---------------------------------------------------------------------------

export const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  maxSizeBytes: 10 * 1024 * 1024 * 1024, // 10GB
  defaultExpiry: 3600, // 1 hour
  maxConcurrent: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 3600,
};

// ---------------------------------------------------------------------------
// DOWNLOAD ENGINE CLASS
// ---------------------------------------------------------------------------

class DownloadEngine {
  private profiles: Map<DownloadType, DownloadProfile>;
  private config: DownloadConfig;
  private activeDownloads: Map<string, DownloadResult>;

  constructor() {
    this.profiles = new Map(
      Object.entries(DOWNLOAD_PROFILES) as [DownloadType, DownloadProfile][]
    );
    this.config = DEFAULT_DOWNLOAD_CONFIG;
    this.activeDownloads = new Map();
  }

  /**
   * Get download profile
   */
  getProfile(type: DownloadType): DownloadProfile | undefined {
    return this.profiles.get(type);
  }

  /**
   * Generate download URL for blob
   */
  generateUrl(blob: Blob, fileName: string): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Generate download filename
   */
  generateFilename(
    originalName: string,
    profile: DownloadProfile,
    targetExt?: string
  ): string {
    const naming = profile.naming;
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const ext = targetExt ?? profile.format ?? originalName.split('.').pop() ?? 'bin';

    let fileName = '';

    if (naming.preserveOriginalName) {
      fileName = originalName;
    } else {
      const parts: string[] = [];

      if (naming.prefix) parts.push(naming.prefix);
      parts.push(baseName);
      if (naming.suffix) parts.push(naming.suffix);
      if (naming.includeTimestamp) {
        parts.push(new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-'));
      }
      if (naming.includeRandomId) {
        parts.push(Math.random().toString(36).substring(2, 8));
      }

      fileName = parts.join('_') + '.' + ext;
    }

    // Apply custom template if provided
    if (naming.customTemplate) {
      fileName = naming.customTemplate
        .replace('{name}', baseName)
        .replace('{date}', new Date().toISOString().slice(0, 10))
        .replace('{time}', new Date().toISOString().slice(11, 19))
        .replace('{random}', Math.random().toString(36).substring(2, 8))
        .replace('{ext}', ext);
    }

    return fileName;
  }

  /**
   * Check if download is expired
   */
  isExpired(result: DownloadResult): boolean {
    if (!result.expiresAt) return false;
    return new Date() > result.expiresAt;
  }

  /**
   * Calculate expiry time
   */
  calculateExpiry(seconds: number = this.config.defaultExpiry): Date {
    return new Date(Date.now() + seconds * 1000);
  }

  /**
   * Trigger browser download
   */
  async triggerDownload(result: DownloadResult): Promise<void> {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Trigger download for blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get configuration
   */
  getConfig(): DownloadConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DownloadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register download result
   */
  registerDownload(result: DownloadResult): void {
    this.activeDownloads.set(result.id, result);
  }

  /**
   * Cleanup expired downloads
   */
  cleanupExpired(): void {
    const now = new Date();
    for (const [id, result] of Array.from(this.activeDownloads.entries())) {
      if (result.expiresAt && result.expiresAt < now) {
        if (result.url.startsWith('blob:')) {
          URL.revokeObjectURL(result.url);
        }
        this.activeDownloads.delete(id);
      }
    }
  }

  /**
   * Calculate checksum for file
   */
  async calculateChecksum(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }
}

export const downloadEngine = new DownloadEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getDownloadProfile(type: DownloadType): DownloadProfile | undefined {
  return downloadEngine.getProfile(type);
}

export function generateDownloadFilename(
  originalName: string,
  profileType: DownloadType,
  targetExt?: string
): string {
  const profile = DOWNLOAD_PROFILES[profileType];
  return downloadEngine.generateFilename(originalName, profile, targetExt);
}

export function downloadBlob(blob: Blob, filename: string): void {
  downloadEngine.downloadBlob(blob, filename);
}
