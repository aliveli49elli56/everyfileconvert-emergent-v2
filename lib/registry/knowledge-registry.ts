/**
 * lib/registry/knowledge-registry.ts
 * Knowledge Engine - technical metadata for formats
 *
 * Contains: official name, aliases, MIME types, magic numbers, capabilities, browser support
 *
 * NOTE: This is technical metadata ONLY - no SEO content.
 * SEO descriptions and content are handled by the SEO layer.
 */

import type { FormatCategory } from '../types/formats';
import { aliasEngine } from '../engine/alias-engine';
import { familyEngine } from '../engine/family-engine';
import { mimeEngine } from '../engine/mime-engine';
import { signatureEngine } from '../engine/signature-engine';

// ---------------------------------------------------------------------------
// KNOWLEDGE TYPES
// ---------------------------------------------------------------------------

export interface FormatKnowledge {
  ext: string;
  officialName: string;
  aliases: string[];
  description: string;
  category: FormatCategory;
  subcategory?: string;
  inventedBy?: string;
  inventedYear?: number;
  standardBody?: string;

  // MIME types
  mimeTypes: {
    primary: string;
    alternatives: string[];
    deprecated?: string[];
  };

  // File signatures
  signatures: {
    hex: string[];
    offset: number;
    reliability: 'high' | 'medium' | 'low';
  };

  // Technical capabilities
  capabilities: {
    lossless: boolean;
    animation: boolean;
    transparency: boolean;
    layers: boolean;
    vector: boolean;
    audio: boolean;
    video: boolean;
    metadata: boolean;
    drm: boolean;
    colorDepth: number;
    maxResolution?: number;
    maxFileSize?: number;
  };

  // Browser support
  browserSupport: {
    viewing: 'native' | 'plugin' | 'server' | 'none';
    editing: 'native' | 'plugin' | 'server' | 'none';
    saving: boolean;
    streaming: boolean;
    supportedBrowsers: string[];
  };

  // Platform support
  platformSupport: {
    windows: 'native' | 'app' | 'none';
    macos: 'native' | 'app' | 'none';
    linux: 'native' | 'app' | 'none';
    ios: 'native' | 'app' | 'none';
    android: 'native' | 'app' | 'none';
  };

  // Software associations
  software: {
    primaryEditors: string[];
    primaryViewers: string[];
    openSourceSupport: boolean;
  };

  // Conversion notes
  conversionNotes?: {
    lossyConversions: string[];
    losslessTo: string[];
    qualityWarning?: string;
    commonPitfalls?: string[];
  };
}

// ---------------------------------------------------------------------------
// FORMAT KNOWLEDGE DATABASE
// ---------------------------------------------------------------------------

