'use client';
import { useState, useRef } from 'react';
import { Upload, Download, ZoomIn } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ImageUpscalerUI({ toolName, onFileSelected }: Props) {
  const [file,   setFile]  = useState<File|null>(null);
  const [objUrl, setObjUrl]= useState<string|null>(null);
  const [scale,  setScale] = useState(2);
  const [busy,   setBusy]  = useState(false);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => { setNaturalW(img.naturalWidth); setNaturalH(img.naturalHeight); };
    img.src = url;
    setFile(f); setObjUrl(url); onFileSelected?.(f);
  };

  const handleDownload = () => {
    if (!file || !objUrl) return;
    setBusy(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width=img.naturalWidth*scale; canvas.height=img.naturalHeight*scale;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(b=>{
        if(!b)return;
        const url=URL.createObjectURL(b);
        const a=document.createElement('a');
        a.href=url; a.download=`upscaled_${scale}x_${file.name}`; a.click();
        URL.revokeObjectURL(url); setBusy(false);
      }, file.type==='image/gif'?'image/png':file.type, 0.95);
    };
    img.src=objUrl;
  };

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="upscaler-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <ZoomIn className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to upscale</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="upscaler-editor">
      <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4" style={{minHeight:220,maxHeight:380}}>
        <img src={objUrl!} alt="preview" draggable={false} className="max-w-full object-contain" style={{maxHeight:340}} />
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div><p className="text-xs text-slate-400">Original</p><p className="font-bold text-slate-700">{naturalW} × {naturalH}px</p></div>
        <div><p className="text-xs text-slate-400">Output ({scale}×)</p><p className="font-bold text-blue-600">{naturalW*scale} × {naturalH*scale}px</p></div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Scale Factor</p>
        <div className="grid grid-cols-4 gap-2">
          {[2,3,4,8].map(s=>(
            <button key={s} onClick={()=>setScale(s)}
              className={`rounded-xl py-2.5 text-sm font-bold transition-all ${scale===s?'bg-blue-500 text-white shadow-sm':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={handleDownload} disabled={busy} data-testid="upscaler-download"
          className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4"/>{busy?'Processing…':`Upscale ${scale}×`}
        </button>
      </div>
    </div>
  );
}
