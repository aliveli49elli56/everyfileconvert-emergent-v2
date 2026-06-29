'use client';
/**
 * BlurImageUI — Canvas-based image blur tool
 * Full image Gaussian blur via CSS filter (fast), region blur via offscreen canvas
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Download } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function BlurImageUI({ onFileSelected }: Props) {
  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [radius, setRadius]   = useState(8);
  const [mode, setMode]       = useState<'full' | 'edges'>('full');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const img = imgRef.current;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    if (mode === 'full') {
      ctx.filter = `blur(${radius}px)`;
      ctx.drawImage(img, -radius * 2, -radius * 2, img.naturalWidth + radius * 4, img.naturalHeight + radius * 4);
      ctx.filter = 'none';
    } else {
      // Draw original, then blur edges with a vignette
      ctx.drawImage(img, 0, 0);
      const edgeBlur = Math.max(2, radius);
      ctx.filter = `blur(${edgeBlur}px)`;
      const edgeW = Math.round(img.naturalWidth * 0.15);
      const edgeH = Math.round(img.naturalHeight * 0.15);
      // left/right/top/bottom strips
      ctx.drawImage(img, 0, 0, edgeW, img.naturalHeight, 0, 0, edgeW, img.naturalHeight);
      ctx.drawImage(img, img.naturalWidth - edgeW, 0, edgeW, img.naturalHeight, img.naturalWidth - edgeW, 0, edgeW, img.naturalHeight);
      ctx.drawImage(img, 0, 0, img.naturalWidth, edgeH, 0, 0, img.naturalWidth, edgeH);
      ctx.drawImage(img, 0, img.naturalHeight - edgeH, img.naturalWidth, edgeH, 0, img.naturalHeight - edgeH, img.naturalWidth, edgeH);
      ctx.filter = 'none';
    }
  }, [radius, mode]);

  useEffect(() => { draw(); }, [draw]);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; setImgSrc(url); draw(); };
    img.src = url;
    onFileSelected?.(f);
  };

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'blurred.png';
      a.click();
    }, 'image/png');
  };

  if (!imgSrc) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="blur-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-slate-400 hover:bg-slate-100/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Image className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an image to blur</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-slate-500">click to browse</span> — PNG, JPG, WebP, GIF</p>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="blur-editor">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center max-h-[360px]">
        <canvas ref={canvasRef} className="max-h-[360px] max-w-full object-contain" />
      </div>

      {/* Mode */}
      <div className="flex gap-2">
        {(['full', 'edges'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${mode === m ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
            {m === 'full' ? 'Full Image Blur' : 'Edge Blur Only'}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Blur Radius — {radius}px</label>
        <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(+e.target.value)}
          className="w-full accent-slate-600" data-testid="blur-slider" />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Subtle (1px)</span><span>Heavy (50px)</span></div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => setImgSrc(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={download} data-testid="blur-download"
          className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
          <Download className="h-4 w-4" />Download
        </button>
      </div>
    </div>
  );
}
