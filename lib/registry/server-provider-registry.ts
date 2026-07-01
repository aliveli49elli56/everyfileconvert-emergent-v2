/**
 * lib/registry/server-provider-registry.ts
 *
 * Phase 6D-1 Part 2 — Server Provider Registry
 *
 * DEDICATED registry for server-side processing providers only.
 * COMPLETELY ADDITIVE — existing registries are untouched:
 *   FormatRegistry, ProcessorRegistry, LibraryRegistry,
 *   ConversionRegistry, CategoryRegistry, InfrastructureRegistry
 *
 * Design:
 *   - Metadata-driven: adding a provider = registration only, no code changes
 *   - Integrates with DI container for service resolution
 *   - Supports capability-based queries (find provider by format/type)
 *   - Health checking and availability reporting
 *   - Does NOT replace or conflict with ProviderSelectionEngine
 */

import type { ProviderMetadata } from '../infrastructure/types';
import type { ServiceContainer } from '../di/service-container';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ServerProviderType =
  | 'video'
  | 'audio'
  | 'document'
  | 'image'
  | 'ebook'
  | 'pdf'
  | 'ocr'
  | 'ai'
  | 'general';

export interface ServerProviderCapability {
  /** Input formats this capability handles */
  inputFormats:  string[];
  /** Output formats this capability produces */
  outputFormats: string[];
  /** Max file size in bytes (0 = unlimited) */
  maxFileSizeBytes: number;
  /** Whether this capability requires premium subscription */
  requiresPremium: boolean;
  /** Estimated quality score 0–100 */
  qualityScore: number;
}

export interface ServerProviderRegistration {
  /** DI token ID for container lookup */
  tokenId:      string;
  /** Provider type category */
  providerType: ServerProviderType;
  /** ProviderMetadata from the provider instance */
  metadata:     ProviderMetadata;
  /** Capabilities this provider exposes */
  capabilities: ServerProviderCapability[];
  /** API endpoint for this provider (empty when using stubs) */
  apiEndpoint?:  string;
}

export interface ServerProviderEntry {
  registration: ServerProviderRegistration;
  registeredAt: string;
}

// ---------------------------------------------------------------------------
// SERVER PROVIDER REGISTRY
// ---------------------------------------------------------------------------

export class ServerProviderRegistry {
  private readonly entries     = new Map<string, ServerProviderEntry>();
  private container: ServiceContainer | null = null;

  // ── Setup ──────────────────────────────────────────────────────────────────

