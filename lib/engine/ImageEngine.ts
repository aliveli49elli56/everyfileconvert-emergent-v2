/**
 * lib/engine/ImageEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Image processing engine — Canvas API for manipulation,
 * canvas.toBlob() for format conversion (PNG/JPEG/WebP/GIF/BMP/ICO).
 * Runs fully client-side; no server round-trips.
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO: Swap FORMAT_MIME["tiff"] / HEIC / RAW paths with @imagemagick/magick-wasm
 *       for lossless TIFF & camera RAW support when Magick.wasm is bundled.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TranscodeJob, TranscodeResult } from './Transcoder';
import { buildOutputName } from './Transcoder';

// ── MIME map ───────────────────────────────────────────────────────────────────
const FORMAT_MIME: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif:  'image/gif',
  bmp:  'image/bmp',
  tiff: 'image/png',  // Canvas can't write TIFF natively → PNG fallback
  ico:  'image/png',  // ICO → PNG fallback
  icns: 'image/png',
  svg:  'image/png',  // Rasterize SVG to PNG
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function mimeFor(ext: string): string {
  return FORMAT_MIME[ext.toLowerCase()] ?? 'image/png';
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('Canvas toBlob failed'))),
      mime,
      quality,
    ),
  );
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return [canvas, ctx];
}

// ── Core operations ────────────────────────────────────────────────────────────

async function convert(
  file: File,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(15);
  const img = await loadImage(file);
  onProgress?.(50);
  const [canvas, ctx] = makeCanvas(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  onProgress?.(80);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function crop(
  file: File,
  x: number, y: number, w: number, h: number,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const sx = Math.max(0, x), sy = Math.max(0, y);
  const sw = Math.min(w, img.naturalWidth  - sx);
  const sh = Math.min(h, img.naturalHeight - sy);
  onProgress?.(50);
  const [canvas, ctx] = makeCanvas(sw, sh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function resize(
  file: File,
  width: number,
  height: number,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const w = width  || img.naturalWidth;
  const h = height || img.naturalHeight;
  onProgress?.(50);
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function rotate(
  file: File,
  degrees: number,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const rad = (degrees * Math.PI) / 180;
  const { naturalWidth: iw, naturalHeight: ih } = img;
  // Compute bounding box for rotated image
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const ow = Math.round(iw * cos + ih * sin);
  const oh = Math.round(iw * sin + ih * cos);
  onProgress?.(40);
  const [canvas, ctx] = makeCanvas(ow, oh);
  ctx.translate(ow / 2, oh / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -iw / 2, -ih / 2);
  onProgress?.(80);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function flip(
  file: File,
  flipH: boolean,
  flipV: boolean,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const [canvas, ctx] = makeCanvas(w, h);
  onProgress?.(50);
  ctx.translate(flipH ? w : 0, flipV ? h : 0);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function blur(
  file: File,
  radius: number,
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const [canvas, ctx] = makeCanvas(w, h);
  onProgress?.(50);
  ctx.filter = `blur(${Math.max(0, radius)}px)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function colorAdjust(
  file: File,
  opts: {
    brightness?: number; // -100 to 100
    contrast?: number;
    saturation?: number;
    hue?: number;
  },
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const [canvas, ctx] = makeCanvas(w, h);
  onProgress?.(50);
  const b  = 1 + (opts.brightness ?? 0) / 100;
  const co = 1 + (opts.contrast   ?? 0) / 100;
  const s  = 1 + (opts.saturation ?? 0) / 100;
  const hu = opts.hue ?? 0;
  ctx.filter = [
    `brightness(${b})`,
    `contrast(${co})`,
    `saturate(${s})`,
    `hue-rotate(${hu}deg)`,
  ].join(' ');
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

async function compress(
  file: File,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  return convert(file, ext, quality, onProgress);
}

async function watermark(
  file: File,
  opts: {
    text: string;
    opacity?: number;
    position?: string;
    fontSize?: number;
  },
  targetExt: string,
  quality: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const [canvas, ctx] = makeCanvas(w, h);
  onProgress?.(50);
  ctx.drawImage(img, 0, 0);

  const fontSize = opts.fontSize ?? Math.max(24, Math.round(Math.min(w, h) * 0.06));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = opts.opacity ?? 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;

  const textW = ctx.measureText(opts.text).width;
  const pos = opts.position ?? 'bottom-right';
  const pad = 20;
  let tx = 0, ty = 0;
  if (pos === 'center')       { tx = (w - textW) / 2; ty = h / 2; }
  if (pos === 'bottom-right') { tx = w - textW - pad;  ty = h - pad; }
  if (pos === 'bottom-left')  { tx = pad;               ty = h - pad; }
  if (pos === 'top-right')    { tx = w - textW - pad;  ty = fontSize + pad; }
  if (pos === 'top-left')     { tx = pad;               ty = fontSize + pad; }

  ctx.strokeText(opts.text, tx, ty);
  ctx.fillText(opts.text, tx, ty);
  ctx.globalAlpha = 1;
  onProgress?.(90);
  const blob = await canvasToBlob(canvas, mimeFor(targetExt), quality / 100);
  onProgress?.(100);
  return blob;
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const ImageEngine = {
  async process(job: TranscodeJob): Promise<TranscodeResult> {
    const { files, op, options = {}, onProgress } = job;
    const file = files[0];
    const srcExt  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const tgtExt  = options.targetFormat ?? srcExt;
    const quality = options.quality ?? 85;
    const mime    = mimeFor(tgtExt);

    let blob: Blob;

    switch (op) {
      case 'image:convert':
        blob = await convert(file, tgtExt, quality, onProgress);
        break;
      case 'image:crop': {
        const c = options.crop ?? { x: 0, y: 0, w: 800, h: 600 };
        blob = await crop(file, c.x, c.y, c.w, c.h, tgtExt, quality, onProgress);
        break;
      }
      case 'image:resize':
        blob = await resize(file, options.width ?? 0, options.height ?? 0, tgtExt, quality, onProgress);
        break;
      case 'image:rotate':
        blob = await rotate(file, options.rotation ?? 90, tgtExt, quality, onProgress);
        break;
      case 'image:flip':
        blob = await flip(file, options.flipH ?? false, options.flipV ?? false, tgtExt, quality, onProgress);
        break;
      case 'image:compress':
        blob = await compress(file, quality, onProgress);
        break;
      case 'image:blur':
        blob = await blur(file, options.blurRadius ?? 5, tgtExt, quality, onProgress);
        break;
      case 'image:color-adjust':
        blob = await colorAdjust(file, options, tgtExt, quality, onProgress);
        break;
      case 'image:watermark':
        blob = await watermark(
          file,
          {
            text:     options.watermarkText ?? '© EveryFileConvert',
            opacity:  options.watermarkOpacity ?? 0.4,
            position: options.watermarkPosition ?? 'bottom-right',
            fontSize: options.watermarkFontSize,
          },
          tgtExt,
          quality,
          onProgress,
        );
        break;
      default:
        blob = await convert(file, tgtExt, quality, onProgress);
    }

    const finalExt = tgtExt === srcExt && op !== 'image:convert'
      ? srcExt
      : (FORMAT_MIME[tgtExt] === 'image/png' && tgtExt !== 'png' ? 'png' : tgtExt);

    return {
      blob,
      filename: buildOutputName(file.name, finalExt),
      mimeType: mime,
    };
  },
};
