/**
 * lib/workers/ocr-worker.ts
 *
 * Phase 6B — OCR processing Web Worker using Tesseract.js.
 * Tesseract manages its own internal worker; this worker coordinates job
 * lifecycle and progress reporting using the typed message protocol.
 */

/* eslint-disable no-restricted-globals */

import type { WorkerRequest, WorkerResponse } from './worker-types';

type WorkerGlobal = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
};
const workerCtx = self as unknown as WorkerGlobal;

function sendProgress(jobId: string, pct: number, msg?: string): void {
  const message: WorkerResponse = { type: 'progress', jobId, stage: 'converting', progress: pct, message: msg };
  workerCtx.postMessage(message);
}

async function runOcr(
  jobId: string,
  buffer: ArrayBuffer,
  filename: string,
  options: Record<string, unknown>,
): Promise<{ text: string; confidence: number }> {
  sendProgress(jobId, 5, 'Loading Tesseract.js…');

  const { createWorker } = await import(/* webpackChunkName: "tesseract-js" */ 'tesseract.js');
  const lang = (options.language as string) ?? 'eng';

  const worker = await createWorker(lang, undefined, {
    logger: (m: { progress: number }) => {
      if (m.progress != null) {
        sendProgress(jobId, Math.round(5 + m.progress * 85), 'Recognizing…');
      }
    },
  });

  sendProgress(jobId, 90, 'Extracting text…');

  const blob = new Blob([buffer]);
  const { data } = await worker.recognize(blob);
  await worker.terminate();

  return { text: data.text, confidence: data.confidence };
}

// ---------------------------------------------------------------------------
// MESSAGE HANDLER
// ---------------------------------------------------------------------------

workerCtx.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { jobId, operation: _op, buffers, filenames, options = {} } = event.data;

  if (!buffers?.length) {
    const errMsg: WorkerResponse = { type: 'error', jobId, error: 'No image buffers provided for OCR' };
    workerCtx.postMessage(errMsg);
    return;
  }

  try {
    const { text, confidence } = await runOcr(jobId, buffers[0], filenames[0], options);
    sendProgress(jobId, 100, 'Done');

    // Encode text result as UTF-8 ArrayBuffer
    const enc = new TextEncoder();
    const outputBuffer = enc.encode(JSON.stringify({ text, confidence })).buffer as ArrayBuffer;

    const result: WorkerResponse = {
      type: 'result',
      jobId,
      outputBuffer,
      filename: (filenames[0] ?? 'result').replace(/\.[^/.]+$/, '') + '.json',
      mimeType: 'application/json',
    };
    workerCtx.postMessage(result, [outputBuffer]);
  } catch (e) {
    const errMsg: WorkerResponse = {
      type: 'error', jobId,
      error: e instanceof Error ? e.message : String(e),
    };
    workerCtx.postMessage(errMsg);
  }
});
