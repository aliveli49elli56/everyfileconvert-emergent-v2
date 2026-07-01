/**
 * lib/infrastructure/providers/storage-provider.ts
 *
 * Storage Provider — Interface + Browser Implementation
 *
 * IStorageProvider: object storage interface.
 * BrowserStorageProvider: uses browser IndexedDB/in-memory when ENABLE_STORAGE = false.
 *
 * Future provider (Phase 6D-2): AWS S3 / Cloudflare R2
 * Swap: register S3StorageProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// STORAGE TYPES
// ---------------------------------------------------------------------------

export interface StorageObject {
  key: string;
  size: number;
  contentType: string;
  url: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: string;
  expiresIn?: number;   // seconds
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface StorageListResult {
  objects: StorageObject[];
  hasMore: boolean;
  nextToken?: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IStorageProvider {
  getMetadata(): ProviderMetadata;
  upload(key: string, data: Blob | ArrayBuffer, options?: UploadOptions): Promise<StorageObject>;
  download(key: string): Promise<Blob | null>;
  getUrl(key: string, expiresIn?: number): Promise<string | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string, limit?: number): Promise<StorageListResult>;
  getStats(): Promise<{ objectCount: number; totalBytes: number }>;
}

// ---------------------------------------------------------------------------
// BROWSER IMPLEMENTATION
// ---------------------------------------------------------------------------

interface BrowserStorageEntry {
  data: Blob;
  contentType: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

/**
 * BrowserStorageProvider — uses in-memory Map (session-scoped).
 * Appropriate for browser-only file conversion where no persistence is needed.
 * Files are already managed by DownloadWorkflowManager via Object URLs.
 */
export class BrowserStorageProvider implements IStorageProvider {
  private readonly store = new Map<string, BrowserStorageEntry>();

  private readonly metadata: ProviderMetadata = {
    id:             'browser-storage',
    displayName:    'Browser Storage Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       12,
    healthStatus:   'healthy',
    capabilities:   ['upload', 'download', 'getUrl', 'delete', 'exists', 'list'],
    futureProvider: 's3',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  async upload(key: string, data: Blob | ArrayBuffer, options?: UploadOptions): Promise<StorageObject> {
    const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: options?.contentType });
    this.store.set(key, {
      data: blob,
      contentType: options?.contentType ?? blob.type,
      createdAt:   new Date().toISOString(),
      metadata:    options?.metadata,
    });
    return {
      key,
      size:        blob.size,
      contentType: blob.type,
      url:         typeof URL !== 'undefined' ? URL.createObjectURL(blob) : '',
      createdAt:   new Date().toISOString(),
    };
  }

  async download(key: string): Promise<Blob | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.data;
  }

  async getUrl(key: string, _expiresIn?: number): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return typeof URL !== 'undefined' ? URL.createObjectURL(entry.data) : null;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async list(prefix?: string, limit = 100): Promise<StorageListResult> {
    const keys = Array.from(this.store.keys())
      .filter(k => !prefix || k.startsWith(prefix))
      .slice(0, limit);
    const objects: StorageObject[] = keys.map(k => {
      const e = this.store.get(k)!;
      return {
        key: k,
        size: e.data.size,
        contentType: e.contentType,
        url: '',
        createdAt: e.createdAt,
      };
    });
    return { objects, hasMore: false };
  }

  async getStats(): Promise<{ objectCount: number; totalBytes: number }> {
    let totalBytes = 0;
    Array.from(this.store.values()).forEach(entry => {
      totalBytes += entry.data.size;
    });
    return { objectCount: this.store.size, totalBytes };
  }
}

export const browserStorageProvider = new BrowserStorageProvider();
