'use client';
import { useState, useRef } from 'react';
import { FileText, Download, Loader2, ArrowRight } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

export default function PDFToWordUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
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
        files: [file], op: 'pdf:to-word',
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 20 ? 'Loading converter…' : 'Extracting content…'); },
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
      data-testid="pdf-to-word-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-blue-400 hover:bg-blue-50/60 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
          <FileText className="h-6 w-6 text-rose-400 group-hover:text-rose-500 transition-colors" />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
          <FileText className="h-6 w-6 text-blue-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a PDF to convert to Word</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-blue-500">click to browse</span> — outputs .docx</p>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="pdf-to-word-editor">
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
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <FileText className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{file.name}</p>
                <p className="text-xs text-slate-400 uppercase font-bold">PDF</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 mx-2" />
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">{file.name.replace('.pdf', '.docx')}</p>
                <p className="text-xs text-blue-500 uppercase font-bold">DOCX</p>
              </div>
            </div>
          </div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Note: Complex layouts (columns, tables) may not convert perfectly. Text content is fully preserved.
          </p>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={file?.name.replace('.pdf', '.docx')} data-testid="pdf-to-word-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download DOCX</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="pdf-to-word-process"
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Converting…</> : <>Convert to Word</>}
          </button>}
      </div>
    </div>
  );
}
