'use client';
import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { FlipHorizontal, FlipVertical } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function FlipImageUI({ toolName, onFileSelected }: Props) {
  const [file,   setFile]  = useState<File|null>(null);
  const [objUrl, setObjUrl]= useState<string|null>(null);
  const [flipH,  setFlipH] = useState(false);
  const [flipV,  setFlipV] = useState(false);
  const [busy,   setBusy]  = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setFlipH(false); setFlipV(false);
    onFileSelected?.(f);
  };

  const cssTransform = [flipH ? 'scaleX(-1)' : '', flipV ? 'scaleY(-1)' : ''].filter(Boolean).join(' ') || 'none';
  const hasFlip = flipH || flipV;

  const handleDownload = () => {
    if (!file || !objUrl) return;
    setBusy(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.translate(flipH?canvas.width:0, flipV?canvas.height:0);
      ctx.scale(flipH?-1:1, flipV?-1:1);
      ctx.drawImage(img,0,0);
      ctx.restore();
      canvas.toBlob(b=>{
        if(!b)return;
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href=url; a.download=`flipped_${file.name}`; a.click();
        URL.revokeObjectURL(url); setBusy(false);
      }, file.type||'image/png', 0.95);
    };
    img.src = objUrl;
  };

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="flip-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <FlipHorizontal className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to flip</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="flip-editor">
      <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4" style={{minHeight:260,maxHeight:440}}>
        <img src={objUrl!} alt="preview" draggable={false}
          style={{maxWidth:'100%',maxHeight:400,objectFit:'contain',transform:cssTransform,transition:'transform 0.25s cubic-bezier(.4,0,.2,1)'}} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={()=>setFlipH(v=>!v)} data-testid="flip-h"
          className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition-all ${flipH?'border-blue-300 bg-blue-50 text-blue-700':'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60'}`}>
          <FlipHorizontal className="h-6 w-6"/>Flip Horizontal
        </button>
        <button onClick={()=>setFlipV(v=>!v)} data-testid="flip-v"
          className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition-all ${flipV?'border-purple-300 bg-purple-50 text-purple-700':'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/60'}`}>
          <FlipVertical className="h-6 w-6"/>Flip Vertical
        </button>
      </div>

      {(flipH||flipV) && (
        <p className="text-center text-xs text-slate-400">
          Applied: {[flipH&&'Horizontal',flipV&&'Vertical'].filter(Boolean).join(' + ')} flip
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={handleDownload} disabled={busy||!hasFlip} data-testid="flip-download"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4"/>{busy?'Processing…':'Download'}
        </button>
      </div>
    </div>
  );
}
