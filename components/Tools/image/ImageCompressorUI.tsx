'use client';
import { useDownloadWorkflow } from '@/lib/hooks/useDownloadWorkflow';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ImageCompressorUI({ toolName, onFileSelected }: Props) {
  const { storeAndRedirect } = useDownloadWorkflow();

  const [file,     setFile]    = useState<File|null>(null);
  const [objUrl,   setObjUrl]  = useState<string|null>(null);
  const [quality,  setQuality] = useState(80);
  const [resultBlob, setResultBlob] = useState<Blob|null>(null);
  const [resultUrl,  setResultUrl]  = useState<string|null>(null);
  const [splitPos, setSplitPos]= useState(50);  // % for before/after divider
  const [origSize, setOrigSize]= useState(0);
  const [newSize,  setNewSize] = useState(0);
  const [busy,     setBusy]    = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splitRef  = useRef<HTMLDivElement>(null);
  const draggingDiv = useRef(false);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f)); setOrigSize(f.size);
    setResultBlob(null); setResultUrl(null); setNewSize(0);
    onFileSelected?.(f);
  };

  // Compress whenever quality changes (debounced)
  useEffect(() => {
    if (!file || !objUrl) return;
    const t = setTimeout(() => compress(), 300);
    return () => clearTimeout(t);
  }, [quality, objUrl]); // eslint-disable-line

  const compress = useCallback(async () => {
    if (!file || !objUrl) return;
    setBusy(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        setNewSize(blob.size);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        storeAndRedirect(blob, {
        inputFilename:  file.name,
        outputFilename: `compressed_${file.name}`,
        inputFormat:    file.name.split('.').pop()?.toLowerCase() ?? 'jpg',
        outputFormat:   file.name.split('.').pop()?.toLowerCase() ?? 'jpg',
        inputSizeBytes: file.size,
        providerId:     'CanvasProcessor',
        libraryId:      'canvas-api',
      });
        setBusy(false);
      }, 'image/jpeg', quality / 100);
    };
    img.src = objUrl;
  }, [file, objUrl, quality, resultUrl]);

  // Drag split divider
  const onSplitPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingDiv.current = true;
  };
  const onSplitPointerMove = (e: React.PointerEvent) => {
    if (!draggingDiv.current || !splitRef.current) return;
    const container = splitRef.current.closest('.split-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setSplitPos(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
  };
  const onSplitPointerUp = () => { draggingDiv.current = false; };

  const saving = origSize > 0 && newSize > 0 ? Math.round((1 - newSize / origSize) * 100) : 0;

  if (!file) return (
    <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadFile(f);}} onDragOver={e=>e.preventDefault()}
      onClick={()=>fileInput.current?.click()} data-testid="compressor-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center"><p className="text-sm font-semibold text-slate-700">Drop an image to compress</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p></div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);}} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="compressor-editor">
      {/* Quality slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Quality</label>
          <span className="text-sm font-bold text-emerald-600">{quality}%</span>
        </div>
        <input type="range" min={10} max={100} step={1} value={quality}
          onChange={e=>setQuality(+e.target.value)}
          className="w-full h-2 rounded-full accent-emerald-500 cursor-pointer" />
        <div className="flex justify-between text-xs text-slate-400"><span>Smaller file</span><span>Higher quality</span></div>
      </div>

      {/* Size comparison */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
        <div><p className="text-xs text-slate-400">Original</p><p className="font-bold text-slate-700">{(origSize/1024).toFixed(1)} KB</p></div>
        <div><p className="text-xs text-slate-400">Saved</p><p className={`font-bold ${saving>0?'text-emerald-600':'text-slate-400'}`}>{saving>0?`-${saving}%`:'—'}</p></div>
        <div><p className="text-xs text-slate-400">New size</p><p className="font-bold text-blue-600">{newSize>0?(newSize/1024).toFixed(1)+' KB':'…'}</p></div>
      </div>

      {/* Before / After slider */}

      {/* Compress triggers automatically via useEffect */}
    </div>
  );
}
