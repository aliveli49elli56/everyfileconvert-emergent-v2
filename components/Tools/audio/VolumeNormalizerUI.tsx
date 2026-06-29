'use client';
import { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, Volume2 } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const LUFS_PRESETS = [
  { label: 'Spotify / Apple Music', value: -14 },
  { label: 'Podcast / YouTube',     value: -16 },
  { label: 'Broadcast (EBU R128)',  value: -23 },
  { label: 'Custom',                value:   0 },
];

export default function VolumeNormalizerUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [objUrl, setObjUrl]     = useState<string | null>(null);
  const [preset, setPreset]     = useState(LUFS_PRESETS[0]);
  const [customLufs, setCustom] = useState(-14);
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const lufsTarget = preset.value === 0 ? customLufs : preset.value;

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
        files: [file], op: 'audio:normalize',
        options: { lufsTarget: lufsTarget },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 25 ? 'Loading FFmpeg…' : `Normalizing to ${lufsTarget} LUFS…`); },
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
      data-testid="volume-normalizer-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Volume2 className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an audio file to normalize</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span> — MP3, WAV, FLAC, AAC, OGG</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="volume-normalizer-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <FileAudio className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="truncate font-medium">{file.name}</span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Target Loudness</p>
            <div className="space-y-2">
              {LUFS_PRESETS.map(p => (
                <button key={p.label} onClick={() => setPreset(p)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${preset.label === p.label ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'}`}>
                  <span className="font-medium">{p.label}</span>
                  {p.value !== 0 && <span className="font-mono text-xs font-bold">{p.value} LUFS</span>}
                  {p.value === 0 && <span className="text-xs text-slate-400">Set manually</span>}
                </button>
              ))}
            </div>
          </div>

          {preset.value === 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Custom LUFS: <span className="text-emerald-600">{customLufs} LUFS</span>
              </label>
              <input type="range" min={-60} max={0} step={1} value={customLufs}
                onChange={e => setCustom(+e.target.value)}
                className="w-full accent-emerald-500" data-testid="lufs-slider" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>-60 LUFS</span><span>0 LUFS</span></div>
            </div>
          )}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); if (objUrl) URL.revokeObjectURL(objUrl); setObjUrl(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`normalized_${file?.name}`} data-testid="normalize-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="normalize-process"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Normalizing…</> : <><Volume2 className="h-4 w-4" />Normalize</>}
          </button>}
      </div>
    </div>
  );
}
