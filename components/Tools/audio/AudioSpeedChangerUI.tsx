'use client';
import { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, Gauge } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function AudioSpeedChangerUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [objUrl, setObjUrl]     = useState<string | null>(null);
  const [speed, setSpeed]       = useState(1.0);
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('audio/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setStage('idle'); setResult(null); setError(null);
    onFileSelected?.(f);
  };

  // Live preview via HTML5 playbackRate
  const applyPreview = (v: number) => {
    setSpeed(v);
    if (audioRef.current) audioRef.current.playbackRate = v;
  };

  const handleProcess = async () => {
    if (!file) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'audio:speed',
        options: { speed },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 25 ? 'Loading FFmpeg…' : `Changing speed to ${speed}x…`); },
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
      data-testid="speed-changer-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-blue-400 hover:bg-blue-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Gauge className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an audio file to change speed</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-blue-500">click to browse</span> — MP3, WAV, FLAC, AAC, OGG</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="speed-changer-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          <audio ref={audioRef} src={objUrl!} controls className="w-full rounded-xl" />

          {/* Speed presets */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Playback Speed</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SPEED_PRESETS.map(s => (
                <button key={s} onClick={() => applyPreview(s)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${speed === s ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
                  {s}x
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <input type="range" min={0.25} max={4} step={0.05} value={speed}
                onChange={e => applyPreview(+e.target.value)}
                className="w-full accent-blue-500" data-testid="speed-slider" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0.25x Slow</span>
                <span className="font-bold text-blue-600">{speed.toFixed(2)}x</span>
                <span>4x Fast</span>
              </div>
            </div>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); if (objUrl) URL.revokeObjectURL(objUrl); setObjUrl(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`speed_${speed}x_${file?.name}`} data-testid="speed-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing' || speed === 1} data-testid="speed-process"
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : <><Gauge className="h-4 w-4" />Change Speed</>}
          </button>}
      </div>
    </div>
  );
}