export const FORMAT_KNOWLEDGE: Record<string, FormatKnowledge> = {
  // ── Images ──────────────────────────────────────────────────────────────────
  png: {
    ext: 'png',
    officialName: 'Portable Network Graphics',
    aliases: [],
    description: 'Lossless raster image format supporting full alpha channel transparency.',
    category: 'image',
    subcategory: 'raster',
    inventedBy: 'PNG Development Group',
    inventedYear: 1996,
    standardBody: 'ISO/IEC 15948',
    mimeTypes: {
      primary: 'image/png',
      alternatives: ['image/x-png'],
    },
    signatures: {
      hex: ['89504E470D0A1A0A'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: true,
      animation: false,
      transparency: true,
      layers: false,
      vector: false,
      audio: false,
      video: false,
      metadata: true,
      drm: false,
      colorDepth: 48,
      maxResolution: 2147483647,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: false,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Photoshop', 'GIMP', 'Affinity Photo'],
      primaryViewers: ['all'],
      openSourceSupport: true,
    },
  },
  jpg: {
    ext: 'jpg',
    officialName: 'JPEG',
    aliases: ['jpeg'],
    description: 'Lossy raster image format designed for photographic content.',
    category: 'image',
    subcategory: 'raster',
    inventedBy: 'Joint Photographic Experts Group',
    inventedYear: 1992,
    standardBody: 'ISO/IEC 10918-1',
    mimeTypes: {
      primary: 'image/jpeg',
      alternatives: ['image/pjpeg'],
    },
    signatures: {
      hex: ['FFD8FF'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: false,
      animation: false,
      transparency: false,
      layers: false,
      vector: false,
      audio: false,
      video: false,
      metadata: true,
      drm: false,
      colorDepth: 24,
      maxResolution: 65535,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Photoshop', 'Lightroom', 'GIMP'],
      primaryViewers: ['all'],
      openSourceSupport: true,
    },
    conversionNotes: {
      losslessTo: [],
      lossyConversions: ['png', 'webp', 'tiff'],
      qualityWarning: 'Multiple saves degrade quality',
    },
  },
  webp: {
    ext: 'webp',
    officialName: 'WebP',
    aliases: [],
    description: 'Modern image format providing both lossless and lossy compression with animation support.',
    category: 'image',
    subcategory: 'raster',
    inventedBy: 'Google',
    inventedYear: 2010,
    standardBody: 'Google',
    mimeTypes: {
      primary: 'image/webp',
      alternatives: [],
    },
    signatures: {
      hex: ['52494646'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: true,
      animation: true,
      transparency: true,
      layers: false,
      vector: false,
      audio: false,
      video: false,
      metadata: true,
      drm: false,
      colorDepth: 24,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: true,
      supportedBrowsers: ['Chrome', 'Firefox', 'Edge', 'Safari 14+'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Photoshop', 'GIMP', 'Affinity Photo'],
      primaryViewers: ['all modern'],
      openSourceSupport: true,
    },
  },
  gif: {
    ext: 'gif',
    officialName: 'Graphics Interchange Format',
    aliases: [],
    description: 'Palette-based image format supporting animation and limited transparency.',
    category: 'image',
    subcategory: 'raster',
    inventedBy: 'CompuServe',
    inventedYear: 1987,
    standardBody: 'CompuServe',
    mimeTypes: {
      primary: 'image/gif',
      alternatives: [],
    },
    signatures: {
      hex: ['47494638', '47494637'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: true,
      animation: true,
      transparency: true,
      layers: false,
      vector: false,
      audio: false,
      video: false,
      metadata: false,
      drm: false,
      colorDepth: 8,
      maxResolution: 65535,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Photoshop', 'GIMP', 'EZGIF'],
      primaryViewers: ['all'],
      openSourceSupport: true,
    },
    conversionNotes: {
      losslessTo: ['png'],
      lossyConversions: ['jpg'],
      qualityWarning: 'Limited to 256 colors per frame',
    },
  },
  svg: {
    ext: 'svg',
    officialName: 'Scalable Vector Graphics',
    aliases: [],
    description: 'XML-based vector image format for two-dimensional graphics.',
    category: 'image',
    subcategory: 'vector',
    inventedBy: 'W3C',
    inventedYear: 1999,
    standardBody: 'W3C',
    mimeTypes: {
      primary: 'image/svg+xml',
      alternatives: [],
    },
    signatures: {
      hex: ['3C3F786D6C', '3C737667'],
      offset: 0,
      reliability: 'medium',
    },
    capabilities: {
      lossless: true,
      animation: true,
      transparency: true,
      layers: false,
      vector: true,
      audio: false,
      video: false,
      metadata: true,
      drm: false,
      colorDepth: 32,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: true,
      supportedBrowsers: ['all modern'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Inkscape', 'Illustrator', 'Figma'],
      primaryViewers: ['all modern browsers'],
      openSourceSupport: true,
    },
  },
  pdf: {
    ext: 'pdf',
    officialName: 'Portable Document Format',
    aliases: [],
    description: 'Document format independent of application software, hardware, and operating systems.',
    category: 'document',
    subcategory: 'fixed-layout',
    inventedBy: 'Adobe',
    inventedYear: 1993,
    standardBody: 'ISO 32000',
    mimeTypes: {
      primary: 'application/pdf',
      alternatives: ['application/x-pdf'],
    },
    signatures: {
      hex: ['25504446'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: true,
      animation: false,
      transparency: true,
      layers: true,
      vector: true,
      audio: false,
      video: false,
      metadata: true,
      drm: true,
      colorDepth: 32,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'server',
      saving: true,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Acrobat', 'Inkscape', 'LibreOffice'],
      primaryViewers: ['Acrobat Reader', 'Browser', 'Preview'],
      openSourceSupport: true,
    },
    conversionNotes: {
      losslessTo: [],
      lossyConversions: ['jpg', 'png'],
      commonPitfalls: ['Encrypted files require password', 'Forms may not convert correctly'],
    },
  },

  // ── Video ───────────────────────────────────────────────────────────────────
  mp4: {
    ext: 'mp4',
    officialName: 'MPEG-4 Part 14',
    aliases: [],
    description: 'Multimedia container format for storing video, audio, and subtitles.',
    category: 'video',
    subcategory: 'container',
    inventedBy: 'MPEG',
    inventedYear: 2001,
    standardBody: 'ISO/IEC 14496-14',
    mimeTypes: {
      primary: 'video/mp4',
      alternatives: ['video/mp4v-es'],
    },
    signatures: {
      hex: [''],
      offset: 4,
      reliability: 'medium',
    },
    capabilities: {
      lossless: false,
      animation: false,
      transparency: false,
      layers: false,
      vector: false,
      audio: true,
      video: true,
      metadata: true,
      drm: true,
      colorDepth: 12,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'server',
      saving: false,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Premiere', 'DaVinci Resolve', 'FFmpeg'],
      primaryViewers: ['all media players'],
      openSourceSupport: true,
    },
  },
  webm: {
    ext: 'webm',
    officialName: 'WebM',
    aliases: [],
    description: 'Open media container format for the web.',
    category: 'video',
    subcategory: 'container',
    inventedBy: 'Google',
    inventedYear: 2010,
    standardBody: 'WebM Project',
    mimeTypes: {
      primary: 'video/webm',
      alternatives: [],
    },
    signatures: {
      hex: ['1A45DFA3'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: false,
      animation: false,
      transparency: true,
      layers: false,
      vector: false,
      audio: true,
      video: true,
      metadata: true,
      drm: false,
      colorDepth: 12,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'server',
      saving: false,
      streaming: true,
      supportedBrowsers: ['Chrome', 'Firefox', 'Edge'],
    },
    platformSupport: {
      windows: 'app',
      macos: 'app',
      linux: 'native',
      ios: 'app',
      android: 'native',
    },
    software: {
      primaryEditors: ['FFmpeg', 'DaVinci Resolve'],
      primaryViewers: ['Chrome', 'Firefox', 'VLC'],
      openSourceSupport: true,
    },
  },

  // ── Audio ───────────────────────────────────────────────────────────────────
  mp3: {
    ext: 'mp3',
    officialName: 'MPEG-1 Audio Layer III',
    aliases: [],
    description: 'Lossy audio coding format for digital audio.',
    category: 'audio',
    subcategory: 'lossy',
    inventedBy: 'Fraunhofer Society',
    inventedYear: 1993,
    standardBody: 'ISO/IEC 11172-3',
    mimeTypes: {
      primary: 'audio/mpeg',
      alternatives: ['audio/mpeg3'],
    },
    signatures: {
      hex: ['FFFB', 'FFFA', 'FFF3', 'FFF2', '494433'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: false,
      animation: false,
      transparency: false,
      layers: false,
      vector: false,
      audio: true,
      video: false,
      metadata: true,
      drm: true,
      colorDepth: 24,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: false,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Audacity', 'Adobe Audition'],
      primaryViewers: ['all music players'],
      openSourceSupport: true,
    },
    conversionNotes: {
      losslessTo: [],
      lossyConversions: ['wav', 'flac'],
      qualityWarning: 'Bitrate affects quality',
      commonPitfalls: ['Multiple re-encodes degrade quality'],
    },
  },
  wav: {
    ext: 'wav',
    officialName: 'Waveform Audio File Format',
    aliases: [],
    description: 'Standard digital audio format for uncompressed audio.',
    category: 'audio',
    subcategory: 'uncompressed',
    inventedBy: 'Microsoft/IBM',
    inventedYear: 1991,
    standardBody: 'Microsoft',
    mimeTypes: {
      primary: 'audio/wav',
      alternatives: ['audio/x-wav'],
    },
    signatures: {
      hex: ['52494646'],
      offset: 0,
      reliability: 'high',
    },
    capabilities: {
      lossless: true,
      animation: false,
      transparency: false,
      layers: false,
      vector: false,
      audio: true,
      video: false,
      metadata: false,
      drm: false,
      colorDepth: 32,
    },
    browserSupport: {
      viewing: 'native',
      editing: 'native',
      saving: true,
      streaming: true,
      supportedBrowsers: ['all'],
    },
    platformSupport: {
      windows: 'native',
      macos: 'native',
      linux: 'native',
      ios: 'native',
      android: 'native',
    },
    software: {
      primaryEditors: ['Audacity', 'Adobe Audition', 'Pro Tools'],
      primaryViewers: ['all music players'],
      openSourceSupport: true,
    },
  },
};

// ---------------------------------------------------------------------------
// KNOWLEDGE ENGINE CLASS
// ---------------------------------------------------------------------------

class KnowledgeEngine {
  private knowledge: Map<string, FormatKnowledge>;

  constructor() {
    this.knowledge = new Map(Object.entries(FORMAT_KNOWLEDGE));
  }

  /**
   * Get knowledge for format
   */
  get(ext: string): FormatKnowledge | undefined {
    const canonical = aliasEngine.resolve(ext);
    return this.knowledge.get(canonical);
  }

  /**
   * Check if format has knowledge entry
   */
  has(ext: string): boolean {
    const canonical = aliasEngine.resolve(ext);
    return this.knowledge.has(canonical);
  }

  /**
   * Get all formats with knowledge
   */
  getAll(): FormatKnowledge[] {
    return Array.from(this.knowledge.values());
  }

  /**
   * Get official name
   */
  getOfficialName(ext: string): string {
    return this.get(ext)?.officialName ?? ext.toUpperCase();
  }

  /**
   * Get browser support info
   */
  getBrowserSupport(ext: string): FormatKnowledge['browserSupport'] | null {
    return this.get(ext)?.browserSupport ?? null;
  }

  /**
   * Get capabilities
   */
  getCapabilities(ext: string): FormatKnowledge['capabilities'] | null {
    return this.get(ext)?.capabilities ?? null;
  }

  /**
   * Check if format supports a capability
   */
  supportsCapability(ext: string, capability: keyof FormatKnowledge['capabilities']): boolean {
    const caps = this.getCapabilities(ext);
    return caps?.[capability] === true;
  }

  /**
   * Get MIME types
   */
  getMimeTypes(ext: string): { primary: string; alternatives: string[] } | null {
    const knowledge = this.get(ext);
    return knowledge?.mimeTypes ?? null;
  }

  /**
   * Get file signatures
   */
  getSignatures(ext: string): FormatKnowledge['signatures'] | null {
    return this.get(ext)?.signatures ?? null;
  }

  /**
   * Get conversion notes
   */
  getConversionNotes(ext: string): FormatKnowledge['conversionNotes'] | null {
    return this.get(ext)?.conversionNotes ?? null;
  }

  /**
   * Get formats by category
   */
  getByCategory(category: FormatCategory): FormatKnowledge[] {
    return this.getAll().filter(k => k.category === category);
  }

  /**
   * Search knowledge
   */
  search(query: string): FormatKnowledge[] {
    const q = query.toLowerCase();
    return this.getAll().filter(k =>
      k.ext.includes(q) ||
      k.officialName.toLowerCase().includes(q) ||
      k.description.toLowerCase().includes(q)
    );
  }

  /**
   * Get related formats (same category or family)
   */
  getRelatedFormats(ext: string): string[] {
    const knowledge = this.get(ext);
    if (!knowledge) return [];

    const related = new Set<string>();

    // Same category
    for (const k of this.getByCategory(knowledge.category)) {
      related.add(k.ext);
    }

    // Remove self
    related.delete(ext);

    return Array.from(related);
  }
}

export const knowledgeEngine = new KnowledgeEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getFormatKnowledge(ext: string): FormatKnowledge | undefined {
  return knowledgeEngine.get(ext);
}

export function getOfficialName(ext: string): string {
  return knowledgeEngine.getOfficialName(ext);
}

export function getFormatBrowserSupport(ext: string) {
  return knowledgeEngine.getBrowserSupport(ext);
}
