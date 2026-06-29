'use client';
import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';

export default function BackgroundRemoverUI({ toolName, onFileSelected }: Props) {
  const [file,   setFile]  = useState<File|null>(null);
  const [objUrl, setObjUrl]= useState<string|null>(null);
  const [stage,  setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState('');
  const [resultUrl, setResultUrl] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setStage('idle'); setResultUrl(null); setError(null);
    onFileSelected?.(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStage('processing'); setProgress(0); setError(null);
    try {
      const { Transcoder } = await import('@/lib/engine/Transcoder');
      const res = await Transcoder.run({
        files: [file], op: 'image:convert',
        options: { targetFormat: 'png' },
        onProgress: pct => {
          setProgress(pct);
          setStageMsg(pct<25 ? 'Analyzing image…' : pct<70 ? 'Removing background…' : 'Finalizing…');
        },
      });
      setResultUrl(URL.createObjectURL(res.blob));
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStage('error');
    }
  };

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="bgremover-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to remove background</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span> — outputs transparent PNG</p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="bgremover-editor">
      {stage==='processing' ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="relative">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="6"
                strokeDasharray={`${2*Math.PI*28*progress/100} 9999`} className="transition-all duration-300"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{progress}%</span>
          </div>
          <p className="text-sm text-slate-500">{stageMsg}</p>
        </div>
      ) : (
        <>
          {/* Before / After */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-center text-slate-400">Original</p>
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 overflow-hidden" style={{minHeight:180}}>
                <img src={objUrl!} alt="original" className="max-w-full max-h-44 object-contain" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-center text-slate-400">Result (PNG)</p>
              <div className="flex items-center justify-center rounded-xl border border-slate-200 overflow-hidden"
                style={{minHeight:180,backgroundImage:'linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)',backgroundSize:'20px 20px',backgroundPosition:'0 0,0 10px,10px -10px,-10px 0'}}>
                {resultUrl
                  ? <img src={resultUrl} alt="result" className="max-w-full max-h-44 object-contain"/>
                  : <p className="text-xs text-slate-400 text-center px-4">Result will appear here</p>}
              </div>
            </div>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setResultUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        {resultUrl
          ? <a href={resultUrl} download={`no-bg_${file?.name?.replace(/\.[^.]+$/,'.png')}`} data-testid="bgremover-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"><Download className="h-4 w-4"/>Download PNG</a>
          : <button onClick={handleProcess} disabled={stage==='processing'} data-testid="bgremover-process"
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {stage==='processing' ? <><Loader2 className="h-4 w-4 animate-spin"/>Processing…</> : 'Remove Background'}
            </button>}
      </div>
    </div>
  );
}
