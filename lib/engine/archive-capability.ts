/**
 * lib/engine/archive-capability.ts
 *
 * Archive Format Capability Registry — Phase 6B Part 2 (7zip-wasm integration)
 *
 * This is the SINGLE SOURCE OF TRUTH for which archive formats are supported,
 * which library handles each format, and what each format can do in the browser.
 *
 * Rules:
 *   - No format entry may be added here without a matching library registration.
 *   - No provider may hardcode format lists; all format decisions use this registry.
 *   - All limitations must be declared truthfully as metadata.
 *   - Do not declare an operation as 'supported' if it is not implemented.
 *
 * Status definitions:
 *   supported   – Current provider implementation handles this fully.
 *   partial     – Library is registered and capable; implementation exists
 *                 but with known browser limitations (size, ctor overhead, etc.).
 *   future      – Library is infrastructure-registered; implementation planned
 *                 but not yet wired in the current provider.
 *   server-only – No browser path exists; format requires server-side processing.
 */

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ArchiveOperationStatus =
  | 'supported'   // fully implemented in current browser provider
  | 'partial'     // implemented with documented limitations
  | 'future'      // library registered; implementation not yet in provider
  | 'server-only' // no browser path; requires server
  ;

export interface ArchiveFormatCapability {
  /** Archive format extension */
  format: string;
  /**
   * Library ID from the Library Registry that handles this format.
   * null means no registered browser library can handle this format.
   */
  libraryId: string | null;
  /**
   * npm package name backing the libraryId.
   * Used for dependency validation and infrastructure docs.
   */
  npmPackage: string | null;
  /** Overall browser support status for this format */
  browserStatus: ArchiveOperationStatus;
  /** Per-operation capability declarations */
  operations: {
    extract: ArchiveOperationStatus;
    create:  ArchiveOperationStatus;
    list:    ArchiveOperationStatus;
    test:    ArchiveOperationStatus;
  };
  /**
   * Human-readable note for developers.
   * Required when browserStatus is 'partial' or 'future'.
   */
  note?: string;
}

// ---------------------------------------------------------------------------
// ARCHIVE FORMAT CAPABILITY TABLE
// ---------------------------------------------------------------------------

export const ARCHIVE_FORMAT_CAPABILITIES: Readonly<Record<string, ArchiveFormatCapability>> = {

  // ── JSZip — full browser support ─────────────────────────────────────────

  zip: {
    format: 'zip',
    libraryId: 'jszip',
    npmPackage: 'jszip',
    browserStatus: 'supported',
    operations: {
      extract: 'supported',
      create:  'supported',
      list:    'supported',
      test:    'supported',
    },
  },

  // ── node-unrar-js — extract only (cannot create RAR) ────────────────────

  rar: {
    format: 'rar',
    libraryId: 'node-unrar-js',
    npmPackage: 'node-unrar-js',
    browserStatus: 'partial',
    operations: {
      extract: 'supported',
      create:  'server-only', // RAR creation requires a licensed WinRAR binary
      list:    'supported',
      test:    'supported',
    },
    note: 'RAR extraction fully supported via node-unrar-js WASM. RAR creation is proprietary and server-only.',
  },

  // ── 7z-wasm — infrastructure registered; full implementation is Phase 6C ─
  // 7z-wasm@1.2.0 is installed as architecture infrastructure.
  // The module factory is lazy-loaded in browser-arch.ts.
  // All operations are 'future': the factory is registered but the SevenZipEngine
  // processing pipeline (FS write, callMain, FS read, cleanup) is not yet
  // wired into BrowserArchiveProvider. Phase 6C completes this.

  '7z': {
    format: '7z',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'future',
      list:    'future',
      test:    'future',
    },
    note: '7z-wasm@1.2.0 installed as infrastructure. SevenZipEngine.initialize() and processing pipeline planned for Phase 6C.',
  },

  tar: {
    format: 'tar',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'future',
      list:    'future',
      test:    'future',
    },
    note: 'TAR handling via 7z-wasm infrastructure. Implementation planned for Phase 6C.',
  },

  gz: {
    format: 'gz',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'future',
      list:    'future',
      test:    'future',
    },
    note: 'GZ handling via 7z-wasm infrastructure. Implementation planned for Phase 6C.',
  },

  bz2: {
    format: 'bz2',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'future',
      list:    'future',
      test:    'future',
    },
    note: 'BZ2 handling via 7z-wasm infrastructure. Implementation planned for Phase 6C.',
  },

  xz: {
    format: 'xz',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'future',
      list:    'future',
      test:    'future',
    },
    note: 'XZ handling via 7z-wasm infrastructure. Implementation planned for Phase 6C.',
  },

  cab: {
    format: 'cab',
    libraryId: '7zip-wasm',
    npmPackage: '7z-wasm',
    browserStatus: 'future',
    operations: {
      extract: 'future',
      create:  'server-only', // CAB creation not supported by 7-Zip
      list:    'future',
      test:    'future',
    },
    note: 'CAB extract via 7z-wasm planned for Phase 6C. CAB creation is server-only.',
  },

  // ── No browser library registered ────────────────────────────────────────

  iso: {
    format: 'iso',
    libraryId: null,
    npmPackage: null,
    browserStatus: 'server-only',
    operations: {
      extract: 'server-only',
      create:  'server-only',
      list:    'server-only',
      test:    'server-only',
    },
    note: 'ISO images require kernel-level filesystem mounting. No browser extraction path.',
  },

  dmg: {
    format: 'dmg',
    libraryId: null,
    npmPackage: null,
    browserStatus: 'server-only',
    operations: {
      extract: 'server-only',
      create:  'server-only',
      list:    'server-only',
      test:    'server-only',
    },
    note: 'Apple DMG format requires macOS HFS/APFS mounting. Server-only.',
  },

  zst: {
    format: 'zst',
    libraryId: null,
    npmPackage: null,
    browserStatus: 'server-only',
    operations: {
      extract: 'server-only',
      create:  'server-only',
      list:    'server-only',
      test:    'server-only',
    },
    note: 'Zstandard has no registered browser WASM library. Server only.',
  },

  lzma: {
    format: 'lzma',
    libraryId: null,
    npmPackage: null,
    browserStatus: 'server-only',
    operations: {
      extract: 'server-only',
      create:  'server-only',
      list:    'server-only',
      test:    'server-only',
    },
    note: 'LZMA has no registered browser WASM library. Server only.',
  },

  lz4: {
    format: 'lz4',
    libraryId: null,
    npmPackage: null,
    browserStatus: 'server-only',
    operations: {
      extract: 'server-only',
      create:  'server-only',
      list:    'server-only',
      test:    'server-only',
    },
    note: 'LZ4 has no registered browser WASM library. Server only.',
  },
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Get the capability entry for a specific archive format.
 * Returns undefined for unknown formats.
 */
