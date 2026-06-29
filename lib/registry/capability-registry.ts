/**
 * lib/registry/capability-registry.ts
 * Capability Matrix - defines format capabilities for converters/viewers/editors
 *
 * This is pure architecture metadata - no SEO content.
 * Used for UI feature toggling, provider selection, and validation.
 */

import type { FormatCategory, ProcessingEngine } from '../types/formats';
import { formatRegistry } from './format-registry';
import { familyEngine } from '../engine/family-engine';

// ---------------------------------------------------------------------------
// CAPABILITY TYPES
// ---------------------------------------------------------------------------

export interface FormatCapabilities {
  /** Supports alpha transparency */
  transparency: boolean;
  /** Supports animation */
  animation: boolean;
  /** Supports multiple layers */
  layers: boolean;
  /** Vector-based (scalable) */
  vector: boolean;
  /** 3D model data */
  model3d: boolean;
  /** Audio streams */
  audio: boolean;
  /** Video streams */
  video: boolean;
  /** Text content */
  text: boolean;
  /** Binary data */
  binary: boolean;
  /** Archive container */
  archive: boolean;
  /** DRM protection possible */
  drmCapable: boolean;
  /** Encryption support */
  encryptionCapable: boolean;
  /** Metadata embedded */
  metadataSupport: 'none' | 'basic' | 'exif' | 'xmp' | 'full';
  /** Color depth */
  colorDepth: '8bit' | '10bit' | '16bit' | '32bit' | 'float' | 'mixed';
  /** Compression type */
  compression: 'lossless' | 'lossy' | 'both' | 'none';
  /** Maximum dimensions (for images) */
  maxDimensions?: number;
  /** Maximum file size in bytes for this format */
  maxFileSize?: number;
}

export interface ConversionCapability {
  source: string;
  target: string;
  lossy: boolean;
  requiresTranscoding: boolean;
  preservesMetadata: boolean;
  preservesTransparency: boolean;
  preservesAnimation: boolean;
  preservesLayers: boolean;
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  typicalTimeMs: number;
  memoryRequirement: 'low' | 'medium' | 'high' | 'very-high';
}

export interface ViewerCapability {
  browserNative: boolean;
  requiresPlugin: boolean;
  requiresServerProcessing: boolean;
  streamingSupport: boolean;
  seekable: boolean;
  zoomable: boolean;
  rotatable: boolean;
  fullscreen: boolean;
}

export interface EditorCapability {
  canCrop: boolean;
  canResize: boolean;
  canRotate: boolean;
  canFlip: boolean;
  canAdjust: boolean;
  canFilter: boolean;
  canWatermark: boolean;
  canAnnotate: boolean;
  canRedact: boolean;
  canMerge: boolean;
  canSplit: boolean;
  canExtract: boolean;
}

// ---------------------------------------------------------------------------
// FORMAT CAPABILITY DEFINITIONS
// ---------------------------------------------------------------------------

