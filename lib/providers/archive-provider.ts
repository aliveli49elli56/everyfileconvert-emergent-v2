/**
 * lib/providers/archive-provider.ts
 *
 * Phase 6B Part 2 — Browser IArchiveProvider implementation.
 *
 * Archive format capabilities are declared through metadata in:
 *   lib/engine/archive-capability.ts
 *
 * This provider does NOT hardcode format lists.
 * All canHandle() decisions are driven by ARCHIVE_FORMAT_CAPABILITIES.
 *
 * Currently implemented (current provider wiring):
 *   ZIP  : FULL   — create, extract, list, test (JSZip)
 *   RAR  : PARTIAL— extract/list/test only, no create (node-unrar-js)
 *
 * Infrastructure-registered for Phase 6C:
 *   7z, tar, gz, bz2, xz, cab — 7z-wasm@1.2.0 installed; SevenZipEngine planned
 *
 * Server-only (no browser path):
 *   iso, dmg, zst, lzma, lz4
 *
 * Libraries used (all lazy-loaded):
 *   - jszip          : ZIP create/extract/list
 *   - node-unrar-js  : RAR extract/list (WASM)
 */

import type {
  IArchiveProvider,
  ProviderInfo,
  ProviderCapabilityCheck,
  ArchiveCompressOptions,
  BaseProcessingOptions,
} from '../types/provider-interfaces';
import type { ConversionResult } from '../types/conversion';
import { providerLifecycleRegistry } from '../core/browser-arch';
import {
  getArchiveFormatCapability,
  isOperationCurrentlySupported,
  getUnsupportedReason,
} from '../engine/archive-capability';

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserArchiveProvider',
  name: 'Browser Archive Provider',
  version: '6.2.1',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fail(msg: string, code: ConversionResult['errorCode'] = 'CONVERSION_FAILED'): ConversionResult {
  return { success: false, error: msg, errorCode: code };
}

