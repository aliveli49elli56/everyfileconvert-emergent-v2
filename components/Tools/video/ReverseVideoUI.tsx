'use client';
/**
 * ReverseVideoUI — Reverses video using FFmpeg.wasm via Transcoder
 */
import { useState, useRef } from 'react';
import { Video, Download, Loader2, RotateCcw } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

export default function ReverseVideoUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [objUrl, setObjUrl]     = useState<string | null>(null);
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [keepAudio, setAudio]   = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('video/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
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
        files: [file], op: 'video:reverse',
        options: { keepAudio },
        onProgress: (pct) => {
          setProgress(pct);
          setStageMsg(pct < 20 ? 'Loading FFmpeg…' : pct < 90 ? 'Reversing video…' : 'Finalizing…');
        },
      });
      setResult(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setStage('error'); }
  };

  if (!file) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="reverse-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-rose-400 hover:bg-rose-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <RotateCcw className="h-6 w-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a video to reverse</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-rose-500">click to browse</span> — MP4, WebM, MOV, AVI</p>
      </div>
      <input ref={fileInput} type="file" accept="video/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="reverse-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#f43f5e" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
          <p className="text-xs text-slate-400">Large videos may take several minutes</p>
        </div>
      ) : (
        <>
          <video src={objUrl!} controls className="w-full rounded-2xl border border-slate-200" style={{ maxHeight: 320 }} />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={keepAudio} onChange={e => setAudio(e.target.checked)} className="rounded" />
            Keep audio (also reversed)
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); if (objUrl) URL.revokeObjectURL(objUrl); setObjUrl(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change video</button>
        {resultUrl
          ? <a href={resultUrl} download={`reversed_${file?.name}`} data-testid="reverse-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="reverse-process"
            className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Reversing…</> : <><RotateCcw className="h-4 w-4" />Reverse Video</>}
          </button>}
      </div>
    </div>
  );
}
