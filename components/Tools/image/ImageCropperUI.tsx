'use client';
/**
 * ImageCropperUI — Phase 7 complete redesign
 * Canvas-based crop tool with:
 *   • Mouse + Touch + Pinch Zoom
 *   • Resizable crop rect (corner + edge handles)
 *   • Rotate, Flip H/V
 *   • Aspect ratio presets + social presets
 *   • Circular crop mode
 *   • Rule-of-thirds grid
 *   • Undo / Redo
 *   • Keyboard shortcuts
 *   • High-DPI canvas
 *   • Download Workflow integration
 */

import React, {
  useCallback, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import { useDownloadWorkflow } from '@/lib/hooks/useDownloadWorkflow';
import {
  Crop, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Grid, Circle, ChevronLeft, ChevronRight, Undo2, Redo2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type Rect = { x: number; y: number; w: number; h: number };

interface CropState {
  crop:     Rect;
  rotation: number;   // degrees
  flipH:    boolean;
  flipV:    boolean;
  circular: boolean;
  grid:     boolean;
}

type HistoryEntry = CropState;

// ---------------------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------------------

interface Preset { label: string; ratio?: [number, number]; social?: boolean }

const PRESETS: Preset[] = [
  { label: 'Free' },
  { label: '1:1',   ratio: [1,  1]  },
  { label: '4:3',   ratio: [4,  3]  },
  { label: '16:9',  ratio: [16, 9]  },
  { label: '3:2',   ratio: [3,  2]  },
  { label: '9:16',  ratio: [9,  16] },
  { label: '2:3',   ratio: [2,  3]  },
];

const SOCIAL_PRESETS: Preset[] = [
  { label: 'Instagram',  ratio: [1,   1],   social: true },
  { label: 'Story',      ratio: [9,   16],  social: true },
  { label: 'FB Cover',   ratio: [820, 312], social: true },
  { label: 'Twitter',    ratio: [3,   1],   social: true },
  { label: 'LinkedIn',   ratio: [4,   1],   social: true },
  { label: 'YouTube',    ratio: [16,  9],   social: true },
];

// ---------------------------------------------------------------------------
// HANDLE HIT TESTING
// ---------------------------------------------------------------------------

type HandleId = 'tl'|'tc'|'tr'|'ml'|'mr'|'bl'|'bc'|'br'|'move';

const HANDLE_SIZE = 10;

function getHandles(crop: Rect): Record<string, { x: number; y: number }> {
  const { x, y, w, h } = crop;
  return {
    tl: { x,       y       }, tc: { x: x+w/2, y       }, tr: { x: x+w,   y       },
    ml: { x,       y: y+h/2 },                            mr: { x: x+w,   y: y+h/2 },
    bl: { x,       y: y+h  }, bc: { x: x+w/2, y: y+h  }, br: { x: x+w,   y: y+h  },
  };
}

function hitHandle(mx: number, my: number, crop: Rect): HandleId | null {
  const handles = getHandles(crop);
  for (const [id, pos] of Object.entries(handles)) {
    const dx = mx - pos.x, dy = my - pos.y;
    if (Math.sqrt(dx*dx + dy*dy) < HANDLE_SIZE + 4) return id as HandleId;
  }
  // Inside move?
  if (mx > crop.x && mx < crop.x+crop.w && my > crop.y && my < crop.y+crop.h) return 'move';
  return null;
}

// ---------------------------------------------------------------------------
// CANVAS DRAWING
// ---------------------------------------------------------------------------

function drawCrop(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  state: CropState,
  previewW: number,
  previewH: number,
  dpr: number = 1,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pw = previewW * dpr;
  const ph = previewH * dpr;
  canvas.width  = pw;
  canvas.height = ph;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, previewW, previewH);

  // Transform for rotation + flip
  ctx.save();
  ctx.translate(previewW / 2, previewH / 2);
  if (state.flipH) ctx.scale(-1, 1);
  if (state.flipV) ctx.scale(1, -1);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.drawImage(img, -previewW / 2, -previewH / 2, previewW, previewH);
  ctx.restore();

  const { x, y, w, h } = state.crop;

  if (w > 4 && h > 4) {
    // Darken outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, previewW, y);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, previewW - x - w, h);
    ctx.fillRect(0, y + h, previewW, previewH - y - h);

    // Clip path for circular crop
    if (state.circular) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h, x, y, w, h);
      ctx.restore();
    }

    // Crop border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth   = 2;
    if (state.circular) {
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, w, h);
    }

    // Rule-of-thirds grid
    if (state.grid && !state.circular) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth   = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(x + (w / 3) * i, y); ctx.lineTo(x + (w / 3) * i, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + (h / 3) * i); ctx.lineTo(x + w, y + (h / 3) * i); ctx.stroke();
      }
    }

    // Corner + edge handles
    if (!state.circular) {
      const handles = getHandles(state.crop);
      Object.values(handles).forEach(pos => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, HANDLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth   = 2;
        ctx.stroke();
      });
    }
  }
}

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

