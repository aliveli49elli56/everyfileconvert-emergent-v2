'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Pipette, Copy, Check } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ColorPickerUI({ toolName, onFileSelected }: Props) {
  const [file,    setFile]   = useState<File|null>(null);
  const [objUrl,  setObjUrl] = useState<string|null>(null);
  const [picked,  setPicked] = useState<{hex:string;r:number;g:number;b:number}|null>(null);
  const [history, setHistory]= useState<string[]>([]);
  const [copied,  setCopied] = useState<string|null>(null);
  const [cursor,  setCursor] = useState({x:0,y:0,show:false});
  const [zoom,    setZoom]   = useState<string|null>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvas= useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f)); setPicked(null); setHistory([]);
    onFileSelected?.(f);
  };

  const buildCanvas = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img,0,0);
  }, []);

  const pickColor = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    if (!canvasRef.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const ctx = canvasRef.current.getContext('2d')!;
    const px = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()}`;
    setPicked({hex, r:px[0], g:px[1], b:px[2]});
    setHistory(h => [hex, ...h.filter(c=>c!==hex)].slice(0,10));

    // Zoom preview
    if (zoomCanvas.current) {
      const zc = zoomCanvas.current; zc.width=80; zc.height=80;
      const zctx = zc.getContext('2d')!;
      zctx.imageSmoothingEnabled=false;
      zctx.drawImage(canvasRef.current, Math.max(0,x-5), Math.max(0,y-5), 10, 10, 0, 0, 80, 80);
      setZoom(zc.toDataURL());
    }
  }, []);

  const moveCursor = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(text); setTimeout(()=>setCopied(null), 1500); });
  };

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="picker-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Pipette className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to pick colors</p>
        <p className="text-xs text-slate-400 mt-1">Click anywhere on the image to get HEX/RGB</p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="picker-editor">
      <canvas ref={canvasRef} className="hidden" />
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 cursor-crosshair">
        <img ref={imgRef} src={objUrl!} alt="pick color" draggable={false}
          className="block max-w-full" style={{maxHeight:420,display:'block',margin:'0 auto'}}
          onLoad={buildCanvas} onPointerDown={pickColor} onPointerMove={moveCursor} onPointerLeave={()=>setCursor(c=>({...c,show:false}))} />
        {/* Crosshair cursor */}
        {cursor.show && (
          <div className="pointer-events-none absolute flex items-center justify-center" style={{left:cursor.x-16,top:cursor.y-16,width:32,height:32}}>
            <div className="h-px w-8 bg-white/80 absolute" /><div className="w-px h-8 bg-white/80 absolute" />
          </div>
        )}
      </div>
      {/* Picked color panel */}
      {picked && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="h-14 w-14 shrink-0 rounded-xl shadow-inner border border-slate-200" style={{background:picked.hex}} />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-800">{picked.hex}</span>
              <button onClick={()=>copyToClipboard(picked.hex)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200">
                {copied===picked.hex ? <Check className="h-3 w-3 text-emerald-500"/> : <Copy className="h-3 w-3"/>}
                {copied===picked.hex?'Copied!':'HEX'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">rgb({picked.r}, {picked.g}, {picked.b})</span>
              <button onClick={()=>copyToClipboard(`rgb(${picked.r}, ${picked.g}, ${picked.b})`)} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                {copied===`rgb(${picked.r}, ${picked.g}, ${picked.b})`?<Check className="h-3 w-3 text-emerald-500"/>:<Copy className="h-3 w-3"/>} RGB
              </button>
            </div>
          </div>
          {zoom && <img src={zoom} alt="zoom" className="h-16 w-16 rounded-lg border border-slate-200 image-render-pixelated" style={{imageRendering:'pixelated'}} />}
        </div>
      )}
      {/* History */}
      {history.length>1 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400">Color History</p>
          <div className="flex flex-wrap gap-2">
            {history.map((h,i) => (
              <button key={i} title={h} onClick={()=>copyToClipboard(h)}
                className="relative h-7 w-7 rounded-lg border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                style={{background:h}} />
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={()=>{setFile(null);if(objUrl)URL.revokeObjectURL(objUrl);setObjUrl(null);setPicked(null);setHistory([]);}} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <p className="text-xs text-slate-400"><Pipette className="inline h-3 w-3 mr-1"/>Click anywhere on image to pick a color</p>
      </div>
    </div>
  );
}
