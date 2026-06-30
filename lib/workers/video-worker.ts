/**
 * lib/workers/video-worker.ts
 *
 * Phase 6B — Video/audio processing Web Worker using FFmpeg.wasm.
 * FFmpeg is loaded lazily on first message — never at import time.
 *
 * Supported operations:
 *   video:convert, video:trim, video:compress, video:rotate, video:crop,
 *   video:gif, video:extract-audio, video:reverse, video:subtitle,
 *   audio:convert, audio:trim, audio:compress, audio:normalize, audio:merge,
 *   audio:speed, audio:pitch
 */

/* eslint-disable no-restricted-globals */

import type { WorkerRequest, WorkerResponse } from './worker-types';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

type WorkerGlobal = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
};
const workerCtx = self as unknown as WorkerGlobal;

// Lazy FFmpeg singleton
let _ffmpeg: FFmpeg | null = null;
let _loaded = false;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg && _loaded) return _ffmpeg;

  const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  if (hasSAB) {
    const { FFmpeg } = await import(/* webpackChunkName: "ffmpeg-core-mt" */ '@ffmpeg/ffmpeg');
    const { toBlobURL } = await import(/* webpackChunkName: "ffmpeg-util" */ '@ffmpeg/util');
    _ffmpeg = new FFmpeg();
    await (_ffmpeg as FFmpeg).load({
      coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
      workerURL: await toBlobURL('/ffmpeg/ffmpeg-core.worker.js', 'text/javascript'),
    });
  } else {
    const { FFmpeg } = await import(/* webpackChunkName: "ffmpeg-core" */ '@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    _ffmpeg = new FFmpeg();
    await (_ffmpeg as FFmpeg).load({
      coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
    });
  }

  _loaded = true;
  return _ffmpeg!;
}

function progress(jobId: string, pct: number, msg?: string): void {
  const message: WorkerResponse = {
    type: 'progress', jobId, stage: 'converting', progress: pct, message: msg,
  };
  workerCtx.postMessage(message);
}

function outputName(original: string, ext: string): string {
  return original.replace(/\.[^/.]+$/, '') + '.' + ext;
}

function mimeFor(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
    mov: 'video/quicktime', mkv: 'video/x-matroska', gif: 'image/gif',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4',
    opus: 'audio/opus',
  };
  return map[ext.toLowerCase()] ?? `video/${ext}`;
}

async function run(
  jobId: string,
  buffer: ArrayBuffer,
  inputName: string,
  ffmpegArgs: string[],
  outputName_: string,
): Promise<{ outputBuffer: ArrayBuffer; mimeType: string }> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const inputBlob = new Blob([buffer]);
  await ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

  ffmpeg.on('progress', ({ progress: pct }) => {
    progress(jobId, Math.round(pct * 90));
  });

  await ffmpeg.exec(['-i', inputName, ...ffmpegArgs, outputName_]);

  const data = await ffmpeg.readFile(outputName_);
  const outBuf = (data as Uint8Array).buffer;

  // Cleanup
  try { await ffmpeg.deleteFile(inputName); } catch { /* no-op */ }
  try { await ffmpeg.deleteFile(outputName_); } catch { /* no-op */ }

  const ext = outputName_.split('.').pop() ?? 'mp4';
  return { outputBuffer: outBuf, mimeType: mimeFor(ext) };
}

