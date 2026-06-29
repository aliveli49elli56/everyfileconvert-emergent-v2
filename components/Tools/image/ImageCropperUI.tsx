'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, Crop, Download } from 'lucide-react';

type Rect = { x: number; y: number; w: number; h: number };
const PRESETS = [
  { label: 'Free' },
  { label: '1:1',  ratio: [1,  1]  as [number,number] },
  { label: '16:9', ratio: [16, 9]  as [number,number] },
  { label: '4:3',  ratio: [4,  3]  as [number,number] },
  { label: '3:2',  ratio: [3,  2]  as [number,number] },
  { label: '9:16', ratio: [9,  16] as [number,number] },
];

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ImageCropperUI({ toolName, onFileSelected }: Props) {
  const [file,     setFile]    = useState<File|null>(null);
  const [objUrl,   setObjUrl]  = useState<string|null>(null);
  const [cropBox,  setCropBox] = useState<Rect|null>(null);
  const [dragging, setDragging]= useState(false);
  const [dragSt,   setDragSt]  = useState({x:0,y:0});
  const [preset,   setPreset]  = useState(PRESETS[0]);
  const [result,   setResult]  = useState<string|null>(null);
  const [imgOff,   setImgOff]  = useState({left:0,top:0});
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const fileInput    = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (result) URL.revokeObjectURL(result);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setCropBox(null); setResult(null); setPreset(PRESETS[0]);
    onFileSelected?.(f);
  }, [objUrl, result, onFileSelected]);

  const updateOff = () => {
    if (!imgRef.current || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const ir = imgRef.current.getBoundingClientRect();
    setImgOff({ left: ir.left - cr.left, top: ir.top - cr.top });
  };

  const posOnImg = useCallback((e: React.PointerEvent) => {
    if (!imgRef.current) return {x:0,y:0};
    const r = imgRef.current.getBoundingClientRect();
    return { x: Math.max(0,Math.min(e.clientX-r.left, r.width)), y: Math.max(0,Math.min(e.clientY-r.top, r.height)) };
  }, []);

  const withRatio = (sx:number,sy:number,ex:number,ey:number,ratio?:[number,number]):Rect => {
    let w=ex-sx, h=ey-sy;
    if (ratio && Math.abs(w)>1 && Math.abs(h)>1) {
      const [rw,rh]=ratio;
      if (Math.abs(w)/Math.abs(h) > rw/rh) h=(Math.abs(w)/rw*rh)*Math.sign(h||1);
      else w=(Math.abs(h)/rh*rw)*Math.sign(w||1);
    }
    return { x:Math.min(sx,sx+w), y:Math.min(sy,sy+h), w:Math.abs(w), h:Math.abs(h) };
  };

  const onDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = posOnImg(e); setDragSt(p); setDragging(true); setResult(null); setCropBox(null);
  }, [posOnImg]);
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setCropBox(withRatio(dragSt.x,dragSt.y,...Object.values(posOnImg(e)) as [number,number], preset.ratio));
  }, [dragging, dragSt, posOnImg, preset]);
  const onUp = useCallback(() => setDragging(false), []);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPreset(p);
    if (!imgRef.current || !p.ratio) { setCropBox(null); return; }
    const [iw,ih] = [imgRef.current.clientWidth, imgRef.current.clientHeight];
    const [rw,rh] = p.ratio;
    let bw=iw*0.8, bh=bw*rh/rw;
    if (bh>ih*0.8) { bh=ih*0.8; bw=bh*rw/rh; }
    setCropBox({ x:(iw-bw)/2, y:(ih-bh)/2, w:bw, h:bh });
  };

  const applyCrop = () => {
    if (!cropBox || !imgRef.current || !file) return;
    const [dw,dh] = [imgRef.current.clientWidth, imgRef.current.clientHeight];
    const [nw,nh] = [imgRef.current.naturalWidth, imgRef.current.naturalHeight];
    const canvas = document.createElement('canvas');
    const nx=Math.round(cropBox.x*nw/dw), ny=Math.round(cropBox.y*nh/dh);
    canvas.width=Math.round(Math.min(cropBox.w*nw/dw, nw-nx));
    canvas.height=Math.round(Math.min(cropBox.h*nh/dh, nh-ny));
    canvas.getContext('2d')!.drawImage(imgRef.current, nx, ny, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(b => { if (!b) return; if (result) URL.revokeObjectURL(result); setResult(URL.createObjectURL(b)); }, file.type||'image/png', 0.95);
  };

  const cropInfo = cropBox && imgRef.current ? {
    w: Math.round(cropBox.w*imgRef.current.naturalWidth/imgRef.current.clientWidth),
    h: Math.round(cropBox.h*imgRef.current.naturalHeight/imgRef.current.clientHeight),
  } : null;

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()}
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all" data-testid="cropper-drop">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Crop className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to crop</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span> — drag on image to select region</p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-3" data-testid="cropper-editor">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ratio:</span>
        {PRESETS.map(p => (
          <button key={p.label} onClick={()=>applyPreset(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${preset.label===p.label ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="relative flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 overflow-hidden" style={{minHeight:200,cursor:'crosshair'}}>
        <img ref={imgRef} src={objUrl!} alt="crop" draggable={false}
          className="block select-none" style={{maxWidth:'100%',maxHeight:460,userSelect:'none'}}
          onLoad={updateOff}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
        {cropBox && cropBox.w>4 && cropBox.h>4 && (
          <div className="absolute pointer-events-none border-2 border-blue-400"
            style={{left:imgOff.left+cropBox.x,top:imgOff.top+cropBox.y,width:cropBox.w,height:cropBox.h,background:'rgba(59,130,246,0.08)',boxShadow:'0 0 0 9999px rgba(0,0,0,0.45)'}}>
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({length:9}).map((_,i)=><div key={i} className="border-[0.5px] border-white/20"/>)}
            </div>
            {[{top:-4,left:-4},{top:-4,right:-4},{bottom:-4,left:-4},{bottom:-4,right:-4}].map((s,i)=>(
              <div key={i} className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm" style={s as React.CSSProperties}/>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{cropInfo ? `${cropInfo.w} × ${cropInfo.h} px` : 'Drag on the image to select a crop region'}</span>
        {cropBox && <button onClick={()=>setCropBox(null)} className="text-rose-400 hover:text-rose-600">Clear</button>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setCropBox(null);setResult(null);}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <div className="flex items-center gap-2">
          {result && <a href={result} download={`cropped_${file?.name}`} data-testid="crop-download"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"><Download className="h-4 w-4"/>Download</a>}
          <button onClick={applyCrop} disabled={!cropBox||cropBox.w<5||cropBox.h<5} data-testid="apply-crop"
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-colors">
            <Crop className="h-4 w-4"/>Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
