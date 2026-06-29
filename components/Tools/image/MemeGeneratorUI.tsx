'use client';
/**
 * MemeGeneratorUI — Canvas-based meme creator
 * Top/bottom text with Impact font, real-time preview, download PNG
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Image, Download, Type } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function MemeGeneratorUI({ onFileSelected }: Props) {
  const [imgSrc, setImgSrc]     = useState<string | null>(null);
  const [topText, setTopText]   = useState('TOP TEXT');
  const [botText, setBotText]   = useState('BOTTOM TEXT');
  const [fontSize, setFontSize] = useState(52);
  const [textColor, setColor]   = useState('#ffffff');
  const [strokeColor, setStroke]= useState('#000000');
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
    ctx.drawImage(img, 0, 0);

    const fs = Math.round(fontSize * (img.naturalWidth / 600));
    ctx.font         = `900 ${fs}px Impact, Arial Black, sans-serif`;
    ctx.fillStyle    = textColor;
    ctx.strokeStyle  = strokeColor;
    ctx.lineWidth    = fs / 10;
    ctx.textAlign    = 'center';
    ctx.lineJoin     = 'round';

    const x = img.naturalWidth / 2;
    const padY = fs * 0.15;
    const topY = fs + padY;
    const botY = img.naturalHeight - padY;

    if (topText) {
      ctx.strokeText(topText.toUpperCase(), x, topY);
      ctx.fillText(topText.toUpperCase(), x, topY);
    }
    if (botText) {
      ctx.strokeText(botText.toUpperCase(), x, botY);
      ctx.fillText(botText.toUpperCase(), x, botY);
    }
  }, [topText, botText, fontSize, textColor, strokeColor]);

  useEffect(() => { draw(); }, [draw, imgSrc]);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; setImgSrc(url); };
    img.src = url;
    onFileSelected?.(f);
  };

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'meme.png';
      a.click();
    }, 'image/png');
  };

  if (!imgSrc) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="meme-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <Image className="h-6 w-6 text-slate-400 group-hover:text-yellow-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an image to create a meme</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-yellow-500">click to browse</span> — PNG, JPG, WebP, GIF</p>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="meme-editor">
      {/* Canvas preview */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 flex items-center justify-center max-h-[380px]">
        <canvas ref={canvasRef} className="max-h-[380px] max-w-full object-contain" />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Top Text</label>
          <input data-testid="meme-top-text" type="text" value={topText} onChange={e => setTopText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-yellow-400 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Bottom Text</label>
          <input data-testid="meme-bot-text" type="text" value={botText} onChange={e => setBotText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-yellow-400 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Font Size — {fontSize}px</label>
          <input type="range" min={24} max={120} value={fontSize} onChange={e => setFontSize(+e.target.value)}
            className="w-full accent-yellow-500" data-testid="meme-font-size" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Text</label>
            <input type="color" value={textColor} onChange={e => setColor(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 cursor-pointer" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Outline</label>
            <input type="color" value={strokeColor} onChange={e => setStroke(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => setImgSrc(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        <button onClick={download} data-testid="meme-download"
          className="flex items-center gap-1.5 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 transition-colors">
          <Download className="h-4 w-4" />Download Meme
        </button>
      </div>
    </div>
  );
}
