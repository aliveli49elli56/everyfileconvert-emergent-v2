/**
 * lib/infrastructure/providers/storage/s3-storage-provider.ts
 *
 * S3 Storage Provider — Interface + Stub
 *
 * IS3StorageProvider: AWS S3 / Cloudflare R2 compatible interface.
 * StubS3StorageProvider: no-op stub (browser storage remains default).
 *
 * Future provider (Phase 6D-2): AWS SDK v3 S3 client.
 * Swap: register S3StorageProviderImpl → no business logic changes.
 */

import type { ProviderMetadata } from '../../types';
import type {
  StorageObjectMetadata, StorageClass, StorageRegion,
  StorageHealthCheck, PresignedUrlOptions,
} from './storage-types';

// ---------------------------------------------------------------------------
// S3 TYPES
// ---------------------------------------------------------------------------

export interface S3Config {
  bucket:          string;
  region:          StorageRegion;
  accessKeyId:     string;
  secretAccessKey: string;
  endpoint?:       string;   // For R2/MinIO compatibility
  forcePathStyle?: boolean;
}

export interface S3UploadOptions {
  contentType?:  string;
  storageClass?: StorageClass;
  tags?:         Record<string, string>;
  metadata?:     Record<string, string>;
  isPublic?:     boolean;
}

export interface S3UploadResult {
  key:      string;
  bucket:   string;
  etag:     string;
  publicUrl: string | null;
  location: string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IS3StorageProvider {
  getMetadata(): ProviderMetadata;
  upload(key: string, data: Blob | Buffer, options?: S3UploadOptions): Promise<S3UploadResult | null>;
  download(key: string): Promise<Blob | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getPresignedUrl(key: string, options: PresignedUrlOptions): Promise<string | null>;
  listObjects(prefix?: string, maxKeys?: number): Promise<StorageObjectMetadata[]>;
  copyObject(sourceKey: string, destKey: string): Promise<boolean>;
  getObjectMetadata(key: string): Promise<StorageObjectMetadata | null>;
  ping(): Promise<StorageHealthCheck>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubS3StorageProvider implements IS3StorageProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-s3-storage',
    displayName:    'Stub S3 Storage Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       12,
    healthStatus:   'unknown',
    capabilities:   ['upload', 'download', 'delete', 'presigned-url', 'list', 'copy', 'metadata'],
    futureProvider: 's3',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async upload(_k: string, _d: Blob | Buffer, _o?: S3UploadOptions): Promise<null> { return null; }
  async download(_k: string): Promise<null> { return null; }
  async delete(_k: string): Promise<boolean> { return false; }
  async exists(_k: string): Promise<boolean> { return false; }
  async getPresignedUrl(_k: string, _o: PresignedUrlOptions): Promise<null> { return null; }
  async listObjects(_prefix?: string, _max?: number): Promise<StorageObjectMetadata[]> { return []; }
  async copyObject(_src: string, _dst: string): Promise<boolean> { return false; }
  async getObjectMetadata(_k: string): Promise<null> { return null; }
  async ping(): Promise<StorageHealthCheck> { return { connected: false, latencyMs: 0 }; }
}

export const stubS3StorageProvider = new StubS3StorageProvider();
