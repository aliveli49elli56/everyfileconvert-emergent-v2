'use client';
import { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, Layers, X, GripVertical } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

export default function AudioMergerUI({ onFileSelected }: Props) {
  const [files, setFiles]       = useState<File[]>([]);
  const [mode, setMode]         = useState<'concat' | 'overlay'>('concat');
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const audioFiles = Array.from(newFiles).filter(f => f.type.startsWith('audio/'));
    setFiles(prev => [...prev, ...audioFiles].slice(0, 10));
    if (audioFiles[0]) onFileSelected?.(audioFiles[0]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    setFiles(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };

  const handleProcess = async () => {
    if (files.length < 2) return;
    setStage('processing'); setProgress(0); setError(null); setResult(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files, op: 'audio:merge',
        options: { mergeMode: mode },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 25 ? 'Loading FFmpeg…' : `Merging ${files.length} tracks…`); },
      });
      setResult(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setStage('error'); }
  };

  if (files.length === 0) return (
    <div
      onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => fileInput.current?.click()}
      data-testid="audio-merger-drop"
      className={`group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 cursor-pointer transition-all ${dragOver ? 'border-cyan-400 bg-cyan-50/60' : 'border-slate-200 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/60'}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Layers className="h-6 w-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop audio files to merge</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-cyan-500">click to browse</span> — select 2–10 files</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" multiple className="sr-only"
        onChange={e => addFiles(e.target.files)} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="audio-merger-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#06b6d4" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          {/* Mode selector */}
          <div className="flex gap-2">
            {(['concat', 'overlay'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all ${mode === m ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200'}`}>
                {m === 'concat' ? 'Sequential (one after another)' : 'Overlay (mix together)'}
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20">
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">{i + 1}</span>
                <FileAudio className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="flex-1 truncate text-xs text-slate-700">{f.name}</span>
                <span className="shrink-0 text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-rose-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {files.length < 10 && (
              <button onClick={() => fileInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs text-slate-400 hover:border-cyan-300 hover:text-cyan-500 transition-all">
                + Add more files
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="audio/*" multiple className="sr-only"
            onChange={e => addFiles(e.target.files)} />
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFiles([]); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Clear all</button>
        {resultUrl
          ? <a href={resultUrl} download="merged_audio.mp3" data-testid="merge-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing' || files.length < 2} data-testid="merge-process"
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Merging…</> : <><Layers className="h-4 w-4" />Merge {files.length} Files</>}
          </button>}
      </div>
    </div>
  );
}
