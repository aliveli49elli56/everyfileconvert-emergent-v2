/**
 * lib/workers/image-worker.ts
 *
 * Phase 6B — Image processing Web Worker.
 * Phase 6B Part 2: MIME resolution now sourced from worker-mime-data.ts
 * (registry-derived, no inline MIME maps).
 * Uses OffscreenCanvas for all render operations (no DOM access needed).
 * Loaded lazily via: new Worker(new URL('./image-worker.ts', import.meta.url))
 *
 * Supported operations (derived from Processor Registry domain 'image'):
 *   image:convert, image:resize, image:crop, image:rotate, image:flip,
 *   image:compress, image:watermark, image:metadata-remove, image:upscale,
 *   image:color-adjust, image:thumbnail, image:preview
 */

/* eslint-disable no-restricted-globals */

import type { WorkerRequest, WorkerResponse } from './worker-types';
import { workerMimeFor } from './worker-mime-data';

// Use a typed reference to the worker global scope without requiring webworker lib
type WorkerGlobal = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
};
const workerCtx = self as unknown as WorkerGlobal;

// ---------------------------------------------------------------------------
// MIME RESOLUTION — sourced from worker-mime-data (registry-derived)
// No inline MIME_MAP allowed. All MIME lookups go through workerMimeFor().
// ---------------------------------------------------------------------------

function mimeFor(ext: string): string {
  return workerMimeFor(ext);
}

function outputName(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

function progress(jobId: string, stage: string, pct: number, msg?: string): void {
  const message: WorkerResponse = {
    type: 'progress',
    jobId,
    stage: stage as 'converting',
    progress: pct,
    message: msg,
  };
  workerCtx.postMessage(message);
}

// ---------------------------------------------------------------------------
// IMAGE PROCESSING CORE (OffscreenCanvas)
// ---------------------------------------------------------------------------

async function loadBitmap(buffer: ArrayBuffer, filename: string): Promise<ImageBitmap> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'png';
  const mime = mimeFor(ext);
  const blob = new Blob([buffer], { type: mime });
  return createImageBitmap(blob);
}

function canvasToBuffer(canvas: OffscreenCanvas, mime: string, quality: number): Promise<ArrayBuffer> {
  return canvas
    .convertToBlob({ type: mime, quality })
    .then(b => b.arrayBuffer());
}