function outputFilename(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

// ---------------------------------------------------------------------------
// ARCHIVE PROVIDER
// ---------------------------------------------------------------------------

export class BrowserArchiveProvider implements IArchiveProvider {
  readonly info: ProviderInfo = PROVIDER_INFO;
  private _ready = false;

  async initialize(): Promise<boolean> {
    this._ready = typeof window !== 'undefined';
    if (this._ready) {
      providerLifecycleRegistry.markReady(this.info.id);
    }
    return this._ready;
  }

  isReady(): boolean { return this._ready; }

  /**
   * Capability check — fully metadata-driven via archive-capability.ts.
   * No format lists are hardcoded in this method.
   */
  async canHandle(input: File | string, targetFormat: string): Promise<ProviderCapabilityCheck> {
    const inputExt = typeof input === 'string'
      ? input.toLowerCase().split('.').pop() ?? input.toLowerCase()
      : (input as File).name.split('.').pop()?.toLowerCase() ?? '';

    const cap = getArchiveFormatCapability(inputExt);

    // Unknown format — not in archive capability registry
    if (!cap) {
      return { supported: false, reason: `Unknown archive format: ${inputExt}. Not registered in archive capability registry.` };
    }

    // Server-only: no browser path at all
    if (cap.browserStatus === 'server-only') {
      return {
        supported: false,
        requiresServer: true,
        reason: getUnsupportedReason(inputExt, 'extract'),
      };
    }

    // Infrastructure-registered (future): library is available but not yet wired
    if (cap.browserStatus === 'future') {
      return {
        supported: false,
        reason: getUnsupportedReason(inputExt, 'extract'),
      };
    }

    // For 'supported' or 'partial' formats, check if target format is achievable
    if (targetFormat) {
      const targetExt = targetFormat.toLowerCase();
      const targetCap = getArchiveFormatCapability(targetExt);
      if (targetCap && !isOperationCurrentlySupported(targetExt, 'create') && targetExt !== inputExt) {
        return {
          supported: false,
          reason: getUnsupportedReason(targetExt, 'create'),
          requiresServer: targetCap.operations.create === 'server-only',
        };
      }
    }

    // Format is currently supported or partial in this provider
    return {
      supported: true,
      reason: cap.browserStatus === 'partial' ? cap.note : undefined,
    };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IArchiveProvider methods ───────────────────────────────────────────────

  async compress(files: File[], options: ArchiveCompressOptions): Promise<ConversionResult> {
    const target = options.targetFormat.toLowerCase();

    // Consult metadata: can we CREATE the target format in the browser right now?
    if (!isOperationCurrentlySupported(target, 'create')) {
      const reason = getUnsupportedReason(target, 'create');
      return fail(reason, 'UNSUPPORTED_FORMAT');
    }

    try {
      const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.name, await file.arrayBuffer(), {
          compression: 'DEFLATE',
          compressionOptions: { level: options.compressionLevel ?? 6 },
        });
      }
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const outputName = files.length === 1
        ? outputFilename(files[0].name, 'zip')
        : 'archive.zip';
      return {
        success: true,
        blob: content,
        filename: outputName,
        mimeType: 'application/zip',
      };
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'ZIP creation failed');
    }
  }

  async extract(file: File, password?: string, _options?: BaseProcessingOptions): Promise<ConversionResult[]> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    // Consult metadata: can we EXTRACT this format in the browser right now?
    if (!isOperationCurrentlySupported(ext, 'extract')) {
      const reason = getUnsupportedReason(ext, 'extract');
      const cap = getArchiveFormatCapability(ext);
      return [fail(reason, cap?.operations.extract === 'server-only' ? 'UNSUPPORTED_FORMAT' : 'CONVERSION_FAILED')];
    }

    if (ext === 'zip') return this._extractZip(file, password);
    if (ext === 'rar') return this._extractRar(file, password);

    // Fallback: metadata says supported/partial but no implementation path
    return [fail(`${ext.toUpperCase()} extraction: unexpected state. Consult archive-capability.ts.`)];
  }

  async convert(file: File, targetFormat: string, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    const srcExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const target = targetFormat.toLowerCase();

    // Consult metadata: can we CREATE the target format?
    if (!isOperationCurrentlySupported(target, 'create')) {
      const reason = getUnsupportedReason(target, 'create');
      return fail(reason);
    }
    // Consult metadata: can we EXTRACT the source format?
    if (!isOperationCurrentlySupported(srcExt, 'extract')) {
      const reason = getUnsupportedReason(srcExt, 'extract');
      return fail(reason);
    }

    // Same format: return as-is
    if (srcExt === target) {
      return { success: true, blob: file, filename: file.name, mimeType: `application/${srcExt}` };
    }

    // Extract then re-compress into target format
    const extracted = await this.extract(file);
    const good = extracted.filter(r => r.success && r.blob);
    if (good.length === 0) return fail(`No files extracted from ${srcExt} archive`);
    const repackFiles = good.map(r => new File([r.blob!], r.filename ?? 'file', { type: r.mimeType ?? '' }));
    return this.compress(repackFiles, { targetFormat: target });
  }

  async list(file: File): Promise<{ name: string; size: number; compressed: number; isDirectory: boolean }[]> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    // Consult metadata: can we LIST this format?
    if (!isOperationCurrentlySupported(ext, 'list')) return [];

    if (ext === 'zip') return this._listZip(file);
    if (ext === 'rar') return this._listRar(file);

    return [];
  }

  async test(file: File, _password?: string): Promise<boolean> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    // Consult metadata: can we TEST this format?
    if (!isOperationCurrentlySupported(ext, 'test')) return false;

    try {
      if (ext === 'zip') {
        const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
        // JSZip does not support password in browser; just verify the ZIP structure
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        return Object.keys(zip.files).length > 0;
      }
      if (ext === 'rar') {
        const items = await this._listRar(file);
        return items.length > 0;
      }
    } catch {
      return false;
    }
    return false;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _extractZip(file: File, _password?: string): Promise<ConversionResult[]> {
    try {
      const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
      // JSZip browser build does not support password-protected ZIP extraction
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const results: ConversionResult[] = [];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const buffer = await entry.async('arraybuffer');
        const ext2 = path.split('.').pop()?.toLowerCase() ?? 'bin';
        results.push({
          success: true,
          blob: new Blob([buffer]),
          filename: path,
          mimeType: `application/${ext2}`,
        });
      }
      return results;
    } catch (e) {
      return [fail(e instanceof Error ? e.message : 'ZIP extraction failed')];
    }
  }

  private async _extractRar(file: File, _password?: string): Promise<ConversionResult[]> {
    try {
      const { createExtractorFromData } = await import(/* webpackChunkName: "node-unrar-js" */ 'node-unrar-js');
      const data = await file.arrayBuffer();
      const extractor = await createExtractorFromData({ data });
      const { files } = extractor.extract();
      const results: ConversionResult[] = [];
      for (const f of Array.from(files)) {
        if (f.fileHeader.flags.directory) continue;
        const buffer = f.extraction!;
        const ext2 = f.fileHeader.name.split('.').pop()?.toLowerCase() ?? 'bin';
        results.push({
          success: true,
          blob: new Blob([buffer]),
          filename: f.fileHeader.name,
          mimeType: `application/${ext2}`,
        });
      }
      return results;
    } catch (e) {
      return [fail(e instanceof Error ? e.message : 'RAR extraction failed')];
    }
  }

  private async _listZip(file: File): Promise<{ name: string; size: number; compressed: number; isDirectory: boolean }[]> {
    const JSZip = (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    return Object.entries(zip.files).map(([path, entry]) => ({
      name: path,
      size: (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0,
      compressed: (entry as unknown as { _data?: { compressedSize?: number } })._data?.compressedSize ?? 0,
      isDirectory: entry.dir,
    }));
  }

  private async _listRar(file: File): Promise<{ name: string; size: number; compressed: number; isDirectory: boolean }[]> {
    try {
      const { createExtractorFromData } = await import(/* webpackChunkName: "node-unrar-js" */ 'node-unrar-js');
      const data = await file.arrayBuffer();
      const extractor = await createExtractorFromData({ data });
      const list = extractor.getFileList();
      const headers: Array<{ name: string; size: number; compressed: number; isDirectory: boolean }> = [];
      for (const h of Array.from(list.fileHeaders)) {
        headers.push({
          name: h.name,
          size: h.packSize,
          compressed: h.packSize,
          isDirectory: h.flags.directory,
        });
      }
      return headers;
    } catch {
      return [];
    }
  }
}

export const browserArchiveProvider = new BrowserArchiveProvider();
