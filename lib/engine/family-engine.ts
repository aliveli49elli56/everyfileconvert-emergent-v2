/**
 * lib/engine/family-engine.ts
 * Format Family Engine - categorizes formats into families with shared characteristics
 *
 * This engine provides format family grouping for capability inheritance
 * and cross-format operations.
 */

import type { FormatCategory } from '../types/formats';
import { aliasEngine } from './alias-engine';

// ---------------------------------------------------------------------------
// FORMAT FAMILY DEFINITION
// ---------------------------------------------------------------------------

export interface FormatFamilyDefinition {
  id: string;
  name: string;
  description: string;
  members: string[];
  primaryCategory: FormatCategory;
  sharedCapabilities: FormatFamilyCapabilities;
  conversionBehavior: 'lossy' | 'lossless' | 'mixed';
}

export interface FormatFamilyCapabilities {
  transparency: boolean;
  animation: boolean;
  layers: boolean;
  vector: boolean;
  editable: boolean;
  colorDepth: '8bit' | '16bit' | '32bit' | 'mixed';
  compression: 'lossless' | 'lossy' | 'both' | 'none';
}

// ---------------------------------------------------------------------------
// PREDEFINED FORMAT FAMILIES
// ---------------------------------------------------------------------------

export const FORMAT_FAMILY_DEFINITIONS: FormatFamilyDefinition[] = [
  {
    id: 'raster-web',
    name: 'Web Raster Images',
    description: 'Common web image formats with browser support',
    members: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'],
    primaryCategory: 'image',
    sharedCapabilities: {
      transparency: true, // Some have it
      animation: true,    // Some have it
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '8bit',
      compression: 'both',
    },
    conversionBehavior: 'mixed',
  },
  {
    id: 'raster-print',
    name: 'Print Raster Images',
    description: 'High-quality formats for print and publishing',
    members: ['tiff', 'tif', 'bmp'],
    primaryCategory: 'image',
    sharedCapabilities: {
      transparency: true,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '16bit',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'raw-camera',
    name: 'Camera RAW',
    description: 'Unprocessed camera sensor data',
    members: ['raw', 'cr2', 'nef', 'arw', 'dng', 'rw2', 'orf', 'sr2', 'pef', 'raf'],
    primaryCategory: 'raw',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '32bit',
      compression: 'none',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'vector-graphics',
    name: 'Vector Graphics',
    description: 'Scalable vector formats',
    members: ['svg', 'ai', 'eps', 'cdr'],
    primaryCategory: 'vector',
    sharedCapabilities: {
      transparency: true,
      animation: false,
      layers: true,
      vector: true,
      editable: true,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'design-documents',
    name: 'Design Documents',
    description: 'Layered design and layout files',
    members: ['psd', 'indd', 'sketch', 'fig'],
    primaryCategory: 'vector',
    sharedCapabilities: {
      transparency: true,
      animation: false,
      layers: true,
      vector: true,
      editable: true,
      colorDepth: '16bit',
      compression: 'lossless',
    },
    conversionBehavior: 'mixed',
  },
  {
    id: 'icon-formats',
    name: 'Icon Formats',
    description: 'Multi-resolution icon containers',
    members: ['ico', 'icns'],
    primaryCategory: 'icon',
    sharedCapabilities: {
      transparency: true,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '8bit',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'video-web',
    name: 'Web Video',
    description: 'Video formats with native browser support',
    members: ['mp4', 'webm', 'ogv'],
    primaryCategory: 'video',
    sharedCapabilities: {
      transparency: false,
      animation: true,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '8bit',
      compression: 'lossy',
    },
    conversionBehavior: 'lossy',
  },
  {
    id: 'video-container',
    name: 'Video Containers',
    description: 'Multimedia container formats',
    members: ['avi', 'mov', 'mkv', 'wmv', 'flv', 'm4v'],
    primaryCategory: 'video',
    sharedCapabilities: {
      transparency: false,
      animation: true,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '8bit',
      compression: 'both',
    },
    conversionBehavior: 'mixed',
  },
  {
    id: 'video-legacy',
    name: 'Legacy Video',
    description: 'Older video formats',
    members: ['mpeg', 'mpg', 'vob', 'asf', '3gp'],
    primaryCategory: 'video',
    sharedCapabilities: {
      transparency: false,
      animation: true,
      layers: false,
      vector: false,
      editable: false,
      colorDepth: '8bit',
      compression: 'lossy',
    },
    conversionBehavior: 'lossy',
  },
  {
    id: 'audio-lossy',
    name: 'Lossy Audio',
    description: 'Compressed audio formats',
    members: ['mp3', 'aac', 'm4a', 'wma', 'opus'],
    primaryCategory: 'audio',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '8bit',
      compression: 'lossy',
    },
    conversionBehavior: 'lossy',
  },
  {
    id: 'audio-lossless',
    name: 'Lossless Audio',
    description: 'Uncompressed and lossless audio',
    members: ['wav', 'flac', 'aiff', 'alac'],
    primaryCategory: 'audio',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: '16bit',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'document-office',
    name: 'Office Documents',
    description: 'Microsoft Office and compatible formats',
    members: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    primaryCategory: 'document',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'document-open',
    name: 'OpenDocument',
    description: 'LibreOffice and OpenOffice formats',
    members: ['odt', 'ods', 'odp', 'odg'],
    primaryCategory: 'document',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: true,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'ebook-formats',
    name: 'eBook Formats',
    description: 'Electronic book formats',
    members: ['epub', 'mobi', 'azw', 'azw3', 'fb2'],
    primaryCategory: 'ebook',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: false,
      colorDepth: '8bit',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'cad-2d',
    name: '2D CAD',
    description: '2D CAD drawing formats',
    members: ['dwg', 'dxf'],
    primaryCategory: 'cad',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: true,
      vector: true,
      editable: true,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'cad-3d',
    name: '3D CAD',
    description: '3D model and mesh formats',
    members: ['step', 'stp', 'stl', 'obj', 'fbx', 'iges'],
    primaryCategory: 'cad',
    sharedCapabilities: {
      transparency: false,
      animation: true,
      layers: false,
      vector: true,
      editable: true,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'font-formats',
    name: 'Font Formats',
    description: 'Scalable font formats',
    members: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    primaryCategory: 'font',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: true,
      editable: false,
      colorDepth: '8bit',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
  {
    id: 'archive-formats',
    name: 'Archive Formats',
    description: 'Compressed archive containers',
    members: ['zip', 'rar', '7z', 'tar', 'gz'],
    primaryCategory: 'archive',
    sharedCapabilities: {
      transparency: false,
      animation: false,
      layers: false,
      vector: false,
      editable: false,
      colorDepth: 'mixed',
      compression: 'lossless',
    },
    conversionBehavior: 'lossless',
  },
];

// ---------------------------------------------------------------------------
// FAMILY ENGINE CLASS
// ---------------------------------------------------------------------------

class FamilyEngine {
  private families: Map<string, FormatFamilyDefinition>;
  private extensionToFamily: Map<string, string>;

  constructor() {
    this.families = new Map();
    this.extensionToFamily = new Map();

    // Build lookup maps
    for (const family of FORMAT_FAMILY_DEFINITIONS) {
      this.families.set(family.id, family);
      for (const member of family.members) {
        this.extensionToFamily.set(member.toLowerCase(), family.id);
      }
    }
  }

  /**
   * Get the family for a format extension
   */
  getFamily(ext: string): FormatFamilyDefinition | null {
    const canonical = aliasEngine.resolve(ext);
    const familyId = this.extensionToFamily.get(canonical.toLowerCase());
    return familyId ? this.families.get(familyId) ?? null : null;
  }

  /**
   * Get family by ID
   */
  getFamilyById(id: string): FormatFamilyDefinition | null {
    return this.families.get(id) ?? null;
  }

  /**
   * Get all families
   */
  getAllFamilies(): FormatFamilyDefinition[] {
    return Array.from(this.families.values());
  }

  /**
   * Get all members of a family
   */
  getMembers(familyId: string): string[] {
    const family = this.families.get(familyId);
    return family?.members ?? [];
  }

  /**
   * Check if two formats belong to the same family
   */
  areSameFamily(ext1: string, ext2: string): boolean {
    const family1 = this.getFamily(ext1);
    const family2 = this.getFamily(ext2);
    return family1 !== null && family2 !== null && family1.id === family2.id;
  }

  /**
   * Get capabilities for a format (from its family)
   */
  getCapabilities(ext: string): FormatFamilyCapabilities | null {
    const family = this.getFamily(ext);
    return family?.sharedCapabilities ?? null;
  }

  /**
   * Check if format family supports a capability
   */
  supportsCapability(ext: string, capability: keyof FormatFamilyCapabilities): boolean | string {
    const caps = this.getCapabilities(ext);
    if (!caps) return false;
    return caps[capability] as boolean | string;
  }

  /**
   * Get families by category
   */
  getFamiliesByCategory(category: FormatCategory): FormatFamilyDefinition[] {
    return FORMAT_FAMILY_DEFINITIONS.filter(f => f.primaryCategory === category);
  }

  /**
   * Get conversion behavior for format
   */
  getConversionBehavior(ext: string): 'lossy' | 'lossless' | 'mixed' {
    const family = this.getFamily(ext);
    return family?.conversionBehavior ?? 'lossy';
  }

  /**
   * Check if conversion within family is typically lossless
   */
  isFamilyConversionLossless(ext1: string, ext2: string): boolean {
    const family1 = this.getFamily(ext1);
    const family2 = this.getFamily(ext2);

    // Same family conversions may be lossless
    if (family1 && family1 === family2) {
      return family1.conversionBehavior === 'lossless';
    }

    return false;
  }
}

export const familyEngine = new FamilyEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function getFormatFamilyDefinition(ext: string): FormatFamilyDefinition | null {
  return familyEngine.getFamily(ext);
}

export function getFamilyCapabilities(ext: string): FormatFamilyCapabilities | null {
  return familyEngine.getCapabilities(ext);
}

export function areSameFormatFamily(ext1: string, ext2: string): boolean {
  return familyEngine.areSameFamily(ext1, ext2);
}
