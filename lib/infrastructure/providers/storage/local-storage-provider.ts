/**
 * lib/infrastructure/providers/storage/local-storage-provider.ts
 *
 * Local Storage Provider — Interface + Stub
 *
 * ILocalStorageProvider: Node.js filesystem-based storage.
 * StubLocalStorageProvider: no-op stub (browser remains default).
 *
 * Used for: temporary file storage on the server, uploaded file staging.
 * Future provider (Phase 6D-2): Node.js fs module implementation.
 */

import type { ProviderMetadata } from '../../types';
import type { StorageObjectMetadata, StorageHealthCheck } from './storage-types';

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ILocalStorageProvider {
  getMetadata(): ProviderMetadata;
  write(path: string, data: Blob | ArrayBuffer, contentType?: string): Promise<string | null>;
  read(path: string): Promise<Blob | null>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  list(directory: string): Promise<StorageObjectMetadata[]>;
  ensureDirectory(path: string): Promise<void>;
  getTempPath(filename: string): string;
  cleanup(olderThanMs: number): Promise<number>;
  ping(): Promise<StorageHealthCheck>;
}

// ---------------------------------------------------------------------------
// STUB
// ---------------------------------------------------------------------------

export class StubLocalStorageProvider implements ILocalStorageProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-local-storage',
    displayName:    'Stub Local Storage Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       11,
    healthStatus:   'unknown',
    capabilities:   ['write', 'read', 'delete', 'list', 'temp-files'],
    futureProvider: 'local-fs',
  };

  getMetadata(): ProviderMetadata { return { ...this.metadata }; }

  async write(_path: string, _data: Blob | ArrayBuffer, _ct?: string): Promise<null> { return null; }
  async read(_path: string): Promise<null> { return null; }
  async delete(_path: string): Promise<boolean> { return false; }
  async exists(_path: string): Promise<boolean> { return false; }
  async list(_dir: string): Promise<StorageObjectMetadata[]> { return []; }
  async ensureDirectory(_path: string): Promise<void> { /* no-op */ }
  getTempPath(filename: string): string { return `/tmp/${filename}`; }
  async cleanup(_olderThanMs: number): Promise<number> { return 0; }
  async ping(): Promise<StorageHealthCheck> { return { connected: false, latencyMs: 0 }; }
}

export const stubLocalStorageProvider = new StubLocalStorageProvider();