const FORMAT_CAPABILITIES: Record<string, FormatCapabilities> = {
  // ── Raster Images ────────────────────────────────────────────────────────
  png: {
    transparency: true, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '16bit', compression: 'lossless',
    maxDimensions: 4294967295, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  jpg: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '8bit', compression: 'lossy',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  jpeg: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '8bit', compression: 'lossy',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  gif: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'basic', colorDepth: '8bit', compression: 'lossless',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  webp: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '8bit', compression: 'both',
    maxDimensions: 16383, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  avif: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '16bit', compression: 'lossy',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  bmp: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: '32bit', compression: 'none',
    maxDimensions: 4294967295, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  tiff: {
    transparency: true, animation: false, layers: true, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '16bit', compression: 'both',
    maxDimensions: 4294967295, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  heic: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '16bit', compression: 'lossy',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },
  heif: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'exif', colorDepth: '16bit', compression: 'both',
    maxDimensions: 65535, maxFileSize: Number.MAX_SAFE_INTEGER,
  },

  // ── Vector & Design ───────────────────────────────────────────────────────
  svg: {
    transparency: true, animation: true, layers: false, vector: true,
    model3d: false, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'xmp', colorDepth: 'mixed', compression: 'lossless',
  },
  ai: {
    transparency: true, animation: false, layers: true, vector: true,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'xmp', colorDepth: 'mixed', compression: 'lossless',
  },
  eps: {
    transparency: true, animation: false, layers: false, vector: true,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'basic', colorDepth: 'mixed', compression: 'lossless',
  },
  psd: {
    transparency: true, animation: false, layers: true, vector: true,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'xmp', colorDepth: '32bit', compression: 'lossless',
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  ico: {
    transparency: true, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: '32bit', compression: 'lossless',
    maxDimensions: 256,
  },
  icns: {
    transparency: true, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: '32bit', compression: 'lossless',
    maxDimensions: 1024,
  },

  // ── Video ──────────────────────────────────────────────────────────────────
  mp4: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: false, audio: true, video: true, text: true, binary: true,
    archive: false, drmCapable: true, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '10bit', compression: 'lossy',
  },
  webm: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: true, video: true, text: true, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '10bit', compression: 'lossy',
  },
  avi: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: false, audio: true, video: true, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'basic', colorDepth: '8bit', compression: 'both',
  },
  mov: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: false, audio: true, video: true, text: true, binary: true,
    archive: false, drmCapable: true, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '10bit', compression: 'both',
  },
  mkv: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: false, audio: true, video: true, text: true, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '16bit', compression: 'both',
  },
  gif_video: {
    transparency: true, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: true, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'basic', colorDepth: '8bit', compression: 'lossless',
  },

  // ── Audio ──────────────────────────────────────────────────────────────────
  mp3: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: true, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '8bit', compression: 'lossy',
  },
  wav: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'basic', colorDepth: '32bit', compression: 'none',
  },
  flac: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '32bit', compression: 'lossless',
  },
  aac: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: true, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '8bit', compression: 'lossy',
  },
  ogg: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '8bit', compression: 'lossy',
  },
  opus: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: '8bit', compression: 'lossy',
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  pdf: {
    transparency: true, animation: false, layers: false, vector: true,
    model3d: false, audio: false, video: true, text: true, binary: true,
    archive: false, drmCapable: true, encryptionCapable: true,
    metadataSupport: 'xmp', colorDepth: 'mixed', compression: 'both',
  },
  docx: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: true, binary: true,
    archive: true, drmCapable: true, encryptionCapable: true,
    metadataSupport: 'full', colorDepth: 'mixed', compression: 'lossless',
  },
  xlsx: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: true, binary: true,
    archive: true, drmCapable: true, encryptionCapable: true,
    metadataSupport: 'full', colorDepth: 'mixed', compression: 'lossless',
  },
  epub: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: true, video: false, text: true, binary: true,
    archive: true, drmCapable: true, encryptionCapable: false,
    metadataSupport: 'full', colorDepth: 'mixed', compression: 'lossless',
  },

  // ── Archives ───────────────────────────────────────────────────────────────
  zip: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: true, drmCapable: false, encryptionCapable: true,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'lossless',
  },
  '7z': {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: false, binary: true,
    archive: true, drmCapable: false, encryptionCapable: true,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'lossless',
  },

  // ── CAD ─────────────────────────────────────────────────────────────────────
  stl: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: true, audio: false, video: false, text: false, binary: true,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'none',
  },
  obj: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: true, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'none',
  },
  step: {
    transparency: false, animation: false, layers: true, vector: true,
    model3d: true, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'lossless',
  },

  // ── Text ────────────────────────────────────────────────────────────────────
  txt: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'none',
  },
  html: {
    transparency: false, animation: true, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'none',
  },
  json: {
    transparency: false, animation: false, layers: false, vector: false,
    model3d: false, audio: false, video: false, text: true, binary: false,
    archive: false, drmCapable: false, encryptionCapable: false,
    metadataSupport: 'none', colorDepth: 'mixed', compression: 'none',
  },
};