export function getArchiveFormatCapability(format: string): ArchiveFormatCapability | undefined {
  return ARCHIVE_FORMAT_CAPABILITIES[format.toLowerCase()];
}

/**
 * Returns true if ANY browser operation is possible for this format
 * (status is supported, partial, or future).
 */
export function isFormatBrowserReachable(format: string): boolean {
  const cap = ARCHIVE_FORMAT_CAPABILITIES[format.toLowerCase()];
  if (!cap) return false;
  return cap.browserStatus !== 'server-only';
}

/**
 * Returns true if the specific operation is currently implementated
 * in the browser provider (supported or partial only — NOT future).
 */
export function isOperationCurrentlySupported(
  format: string,
  operation: keyof ArchiveFormatCapability['operations'],
): boolean {
  const cap = ARCHIVE_FORMAT_CAPABILITIES[format.toLowerCase()];
  if (!cap) return false;
  const status = cap.operations[operation];
  return status === 'supported' || status === 'partial';
}

/**
 * Returns a human-readable reason string for why a format/operation
 * is not currently browser-supported. Used in ProviderCapabilityCheck.reason.
 */
export function getUnsupportedReason(
  format: string,
  operation: keyof ArchiveFormatCapability['operations'],
): string {
  const cap = ARCHIVE_FORMAT_CAPABILITIES[format.toLowerCase()];
  if (!cap) {
    return `Unknown archive format: ${format}. No browser or server provider registered.`;
  }
  const status = cap.operations[operation];
  switch (status) {
    case 'supported':
    case 'partial':
      return ''; // not unsupported
    case 'future':
      return cap.note
        ?? `${format.toUpperCase()} ${operation} via ${cap.npmPackage ?? cap.libraryId ?? 'unknown'} is infrastructure-registered. Full implementation planned.`;
    case 'server-only':
      return cap.note
        ?? `${format.toUpperCase()} ${operation} requires server-side processing. No browser path exists.`;
  }
}

/**
 * Summary of all registered archive format statuses.
 */
export function getArchiveCapabilitySummary(): {
  supported: string[];
  partial: string[];
  future: string[];
  serverOnly: string[];
} {
  const result = { supported: [] as string[], partial: [] as string[], future: [] as string[], serverOnly: [] as string[] };
  for (const [fmt, cap] of Object.entries(ARCHIVE_FORMAT_CAPABILITIES)) {
    switch (cap.browserStatus) {
      case 'supported':   result.supported.push(fmt);  break;
      case 'partial':     result.partial.push(fmt);    break;
      case 'future':      result.future.push(fmt);     break;
      case 'server-only': result.serverOnly.push(fmt); break;
    }
  }
  return result;
}
