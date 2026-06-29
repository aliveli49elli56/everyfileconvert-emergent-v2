'use client';
/**
 * AddWatermarkUI — Canvas-based image watermark
 * Text watermark with position, opacity, color, font size
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Download, Stamp } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

const POSITIONS = [
  { label: 'Top Left',     value: 'top-left'      },
  { label: 'Top Right',    value: 'top-right'      },
  { label: 'Center',       value: 'center'         },
  { label: 'Bottom Left',  value: 'bottom-left'    },
  { label: 'Bottom Right', value: 'bottom-right'   },
  { label: 'Tiled',        value: 'tiled'          },
];

export default function AddWatermarkUI({ onFileSelected }: Props) {
  const [imgSrc, setImgSrc]     = useState<string | null>(null);
  const [text, setText]         = useState('© MyBrand');
  const [color, setColor]       = useState('#ffffff');
  const [opacity, setOpacity]   = useState(0.5);
  const [fontSize, setFontSize] = useState(36);
  const [position, setPosition] = useState('bottom-right');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const img = imgRef.current;
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const scaledFs = Math.round(fontSize * (img.naturalWidth / 600));
    ctx.font      = `bold ${scaledFs}px Arial, sans-serif`;
    ctx.fillStyle = hexToRgba(color, opacity);
    const pad     = scaledFs;
    const textW   = ctx.measureText(text).width;
    const W = img.naturalWidth, H = img.naturalHeight;

    const getXY = (): [number, number] => {
      switch (position) {
        case 'top-left':     ctx.textAlign = 'left';   return [pad, pad + scaledFs];
        case 'top-right':    ctx.textAlign = 'right';  return [W - pad, pad + scaledFs];
        case 'center':       ctx.textAlign = 'center'; return [W / 2, H / 2];
        case 'bottom-left':  ctx.textAlign = 'left';   return [pad, H - pad];
        case 'bottom-right': ctx.textAlign = 'right';  return [W - pad, H - pad];
        default:             ctx.textAlign = 'center'; return [W / 2, H / 2];
      }
    };

    if (position === 'tiled') {
      ctx.textAlign = 'center';
      const stepX = textW + scaledFs * 2;
      const stepY = scaledFs * 3;
      ctx.save(); ctx.rotate((-25 * Math.PI) / 180);
      for (let x = -W; x < W * 2; x += stepX)
        for (let y = -H; y < H * 2; y += stepY)
          ctx.fillText(text, x, y);
      ctx.restore();
    } else {
      const [x, y] = getXY();
      ctx.fillText(text, x, y);
    }
  }, [text, color, opacity, fontSize, position]);

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
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'watermarked.png';
      a.click();
    }, 'image/png');
  };

  if (!imgSrc) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="watermark-img-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Stamp className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an image to watermark</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-indigo-500">click to browse</span> — PNG, JPG, WebP</p>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="watermark-img-editor">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center max-h-[340px]">
        <canvas ref={canvasRef} className="max-h-[340px] max-w-full object-contain" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Watermark Text</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} maxLength={80}
            data-testid="wm-text-input"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 cursor-pointer" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Font Size — {fontSize}px</label>
          <input type="range" min={12} max={120} value={fontSize} onChange={e => setFontSize(+e.target.value)}
            className="w-full accent-indigo-500 mt-2" />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Opacity — {Math.round(opacity*100)}%</label>
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={e => setOpacity(+e.target.value)}
            className="w-full accent-indigo-500" data-testid="wm-opacity" />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Position</label>
          <div className="flex flex-wrap gap-1.5">
            {POSITIONS.map(p => (
              <button key={p.value} onClick={() => setPosition(p.value)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${position === p.value ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => setImgSrc(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={download} data-testid="wm-img-download"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          <Download className="h-4 w-4" />Download
        </button>
      </div>
    </div>
  );
}
