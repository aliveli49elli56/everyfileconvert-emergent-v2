'use client';
import { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, Music } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const SEMITONE_PRESETS = [
  { label: '-5', value: -5 },
  { label: '-3', value: -3 },
  { label: '-1', value: -1 },
  { label: '0',  value:  0 },
  { label: '+1', value:  1 },
  { label: '+3', value:  3 },
  { label: '+5', value:  5 },
];

export default function AudioPitchChangerUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [objUrl, setObjUrl]     = useState<string | null>(null);
  const [semitones, setSemitones] = useState(0);
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
        files: [file], op: 'audio:pitch',
        options: { pitch: semitones },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 25 ? 'Loading FFmpeg…' : `Shifting pitch ${semitones > 0 ? '+' : ''}${semitones} semitones…`); },
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
      data-testid="pitch-changer-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-pink-400 hover:bg-pink-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Music className="h-6 w-6 text-slate-400 group-hover:text-pink-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an audio file to change pitch</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-pink-500">click to browse</span> — MP3, WAV, FLAC, AAC, OGG</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="pitch-changer-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#ec4899" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          <audio src={objUrl!} controls className="w-full rounded-xl" />

          {/* Semitone presets */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Pitch Shift</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SEMITONE_PRESETS.map(p => (
                <button key={p.value} onClick={() => setSemitones(p.value)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${semitones === p.value ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <input type="range" min={-12} max={12} step={1} value={semitones}
                onChange={e => setSemitones(+e.target.value)}
                className="w-full accent-pink-500" data-testid="pitch-slider" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>-12 (Octave Down)</span>
                <span className={`font-bold ${semitones === 0 ? 'text-slate-500' : semitones > 0 ? 'text-pink-600' : 'text-indigo-600'}`}>
                  {semitones > 0 ? `+${semitones}` : semitones} semitones
                </span>
                <span>+12 (Octave Up)</span>
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
          ? <a href={resultUrl} download={`pitch_${semitones}st_${file?.name}`} data-testid="pitch-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing' || semitones === 0} data-testid="pitch-process"
            className="flex items-center gap-1.5 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : <><Music className="h-4 w-4" />Change Pitch</>}
          </button>}
      </div>
    </div>
  );
}
