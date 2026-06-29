'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ColorAdjustmentsUI({ toolName, onFileSelected }: Props) {
  const [file,   setFile]  = useState<File|null>(null);
  const [objUrl, setObjUrl]= useState<string|null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast,   setContrast]   = useState(100);
  const [saturate,   setSaturate]   = useState(100);
  const [hue,        setHue]        = useState(0);
  const [blur,       setBlur]       = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [resultUrl, setResultUrl] = useState<string|null>(null);

  const filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg) blur(${blur}px)`;

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f)); setResultUrl(null);
    setBrightness(100); setContrast(100); setSaturate(100); setHue(0); setBlur(0);
    onFileSelected?.(f);
  };

  const handleDownload = useCallback(() => {
    if (!objUrl || !file) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.filter = filter;
      ctx.drawImage(img,0,0);
      canvas.toBlob(b=>{
        if(!b)return;
        if(resultUrl)URL.revokeObjectURL(resultUrl);
        const url = URL.createObjectURL(b);
        setResultUrl(url);
        const a = document.createElement('a');
        a.href=url; a.download=`adjusted_${file.name}`; a.click();
      }, file.type||'image/png', 0.95);
    };
    img.src=objUrl;
  }, [objUrl, file, filter, resultUrl]);

  const sliders = [
    { label:'Brightness', value:brightness, set:setBrightness, min:0,   max:200, unit:'%',  step:1  },
    { label:'Contrast',   value:contrast,   set:setContrast,   min:0,   max:200, unit:'%',  step:1  },
    { label:'Saturation', value:saturate,   set:setSaturate,   min:0,   max:200, unit:'%',  step:1  },
    { label:'Hue Rotate', value:hue,        set:setHue,        min:-180,max:180, unit:'deg',step:1  },
    { label:'Blur',       value:blur,       set:setBlur,       min:0,   max:20,  unit:'px', step:0.5},
  ];

  const isDefault = brightness===100 && contrast===100 && saturate===100 && hue===0 && blur===0;

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="coloradj-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to adjust</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="coloradj-editor">
      {/* Live preview */}
      <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900" style={{minHeight:220,maxHeight:380}}>
        <img src={objUrl!} alt="preview" draggable={false}
          style={{maxWidth:'100%',maxHeight:360,objectFit:'contain',filter,transition:'filter 0.15s ease'}} />
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        {sliders.map(s=>(
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-24 text-xs font-medium text-slate-500 shrink-0">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e=>s.set(+e.target.value)}
              className="flex-1 h-1.5 rounded-full accent-emerald-500 cursor-pointer" />
            <span className="w-16 text-right text-xs font-mono text-slate-600">{s.value}{s.unit}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);}} className="text-xs text-slate-400 hover:text-slate-600">← Change</button>
          {!isDefault && <button onClick={()=>{setBrightness(100);setContrast(100);setSaturate(100);setHue(0);setBlur(0);}} className="text-xs text-rose-400 hover:text-rose-600">Reset</button>}
        </div>
        <button onClick={handleDownload} disabled={isDefault} data-testid="coloradj-download"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4"/>Download
        </button>
      </div>
    </div>
  );
}
