/**
 * lib/providers/archive-provider.ts
 *
 * Phase 6B Part 2 — Browser IArchiveProvider implementation.
 *
 * Browser Capability Declaration (truthful):
 *   ZIP  : FULL   — create, extract, list, test (JSZip)
 *   RAR  : PARTIAL— extract only, no create (node-unrar-js)
 *   7Z   : FUTURE — 7zip-wasm not yet available on npm; server-only
 *   TAR  : FUTURE — no browser tar library currently registered
 *   GZ   : FUTURE — browser gzip decompression via CompressionStream API (partial)
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

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserArchiveProvider',
  name: 'Browser Archive Provider',
  version: '6.2.0',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

/** ZIP: full support; RAR: extract only; others: future/server-only */
const BROWSER_INPUT_FORMATS  = ['zip', 'rar'];
const BROWSER_OUTPUT_FORMATS = ['zip'];
const SERVER_ONLY_FORMATS    = ['7z', 'tar', 'gz', 'bz2', 'xz', 'cab', 'zst'];

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

  async canHandle(input: File | string, targetFormat: string): Promise<ProviderCapabilityCheck> {
    const ext = typeof input === 'string'
      ? input.toLowerCase()
      : (input as File).name.split('.').pop()?.toLowerCase() ?? '';

    if (SERVER_ONLY_FORMATS.includes(ext)) {
      return {
        supported: false,
        reason: `${ext.toUpperCase()} archive format requires server processing. 7zip-wasm integration is planned for Phase 6C.`,
        requiresServer: true,
      };
    }
    if (!BROWSER_INPUT_FORMATS.includes(ext)) {
      return { supported: false, reason: `Unsupported archive format: ${ext}` };
    }
    if (targetFormat && !BROWSER_OUTPUT_FORMATS.includes(targetFormat.toLowerCase()) && targetFormat !== ext) {
      return {
        supported: false,
        reason: `Browser can only output ZIP archives. Target format ${targetFormat} requires server.`,
        requiresServer: true,
      };
    }
    return { supported: true };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IArchiveProvider methods ───────────────────────────────────────────────

  async compress(files: File[], options: ArchiveCompressOptions): Promise<ConversionResult> {
    const target = options.targetFormat.toLowerCase();
    if (target !== 'zip') {
      return fail(`Browser can only create ZIP archives. ${target.toUpperCase()} creation requires server.`, 'UNSUPPORTED_FORMAT');
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

    if (ext === 'zip') return this._extractZip(file, password);
    if (ext === 'rar') return this._extractRar(file, password);

    return [fail(`${ext.toUpperCase()} extraction not supported in browser.`, 'UNSUPPORTED_FORMAT')];
  }

  async convert(file: File, targetFormat: string, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    const srcExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const target = targetFormat.toLowerCase();

    if (target !== 'zip') {
      return fail(`Browser can only convert archives to ZIP. ${target.toUpperCase()} output requires server.`);
    }
    if (srcExt === 'zip') {
      // Same format — return as-is
      return {
        success: true,
        blob: file,
        filename: file.name,
        mimeType: 'application/zip',
      };
    }
    if (srcExt === 'rar') {
      // Extract RAR then re-zip
      const items = await this._extractRar(file, undefined);
      if (items.length === 0) return fail('RAR extraction produced no files');
      const repackFiles = items
        .filter(r => r.success && r.blob)
        .map(r => new File([r.blob!], r.filename ?? 'file', { type: r.mimeType ?? '' }));
      return this.compress(repackFiles, { targetFormat: 'zip' });
    }
    return fail(`Cannot convert ${srcExt} to ${target} in browser.`);
  }

  async list(file: File): Promise<{ name: string; size: number; compressed: number; isDirectory: boolean }[]> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'zip') return this._listZip(file);
    if (ext === 'rar') return this._listRar(file);

    return [];
  }

  async test(file: File, _password?: string): Promise<boolean> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
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
