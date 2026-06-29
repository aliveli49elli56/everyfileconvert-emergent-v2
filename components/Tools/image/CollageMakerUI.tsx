'use client';
/**
 * CollageMakerUI — Canvas-based multi-image collage
 * Grid layout templates, real-time preview, download PNG
 */
import { useState, useRef, useCallback } from 'react';
import { Image, Download, X, LayoutGrid } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

const LAYOUTS: { label: string; cols: number; rows: number }[] = [
  { label: '2×1', cols: 2, rows: 1 },
  { label: '1×2', cols: 1, rows: 2 },
  { label: '2×2', cols: 2, rows: 2 },
  { label: '3×1', cols: 3, rows: 1 },
  { label: '3×2', cols: 3, rows: 2 },
  { label: '2×3', cols: 2, rows: 3 },
];

export default function CollageMakerUI({ onFileSelected }: Props) {
  const [images, setImages]   = useState<string[]>([]);
  const [layout, setLayout]   = useState(LAYOUTS[2]);
  const [gap, setGap]         = useState(8);
  const [bg, setBg]           = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const totalSlots = layout.cols * layout.rows;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const current = images.length;
    const slots = totalSlots - current;
    Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, slots).forEach(f => {
      const url = URL.createObjectURL(f);
      setImages(prev => [...prev, url].slice(0, totalSlots));
      if (current === 0) onFileSelected?.(f);
    });
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const buildCollage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const CELL_W = 400, CELL_H = 300;
    const W = layout.cols * CELL_W + (layout.cols - 1) * gap;
    const H = layout.rows * CELL_H + (layout.rows - 1) * gap;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const loadedImgs = images.map(src => new Promise<HTMLImageElement>(res => {
      const img = new window.Image(); img.crossOrigin = 'anonymous';
      img.onload = () => res(img); img.src = src;
    }));

    Promise.all(loadedImgs).then(imgs => {
      imgs.forEach((img, i) => {
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        const x = col * (CELL_W + gap);
        const y = row * (CELL_H + gap);
        // Cover fit
        const scale = Math.max(CELL_W / img.naturalWidth, CELL_H / img.naturalHeight);
        const sw = CELL_W / scale, sh = CELL_H / scale;
        const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, CELL_W, CELL_H);
      });
    });
  }, [images, layout, gap, bg]);

  const download = () => {
    buildCollage();
    setTimeout(() => {
      canvasRef.current?.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'collage.png';
        a.click();
      }, 'image/png');
    }, 300);
  };

  return (
    <div className="space-y-4" data-testid="collage-editor">
      {/* Layout selector */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Layout</p>
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map(l => (
            <button key={l.label} onClick={() => { setLayout(l); setImages([]); }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${layout.label === l.label ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image slots */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}>
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div key={i} className={`relative aspect-video overflow-hidden rounded-xl border-2 transition-all ${images[i] ? 'border-transparent' : 'border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-purple-300'}`}
            onClick={() => !images[i] && fileInput.current?.click()}>
            {images[i] ? (
              <>
                <img src={images[i]} className="h-full w-full object-cover" alt="" />
                <button onClick={e => { e.stopPropagation(); removeImage(i); }}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400">+ Image {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only"
        onChange={e => addFiles(e.target.files)} />

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="sr-only" />

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Gap — {gap}px</label>
          <input type="range" min={0} max={32} value={gap} onChange={e => setGap(+e.target.value)}
            className="w-full accent-purple-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Background</label>
          <input type="color" value={bg} onChange={e => setBg(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 cursor-pointer" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">{images.length}/{totalSlots} images added</span>
        <button onClick={download} disabled={images.length === 0} data-testid="collage-download"
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4" />Create Collage
        </button>
      </div>
    </div>
  );
}
