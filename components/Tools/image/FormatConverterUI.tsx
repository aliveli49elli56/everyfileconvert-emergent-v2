'use client';
/**
 * FormatConverterUI — Canvas-based image aspect ratio converter
 * Square, Landscape, Portrait with fill color for empty areas
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Download } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

const RATIOS = [
  { label: '1:1 Square',        w: 1, h: 1  },
  { label: '16:9 Landscape',    w: 16, h: 9  },
  { label: '9:16 Portrait',     w: 9, h: 16 },
  { label: '4:3 Classic',       w: 4, h: 3  },
  { label: '3:4 Portrait',      w: 3, h: 4  },
  { label: '21:9 Ultra-wide',   w: 21, h: 9 },
];

export default function FormatConverterUI({ onFileSelected }: Props) {
  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [ratio, setRatio]     = useState(RATIOS[0]);
  const [fill, setFill]       = useState('#ffffff');
  const [outW, setOutW]       = useState(1080);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const img  = imgRef.current;
    const outH = Math.round((outW / ratio.w) * ratio.h);
    canvas.width = outW; canvas.height = outH;
    const ctx  = canvas.getContext('2d')!;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, outW, outH);

    // Cover-fit: scale to fill, center
    const scale = Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (outW - drawW) / 2;
    const y = (outH - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
  }, [ratio, fill, outW]);

  useEffect(() => { draw(); }, [draw]);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setOutW(Math.max(img.naturalWidth, 400));
      setImgSrc(url);
      draw();
    };
    img.src = url;
    onFileSelected?.(f);
  };

  const download = () => {
    draw();
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `image_${ratio.label.split(' ')[0].replace(':', 'x')}.jpg`;
      a.click();
    }, 'image/jpeg', 0.92);
  };

  if (!imgSrc) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="format-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-teal-400 hover:bg-teal-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Image className="h-6 w-6 text-slate-400 group-hover:text-teal-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an image to change format/ratio</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-teal-500">click to browse</span> — PNG, JPG, WebP, GIF</p>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="format-editor">
      <div className="overflow-hidden rounded-2xl border border-slate-200 flex items-center justify-center max-h-[320px]"
        style={{ background: fill }}>
        <canvas ref={canvasRef} className="max-h-[320px] max-w-full object-contain" />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Aspect Ratio</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RATIOS.map(r => (
            <button key={r.label} onClick={() => setRatio(r)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all text-left ${ratio.label === r.label ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Output Width — {outW}px</label>
          <input type="range" min={400} max={4000} step={100} value={outW} onChange={e => setOutW(+e.target.value)}
            className="w-full accent-teal-500" data-testid="format-width" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Fill Color</label>
          <input type="color" value={fill} onChange={e => setFill(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 cursor-pointer" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => setImgSrc(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{outW}×{Math.round((outW / ratio.w) * ratio.h)}px</span>
          <button onClick={download} data-testid="format-download"
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
            <Download className="h-4 w-4" />Download JPG
          </button>
        </div>
      </div>
    </div>
  );
}