async function processImage(
  jobId: string,
  operation: string,
  buffer: ArrayBuffer,
  filename: string,
  options: Record<string, unknown> = {},
): Promise<{ outputBuffer: ArrayBuffer; filename: string; mimeType: string }> {
  progress(jobId, 'loading-library', 10, 'Loading image bitmap…');

  const bitmap = await loadBitmap(buffer, filename);
  const srcExt = filename.split('.').pop()?.toLowerCase() ?? 'png';
  const targetExt = (options.targetFormat as string | undefined) ?? srcExt;
  const mime = mimeFor(targetExt);
  const quality = ((options.quality as number | undefined) ?? 92) / 100;

  let outW = bitmap.width;
  let outH = bitmap.height;

  if (operation === 'image:resize') {
    outW = (options.width as number) ?? bitmap.width;
    outH = (options.height as number) ?? bitmap.height;
  }

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d')!;

  progress(jobId, 'converting', 30, `${operation}…`);

  switch (operation) {
    case 'image:convert':
    case 'image:compress':
    case 'image:metadata-remove':
      ctx.drawImage(bitmap, 0, 0, outW, outH);
      break;

    case 'image:resize':
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, outW, outH);
      break;

    case 'image:crop': {
      const { x = 0, y = 0, w = bitmap.width, h = bitmap.height } = options as {
        x?: number; y?: number; w?: number; h?: number;
      };
      const cropped = new OffscreenCanvas(w as number, h as number);
      const cctx = cropped.getContext('2d')!;
      cctx.drawImage(bitmap, x as number, y as number, w as number, h as number, 0, 0, w as number, h as number);
      const buf = await canvasToBuffer(cropped, mime, quality);
      return { outputBuffer: buf, filename: outputName(filename, targetExt), mimeType: mime };
    }

    case 'image:rotate': {
      const degrees = (options.degrees as 90 | 180 | 270) ?? 90;
      const swap = degrees === 90 || degrees === 270;
      const rCanvas = new OffscreenCanvas(swap ? bitmap.height : bitmap.width, swap ? bitmap.width : bitmap.height);
      const rCtx = rCanvas.getContext('2d')!;
      rCtx.translate(rCanvas.width / 2, rCanvas.height / 2);
      rCtx.rotate((degrees * Math.PI) / 180);
      rCtx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      const buf = await canvasToBuffer(rCanvas, mime, quality);
      return { outputBuffer: buf, filename: outputName(filename, targetExt), mimeType: mime };
    }

    case 'image:flip': {
      const dir = options.direction as 'horizontal' | 'vertical';
      if (dir === 'horizontal') {
        ctx.scale(-1, 1);
        ctx.drawImage(bitmap, -bitmap.width, 0);
      } else {
        ctx.scale(1, -1);
        ctx.drawImage(bitmap, 0, -bitmap.height);
      }
      break;
    }

    case 'image:watermark': {
      ctx.drawImage(bitmap, 0, 0);
      const text = (options.text as string) ?? 'Watermark';
      const fontSize = (options.fontSize as number) ?? Math.round(bitmap.width / 15);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = (options.color as string) ?? '#ffffff';
      ctx.globalAlpha = (options.opacity as number) ?? 0.4;
      ctx.fillText(text, bitmap.width - ctx.measureText(text).width - 20, bitmap.height - 20);
      ctx.globalAlpha = 1;
      break;
    }

    case 'image:upscale': {
      const factor = (options.factor as 2 | 4) ?? 2;
      const uCanvas = new OffscreenCanvas(bitmap.width * factor, bitmap.height * factor);
      const uCtx = uCanvas.getContext('2d')!;
      uCtx.imageSmoothingEnabled = true;
      uCtx.imageSmoothingQuality = 'high';
      uCtx.drawImage(bitmap, 0, 0, uCanvas.width, uCanvas.height);
      const buf = await canvasToBuffer(uCanvas, mime, quality);
      return { outputBuffer: buf, filename: outputName(filename, targetExt), mimeType: mime };
    }

    case 'image:thumbnail':
    case 'image:preview': {
      const maxDim = (options.size as number) ?? (operation === 'image:thumbnail' ? 150 : 400);
      const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
      const tCanvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
      const tCtx = tCanvas.getContext('2d')!;
      tCtx.imageSmoothingQuality = 'high';
      tCtx.drawImage(bitmap, 0, 0, tCanvas.width, tCanvas.height);
      const buf = await canvasToBuffer(tCanvas, mime, quality);
      return { outputBuffer: buf, filename: outputName(filename, targetExt), mimeType: mime };
    }

    case 'image:color-adjust': {
      ctx.filter = buildFilter(options);
      ctx.drawImage(bitmap, 0, 0, outW, outH);
      ctx.filter = 'none';
      break;
    }

    default:
      ctx.drawImage(bitmap, 0, 0, outW, outH);
  }

  progress(jobId, 'encoding-output', 80, 'Encoding…');
  const outputBuffer = await canvasToBuffer(canvas, mime, quality);
  return { outputBuffer, filename: outputName(filename, targetExt), mimeType: mime };
}

function buildFilter(opts: Record<string, unknown>): string {
  const parts: string[] = [];
  if (opts.brightness) parts.push(`brightness(${100 + (opts.brightness as number)}%)`);
  if (opts.contrast)   parts.push(`contrast(${100 + (opts.contrast as number)}%)`);
  if (opts.saturation) parts.push(`saturate(${100 + (opts.saturation as number)}%)`);
  if (opts.blur)       parts.push(`blur(${opts.blur as number}px)`);
  return parts.join(' ') || 'none';
}

// ---------------------------------------------------------------------------
// MESSAGE HANDLER
// ---------------------------------------------------------------------------

workerCtx.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { jobId, operation, buffers, filenames, options = {} } = event.data;

  if (!buffers?.length || !filenames?.length) {
    const errorMsg: WorkerResponse = { type: 'error', jobId, error: 'No input buffers provided' };
    workerCtx.postMessage(errorMsg);
    return;
  }

  try {
    const { outputBuffer, filename, mimeType } = await processImage(
      jobId, operation, buffers[0], filenames[0], options,
    );
    progress(jobId, 'complete', 100, 'Done');
    const result: WorkerResponse = { type: 'result', jobId, outputBuffer, filename, mimeType };
    workerCtx.postMessage(result, [outputBuffer]);
  } catch (e) {
    const errorMsg: WorkerResponse = {
      type: 'error', jobId,
      error: e instanceof Error ? e.message : String(e),
    };
    workerCtx.postMessage(errorMsg);
  }
});
