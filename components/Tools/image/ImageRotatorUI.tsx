'use client';

import { useRef, useState, useCallback } from 'react';
import {
  Upload, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Download, RefreshCw,
} from 'lucide-react';

interface Props {
  toolName?: string;
  onFileSelected?: (file: File) => void;
}

export default function ImageRotatorUI({ toolName, onFileSelected }: Props) {
  const [file, setFile]           = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [rotation, setRotation]   = useState(0);   // 0 | 90 | 180 | 270
  const [flipH, setFlipH]         = useState(false);
  const [flipV, setFlipV]         = useState(false);
  const [busy, setBusy]           = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setFile(f);
    setObjectUrl(URL.createObjectURL(f));
    setRotation(0); setFlipH(false); setFlipV(false);
    onFileSelected?.(f);
  }, [objectUrl, onFileSelected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  };

  const resetTransforms = () => { setRotation(0); setFlipH(false); setFlipV(false); };

  const handleDownload = () => {
    if (!file || !objectUrl) return;
    setBusy(true);
    const img = new window.Image();
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180;
      const isRotated90 = rotation % 180 === 90;
      const cw = isRotated90 ? img.height : img.width;
      const ch = isRotated90 ? img.width  : img.height;
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `rotated_${file.name}`; a.click();
        URL.revokeObjectURL(url);
        setBusy(false);
      }, file.type === 'image/gif' ? 'image/png' : file.type, 0.95);
    };
    img.src = objectUrl;
  };

  const hasTransform = rotation !== 0 || flipH || flipV;
  const cssTransform = [
    rotation !== 0 ? `rotate(${rotation}deg)` : '',
    flipH ? 'scaleX(-1)' : '',
    flipV ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ') || 'none';

  if (!file) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        data-testid="rotator-dropzone"
        className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-16 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all duration-200"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
          <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Drop an image here to rotate</p>
          <p className="text-xs text-slate-400 mt-1">
            or <span className="text-emerald-500">click to browse</span> — PNG, JPG, WebP, GIF
          </p>
        </div>
        <input
          ref={fileInputRef} type="file" accept="image/*" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="rotator-editor">
      {/* Live preview with CSS transform */}
      <div className="flex min-h-[260px] max-h-[480px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4">
        <img
          src={objectUrl!}
          alt="Preview"
          draggable={false}
          style={{
            transform: cssTransform,
            maxWidth: '100%',
            maxHeight: '440px',
            objectFit: 'contain',
            transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>

      {/* Transform buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
          data-testid="rotate-ccw-btn"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
        >
          <RotateCcw className="h-5 w-5" />
          90° Left
        </button>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          data-testid="rotate-cw-btn"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
        >
          <RotateCw className="h-5 w-5" />
          90° Right
        </button>
        <button
          onClick={() => setFlipH((v) => !v)}
          data-testid="flip-h-btn"
          className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition-all ${
            flipH
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-600'
          }`}
        >
          <FlipHorizontal className="h-5 w-5" />
          Flip H
        </button>
        <button
          onClick={() => setFlipV((v) => !v)}
          data-testid="flip-v-btn"
          className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition-all ${
            flipV
              ? 'border-purple-300 bg-purple-50 text-purple-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50/60 hover:text-purple-600'
          }`}
        >
          <FlipVertical className="h-5 w-5" />
          Flip V
        </button>
      </div>

      {/* Rotation badge */}
      {rotation !== 0 && (
        <p className="text-center text-xs text-slate-400">
          Current rotation: <span className="font-semibold text-slate-600">{rotation}°</span>
          {(flipH || flipV) && ` · Flipped: ${[flipH && 'H', flipV && 'V'].filter(Boolean).join('+')}` }
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFile(null); if (objectUrl) URL.revokeObjectURL(objectUrl); setObjectUrl(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Change image
          </button>
          {hasTransform && (
            <button
              onClick={resetTransforms}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={busy || !hasTransform}
          data-testid="rotator-download-btn"
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Download className="h-4 w-4" />
          {busy ? 'Processing…' : 'Download'}
        </button>
      </div>
    </div>
  );
}
