'use client';
import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Link } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ImageEnlargerUI({ toolName, onFileSelected }: Props) {
  const [file,   setFile]  = useState<File|null>(null);
  const [objUrl, setObjUrl]= useState<string|null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [newW,  setNewW]   = useState(0);
  const [newH,  setNewH]   = useState(0);
  const [locked, setLocked]= useState(true);
  const [busy,   setBusy]  = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => { setNaturalW(img.naturalWidth); setNaturalH(img.naturalHeight); setNewW(img.naturalWidth); setNewH(img.naturalHeight); };
    img.src = url;
    setFile(f); setObjUrl(url);
    onFileSelected?.(f);
  };

  const handleWChange = (v: number) => {
    setNewW(v);
    if (locked && naturalW>0) setNewH(Math.round(v * naturalH / naturalW));
  };
  const handleHChange = (v: number) => {
    setNewH(v);
    if (locked && naturalH>0) setNewW(Math.round(v * naturalW / naturalH));
  };

  const handleDownload = () => {
    if (!file || !objUrl || newW<=0 || newH<=0) return;
    setBusy(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width=newW; canvas.height=newH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,newW,newH);
      canvas.toBlob(b=>{
        if(!b)return;
        const url=URL.createObjectURL(b);
        const a=document.createElement('a');
        a.href=url; a.download=`enlarged_${file.name}`; a.click();
        URL.revokeObjectURL(url); setBusy(false);
      }, file.type||'image/png', 0.95);
    };
    img.src=objUrl;
  };

  const scalePresets = [
    {label:'2×', mul:2},{label:'3×', mul:3},{label:'4×', mul:4},
    {label:'HD (1280×720)',  w:1280, h:720},
    {label:'FHD (1920×1080)',w:1920, h:1080},
  ];

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="enlarger-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to resize/enlarge</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="enlarger-editor">
      {/* Current / New info */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div><p className="text-xs text-slate-400">Original size</p><p className="font-bold text-slate-700">{naturalW} × {naturalH}px</p></div>
        <div><p className="text-xs text-slate-400">New size</p><p className={`font-bold ${(newW>naturalW||newH>naturalH)?'text-blue-600':'text-emerald-600'}`}>{newW} × {newH}px</p></div>
      </div>

      {/* Scale presets */}
      <div className="flex flex-wrap gap-2">
        {scalePresets.map(p => (
          <button key={p.label} onClick={()=>{
            if(p.mul){ setNewW(naturalW*p.mul); setNewH(naturalH*p.mul); }
            else if(p.w&&p.h){ setNewW(p.w); if(locked&&naturalW>0)setNewH(Math.round(p.w*naturalH/naturalW)); else setNewH(p.h); }
          }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      {/* Width/Height inputs */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-500">Width (px)</label>
          <input type="number" min={1} max={10000} value={newW} onChange={e=>handleWChange(+e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-700 focus:border-emerald-400 focus:outline-none" />
        </div>
        <button onClick={()=>setLocked(v=>!v)} title={locked?'Unlock aspect ratio':'Lock aspect ratio'}
          className={`mt-5 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${locked?'border-emerald-300 bg-emerald-50 text-emerald-600':'border-slate-200 bg-white text-slate-400'}`}>
          <Link className="h-4 w-4"/>
        </button>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-500">Height (px)</label>
          <input type="number" min={1} max={10000} value={newH} onChange={e=>handleHChange(+e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-slate-700 focus:border-emerald-400 focus:outline-none" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={handleDownload} disabled={busy||newW<=0||newH<=0} data-testid="enlarger-download"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4"/>{busy?'Processing…':'Download'}
        </button>
      </div>
    </div>
  );
}
