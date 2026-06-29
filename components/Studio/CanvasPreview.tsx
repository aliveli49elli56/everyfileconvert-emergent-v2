'use client';
/**
 * components/Studio/CanvasPreview.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time canvas preview for image files.
 * Applies CSS filters and CSS transforms for instant feedback.
 * Heavy canvas re-draw (for crop/resize) is debounced to 200ms.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState } from 'react';
import type { TranscodeOptions } from '@/lib/engine/Transcoder';
import { Film, Music, FileText } from 'lucide-react';

interface Props {
  file: File | null;
  mode: 'image' | 'video' | 'audio' | 'pdf' | 'all';
  options: TranscodeOptions;
}

function buildCssFilter(opts: TranscodeOptions): string {
  const b  = 1 + (opts.brightness ?? 0) / 100;
  const co = 1 + (opts.contrast   ?? 0) / 100;
  const s  = 1 + (opts.saturation ?? 0) / 100;
  const hu = opts.hue ?? 0;
  const bl = opts.blurRadius ?? 0;
  const parts: string[] = [];
  if (b  !== 1) parts.push(`brightness(${b})`);
  if (co !== 1) parts.push(`contrast(${co})`);
  if (s  !== 1) parts.push(`saturate(${s})`);
  if (hu !== 0) parts.push(`hue-rotate(${hu}deg)`);
  if (bl >  0)  parts.push(`blur(${bl}px)`);
  return parts.join(' ') || 'none';
}

function buildCssTransform(opts: TranscodeOptions): string {
  const parts: string[] = [];
  if (opts.rotation)        parts.push(`rotate(${opts.rotation}deg)`);
  if (opts.flipH)           parts.push('scaleX(-1)');
  if (opts.flipV)           parts.push('scaleY(-1)');
  return parts.join(' ') || 'none';
}

export default function CanvasPreview({ file, mode, options }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!file) { setObjectUrl(null); return; }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    const old = prevUrl.current;
    prevUrl.current = url;
    return () => { if (old) URL.revokeObjectURL(old); };
  }, [file]);

  useEffect(() => {
    return () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); };
  }, []);

  const cssFilter    = buildCssFilter(options);
  const cssTransform = buildCssTransform(options);

  // ── Image preview ───────────────────────────────────────────────────────────
  if ((mode === 'image' || mode === 'all') && objectUrl && file?.type.startsWith('image/')) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJ0lEQVQoU2NkYGBg+M9AAGJgYMBggmQZGRkYkKlhIKgQVUg1VRkAU4oECQ==')] bg-repeat">
        {/* Checkerboard for transparency */}
        <img
          src={objectUrl}
          alt="Preview"
          className="max-h-full max-w-full object-contain rounded-lg transition-all duration-200"
          style={{ filter: cssFilter, transform: cssTransform }}
        />
        {/* Crop overlay */}
        {options.crop && (
          <div
            className="absolute border-2 border-cyan-400 pointer-events-none"
            style={{
              // These are approximate — a full crop UI would use canvas coordinates
              left:   '10%', top:   '10%',
              width:  '80%', height: '80%',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            }}
          />
        )}
      </div>
    );
  }

  // ── Video placeholder ───────────────────────────────────────────────────────
  if (mode === 'video' && file) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-900 text-white">
        <div className="text-center space-y-3 px-8">
          <Film className="mx-auto h-12 w-12 text-violet-400 opacity-70" />
          <p className="text-sm font-medium text-slate-300">{file.name}</p>
          <p className="text-xs text-slate-500">
            {(file.size / 1_048_576).toFixed(1)} MB — Video preview unavailable in Studio
          </p>
          <p className="text-xs text-cyan-400">Configure settings and click Process</p>
        </div>
      </div>
    );
  }

  // ── Audio placeholder ───────────────────────────────────────────────────────
  if (mode === 'audio' && file) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-rose-900 to-slate-900 text-white">
        <div className="text-center space-y-3 px-8">
          <Music className="mx-auto h-12 w-12 text-rose-400 opacity-70" />
          <p className="text-sm font-medium text-slate-300">{file.name}</p>
          <p className="text-xs text-slate-500">{(file.size / 1_048_576).toFixed(2)} MB</p>
          <div className="flex items-end justify-center gap-1 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-rose-400 rounded-full opacity-60 animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 1.2) * 12 + Math.cos(i * 0.8) * 8}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PDF / Doc placeholder ───────────────────────────────────────────────────
  if ((mode === 'pdf' || mode === 'all') && file) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        <div className="text-center space-y-3 px-8">
          <FileText className="mx-auto h-12 w-12 text-amber-500 opacity-70" />
          <p className="text-sm font-semibold text-slate-700">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1_048_576).toFixed(2)} MB</p>
          <p className="text-xs text-amber-600">Configure settings below, then click Process</p>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
      <p className="text-sm text-slate-400">Drop a file to preview</p>
    </div>
  );
}