// ---------------------------------------------------------------------------
// VIEWER CAPABILITIES
// ---------------------------------------------------------------------------

const VIEWER_CAPABILITIES: Record<string, ViewerCapability> = {
  'native-image': {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: false,
    seekable: false,
    zoomable: true,
    rotatable: true,
    fullscreen: true,
  },
  video: {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: true,
    seekable: true,
    zoomable: false,
    rotatable: false,
    fullscreen: true,
  },
  audio: {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: true,
    seekable: true,
    zoomable: false,
    rotatable: false,
    fullscreen: false,
  },
  pdf: {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: true,
    seekable: true,
    zoomable: true,
    rotatable: true,
    fullscreen: true,
  },
  svg: {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: false,
    seekable: false,
    zoomable: true,
    rotatable: true,
    fullscreen: true,
  },
  text: {
    browserNative: true,
    requiresPlugin: false,
    requiresServerProcessing: false,
    streamingSupport: false,
    seekable: true,
    zoomable: true,
    rotatable: false,
    fullscreen: false,
  },
  archive: {
    browserNative: false,
    requiresPlugin: false,
    requiresServerProcessing: true,
    streamingSupport: false,
    seekable: false,
    zoomable: false,
    rotatable: false,
    fullscreen: false,
  },
  ebook: {
    browserNative: false,
    requiresPlugin: false,
    requiresServerProcessing: true,
    streamingSupport: false,
    seekable: true,
    zoomable: true,
    rotatable: false,
    fullscreen: true,
  },
  cad: {
    browserNative: false,
    requiresPlugin: true,
    requiresServerProcessing: true,
    streamingSupport: false,
    seekable: false,
    zoomable: true,
    rotatable: true,
    fullscreen: true,
  },
  '3d-model': {
    browserNative: false,
    requiresPlugin: true,
    requiresServerProcessing: true,
    streamingSupport: false,
    seekable: false,
    zoomable: true,
    rotatable: true,
    fullscreen: true,
  },
};

// ---------------------------------------------------------------------------
// CAPABILITY REGISTRY CLASS
// ---------------------------------------------------------------------------

class CapabilityRegistry {
  private formatCapabilities: Map<string, FormatCapabilities>;
  private viewerCapabilities: Map<string, ViewerCapability>;

  constructor() {
    this.formatCapabilities = new Map(
      Object.entries(FORMAT_CAPABILITIES).map(([ext, caps]) => [ext.toLowerCase(), caps])
    );
    this.viewerCapabilities = new Map(
      Object.entries(VIEWER_CAPABILITIES)
    );
  }

  /**
   * Get capabilities for a format
   */
  getCapabilities(ext: string): FormatCapabilities | null {
    const caps = this.formatCapabilities.get(ext.toLowerCase());
    if (caps) return caps;

    // Try to get from family
    const family = familyEngine.getFamily(ext);
    if (family) {
      const familyCaps = family.sharedCapabilities;
      return {
        transparency: familyCaps.transparency,
        animation: familyCaps.animation,
        layers: familyCaps.layers,
        vector: familyCaps.vector,
        model3d: false,
        audio: false,
        video: false,
        text: false,
        binary: true,
        archive: false,
        drmCapable: false,
        encryptionCapable: false,
        metadataSupport: 'basic',
        colorDepth: familyCaps.colorDepth,
        compression: familyCaps.compression === 'both' ? 'both' : familyCaps.compression,
      };
    }

    return null;
  }

  /**
   * Check if format supports a specific capability
   */
  hasCapability(ext: string, capability: keyof FormatCapabilities): boolean {
    const caps = this.getCapabilities(ext);
    if (!caps) return false;
    const value = caps[capability];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== 'none';
    return false;
  }

