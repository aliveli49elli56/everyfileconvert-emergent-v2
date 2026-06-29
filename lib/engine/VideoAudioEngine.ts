/**
 * lib/engine/VideoAudioEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FFmpeg.wasm engine for video and audio operations.
 * Multi-threaded (MT) core is used when SharedArrayBuffer is available.
 * COOP/COEP headers in next.config.js enable SharedArrayBuffer.
 * Falls back to single-threaded (ST) if SAB is unavailable.
 * Core files served locally from /public/ffmpeg[-mt]/ to avoid CDN/COEP issues.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TranscodeJob, TranscodeResult } from './Transcoder';
import { buildOutputName } from './Transcoder';

// Detect SharedArrayBuffer availability → choose MT or ST core
function hasSAB(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

function getCoreFolder(): string {
  return hasSAB() ? 'ffmpeg-mt' : 'ffmpeg';
}

function getCoreBase(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/${getCoreFolder()}`;
}

type FFmpegInstance = {
  load: (opts: { coreURL: string; wasmURL: string; workerURL?: string }) => Promise<boolean | void>;
  on: (event: string, cb: (data: unknown) => void) => void;
  exec: (args: string[]) => Promise<number>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
  terminate: () => void;
};

type FFmpegModule = {
  FFmpeg: new () => FFmpegInstance;
};

type FFmpegUtilModule = {
  fetchFile: (source: File | string) => Promise<Uint8Array>;
  toBlobURL: (url: string, mimeType: string) => Promise<string>;
};

// ── MIME types for output ──────────────────────────────────────────────────────
const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
  mov: 'video/quicktime', mkv: 'video/x-matroska', gif: 'image/gif',
  ogv: 'video/ogg', m4v: 'video/x-m4v', wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
};
const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  aac: 'audio/aac', m4a: 'audio/mp4', opus: 'audio/opus', ac3: 'audio/ac3',
  aiff: 'audio/aiff', wma: 'audio/x-ms-wma', amr: 'audio/amr', caf: 'audio/x-caf',
};

function mimeFor(ext: string): string {
  return VIDEO_MIME[ext] ?? AUDIO_MIME[ext] ?? `video/${ext}`;
}

// ── Build FFmpeg argument arrays for each operation ───────────────────────────
function buildArgs(
  inputName: string,
  outputName: string,
  op: string,
  opts: TranscodeJob['options'],
  srcExt: string,
  tgtExt: string,
): string[] {
  const o = opts ?? {};

  switch (op) {
    case 'video:convert': {
      // WebM requires VP9/VP8, not H.264
      if (tgtExt === 'webm') {
        return ['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0',
                '-c:a', 'libopus', '-threads', '0', outputName];
      }
      // Standard H.264 for MP4, MKV, MOV, AVI, etc.
      return ['-i', inputName, '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast',
              '-c:a', 'aac', '-threads', '0', outputName];
    }

    case 'video:trim': {
      const args = ['-i', inputName];
      if (o.startTime != null) args.push('-ss', String(o.startTime));
      if (o.endTime != null)   args.push('-to', String(o.endTime));
      args.push('-c', 'copy', outputName);
      return args;
    }

    case 'video:compress': {
      const crf = o.quality != null ? Math.round(51 - (o.quality / 100) * 33) : 28;
      if (tgtExt === 'webm') {
        return ['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0',
                '-threads', '0', outputName];
      }
      return ['-i', inputName, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'veryfast',
              '-c:a', 'aac', '-threads', '0', outputName];
    }

    case 'video:extract-audio':
      return ['-i', inputName, '-vn', '-acodec', tgtExt === 'mp3' ? 'libmp3lame' : 'copy', outputName];

    case 'video:rotate': {
      const deg = o.rotation ?? 90;
      const transpose = deg === 90 ? 'transpose=1' : deg === 180 ? 'hflip,vflip' : deg === 270 || deg === -90 ? 'transpose=2' : 'transpose=0';
      return ['-i', inputName, '-vf', transpose, '-c:a', 'copy', outputName];
    }

    case 'video:gif': {
      const fps = o.fps ?? 12;
      return ['-i', inputName, '-vf', `fps=${fps},scale=480:-1:flags=lanczos`, '-loop', '0', outputName];
    }

    case 'video:crop': {
      const { x=0, y=0, w=640, h=480 } = o.crop ?? {};
      return ['-i', inputName, '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:a', 'copy', outputName];
    }

    case 'video:reverse': {
      const keepAudio = o.keepAudio ?? false;
      if (keepAudio) return ['-i', inputName, '-vf', 'reverse', '-af', 'areverse', outputName];
      return ['-i', inputName, '-vf', 'reverse', '-an', outputName];
    }

    case 'video:subtitle': {
      // Burn subtitle text passed as SRT content in options.subtitleText
      // Write SRT to a virtual file in FFmpeg FS, then use subtitles filter
      return ['-i', inputName, '-vf', `ass=${inputName}.srt`, '-c:a', 'copy', outputName];
    }

    case 'audio:merge': {
      // handled separately in engine run() with multiple input files
      return ['-i', inputName, outputName];
    }

    case 'audio:convert':
      return ['-i', inputName, outputName];

    case 'audio:trim': {
      const args = ['-i', inputName];
      if (o.startTime != null) args.push('-ss', String(o.startTime));
      if (o.endTime != null)   args.push('-to', String(o.endTime));
      args.push('-c', 'copy', outputName);
      return args;
    }

    case 'audio:compress': {
      const bitrate = o.bitrate ?? 128;
      return ['-i', inputName, '-b:a', `${bitrate}k`, outputName];
    }

    case 'audio:normalize':
      return ['-i', inputName, '-filter:a', 'loudnorm', outputName];

    case 'audio:speed': {
      const s = o.speed ?? 1.0;
      return ['-i', inputName, '-filter:a', `atempo=${s}`, outputName];
    }

    case 'audio:pitch': {
      const semitones = o.pitch ?? 0;
      const ratio = Math.pow(2, semitones / 12);
      return ['-i', inputName, '-filter:a', `rubberband=pitch=${ratio}`, outputName];
    }

    default:
      return ['-i', inputName, outputName];
  }
}

// ── Engine ─────────────────────────────────────────────────────────────────────
let _ffmpegInstance: FFmpegInstance | null = null;
let _loadPromise: Promise<void> | null = null;

async function getFFmpeg(onProgress?: (n: number) => void): Promise<FFmpegInstance> {
  if (_ffmpegInstance) return _ffmpegInstance;

  if (_loadPromise) { await _loadPromise; return _ffmpegInstance!; }

  _loadPromise = (async () => {
    onProgress?.(5);
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg') as unknown as Promise<FFmpegModule>,
      import('@ffmpeg/util') as Promise<FFmpegUtilModule>,
    ]);
    onProgress?.(10);

    const ff = new FFmpeg();
    ff.on('log', (data: unknown) => {
      const msg = (data as { message?: string }).message ?? '';
      if (process.env.NODE_ENV === 'development') console.debug('[FFmpeg]', msg);
    });

    const base = getCoreBase();
    const useMT = hasSAB();

    onProgress?.(12);
    // Fetch all core files in parallel for faster initialization
    const [coreURL, wasmURL, workerURL] = await Promise.all([
      toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      useMT
        ? toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript')
        : Promise.resolve(undefined),
    ]);
    onProgress?.(22);

    const loadOpts = useMT
      ? { coreURL, wasmURL, workerURL: workerURL! }
      : { coreURL, wasmURL };

    await ff.load(loadOpts);
    _ffmpegInstance = ff;
    onProgress?.(32);
    console.info(`[FFmpeg] Loaded ${useMT ? 'multi-threaded' : 'single-threaded'} core`);
  })();

  await _loadPromise;
  return _ffmpegInstance!;
}

export const VideoAudioEngine = {
  async process(job: TranscodeJob): Promise<TranscodeResult> {
    const { files, op, options = {}, onProgress } = job;
    const file   = files[0];
    const srcExt = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
    const tgtExt = options.targetFormat ?? srcExt;

    // Handle audio:merge separately
    if (op === 'audio:merge') {
      return this._merge(files, tgtExt, options, onProgress);
    }

    const ff = await getFFmpeg(onProgress);
    const { fetchFile } = await import('@ffmpeg/util') as FFmpegUtilModule;

    const inputName  = `input.${srcExt}`;
    const outputName = `output.${tgtExt}`;

    onProgress?.(35);
    ff.on('progress', (data: unknown) => {
      const progress = ((data as { progress?: number }).progress ?? 0);
      onProgress?.(35 + Math.round(progress * 60));
    });

    await ff.writeFile(inputName, await fetchFile(file));
    onProgress?.(50);

    const args = buildArgs(inputName, outputName, op, options, srcExt, tgtExt);
    const code = await ff.exec(args);
    if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(inputName).catch(() => {});
    await ff.deleteFile(outputName).catch(() => {});

    onProgress?.(100);
    const blob = new Blob([data], { type: mimeFor(tgtExt) });

    return {
      blob,
      filename: buildOutputName(file.name, tgtExt),
      mimeType: mimeFor(tgtExt),
    };
  },

  async _merge(
    files: File[],
    tgtExt: string,
    options: TranscodeJob['options'],
    onProgress?: (n: number) => void,
  ): Promise<TranscodeResult> {
    const ff = await getFFmpeg(onProgress);
    const { fetchFile } = await import('@ffmpeg/util') as FFmpegUtilModule;

    onProgress?.(35);
    const inputLines: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const ext  = files[i].name.split('.').pop() ?? 'mp3';
      const name = `in${i}.${ext}`;
      await ff.writeFile(name, await fetchFile(files[i]));
      inputLines.push(`file '${name}'`);
    }

    const listBlob = new Blob([inputLines.join('\n')], { type: 'text/plain' });
    const listArr  = new Uint8Array(await listBlob.arrayBuffer());
    await ff.writeFile('list.txt', listArr);

    const outputName = `merged.${tgtExt}`;
    await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outputName]);
    const data = await ff.readFile(outputName);
    onProgress?.(100);

    return {
      blob: new Blob([data], { type: mimeFor(tgtExt) }),
      filename: `merged.${tgtExt}`,
      mimeType: mimeFor(tgtExt),
    };
  },
};
