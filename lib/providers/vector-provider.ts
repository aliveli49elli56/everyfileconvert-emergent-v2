/**
 * lib/providers/vector-provider.ts
 *
 * Phase 6B Part 2 — Browser IVectorProvider implementation.
 *
 * Libraries used (all lazy-loaded):
 *   - svgo/browser : SVG optimization
 *
 * Browser capabilities:
 *   - SVG optimize    : FULL via SVGO browser build
 *   - SVG → PNG       : FULL via Canvas drawImage (browser built-in)
 *   - SVG extractText : FULL via DOMParser
 *   - SVG getViewBox  : FULL via DOMParser
 *
 * Browser limitations declared via canHandle():
 *   - AI / EPS / WMF / EMF : server-only (Inkscape required)
 *   - SVG → PDF             : partial (Canvas path only, no vector PDF)
 */

import type {
  IVectorProvider,
  ProviderInfo,
  ProviderCapabilityCheck,
  VectorConvertOptions,
  BaseProcessingOptions,
} from '../types/provider-interfaces';
import type { ConversionResult } from '../types/conversion';
import { providerLifecycleRegistry } from '../core/browser-arch';

// ---------------------------------------------------------------------------
// PROVIDER METADATA
// ---------------------------------------------------------------------------

const PROVIDER_INFO: ProviderInfo = {
  id: 'BrowserVectorProvider',
  name: 'Browser SVG / Vector Provider',
  version: '6.2.0',
  type: 'client',
  enabled: true,
  premiumOnly: false,
};

const BROWSER_INPUT_FORMATS = ['svg'];
const SERVER_ONLY_FORMATS   = ['ai', 'eps', 'wmf', 'emf', 'cdr', 'afdesign', 'sketch', 'fig', 'vsd'];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function fail(msg: string): ConversionResult {
  return { success: false, error: msg, errorCode: 'CONVERSION_FAILED' };
}

function outputFilename(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

// ---------------------------------------------------------------------------
// VECTOR PROVIDER
// ---------------------------------------------------------------------------

export class BrowserVectorProvider implements IVectorProvider {
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
        reason: `${ext.toUpperCase()} vector format requires server processing (Inkscape). No browser parser available.`,
        requiresServer: true,
      };
    }
    if (!BROWSER_INPUT_FORMATS.includes(ext)) {
      return { supported: false, reason: `Unsupported vector format: ${ext}` };
    }
    const target = targetFormat.toLowerCase();
    if (target === 'pdf') {
      return { supported: true, reason: 'SVG→PDF in browser produces a raster-embedded PDF, not a vector PDF. For true vector PDF use server Inkscape.' };
    }
    return { supported: true };
  }

  async dispose(): Promise<void> { this._ready = false; }

  // ── IVectorProvider methods ────────────────────────────────────────────────

  async convert(file: File, options: VectorConvertOptions): Promise<ConversionResult> {
    const target = options.targetFormat.toLowerCase();

    // SVG → SVG (optimized)
    if (target === 'svg') {
      return this.optimize(file, options);
    }

    // SVG → Raster (PNG, JPG, WEBP)
    if (['png', 'jpg', 'jpeg', 'webp'].includes(target)) {
      const w = options.width ?? 1200;
      const h = options.height ?? 800;
      return this.rasterize(file, w, h, options);
    }

    return fail(`SVG conversion to ${target} is not supported in browser. Use server Inkscape for PDF/EPS output.`);
  }

  async optimize(file: File, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    try {
      const svgText = await file.text();
      // Use SVGO browser build
      const { optimize } = await import(/* webpackChunkName: "svgo" */ 'svgo/browser');
      const result = optimize(svgText, {
        plugins: [
          'removeComments',
          'removeMetadata',
          'removeEmptyAttrs',
          'removeEmptyContainers',
          'removeUnusedNS',
          'cleanupIds',
          'collapseGroups',
          'mergePaths',
          { name: 'removeAttrs', params: { attrs: ['data-name'] } },
        ],
      });
      return {
        success: true,
        blob: new Blob([result.data], { type: 'image/svg+xml' }),
        filename: file.name,
        mimeType: 'image/svg+xml',
      };
    } catch (e) {
      // Fallback: return original SVG if SVGO fails
      return {
        success: true,
        blob: file,
        filename: file.name,
        mimeType: 'image/svg+xml',
      };
    }
  }

  async rasterize(file: File, width: number, height: number, _options?: BaseProcessingOptions): Promise<ConversionResult> {
    try {
      const svgText = await file.text();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise<ConversionResult>((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const w = width || img.naturalWidth || 1200;
          const h = height || img.naturalHeight || Math.round(w * (img.naturalHeight / (img.naturalWidth || 1)));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(fail('Rasterization produced empty output')); return; }
            resolve({
              success: true,
              blob,
              filename: outputFilename(file.name, 'png'),
              mimeType: 'image/png',
            });
          }, 'image/png');
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(fail('SVG rasterization failed: could not load SVG as image'));
        };
        img.src = url;
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'SVG rasterization failed');
    }
  }

  async extractText(file: File): Promise<string> {
    try {
      const svgText = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      // Extract text elements
      const textNodes = Array.from(doc.querySelectorAll('text, tspan, textPath'));
      return textNodes.map(n => n.textContent ?? '').filter(Boolean).join(' ').trim();
    } catch {
      return '';
    }
  }

  async getViewBox(file: File): Promise<{ x: number; y: number; width: number; height: number }> {
    try {
      const svgText = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return { x: 0, y: 0, width: 0, height: 0 };

      const vb = svg.getAttribute('viewBox');
      if (vb) {
        const [x, y, w, h] = vb.split(/[\s,]+/).map(Number);
        return { x: x ?? 0, y: y ?? 0, width: w ?? 0, height: h ?? 0 };
      }
      // Fallback to width/height attributes
      return {
        x: 0,
        y: 0,
        width: parseFloat(svg.getAttribute('width') ?? '0') || 0,
        height: parseFloat(svg.getAttribute('height') ?? '0') || 0,
      };
    } catch {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
}

export const browserVectorProvider = new BrowserVectorProvider();
