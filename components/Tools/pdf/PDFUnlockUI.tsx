'use client';
import { useState, useRef } from 'react';
import { FileText, Download, Loader2, Unlock } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

export default function PDFUnlockUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
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
        files: [file], op: 'pdf:unlock',
        options: { password },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 20 ? 'Loading pdf-lib…' : 'Unlocking PDF…'); },
      });
      setResult(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Incorrect password or failed to unlock'); setStage('error'); }
  };

  if (!file) return (
    <div
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      onClick={() => fileInput.current?.click()}
      data-testid="pdf-unlock-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Unlock className="h-6 w-6 text-slate-400 group-hover:text-cyan-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a password-protected PDF</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-cyan-500">click to browse</span></p>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-5" data-testid="pdf-unlock-editor">
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
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <FileText className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium text-slate-700">{file.name}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">PDF Password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcess()}
              placeholder="Enter the PDF password"
              data-testid="pdf-password-input"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} className="rounded" />
              Show password
            </label>
          </div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Only remove passwords from PDFs you own or have permission to unlock.
          </p>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`unlocked_${file?.name}`} data-testid="pdf-unlock-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download Unlocked PDF</a>
          : <button onClick={handleProcess} disabled={stage === 'processing'} data-testid="pdf-unlock-process"
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Unlocking…</> : <><Unlock className="h-4 w-4" />Unlock PDF</>}
          </button>}
      </div>
    </div>
  );
}
