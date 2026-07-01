/**
 * lib/infrastructure/providers/cdn-provider.ts
 *
 * CDN Provider — Interface + Stub Implementation
 *
 * ICDNProvider: content delivery network interface.
 * StubCDNProvider: no-op when ENABLE_CDN = false.
 *
 * Future provider (Phase 6D-2): Cloudflare CDN / Workers KV
 * Swap: register CloudflareProvider — no business logic changes.
 */

import type { ProviderMetadata } from '../types';

// ---------------------------------------------------------------------------
// CDN TYPES
// ---------------------------------------------------------------------------

export interface CacheInvalidationRequest {
  paths: string[];
  zone?: string;
}

export interface CDNUploadResult {
  publicUrl: string;
  cdnUrl: string;
  etag?: string;
}

export interface CDNStats {
  bandwidthUsedBytes: number;
  cacheHitRate: number;
  requestsServed: number;
}

// ---------------------------------------------------------------------------
// INTERFACE
// ---------------------------------------------------------------------------

export interface ICDNProvider {
  getMetadata(): ProviderMetadata;
  getPublicUrl(path: string): string;
  purgeCache(request: CacheInvalidationRequest): Promise<{ purged: number }>;
  upload(path: string, data: Blob, contentType: string): Promise<CDNUploadResult | null>;
  getStats(): Promise<CDNStats | null>;
  isEnabled(): boolean;
}

// ---------------------------------------------------------------------------
// STUB IMPLEMENTATION
// ---------------------------------------------------------------------------

export class StubCDNProvider implements ICDNProvider {
  private readonly metadata: ProviderMetadata = {
    id:             'stub-cdn',
    displayName:    'Stub CDN Provider',
    version:        '1.0.0',
    enabled:        false,
    dependencies:   [],
    priority:       40,
    healthStatus:   'unknown',
    capabilities:   ['publicUrl', 'purgeCache', 'upload', 'stats'],
    futureProvider: 'cloudflare',
  };

  getMetadata(): ProviderMetadata {
    return { ...this.metadata };
  }

  getPublicUrl(path: string): string {
    // Return relative path — no CDN transformation in stub mode
    return path;
  }

  async purgeCache(_request: CacheInvalidationRequest): Promise<{ purged: number }> {
    return { purged: 0 };
  }

  async upload(_path: string, _data: Blob, _contentType: string): Promise<CDNUploadResult | null> {
    return null;
  }

  async getStats(): Promise<CDNStats | null> {
    return null;
  }

  isEnabled(): boolean {
    return false;
  }
}

export const stubCDNProvider = new StubCDNProvider();
