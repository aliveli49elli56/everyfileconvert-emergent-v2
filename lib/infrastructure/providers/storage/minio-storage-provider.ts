/**
 * lib/infrastructure/providers/storage/minio-storage-provider.ts
 *
 * MinIO Storage Provider — Interface + Stub
 *
 * IMinioStorageProvider: MinIO S3-compatible object storage interface.
 * StubMinioStorageProvider: no-op stub.
 *
 * Future provider (Phase 6D-2): MinIO SDK implementation.
 * Designed for self-hosted S3-compatible storage on Hetzner/Docker.
 */

import type { ProviderMetadata } from '../../types';
import type { StorageObjectMetadata, StorageHealthCheck, PresignedUrlOptions } from './storage-types';

// ---------------------------------------------------------------------------
// MINIO CONFIG
// ---------------------------------------------------------------------------

export interface MinioConfig {
  endpoint:        string;
  port:            number;
  useSSL:          boolean;
  accessKey:       string;
  secretKey:       string;
  bucket:          string;
  region?:         string;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface IMinioStorageProvider {
  getMetadata(): ProviderMetadata;
  upload(key: string, data: Blob | Buffer, contentType?: string): Promise<{ etag: string; key: string } | null>;
  download(key: string): Promise<Blob | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getPresignedUrl(key: string, options: PresignedUrlOptions): Promise<string | null>;
  listObjects(prefix?: string): Promise<StorageObjectMetadata[]>;
  ensureBucket(): Promise<boolean>;
  ping(): Promise<StorageHealthCheck>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubMinioStorageProvider implements IMinioStorageProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-minio-storage',
    displayName:    'Stub MinIO Storage Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       13,
    healthStatus:   'unknown',
    capabilities:   ['upload', 'download', 'delete', 'presigned-url', 'list', 'bucket-management'],
    futureProvider: 'minio',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async upload(_k: string, _d: Blob | Buffer, _ct?: string): Promise<null> { return null; }
  async download(_k: string): Promise<null> { return null; }
  async delete(_k: string): Promise<boolean> { return false; }
  async exists(_k: string): Promise<boolean> { return false; }
  async getPresignedUrl(_k: string, _o: PresignedUrlOptions): Promise<null> { return null; }
  async listObjects(_prefix?: string): Promise<StorageObjectMetadata[]> { return []; }
  async ensureBucket(): Promise<boolean> { return false; }
  async ping(): Promise<StorageHealthCheck> { return { connected: false, latencyMs: 0 }; }
}

export const stubMinioStorageProvider = new StubMinioStorageProvider();
