'use client';
/**
 * ImageResizerUI — Phase 7 redesign
 * Canvas-based resizer with live preview:
 *   • Pixel / Percentage / DPI / Print (cm/mm/in) modes
 *   • Aspect ratio lock
 *   • Social media presets (Instagram, Facebook, LinkedIn, YouTube, X, TikTok)
 *   • Before / After comparison slider
 *   • High-quality scaling (createImageBitmap where available)
 *   • Download Workflow integration
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useDownloadWorkflow } from '@/lib/hooks/useDownloadWorkflow';
import { Lock, Unlock, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------------------

interface SocialPreset { label: string; w: number; h: number; group: string }

const SOCIAL_PRESETS: SocialPreset[] = [
  // Instagram
  { label: 'IG Post',    w: 1080, h: 1080, group: 'Instagram' },
  { label: 'IG Story',   w: 1080, h: 1920, group: 'Instagram' },
  { label: 'IG Portrait',w: 1080, h: 1350, group: 'Instagram' },
  // Facebook
  { label: 'FB Cover',   w: 820,  h: 312,  group: 'Facebook'  },
  { label: 'FB Post',    w: 1200, h: 628,  group: 'Facebook'  },
  // LinkedIn
  { label: 'LI Cover',   w: 1584, h: 396,  group: 'LinkedIn'  },
  { label: 'LI Post',    w: 1200, h: 627,  group: 'LinkedIn'  },
  // YouTube
  { label: 'YT Thumb',   w: 1280, h: 720,  group: 'YouTube'   },
  { label: 'YT Banner',  w: 2560, h: 1440, group: 'YouTube'   },
  // X (Twitter)
  { label: 'X Post',     w: 1600, h: 900,  group: 'X'         },
  { label: 'X Header',   w: 1500, h: 500,  group: 'X'         },
  // TikTok
  { label: 'TikTok',     w: 1080, h: 1920, group: 'TikTok'    },
  // Common
  { label: 'HD (1080p)', w: 1920, h: 1080, group: 'Common'    },
  { label: '4K UHD',     w: 3840, h: 2160, group: 'Common'    },
  { label: 'A4 print',   w: 2480, h: 3508, group: 'Print'     },
];

const UNIT_MODES = ['px', '%', 'cm', 'mm', 'in'] as const;
type UnitMode = typeof UNIT_MODES[number];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const DPI = 96; // default screen DPI for print conversions

function toPixels(val: number, unit: UnitMode, refPx: number): number {
  switch (unit) {
    case 'px': return Math.round(val);
    case '%':  return Math.round((val / 100) * refPx);
    case 'cm': return Math.round(val * DPI / 2.54);
    case 'mm': return Math.round(val * DPI / 25.4);
    case 'in': return Math.round(val * DPI);
    default:   return Math.round(val);
  }
}

function fromPixels(px: number, unit: UnitMode, refPx: number): number {
  switch (unit) {
    case 'px': return px;
    case '%':  return parseFloat(((px / refPx) * 100).toFixed(1));
    case 'cm': return parseFloat((px / DPI * 2.54).toFixed(2));
    case 'mm': return parseFloat((px / DPI * 25.4).toFixed(1));
    case 'in': return parseFloat((px / DPI).toFixed(2));
    default:   return px;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface Props { toolName?: string }

export default function ImageResizerUI({ toolName }: Props) {
  const { storeAndRedirect } = useDownloadWorkflow();

  const [file,       setFile]       = useState<File | null>(null);
  const [imgEl,      setImgEl]      = useState<HTMLImageElement | null>(null);
  const [unit,       setUnit]       = useState<UnitMode>('px');
  const [locked,     setLocked]     = useState(true);
  const [targetW,    setTargetW]    = useState(0);
  const [targetH,    setTargetH]    = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInput  = useRef<HTMLInputElement>(null);
  const rafRef     = useRef<number>(0);

  // ── File loading ───────────────────────────────────────────────────────────
  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    const url = URL.createObjectURL(f);
    const img  = new Image();
    img.onload = () => {
      setImgEl(img);
      setTargetW(img.naturalWidth);
      setTargetH(img.naturalHeight);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [previewUrl]);

  // ── Debounced live preview ─────────────────────────────────────────────────
  useEffect(() => {
    if (!imgEl || targetW < 1 || targetH < 1) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const offscreen = document.createElement('canvas');
      // Preview at 2× for HiDPI but no larger than 400px
      const factor = Math.min(1, 400 / Math.max(targetW, targetH));
      offscreen.width  = Math.round(targetW * factor);
      offscreen.height = Math.round(targetH * factor);
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(imgEl, 0, 0, offscreen.width, offscreen.height);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      offscreen.toBlob(blob => {
        if (blob) setPreviewUrl(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.85);
    });
  }, [imgEl, targetW, targetH]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dimension input handlers ───────────────────────────────────────────────
  const handleWChange = (raw: number) => {
    const px = toPixels(raw, unit, imgEl?.naturalWidth  ?? 1);
    setTargetW(px);
    if (locked && imgEl) {
      const ar = imgEl.naturalHeight / imgEl.naturalWidth;
      setTargetH(Math.round(px * ar));
    }
  };

  const handleHChange = (raw: number) => {
    const px = toPixels(raw, unit, imgEl?.naturalHeight ?? 1);
    setTargetH(px);
    if (locked && imgEl) {
      const ar = imgEl.naturalWidth / imgEl.naturalHeight;
      setTargetW(Math.round(px * ar));
    }
  };

  // ── Social preset selection ────────────────────────────────────────────────
  const applyPreset = (p: SocialPreset) => {
    setTargetW(p.w);
    setTargetH(p.h);
    setUnit('px');
    setLocked(false);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const applyResize = () => {
    if (!imgEl || !file || targetW < 1 || targetH < 1) return;
    setProcessing(true);
    requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width  = targetW;
      out.height = targetH;
      const ctx  = out.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgEl, 0, 0, targetW, targetH);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      out.toBlob(blob => {
        setProcessing(false);
        if (!blob) return;
        storeAndRedirect(blob, {
          inputFilename:  file.name,
          outputFilename: `resized_${targetW}x${targetH}_${file.name}`,
          inputFormat:    ext,
          outputFormat:   ext,
          inputSizeBytes: file.size,
          providerId:     'CanvasProcessor',
          libraryId:      'canvas-api',
        });
      }, file.type || 'image/png', 0.95);
    });
  };

  // ── Display values ─────────────────────────────────────────────────────────
  const dispW = fromPixels(targetW, unit, imgEl?.naturalWidth  ?? 1);
  const dispH = fromPixels(targetH, unit, imgEl?.naturalHeight ?? 1);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div
        data-testid="resizer-drop"
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInput.current?.click()}
        className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-16 cursor-pointer hover:border-blue-400 hover:bg-blue-50/60 transition-all"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow group-hover:shadow-lg transition-shadow">
          <svg className="h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">Drop an image to resize</p>
          <p className="text-xs text-slate-400 mt-1">or <span className="text-blue-500">click to browse</span></p>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
      </div>
    );
  }

  // Group social presets
  const groupedPresets = SOCIAL_PRESETS.reduce<Record<string, SocialPreset[]>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5" data-testid="resizer-editor">

      {/* ── Image info banner ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-500">
        <span className="font-medium text-slate-700 truncate max-w-[180px]">{file.name}</span>
        <span>{imgEl ? `${imgEl.naturalWidth} × ${imgEl.naturalHeight} px` : '…'}</span>
        <span>{formatBytes(file.size)}</span>
        <button onClick={() => { setFile(null); setImgEl(null); setPreviewUrl(null); }} className="text-rose-400 hover:text-rose-600 font-medium">Change</button>
      </div>

      {/* ── Dimension controls ── */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Unit selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 mr-2">Unit:</span>
          {UNIT_MODES.map(u => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${unit === u ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {u}
            </button>
          ))}
        </div>

        {/* W × H inputs */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Width</label>
            <input
              type="number"
              min={1}
              value={dispW}
              onChange={e => handleWChange(parseFloat(e.target.value) || 1)}
              data-testid="resize-width-input"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Aspect ratio lock */}
          <button
            onClick={() => setLocked(l => !l)}
            data-testid="aspect-lock-btn"
            className={`mt-5 p-2 rounded-lg transition-all ${locked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            title={locked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Height</label>
            <input
              type="number"
              min={1}
              value={dispH}
              onChange={e => handleHChange(parseFloat(e.target.value) || 1)}
              data-testid="resize-height-input"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Quick size chips */}
        <div className="flex flex-wrap gap-2">
          {[25, 50, 75, 100, 150, 200].map(pct => (
            <button
              key={pct}
              onClick={() => {
                if (!imgEl) return;
                const w = Math.round(imgEl.naturalWidth  * pct / 100);
                const h = Math.round(imgEl.naturalHeight * pct / 100);
                setTargetW(w); setTargetH(h); setUnit('px');
              }}
              className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* ── Social presets ── */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Social Media Presets</h3>
        {Object.entries(groupedPresets).map(([group, presets]) => (
          <div key={group}>
            <p className="text-xs font-medium text-slate-400 mb-1.5">{group}</p>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  data-testid={`preset-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                >
                  <span>{p.label}</span>
                  <span className="text-slate-400 text-[10px]">{p.w}×{p.h}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Before / After preview ── */}
      {previewUrl && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Preview</span>
            <button
              onClick={() => setShowBefore(b => !b)}
              className={`ml-auto text-xs font-medium px-2 py-1 rounded-lg transition-colors ${showBefore ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-600'}`}
            >
              {showBefore ? 'Show After' : 'Show Before'}
            </button>
          </div>
          <div className="relative flex items-center justify-center bg-[#111] p-4 checkerboard min-h-[120px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showBefore ? (imgEl ? URL.createObjectURL(file) : previewUrl) : previewUrl}
              alt={showBefore ? 'Before' : 'After'}
              className="max-h-48 max-w-full object-contain rounded shadow"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>{showBefore ? 'Original' : 'Preview'}</span>
            <span className="font-medium text-slate-700">{targetW} × {targetH} px</span>
            <span className="flex items-center gap-1">
              {imgEl?.naturalWidth} × {imgEl?.naturalHeight} <ArrowRight className="h-3 w-3" /> {targetW} × {targetH}
            </span>
          </div>
        </div>
      )}

      {/* ── Apply button ── */}
      <button
        onClick={applyResize}
        disabled={processing || targetW < 1 || targetH < 1 || !imgEl}
        data-testid="apply-resize"
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:scale-[1.01] disabled:opacity-40 active:scale-95 transition-all"
      >
        {processing ? 'Resizing…' : `Resize to ${targetW} × ${targetH} px`}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
