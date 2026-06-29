'use client';
import { useState, useRef } from 'react';
import { Upload, Download, X, Loader2, Plus, Droplets } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle'|'processing'|'done'|'error';

interface FileItem { id: string; file: File; preview: string }
type Op = 'resize'|'watermark'|'grayscale'|'brightness';

export default function BatchImageProcessorUI({ toolName, onFileSelected }: Props) {
  const [files,  setFiles]  = useState<FileItem[]>([]);
  const [op,     setOp]     = useState<Op>('resize');
  const [resizeW, setResizeW] = useState(800);
  const [resizeH, setResizeH] = useState(600);
  const [wmText,  setWmText]  = useState('© 2025');
  const [brightness, setBrightness] = useState(100);
  const [stage,  setStage]  = useState<Stage>('idle');
  const [zipUrl, setZipUrl] = useState<string|null>(null);
  const [error,  setError]  = useState<string|null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const imgs = incoming.filter(f=>f.type.startsWith('image/'));
    setFiles(prev=>[...prev,...imgs.map(f=>({id:Math.random().toString(36).slice(2),file:f,preview:URL.createObjectURL(f)}))]);
    if(imgs[0]) onFileSelected?.(imgs[0]);
  };

  const removeFile = (id:string) => {
    setFiles(prev=>{const f=prev.find(x=>x.id===id);if(f)URL.revokeObjectURL(f.preview);return prev.filter(x=>x.id!==id);});
  };

  const processOne = (item: FileItem): Promise<Blob> => new Promise((res,rej) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.naturalWidth,h=img.naturalHeight;
      if(op==='resize'){ w=resizeW; h=resizeH; }
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d')!;
      if(op==='grayscale') ctx.filter='grayscale(100%)';
      if(op==='brightness') ctx.filter=`brightness(${brightness}%)`;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,w,h);
      if(op==='watermark'&&wmText){
        ctx.filter='none';
        const fs=Math.max(16,Math.min(48,w/20));
        ctx.font=`bold ${fs}px sans-serif`;
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.textAlign='right';
        ctx.fillText(wmText,w-12,h-12);
      }
      canvas.toBlob(b=>b?res(b):rej(new Error('blob')),item.file.type||'image/jpeg',0.92);
    };
    img.src=item.preview;
  });

  const handleProcess = async () => {
    if(!files.length) return;
    setStage('processing'); setError(null);
    try {
      const JSZip=(await import('jszip')).default;
      const zip=new JSZip();
      for(const item of files){
        const blob=await processOne(item);
        zip.file(item.file.name,blob);
      }
      const zipBlob=await zip.generateAsync({type:'blob'});
      if(zipUrl)URL.revokeObjectURL(zipUrl);
      setZipUrl(URL.createObjectURL(zipBlob));
      setStage('done');
    } catch(e){ setError(e instanceof Error?e.message:'Failed'); setStage('error'); }
  };

  const OPS: {value:Op;label:string}[] = [{value:'resize',label:'Resize'},{value:'watermark',label:'Watermark'},{value:'grayscale',label:'Grayscale'},{value:'brightness',label:'Brightness'}];

  return (
    <div className="space-y-4" data-testid="batch-processor">
      <div onDrop={e=>{e.preventDefault();addFiles(Array.from(e.dataTransfer.files));}} onDragOver={e=>e.preventDefault()}
        onClick={()=>fileInput.current?.click()}
        className="group flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
        <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-500"/>
        <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-600">Add images — {files.length} loaded</span>
        <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={e=>addFiles(Array.from(e.target.files??[]))}/>
      </div>

      {/* Operation selector */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {OPS.map(o=>(
            <button key={o.value} onClick={()=>setOp(o.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${op===o.value?'bg-emerald-500 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{o.label}</button>
          ))}
        </div>
        {op==='resize'&&(
          <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Size:</span>
            <input type="number" value={resizeW} onChange={e=>setResizeW(+e.target.value)} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono text-center focus:border-emerald-400 focus:outline-none"/>
            <span className="text-xs text-slate-400">×</span>
            <input type="number" value={resizeH} onChange={e=>setResizeH(+e.target.value)} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono text-center focus:border-emerald-400 focus:outline-none"/>
          </div>
        )}
        {op==='watermark'&&(
          <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Text:</span>
            <input type="text" value={wmText} onChange={e=>setWmText(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none" placeholder="© Your Name"/>
          </div>
        )}
        {op==='brightness'&&(
          <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Brightness:</span>
            <input type="range" min={50} max={150} value={brightness} onChange={e=>setBrightness(+e.target.value)} className="flex-1 h-1.5 rounded-full accent-emerald-500 cursor-pointer"/>
            <span className="text-xs font-mono text-slate-600">{brightness}%</span>
          </div>
        )}
      </div>

      {files.length>0&&(
        <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto rounded-xl border border-slate-100 p-2">
          {files.map(f=>(
            <div key={f.id} className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square">
              <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover"/>
              <button onClick={()=>removeFile(f.id)} className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
                <X className="h-3 w-3"/>
              </button>
            </div>
          ))}
        </div>
      )}

      {error&&<p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{files.forEach(f=>URL.revokeObjectURL(f.preview));setFiles([]);setZipUrl(null);setStage('idle');}} className="text-xs text-slate-400 hover:text-slate-600">Clear all</button>
        {zipUrl
          ? <a href={zipUrl} download="processed_images.zip" data-testid="batch-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4"/>Download ZIP</a>
          : <button onClick={handleProcess} disabled={!files.length||stage==='processing'} data-testid="batch-process"
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
              {stage==='processing'?<><Loader2 className="h-4 w-4 animate-spin"/>Processing…</>:`Process ${files.length} Image${files.length!==1?'s':''}`}
            </button>}
      </div>
    </div>
  );
}
