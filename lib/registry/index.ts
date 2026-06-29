/**
 * lib/registry/index.ts
 * Registry layer entry point
 */

// Core registries
export * from './format-registry';
export * from './conversion-registry';
export * from './tool-registry';
export * from './provider-registry';
export * from './category-registry';

// Viewer and Editor registries (explicit selective exports to avoid conflicts)
export { viewerRegistry, VIEWER_ENGINES, VIEWER_CATEGORIES, type ViewerCapability, type ViewerCategory } from './viewer-registry';
export { editorRegistry, EDITOR_DEFINITIONS } from './editor-registry';

// Unified registry (explicit exports)
export { unifiedRegistry, type UnifiedToolDefinition } from './unified-registry';

// New Phase 2.1 registries
export * from './capability-registry';
export * from './relationship-registry';
export * from './metadata-registry';
export * from './tool-identity-registry';
export * from './knowledge-registry';