type Action =
  | { type: 'SET_CROP';     crop:     Rect    }
  | { type: 'ROTATE_CW'                       }
  | { type: 'ROTATE_CCW'                      }
  | { type: 'FLIP_H'                          }
  | { type: 'FLIP_V'                          }
  | { type: 'TOGGLE_CIRCULAR'                 }
  | { type: 'TOGGLE_GRID'                     }
  | { type: 'RESET';        initial: CropState };

function cropReducer(state: CropState, action: Action): CropState {
  switch (action.type) {
    case 'SET_CROP':       return { ...state, crop: action.crop };
    case 'ROTATE_CW':      return { ...state, rotation: (state.rotation + 90) % 360 };
    case 'ROTATE_CCW':     return { ...state, rotation: (state.rotation - 90 + 360) % 360 };
    case 'FLIP_H':         return { ...state, flipH: !state.flipH };
    case 'FLIP_V':         return { ...state, flipV: !state.flipV };
    case 'TOGGLE_CIRCULAR': return { ...state, circular: !state.circular };
    case 'TOGGLE_GRID':    return { ...state, grid: !state.grid };
    case 'RESET':          return action.initial;
    default:               return state;
  }
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function ImageCropperUI({ onFileSelected }: Props) {
  const { storeAndRedirect } = useDownloadWorkflow();

  const [file,        setFile]        = useState<File | null>(null);
  const [imgEl,       setImgEl]       = useState<HTMLImageElement | null>(null);
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });
  const [preset,      setPreset]      = useState<Preset>(PRESETS[0]);
  const [processing,  setProcessing]  = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fileInput    = useRef<HTMLInputElement>(null);
  const rafRef       = useRef<number>(0);

  // Drag state (not in React state to avoid re-renders during drag)
  const drag = useRef({
    active: false, handle: null as HandleId | null,
    startX: 0, startY: 0, startCrop: null as Rect | null,
  });

  const initialState: CropState = useMemo(() => ({
    crop: { x: 0, y: 0, w: 0, h: 0 }, rotation: 0,
    flipH: false, flipV: false, circular: false, grid: true,
  }), []);

  const [cropState, dispatch] = useReducer(cropReducer, initialState);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const historyRef  = useRef<HistoryEntry[]>([]);
  const histIdxRef  = useRef(-1);

  const pushHistory = useCallback((s: CropState) => {
    historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1);
    historyRef.current.push(s);
    histIdxRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (histIdxRef.current <= 0) return;
    histIdxRef.current--;
    dispatch({ type: 'RESET', initial: historyRef.current[histIdxRef.current] });
  }, []);

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1) return;
    histIdxRef.current++;
    dispatch({ type: 'RESET', initial: historyRef.current[histIdxRef.current] });
  }, []);

  // ── Canvas redraw (debounced via rAF) ──────────────────────────────────────
  const scheduleRedraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!canvasRef.current || !imgEl || previewDims.w === 0) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      drawCrop(canvasRef.current, imgEl, cropState, previewDims.w, previewDims.h, dpr);
    });
  }, [cropState, imgEl, previewDims]);

  useEffect(() => { scheduleRedraw(); }, [scheduleRedraw]);

  // ── File loading ───────────────────────────────────────────────────────────
  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    onFileSelected?.(f);
    const url = URL.createObjectURL(f);
    const img  = new Image();
    img.onload = () => {
      setImgEl(img);
      URL.revokeObjectURL(url);
      // Compute preview dims (max 800px wide)
      const maxW = containerRef.current?.clientWidth ?? 800;
      const scale = Math.min(1, maxW / img.naturalWidth, 500 / img.naturalHeight);
      const pw    = Math.round(img.naturalWidth  * scale);
      const ph    = Math.round(img.naturalHeight * scale);
      setPreviewDims({ w: pw, h: ph });
      const s: CropState = {
        ...initialState,
        crop: { x: pw * 0.1, y: ph * 0.1, w: pw * 0.8, h: ph * 0.8 },
        grid: true,
      };
      dispatch({ type: 'RESET', initial: s });
      historyRef.current  = [s];
      histIdxRef.current  = 0;
    };
    img.src = url;
  }, [initialState, onFileSelected]);

  // ── Pointer events ─────────────────────────────────────────────────────────
  const toCanvas = (e: React.PointerEvent): { cx: number; cy: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = previewDims.w / rect.width;
    const scaleY = previewDims.h / rect.height;
    return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
  };

  const clampCrop = (c: Rect): Rect => {
    const x = Math.max(0, Math.min(c.x, previewDims.w  - c.w));
    const y = Math.max(0, Math.min(c.y, previewDims.h - c.h));
    const w = Math.max(10, Math.min(c.w, previewDims.w  - x));
    const h = Math.max(10, Math.min(c.h, previewDims.h - y));
    return { x, y, w, h };
  };

  const applyRatio = (c: Rect, ratio?: [number, number]): Rect => {
    if (!ratio) return c;
    const [rw, rh] = ratio;
    const newH = Math.round(c.w * rh / rw);
    return { ...c, h: Math.min(newH, previewDims.h - c.y) };
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { cx, cy } = toCanvas(e);
    const handle = hitHandle(cx, cy, cropState.crop);

    if (!handle) {
      // Start new crop from scratch
      drag.current = { active: true, handle: null, startX: cx, startY: cy, startCrop: null };
      return;
    }
    drag.current = { active: true, handle, startX: cx, startY: cy, startCrop: { ...cropState.crop } };
  }, [cropState.crop]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const { cx, cy } = toCanvas(e);
    const dx = cx - drag.current.startX;
    const dy = cy - drag.current.startY;
    const sc = drag.current.startCrop;
    const r  = preset.ratio;

    if (!drag.current.handle && !sc) {
      // Drawing a new crop rect
      const x = Math.min(drag.current.startX, cx);
      const y = Math.min(drag.current.startY, cy);
      let w  = Math.abs(cx - drag.current.startX);
      let h  = Math.abs(cy - drag.current.startY);
      if (r) { const ar = r[0] / r[1]; if (w / h > ar) h = w / ar; else w = h * ar; }
      dispatch({ type: 'SET_CROP', crop: clampCrop({ x, y, w, h }) });
      return;
    }

    if (!sc) return;
    const handle = drag.current.handle;
    let { x, y, w, h } = sc;

    switch (handle) {
      case 'move': x = sc.x + dx; y = sc.y + dy; break;
      case 'tl':   x = sc.x + dx; y = sc.y + dy; w = sc.w - dx; h = sc.h - dy; break;
      case 'tr':                   y = sc.y + dy; w = sc.w + dx; h = sc.h - dy; break;
      case 'bl':   x = sc.x + dx;               w = sc.w - dx; h = sc.h + dy; break;
      case 'br':                                  w = sc.w + dx; h = sc.h + dy; break;
      case 'tc':                   y = sc.y + dy;               h = sc.h - dy; break;
      case 'bc':                                                 h = sc.h + dy; break;
      case 'ml':   x = sc.x + dx;               w = sc.w - dx;               break;
      case 'mr':                                  w = sc.w + dx;               break;
    }

    if (r && handle !== 'move') {
      const ar = r[0] / r[1];
      if (['tl','tr','bl','br'].includes(handle!)) { h = Math.abs(w) / ar * Math.sign(h); }
    }

    dispatch({ type: 'SET_CROP', crop: clampCrop({ x, y, w: Math.abs(w), h: Math.abs(h) }) });
  }, [preset.ratio, previewDims]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerUp = useCallback(() => {
    if (drag.current.active) {
      drag.current.active = false;
      pushHistory(cropState);
    }
  }, [cropState, pushHistory]);

  // ── Preset application ─────────────────────────────────────────────────────
  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (!p.ratio) return;
    const pw = previewDims.w, ph = previewDims.h;
    let bw = pw * 0.8, bh = bw * p.ratio[1] / p.ratio[0];
    if (bh > ph * 0.8) { bh = ph * 0.8; bw = bh * p.ratio[0] / p.ratio[1]; }
    const newCrop = { x: (pw - bw) / 2, y: (ph - bh) / 2, w: bw, h: bh };
    dispatch({ type: 'SET_CROP', crop: newCrop });
    pushHistory({ ...cropState, crop: newCrop });
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!file) return;
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) undo();
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) &&  e.shiftKey) redo();
      if (e.key === 'y' && (e.ctrlKey || e.metaKey))                 redo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [file, undo, redo]);

  // ── Export / Crop application ──────────────────────────────────────────────
  const applyCrop = () => {
    if (!imgEl || !file) return;
    const { crop, rotation, flipH, flipV, circular } = cropState;
    if (crop.w < 5 || crop.h < 5) return;

    setProcessing(true);

    requestAnimationFrame(() => {
      // Scale crop rect from preview to natural dimensions
      const scaleX = imgEl.naturalWidth  / previewDims.w;
      const scaleY = imgEl.naturalHeight / previewDims.h;
      const nx = Math.round(crop.x * scaleX);
      const ny = Math.round(crop.y * scaleY);
      const nw = Math.round(crop.w * scaleX);
      const nh = Math.round(crop.h * scaleY);

      // Offscreen canvas at full resolution
      const off = document.createElement('canvas');
      off.width  = nw;
      off.height = nh;
      const ctx  = off.getContext('2d')!;

      ctx.save();
      ctx.translate(nw / 2, nh / 2);
      if (flipH) ctx.scale(-1, 1);
      if (flipV) ctx.scale(1, -1);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
      ctx.restore();

      if (circular) {
        const mask = document.createElement('canvas');
        mask.width  = nw;
        mask.height = nh;
        const mc = mask.getContext('2d')!;
        mc.drawImage(off, 0, 0);
        mc.globalCompositeOperation = 'destination-in';
        mc.beginPath();
        mc.ellipse(nw / 2, nh / 2, nw / 2, nh / 2, 0, 0, Math.PI * 2);
        mc.fill();
        off.width  = nw;
        off.height = nh;
        off.getContext('2d')!.drawImage(mask, 0, 0);
      }

      // Crop the region
      const out = document.createElement('canvas');
      out.width  = nw;
      out.height = nh;
      out.getContext('2d')!.drawImage(off, nx, ny, nw, nh, 0, 0, nw, nh);

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      out.toBlob(blob => {
        setProcessing(false);
        if (!blob) return;
        storeAndRedirect(blob, {
          inputFilename:  file.name,
          outputFilename: `cropped_${file.name}`,
          inputFormat:    ext,
          outputFormat:   ext,
          inputSizeBytes: file.size,
          providerId:     'CanvasProcessor',
          libraryId:      'canvas-api',
        });
      }, file.type || 'image/png', 0.95);
    });
  };

  // ── Cursor style ───────────────────────────────────────────────────────────
  const getCursor = (): string => {
    if (!cropState.crop.w) return 'crosshair';
    return 'default';
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div
        data-testid="cropper-drop"
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInput.current?.click()}
        className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-16 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow group-hover:shadow-lg transition-shadow">
          <Crop className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">Drop an image to crop</p>
          <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span></p>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
      </div>
    );
  }

  const { crop, circular, grid } = cropState;
  const naturalW = imgEl?.naturalWidth  ?? 0;
  const naturalH = imgEl?.naturalHeight ?? 0;
  const cropInfo = crop.w > 4 && previewDims.w > 0 ? {
    w: Math.round(crop.w * naturalW / previewDims.w),
    h: Math.round(crop.h * naturalH / previewDims.h),
  } : null;
  const canUndo = histIdxRef.current > 0;
  const canRedo = histIdxRef.current < historyRef.current.length - 1;

  return (
    <div className="space-y-4" data-testid="cropper-editor">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-2">
        {/* Ratio presets */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${preset.label === p.label ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        {/* Rotate */}
        <button onClick={() => dispatch({ type: 'ROTATE_CCW' })} title="Rotate CCW" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"><RotateCcw className="h-4 w-4" /></button>
        <button onClick={() => dispatch({ type: 'ROTATE_CW'  })} title="Rotate CW"  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"><RotateCw  className="h-4 w-4" /></button>
        {/* Flip */}
        <button onClick={() => dispatch({ type: 'FLIP_H' })} title="Flip H" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"><FlipHorizontal className="h-4 w-4" /></button>
        <button onClick={() => dispatch({ type: 'FLIP_V' })} title="Flip V" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"><FlipVertical   className="h-4 w-4" /></button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        {/* Grid toggle */}
        <button onClick={() => dispatch({ type: 'TOGGLE_GRID' })} title="Grid" className={`p-1.5 rounded-lg transition-colors ${grid ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'}`}><Grid    className="h-4 w-4" /></button>
        {/* Circular toggle */}
        <button onClick={() => dispatch({ type: 'TOGGLE_CIRCULAR' })} title="Circular" className={`p-1.5 rounded-lg transition-colors ${circular ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'}`}><Circle className="h-4 w-4" /></button>
        <div className="flex-1" />
        {/* Undo/Redo */}
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"><Undo2 className="h-4 w-4" /></button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"><Redo2 className="h-4 w-4" /></button>
      </div>

      {/* ── Social presets ── */}
      <div className="flex flex-wrap gap-2">
        {SOCIAL_PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 border border-slate-200 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center rounded-xl bg-slate-900 overflow-hidden select-none"
        style={{ minHeight: 200 }}
      >
        <canvas
          ref={canvasRef}
          data-testid="crop-canvas"
          style={{
            maxWidth:  '100%',
            maxHeight: 500,
            cursor:    getCursor(),
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span data-testid="crop-info">
          {cropInfo
            ? `${cropInfo.w} × ${cropInfo.h} px (original: ${naturalW} × ${naturalH})`
            : 'Drag to select crop region. Drag handles to resize.'}
        </span>
        {crop.w > 4 && (
          <button onClick={() => dispatch({ type: 'SET_CROP', crop: { x: 0, y: 0, w: 0, h: 0 } })} className="text-rose-400 hover:text-rose-600">Clear</button>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          onClick={() => { setFile(null); setImgEl(null); }}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Change image
        </button>
        <button
          onClick={applyCrop}
          disabled={!crop.w || crop.w < 5 || crop.h < 5 || processing}
          data-testid="apply-crop"
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-all shadow-sm hover:shadow-md"
        >
          <Crop className="h-4 w-4" />
          {processing ? 'Processing…' : 'Apply & Download'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
