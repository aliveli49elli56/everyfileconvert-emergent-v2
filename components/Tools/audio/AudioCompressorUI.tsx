'use client';
import { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, Zap } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const BITRATE_PRESETS = [
  { label: 'Low', value: 64,  desc: '~1 MB/min' },
  { label: 'Med', value: 128, desc: '~2 MB/min' },
  { label: 'High', value: 192, desc: '~3 MB/min' },
  { label: 'Max', value: 320, desc: '~5 MB/min' },
];

const FORMAT_OPTS = ['mp3', 'aac', 'ogg'] as const;

export default function AudioCompressorUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [objUrl, setObjUrl]     = useState<string | null>(null);
  const [bitrate, setBitrate]   = useState(128);
  const [format, setFormat]     = useState<typeof FORMAT_OPTS[number]>('mp3');
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('audio/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setStage('idle'); setResult(null); setError(null);
    onFileSelected?.(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'audio:compress',
        options: { bitrate, targetFormat: format },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 25 ? 'Loading FFmpeg…' : `Compressing to ${bitrate}kbps…`); },
      });
      setResult(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setStage('error'); }
  };

  if (!file) return (
    <div
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      onClick={() => fileInput.current?.click()}
      data-testid="audio-compressor-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <FileAudio className="h-6 w-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an audio file to compress</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-amber-500">click to browse</span> — MP3, WAV, FLAC, AAC, OGG</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="audio-compressor-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#f59e0b" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <FileAudio className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="truncate font-medium">{file.name}</span>
            <span className="ml-auto shrink-0 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>

          {/* Output format */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Output Format</p>
            <div className="flex gap-2">
              {FORMAT_OPTS.map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${format === f ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate presets */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Bitrate — {bitrate} kbps</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {BITRATE_PRESETS.map(p => (
                <button key={p.value} onClick={() => setBitrate(p.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 text-xs font-semibold transition-all ${bitrate === p.value ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'}`}>
                  <span>{p.label}</span>
                  <span className="font-normal text-slate-400">{p.desc}</span>
                </button>
              ))}
            </div>
            <input type="range" min={32} max={320} step={8} value={bitrate}
              onChange={e => setBitrate(+e.target.value)}
              className="w-full accent-amber-500" data-testid="bitrate-slider" />
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); if (objUrl) URL.revokeObjectURL(objUrl); setObjUrl(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`compressed_${file?.name}`} data-testid="audio-compress-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="audio-compress-process"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Compressing…</> : <><Zap className="h-4 w-4" />Compress Audio</>}
          </button>}
      </div>
    </div>
  );
}
