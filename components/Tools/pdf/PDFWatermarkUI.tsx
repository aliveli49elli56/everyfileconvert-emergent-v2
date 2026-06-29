'use client';
import { useState, useRef } from 'react';
import { FileText, Download, Loader2, Stamp } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'processing' | 'done' | 'error';

const POSITIONS = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ANGLES    = [0, 45, -45, 90];

export default function PDFWatermarkUI({ onFileSelected }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [text, setText]         = useState('CONFIDENTIAL');
  const [color, setColor]       = useState('#6b7280');
  const [opacity, setOpacity]   = useState(0.3);
  const [angle, setAngle]       = useState(45);
  const [position, setPosition] = useState('center');
  const [fontSize, setFontSize] = useState(48);
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
    if (!file || !text.trim()) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'pdf:watermark',
        options: { watermarkText: text, watermarkColor: color, watermarkOpacity: opacity, watermarkAngle: angle, watermarkPosition: position as 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left', watermarkFontSize: fontSize },
        onProgress: (pct) => { setProgress(pct); setStageMsg(pct < 20 ? 'Loading pdf-lib…' : 'Applying watermark…'); },
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
      data-testid="pdf-watermark-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-slate-400 hover:bg-slate-100/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Stamp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop a PDF to watermark</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-slate-500">click to browse</span></p>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="pdf-watermark-editor">
      {stage === 'processing' ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#64748b" strokeWidth="6"
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

          {/* Watermark preview */}
          <div className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <span
              className="select-none font-bold"
              style={{
                color, opacity, fontSize: Math.min(fontSize, 40),
                transform: `rotate(${angle}deg)`,
                transition: 'all 0.2s ease',
              }}>
              {text || 'WATERMARK'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Watermark text */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Watermark Text</label>
              <input type="text" value={text} onChange={e => setText(e.target.value)} maxLength={60}
                data-testid="watermark-text-input"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>

            {/* Color */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="h-9 w-14 rounded-lg border border-slate-200 cursor-pointer" data-testid="watermark-color" />
                <span className="text-xs font-mono text-slate-500">{color}</span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Opacity — {Math.round(opacity * 100)}%</label>
              <input type="range" min={0.05} max={1} step={0.05} value={opacity}
                onChange={e => setOpacity(+e.target.value)}
                className="w-full accent-slate-500 mt-1" data-testid="watermark-opacity" />
            </div>

            {/* Font size */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Font Size (pt)</label>
              <input type="number" min={12} max={200} value={fontSize}
                onChange={e => setFontSize(Math.min(200, Math.max(12, +e.target.value)))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
            </div>

            {/* Angle */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Angle</label>
              <div className="flex gap-1.5">
                {ANGLES.map(a => (
                  <button key={a} onClick={() => setAngle(a)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${angle === a ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {a}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500">Position</p>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map(p => (
                <button key={p} onClick={() => setPosition(p)}
                  className={`rounded-lg border px-2.5 py-1 text-xs capitalize transition-all ${position === p ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); setResult(null); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {resultUrl
          ? <a href={resultUrl} download={`watermarked_${file?.name}`} data-testid="pdf-watermark-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Download</a>
          : <button onClick={handleProcess} disabled={stage === 'processing' || !text.trim()} data-testid="pdf-watermark-process"
            className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">
            {stage === 'processing' ? <><Loader2 className="h-4 w-4 animate-spin" />Applying…</> : <><Stamp className="h-4 w-4" />Apply Watermark</>}
          </button>}
      </div>
    </div>
  );
}
