'use client';
/**
 * AddSubtitleUI — Add/burn subtitles to video using FFmpeg.wasm
 * Supports SRT file upload OR manual subtitle entry
 */
import { useState, useRef } from 'react';
import { Video, FileText, Download, Loader2, Captions, X } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

interface SubEntry { start: string; end: string; text: string }

function timecodeToSec(tc: string) {
  const [h, m, s] = tc.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

export default function AddSubtitleUI({ onFileSelected }: Props) {
  const [videoFile, setVideo]   = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode]         = useState<'upload' | 'manual'>('upload');
  const [srtFile, setSrtFile]   = useState<File | null>(null);
  const [manualSubs, setManual] = useState<SubEntry[]>([{ start: '00:00:01', end: '00:00:04', text: 'Hello World' }]);
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const srtInput   = useRef<HTMLInputElement>(null);

  const loadVideo = (f: File) => {
    if (!f.type.startsWith('video/')) return;
    setVideo(f); setVideoUrl(URL.createObjectURL(f));
    setResult(null); setError(null); setStage('idle');
    onFileSelected?.(f);
  };

  const buildSrtContent = () => {
    return manualSubs.map((s, i) => (
      `${i + 1}\n${s.start},000 --> ${s.end},000\n${s.text}\n`
    )).join('\n');
  };

  const updateSub = (i: number, key: keyof SubEntry, value: string) => {
    setManual(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  };

  const handleProcess = async () => {
    if (!videoFile) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      let srtContent = '';
      if (mode === 'upload' && srtFile) {
        srtContent = await srtFile.text();
      } else {
        srtContent = buildSrtContent();
      }
      const res = await Transcoder.run({
        files: [videoFile], op: 'video:subtitle',
        options: { subtitleText: srtContent },
        onProgress: (pct) => {
          setProgress(pct);
          setStageMsg(pct < 20 ? 'Loading FFmpeg…' : 'Burning subtitles…');
        },
      });
      setResult(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setStage('error'); }
  };

  if (!videoFile) return (
    <div onClick={() => videoInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadVideo(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="subtitle-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-blue-400 hover:bg-blue-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Captions className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a video to add subtitles</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-blue-500">click to browse</span> — MP4, WebM, MOV, AVI</p>
      </div>
      <input ref={videoInput} type="file" accept="video/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadVideo(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="subtitle-editor">
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
          <video src={videoUrl!} controls className="w-full rounded-2xl border border-slate-200" style={{ maxHeight: 260 }} />

          {/* Mode */}
          <div className="flex gap-2">
            {(['upload', 'manual'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${mode === m ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                {m === 'upload' ? 'Upload SRT File' : 'Type Manually'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <div onClick={() => srtInput.current?.click()}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all ${srtFile ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <FileText className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-slate-600">{srtFile ? srtFile.name : 'Click to upload .srt file'}</span>
              {srtFile && <button onClick={e => { e.stopPropagation(); setSrtFile(null); }} className="ml-auto text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>}
              <input ref={srtInput} type="file" accept=".srt,.vtt,.ass" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) setSrtFile(f); }} />
            </div>
          ) : (
            <div className="space-y-2">
              {manualSubs.map((s, i) => (
                <div key={i} className="grid grid-cols-[100px_100px_1fr_28px] gap-2 items-center">
                  <input type="text" value={s.start} onChange={e => updateSub(i, 'start', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono focus:outline-none" placeholder="00:00:01" />
                  <input type="text" value={s.end} onChange={e => updateSub(i, 'end', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono focus:outline-none" placeholder="00:00:04" />
                  <input type="text" value={s.text} onChange={e => updateSub(i, 'text', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none" />
                  <button onClick={() => setManual(p => p.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => setManual(p => [...p, { start: '00:00:00', end: '00:00:03', text: 'New subtitle' }])}
                className="text-xs text-blue-500 hover:text-blue-600">+ Add subtitle entry</button>
            </div>
          )}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setVideo(null); setVideoUrl(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change video</button>
        {resultUrl
          ? <a href={resultUrl} download={`subtitled_${videoFile?.name}`} data-testid="subtitle-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess}
            disabled={stage === 'processing' || (mode === 'upload' && !srtFile)}
            data-testid="subtitle-process"
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : <><Captions className="h-4 w-4" />Burn Subtitles</>}
          </button>}
      </div>
    </div>
  );
}
