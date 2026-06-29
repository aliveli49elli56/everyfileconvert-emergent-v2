'use client';
import { useState, useRef } from 'react';
import { FileText, Download, Loader2, RotateCw } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const ANGLES = [
  { label: '90° Right', value: 90  },
  { label: '180°',      value: 180 },
  { label: '90° Left',  value: 270 },
];

export default function PDFRotatorUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [pageCount, setCount]   = useState<number | null>(null);
  const [angle, setAngle]       = useState(90);
  const [applyTo, setApplyTo]   = useState<'all' | 'range'>('all');
  const [rangeStr, setRangeStr] = useState('');
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') return;
    setFile(f); setStage('idle'); setResult(null); setError(null); setCount(null);
    onFileSelected?.(f);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setCount(doc.getPageCount());
    } catch { setCount(null); }
  };

  const handleProcess = async () => {
    if (!file) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'pdf:rotate',
        options: { rotateDegrees: angle, pageRange: applyTo === 'range' ? rangeStr : 'all' },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 20 ? 'Loading pdf-lib…' : `Rotating pages ${angle}°…`); },
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
      data-testid="pdf-rotator-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <RotateCw className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a PDF to rotate</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-indigo-500">click to browse</span></p>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="pdf-rotator-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#6366f1" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * progress / 100} 9999`} className="transition-all duration-300" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <FileText className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium text-slate-700">{file.name}</span>
            {pageCount && <span className="text-xs font-bold text-indigo-600">{pageCount} pages</span>}
          </div>

          {/* Rotation angle */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Rotation Angle</p>
            <div className="grid grid-cols-3 gap-2">
              {ANGLES.map(a => (
                <button key={a.value} onClick={() => setAngle(a.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all ${angle === a.value ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}>
                  <RotateCw className={`h-4 w-4 ${a.value === 270 ? 'scale-x-[-1]' : ''}`} style={a.value === 180 ? { transform: 'rotate(180deg)' } : undefined} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Apply to */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Apply to</p>
            <div className="flex gap-2">
              {(['all', 'range'] as const).map(opt => (
                <button key={opt} onClick={() => setApplyTo(opt)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all ${applyTo === opt ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                  {opt === 'all' ? 'All pages' : 'Specific pages'}
                </button>
              ))}
            </div>
            {applyTo === 'range' && (
              <input type="text" value={rangeStr} onChange={e => setRangeStr(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-9" data-testid="rotate-range-input"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none" />
            )}
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); setResult(null); setStage('idle'); setCount(null); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`rotated_${file?.name}`} data-testid="pdf-rotate-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="pdf-rotate-process"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Rotating…</> : <><RotateCw className="h-4 w-4" />Rotate PDF</>}
          </button>}
      </div>
    </div>
  );
}
