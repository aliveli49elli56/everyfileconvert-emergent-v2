'use client';
import { useState, useRef } from 'react';
import { FileText, Download, Loader2, Hash } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const POSITIONS = [
  { label: 'Bottom Center', value: 'bottom-center' },
  { label: 'Bottom Right',  value: 'bottom-right'  },
  { label: 'Bottom Left',   value: 'bottom-left'   },
  { label: 'Top Center',    value: 'top-center'    },
  { label: 'Top Right',     value: 'top-right'     },
];

export default function PDFPageNumbersUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [position, setPosition] = useState('bottom-center');
  const [startNum, setStartNum] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [stage, setStage]       = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') return;
    setFile(f); setStage('idle'); setResult(null); setError(null);
    onFileSelected?.(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'pdf:page-numbers',
        options: { pageNumberPosition: position as 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left', pageNumberStart: startNum, pageNumberFontSize: fontSize },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 20 ? 'Loading pdf-lib…' : 'Adding page numbers…'); },
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
      data-testid="page-numbers-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-teal-400 hover:bg-teal-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Hash className="h-6 w-6 text-slate-400 group-hover:text-teal-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a PDF to add page numbers</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-teal-500">click to browse</span></p>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="page-numbers-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#14b8a6" strokeWidth="6"
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
          </div>

          {/* Position */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Position</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {POSITIONS.map(p => (
                <button key={p.value} onClick={() => setPosition(p.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${position === p.value ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Starting Number</label>
              <input type="number" min={1} value={startNum} onChange={e => setStartNum(Math.max(1, +e.target.value))}
                data-testid="start-number-input"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Font Size (pt)</label>
              <input type="number" min={8} max={24} value={fontSize} onChange={e => setFontSize(Math.min(24, Math.max(8, +e.target.value)))}
                data-testid="font-size-input"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`numbered_${file?.name}`} data-testid="page-numbers-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="page-numbers-process"
            className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Adding…</> : <><Hash className="h-4 w-4" />Add Page Numbers</>}
          </button>}
      </div>
    </div>
  );
}