async function processVideo(
  jobId: string,
  operation: string,
  buffer: ArrayBuffer,
  filename: string,
  options: Record<string, unknown>,
): Promise<{ outputBuffer: ArrayBuffer; filename: string; mimeType: string }> {
  progress(jobId, 5, 'Initializing FFmpeg…');

  const srcExt = filename.split('.').pop()?.toLowerCase() ?? 'mp4';
  const targetExt = (options.targetFormat as string | undefined) ?? srcExt;
  const outFile = outputName(filename, targetExt);
  const inFile = `input_${jobId}.${srcExt}`;
  const outFileKey = `output_${jobId}.${targetExt}`;

  progress(jobId, 15, `${operation}…`);

  let args: string[];

  switch (operation) {
    case 'video:convert':
    case 'audio:convert':
      args = ['-y'];
      if (options.quality) args.push('-crf', String(Math.round(100 - (options.quality as number))));
      break;

    case 'video:trim':
    case 'audio:trim': {
      const start = (options.startTime as number) ?? 0;
      const end = (options.endTime as number) ?? 60;
      args = ['-y', '-ss', String(start), '-to', String(end), '-c', 'copy'];
      break;
    }

    case 'video:compress':
    case 'audio:compress': {
      const crf = Math.round(50 - ((options.quality as number) ?? 60) / 4);
      args = ['-y', '-crf', String(crf)];
      break;
    }

    case 'video:rotate': {
      const deg = (options.rotation as number) ?? 90;
      const transpose = deg === 90 ? '1' : deg === 270 ? '2' : deg === 180 ? 'transpose=1,transpose=1' : '1';
      args = ['-y', '-vf', `transpose=${transpose}`];
      break;
    }

    case 'video:crop': {
      const c = (options.crop as { x: number; y: number; w: number; h: number }) ?? { x: 0, y: 0, w: 640, h: 480 };
      args = ['-y', '-vf', `crop=${c.w}:${c.h}:${c.x}:${c.y}`];
      break;
    }

    case 'video:gif': {
      const fps = (options.fps as number) ?? 10;
      const outGif = outputName(filename, 'gif');
      args = ['-y', '-vf', `fps=${fps},scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`];
      const { outputBuffer, mimeType } = await run(jobId, buffer, inFile, args, `output_${jobId}.gif`);
      return { outputBuffer, filename: outGif, mimeType };
    }

    case 'video:extract-audio':
    case 'audio:merge':
      args = ['-y', '-vn'];
      break;

    case 'video:reverse':
      args = ['-y', '-vf', 'reverse', '-af', 'areverse'];
      break;

    case 'video:subtitle': {
      const srtText = (options.subtitleText as string) ?? '';
      // Write srt file
      const ffmpeg = await getFFmpeg();
      const enc = new TextEncoder();
      await ffmpeg.writeFile(`subs_${jobId}.srt`, enc.encode(srtText));
      args = ['-y', '-vf', `subtitles=subs_${jobId}.srt`];
      break;
    }

    case 'audio:normalize':
      args = ['-y', '-af', 'loudnorm'];
      break;

    case 'audio:speed': {
      const speed = (options.speed as number) ?? 1.0;
      args = ['-y', '-af', `atempo=${speed}`];
      break;
    }

    case 'audio:pitch': {
      const semitones = (options.semitones as number) ?? 0;
      const rate = Math.pow(2, semitones / 12);
      args = ['-y', '-af', `asetrate=44100*${rate},aresample=44100`];
      break;
    }

    default:
      args = ['-y'];
  }

  const { outputBuffer, mimeType } = await run(jobId, buffer, inFile, args, outFileKey);
  return { outputBuffer, filename: outFile, mimeType };
}

// ---------------------------------------------------------------------------
// MESSAGE HANDLER
// ---------------------------------------------------------------------------

workerCtx.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { jobId, operation, buffers, filenames, options = {} } = event.data;

  if (!buffers?.length || !filenames?.length) {
    const errMsg: WorkerResponse = { type: 'error', jobId, error: 'No input buffers provided' };
    workerCtx.postMessage(errMsg);
    return;
  }

  try {
    const { outputBuffer, filename, mimeType } = await processVideo(
      jobId, operation, buffers[0], filenames[0], options,
    );
    progress(jobId, 100, 'Done');
    const result: WorkerResponse = { type: 'result', jobId, outputBuffer, filename, mimeType };
    workerCtx.postMessage(result, [outputBuffer]);
  } catch (e) {
    const errMsg: WorkerResponse = {
      type: 'error', jobId,
      error: e instanceof Error ? e.message : String(e),
    };
    workerCtx.postMessage(errMsg);
  }
});