  setContainer(c: ServiceContainer): void {
    this.container = c;
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a server provider.
   * This is the ONLY thing needed to add a new server provider.
   * No existing business logic requires modification.
   */
  register(registration: ServerProviderRegistration): void {
    this.entries.set(registration.metadata.id, {
      registration,
      registeredAt: new Date().toISOString(),
    });
  }

  // ── Retrieval ──────────────────────────────────────────────────────────────

  get(id: string): ServerProviderRegistration | undefined {
    return this.entries.get(id)?.registration;
  }

  getAll(): ServerProviderRegistration[] {
    return Array.from(this.entries.values()).map(e => e.registration);
  }

  getByType(type: ServerProviderType): ServerProviderRegistration[] {
    return this.getAll().filter(r => r.providerType === type);
  }

  /**
   * Find providers that can handle a specific format conversion.
   * Returns providers sorted by quality score (highest first).
   */
  getByCapability(inputFormat: string, outputFormat: string): ServerProviderRegistration[] {
    return this.getAll()
      .filter(r => r.capabilities.some(cap =>
        cap.inputFormats.includes(inputFormat.toLowerCase()) &&
        cap.outputFormats.includes(outputFormat.toLowerCase()),
      ))
      .sort((a, b) => {
        const aScore = Math.max(...a.capabilities.map(c => c.qualityScore));
        const bScore = Math.max(...b.capabilities.map(c => c.qualityScore));
        return bScore - aScore;
      });
  }

  /**
   * Get the best available provider for a conversion.
   */
  getBestProvider(inputFormat: string, outputFormat: string): ServerProviderRegistration | null {
    const candidates = this.getByCapability(inputFormat, outputFormat);
    return candidates.find(r => r.metadata.enabled) ?? candidates[0] ?? null;
  }

  /**
   * Get all enabled (real, non-stub) providers.
   */
  getAvailableProviders(): ServerProviderRegistration[] {
    return this.getAll().filter(r => r.metadata.enabled);
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  getHealthReport(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<ServerProviderType, number>;
    providers: Array<{ id: string; type: ServerProviderType; status: string; enabled: boolean }>;
  } {
    const all    = this.getAll();
    const byType = {} as Record<ServerProviderType, number>;
    all.forEach(r => {
      byType[r.providerType] = (byType[r.providerType] ?? 0) + 1;
    });

    return {
      total:    all.length,
      enabled:  all.filter(r => r.metadata.enabled).length,
      disabled: all.filter(r => !r.metadata.enabled).length,
      byType,
      providers: all.map(r => ({
        id:      r.metadata.id,
        type:    r.providerType,
        status:  r.metadata.healthStatus,
        enabled: r.metadata.enabled,
      })),
    };
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  has(id: string): boolean { return this.entries.has(id); }
  count(): number { return this.entries.size; }
  listIds(): string[] { return Array.from(this.entries.keys()); }
}

// ---------------------------------------------------------------------------
// SINGLETON + REGISTRATION
// ---------------------------------------------------------------------------

export const serverProviderRegistry = new ServerProviderRegistry();

// Pre-register all server provider stubs
// Each stub is registered with its format capabilities for future routing.
import { stubFFmpegServerProvider }   from '../infrastructure/providers/server/ffmpeg-server-provider';
import { stubLibreOfficeProvider }    from '../infrastructure/providers/server/libreoffice-provider';
import { stubGhostscriptProvider }    from '../infrastructure/providers/server/ghostscript-provider';
import { stubSharpProvider }          from '../infrastructure/providers/server/sharp-provider';
import { stubPuppeteerProvider }      from '../infrastructure/providers/server/puppeteer-provider';
import { stubCalibreProvider, stubOCRProvider, stubAIProcessingProvider } from '../infrastructure/providers/server/calibre-provider';

serverProviderRegistry.register({
  tokenId:      'FFmpegServerProvider',
  providerType: 'video',
  metadata:     stubFFmpegServerProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['mp4','avi','mov','mkv','wmv','flv','webm'], outputFormats: ['mp4','avi','mov','mkv','wmv','flv','webm','gif'], maxFileSizeBytes: 0, requiresPremium: false, qualityScore: 95 },
    { inputFormats: ['mp4','avi','mov','mkv','wmv','flv','webm','mp3','aac','ogg'], outputFormats: ['mp3','aac','wav','ogg','flac'], maxFileSizeBytes: 0, requiresPremium: false, qualityScore: 90 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'LibreOfficeProvider',
  providerType: 'document',
  metadata:     stubLibreOfficeProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['docx','doc','odt','rtf','xlsx','xls','ods','pptx','ppt','odp'], outputFormats: ['pdf','docx','odt','xlsx','ods','pptx'], maxFileSizeBytes: 100 * 1024 * 1024, requiresPremium: false, qualityScore: 92 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'GhostscriptProvider',
  providerType: 'pdf',
  metadata:     stubGhostscriptProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['pdf'], outputFormats: ['pdf','png','jpg','tiff'], maxFileSizeBytes: 0, requiresPremium: false, qualityScore: 88 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'SharpProvider',
  providerType: 'image',
  metadata:     stubSharpProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['png','jpg','jpeg','tiff','bmp','gif','webp','svg','avif'], outputFormats: ['png','jpg','jpeg','webp','avif','tiff','gif'], maxFileSizeBytes: 0, requiresPremium: false, qualityScore: 96 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'PuppeteerProvider',
  providerType: 'document',
  metadata:     stubPuppeteerProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['html','url'], outputFormats: ['pdf','png','jpg'], maxFileSizeBytes: 0, requiresPremium: true, qualityScore: 90 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'CalibreProvider',
  providerType: 'ebook',
  metadata:     stubCalibreProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['epub','mobi','azw','azw3','fb2','lit'], outputFormats: ['epub','mobi','azw3','pdf','txt','html'], maxFileSizeBytes: 0, requiresPremium: false, qualityScore: 85 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'OCRProvider',
  providerType: 'ocr',
  metadata:     stubOCRProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['png','jpg','jpeg','tiff','bmp','pdf'], outputFormats: ['txt','pdf','hocr'], maxFileSizeBytes: 50 * 1024 * 1024, requiresPremium: true, qualityScore: 88 },
  ],
});

serverProviderRegistry.register({
  tokenId:      'AIProcessingProvider',
  providerType: 'ai',
  metadata:     stubAIProcessingProvider.getMetadata(),
  capabilities: [
    { inputFormats: ['pdf','docx','doc','txt','png','jpg'], outputFormats: ['json','txt'], maxFileSizeBytes: 20 * 1024 * 1024, requiresPremium: true, qualityScore: 92 },
  ],
});
