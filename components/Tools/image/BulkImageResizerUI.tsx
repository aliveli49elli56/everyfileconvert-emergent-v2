'use client';
import { useState, useRef } from 'react';
import { Upload, Download, X, Loader2, Plus } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';

interface FileItem { id: string; file: File; preview: string; newW: number; newH: number; done: boolean; }

export default function BulkImageResizerUI({ toolName, onFileSelected }: Props) {
  const [files,  setFiles] = useState<FileItem[]>([]);
  const [targetW, setTargetW] = useState(1280);
  const [targetH, setTargetH] = useState(720);
  const [lockAspect, setLockAspect] = useState(true);
  const [stage,  setStage] = useState<Stage>('idle');
  const [zipUrl, setZipUrl]= useState<string|null>(null);
  const [error,  setError] = useState<string|null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const imgs = incoming.filter(f => f.type.startsWith('image/'));
    const items: FileItem[] = imgs.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: URL.createObjectURL(f),
      newW: targetW, newH: targetH,
      done: false,
    }));
    setFiles(prev => [...prev, ...items]);
    if (items[0]) onFileSelected?.(items[0].file);
  };

  const removeFile = (id: string) => {
    setFiles(prev => { const f = prev.find(x=>x.id===id); if(f)URL.revokeObjectURL(f.preview); return prev.filter(x=>x.id!==id); });
  };

  const handleProcess = async () => {
    if (!files.length) return;
    setStage('processing'); setError(null);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const item of files) {
        const blob = await new Promise<Blob>((res, rej) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w=targetW, h=targetH;
            if(lockAspect) { const r=img.naturalWidth/img.naturalHeight; if(w/h>r) w=Math.round(h*r); else h=Math.round(w/r); }
            canvas.width=w; canvas.height=h;
            const ctx=canvas.getContext('2d')!; ctx.imageSmoothingQuality='high';
            ctx.drawImage(img,0,0,w,h);
            canvas.toBlob(b=>b?res(b):rej(new Error('blob failed')), item.file.type||'image/jpeg', 0.92);
          };
          img.src=item.preview;
        });
        zip.file(item.file.name, blob);
      }
      const zipBlob = await zip.generateAsync({type:'blob'});
      if (zipUrl) URL.revokeObjectURL(zipUrl);
      setZipUrl(URL.createObjectURL(zipBlob));
      setStage('done');
    } catch(e) { setError(e instanceof Error?e.message:'Failed'); setStage('error'); }
  };

  return (
    <div className="space-y-4" data-testid="bulk-resizer">
      {/* Drop zone */}
      <div onDrop={e=>{e.preventDefault();addFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()}
        onClick={()=>fileInput.current?.click()}
        className="group flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
        <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-500"/>
        <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-600">Add images ({files.length} loaded)</span>
        <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={e=>addFiles(Array.from(e.target.files??[]))} />
      </div>

      {/* Target dimensions */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <span className="text-xs font-medium text-slate-500">Resize all to:</span>
        <input type="number" min={1} max={8000} value={targetW} onChange={e=>setTargetW(+e.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono text-center focus:border-emerald-400 focus:outline-none" />
        <span className="text-xs text-slate-400">×</span>
        <input type="number" min={1} max={8000} value={targetH} onChange={e=>setTargetH(+e.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono text-center focus:border-emerald-400 focus:outline-none" />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={lockAspect} onChange={e=>setLockAspect(e.target.checked)} className="accent-emerald-500" />
          Lock aspect
        </label>
      </div>

      {/* File grid */}
      {files.length>0 && (
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto rounded-xl border border-slate-100 p-2">
          {files.map(f => (
            <div key={f.id} className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square">
              <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"/>
              <button onClick={()=>removeFile(f.id)} className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
                <X className="h-3 w-3"/>
              </button>
              <p className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5 text-[9px] text-white truncate">{f.file.name}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{files.forEach(f=>URL.revokeObjectURL(f.preview));setFiles([]);setZipUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">Clear all</button>
        {zipUrl
          ? <a href={zipUrl} download="resized_images.zip" data-testid="bulk-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download ZIP</a>
          : <button onClick={handleProcess} disabled={!files.length||stage==='processing'} data-testid="bulk-process"
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Processing…</>:`Resize ${files.length} Image${files.length!==1?'s':''}`}
            </button>}
      </div>
    </div>
  );
}