  /**
   * Check if conversion preserves capability
   */
  conversionPreservesCapability(source: string, target: string, capability: keyof FormatCapabilities): boolean {
    const sourceCaps = this.getCapabilities(source);
    const targetCaps = this.getCapabilities(target);

    if (!sourceCaps || !targetCaps) return false;

    const sourceHas = sourceCaps[capability];
    const targetSupports = targetCaps[capability];

    if (typeof sourceHas === 'boolean' && typeof targetSupports === 'boolean') {
      return !sourceHas || targetSupports; // If source has it, target must support it
    }

    return true; // Assume preserved for non-boolean capabilities
  }

  /**
   * Get viewer capabilities for engine
   */
  getViewerCapabilities(engine: string): ViewerCapability | null {
    return this.viewerCapabilities.get(engine) ?? null;
  }

  /**
   * Check if viewer supports capability
   */
  viewerHasCapability(engine: string, capability: keyof ViewerCapability): boolean {
    const caps = this.viewerCapabilities.get(engine);
    return caps?.[capability] ?? false;
  }

  /**
   * Get formats by capability
   */
  getFormatsWithCapability(capability: keyof FormatCapabilities, value: boolean = true): string[] {
    const formats: string[] = [];
    for (const [ext, caps] of Array.from(this.formatCapabilities.entries())) {
      const capValue = caps[capability];
      if (typeof capValue === 'boolean' && capValue === value) {
        formats.push(ext);
      }
    }
    return formats;
  }

  /**
   * Get capability warnings for conversion
   */
  getConversionWarnings(source: string, target: string): string[] {
    const warnings: string[] = [];
    const sourceCaps = this.getCapabilities(source);
    const targetCaps = this.getCapabilities(target);

    if (!sourceCaps || !targetCaps) return warnings;

    if (sourceCaps.transparency && !targetCaps.transparency) {
      warnings.push('Transparency will be lost');
    }
    if (sourceCaps.animation && !targetCaps.animation) {
      warnings.push('Animation will be lost');
    }
    if (sourceCaps.layers && !targetCaps.layers) {
      warnings.push('Layers will be flattened');
    }
    if (sourceCaps.vector && !targetCaps.vector) {
      warnings.push('Vector data will be rasterized');
    }
    if (sourceCaps.model3d && !targetCaps.model3d) {
      warnings.push('3D data will be converted to 2D');
    }
    if (sourceCaps.audio && !targetCaps.audio) {
      warnings.push('Audio will be removed');
    }
    if (sourceCaps.compression === 'lossless' && targetCaps.compression === 'lossy') {
      warnings.push('Quality loss expected due to lossy compression');
    }

    return warnings;
  }

  /**
   * Register custom capability
   */
  registerCapability(ext: string, capabilities: FormatCapabilities): void {
    this.formatCapabilities.set(ext.toLowerCase(), capabilities);
  }

  /**
   * Get all capability keys
   */
  getAllCapabilityKeys(): (keyof FormatCapabilities)[] {
    return [
      'transparency', 'animation', 'layers', 'vector', 'model3d',
      'audio', 'video', 'text', 'binary', 'archive',
      'drmCapable', 'encryptionCapable', 'metadataSupport',
      'colorDepth', 'compression',
    ];
  }
}

export const capabilityRegistry = new CapabilityRegistry();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getFormatCapabilities(ext: string): FormatCapabilities | null {
  return capabilityRegistry.getCapabilities(ext);
}

export function formatHasCapability(ext: string, capability: keyof FormatCapabilities): boolean {
  return capabilityRegistry.hasCapability(ext, capability);
}

export function getConversionWarnings(source: string, target: string): string[] {
  return capabilityRegistry.getConversionWarnings(source, target);
}

export function getViewerCapabilities(engine: string): ViewerCapability | null {
  return capabilityRegistry.getViewerCapabilities(engine);
}
