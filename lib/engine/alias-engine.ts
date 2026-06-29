/**
 * lib/engine/alias-engine.ts
 * Alias Resolution Engine - resolves format aliases to canonical forms
 *
 * Handles extension aliases like jpg/jpeg/jpe/jfif → jpeg-family
 * This is pure architecture - no SEO content here.
 */

// ---------------------------------------------------------------------------
// FORMAT FAMILY ALIASES
// Groups of extensions that should be treated as the same logical format
// ---------------------------------------------------------------------------

export const FORMAT_ALIASES: Record<string, string> = {
  // JPEG family - all resolve to 'jpg' as canonical
  jpeg: 'jpg',
  jpe: 'jpg',
  jfif: 'jpg',
  jfi: 'jpg',
  jif: 'jpg',

  // MPEG video family
  mpg: 'mpeg',
  mpe: 'mpeg',
  mpeg: 'mpeg',
  m1v: 'mpeg',
  m2v: 'mpeg',

  // Audio variations
  aif: 'aiff',
  aifc: 'aiff',

  // TIFF variations
  tif: 'tiff',

  // HTML variations
  htm: 'html',

  // Archive variations
  gzip: 'gz',
  tgz: 'tar',

  // STEP CAD variations
  stp: 'step',

  // Document variations
  word: 'doc',
  excel: 'xls',
  powerpoint: 'ppt',

  // MPEG-TS variations
  m2ts: 'ts',
  mts: 'ts',
};

// ---------------------------------------------------------------------------
// CANONICAL FORMAT FAMILIES
// Groups of formats that share common characteristics
// ---------------------------------------------------------------------------

export const FORMAT_FAMILIES: Record<string, string[]> = {
  'jpeg-family': ['jpg', 'jpeg', 'jpe', 'jfif', 'jif'],
  'mpeg-family': ['mpeg', 'mpg', 'mpe', 'm1v', 'm2v'],
  'tiff-family': ['tiff', 'tif'],
  'html-family': ['html', 'htm'],
  'archive-family': ['zip', 'rar', '7z', 'tar', 'gz'],
  'raw-family': ['raw', 'cr2', 'nef', 'arw', 'dng', 'rw2', 'orf', 'sr2'],
  'office-family': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  'ebook-family': ['epub', 'mobi', 'azw', 'azw3'],
  'web-audio-family': ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'],
  'web-video-family': ['mp4', 'webm', 'ogv', 'mov'],
};

// ---------------------------------------------------------------------------
// ALIAS ENGINE CLASS
// ---------------------------------------------------------------------------

class AliasEngine {
  private aliasMap: Map<string, string>;
  private familyMap: Map<string, string[]>;
  private reverseFamilyMap: Map<string, string>;

  constructor() {
    // Build alias lookup map (all lowercase)
    this.aliasMap = new Map();
    for (const [alias, canonical] of Object.entries(FORMAT_ALIASES)) {
      this.aliasMap.set(alias.toLowerCase(), canonical.toLowerCase());
    }

    // Build family lookup maps
    this.familyMap = new Map();
    this.reverseFamilyMap = new Map();
    for (const [family, members] of Object.entries(FORMAT_FAMILIES)) {
      this.familyMap.set(family, members.map(m => m.toLowerCase()));
      for (const member of members) {
        this.reverseFamilyMap.set(member.toLowerCase(), family);
      }
    }
  }

  /**
   * Resolve an extension to its canonical form
   * e.g., 'jpeg' → 'jpg', 'tif' → 'tiff'
   */
  resolve(ext: string): string {
    const lower = ext.toLowerCase().replace(/^\./, '');
    return this.aliasMap.get(lower) ?? lower;
  }

  /**
   * Check if an extension is an alias of another
   */
  isAlias(ext: string): boolean {
    const lower = ext.toLowerCase().replace(/^\./, '');
    return this.aliasMap.has(lower);
  }

  /**
   * Get the original alias that maps to a canonical form
   * Returns the input if it's not an alias
   */
  getOriginalAlias(ext: string): string {
    return ext.toLowerCase().replace(/^\./, '');
  }

  /**
   * Get the format family for an extension
   * Returns null if the format is not part of a defined family
   */
  getFamily(ext: string): string | null {
    const canonical = this.resolve(ext);
    return this.reverseFamilyMap.get(canonical) ?? null;
  }

  /**
   * Get all members of a format family
   */
  getFamilyMembers(family: string): string[] {
    return this.familyMap.get(family) ?? [];
  }

  /**
   * Check if two extensions represent the same logical format
   */
  areEquivalent(ext1: string, ext2: string): boolean {
    const c1 = this.resolve(ext1);
    const c2 = this.resolve(ext2);

    if (c1 === c2) return true;

    // Check if they're in the same family (e.g., jpg and jpeg)
    const f1 = this.getFamily(c1);
    const f2 = this.getFamily(c2);
    if (f1 && f2 && f1 === f2) return true;

    return false;
  }

  /**
   * Get all equivalent extensions for a given extension
   * Includes aliases and family members
   */
  getAllEquivalent(ext: string): string[] {
    const canonical = this.resolve(ext);
    const family = this.getFamily(canonical);

    const equivalents = new Set<string>([canonical]);

    // Add other extensions that resolve to same canonical
    for (const [alias, resolved] of Array.from(this.aliasMap.entries())) {
      if (resolved === canonical) {
        equivalents.add(alias);
      }
    }

    // Add family members
    if (family) {
      for (const member of this.getFamilyMembers(family)) {
        equivalents.add(member);
      }
    }

    return Array.from(equivalents);
  }

  /**
   * Normalize a file extension for consistent handling
   * Removes leading dot, converts to lowercase, resolves aliases
   */
  normalize(ext: string): string {
    const cleaned = ext.toLowerCase().replace(/^\./, '');
    return this.resolve(cleaned);
  }

  /**
   * Check if extension is known (either canonical or alias)
   */
  isKnown(ext: string): boolean {
    const cleaned = ext.toLowerCase().replace(/^\./, '');
    return this.aliasMap.has(cleaned) || this.aliasMap.has(this.resolve(cleaned));
  }

  /**
   * Get canonical extension from filename
   */
  getCanonicalExtension(filename: string): string {
    const ext = filename.split('.').pop() ?? '';
    return this.resolve(ext);
  }

  /**
   * Get all aliases as a Record
   */
  getAllAliases(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [alias, canonical] of Array.from(this.aliasMap.entries())) {
      result[alias] = canonical;
    }
    return result;
  }
}

export const aliasEngine = new AliasEngine();

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORTS
// ---------------------------------------------------------------------------

export function resolveAlias(ext: string): string {
  return aliasEngine.resolve(ext);
}

export function getFormatFamily(ext: string): string | null {
  return aliasEngine.getFamily(ext);
}

export function areFormatsEquivalent(ext1: string, ext2: string): boolean {
  return aliasEngine.areEquivalent(ext1, ext2);
}

export function normalizeExtension(ext: string): string {
  return aliasEngine.normalize(ext);
}
