/**
 * lib/providers/index.ts
 * Provider layer entry point — Phase 6B Part 2
 *
 * Exports all concrete browser provider implementations.
 * Providers are NOT imported eagerly here — they are lazy-loaded by the
 * Provider Selection Engine via resolveNewProviderAsync() in conversion-service.ts.
 *
 * This index exists solely for type-safe direct imports where needed.
 */

export * from './base-provider';
export * from './canvas-provider';
export * from './ffmpeg-provider';
export * from './pdf-provider';
// Phase 6B Part 2 providers:
export * from './document-provider';
export * from './archive-provider';
export * from './ebook-provider';
export * from './font-provider';
export * from './vector-provider';
export * from './webpage-provider';
