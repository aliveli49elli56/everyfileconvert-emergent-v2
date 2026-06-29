'use client';
/**
 * components/Studio/AdvancedStudio.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * All-in-One Studio panel.
 * - Desktop: right-side drawer (40% width)
 * - Mobile: full-screen overlay with touch/pinch support
 * - Real-time preview via CanvasPreview
 * - Tool-specific controls via ToolControls
 * - Calls Transcoder and downloads the result
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import {
  X, Download, Sparkles, Loader2, ChevronLeft, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscodeOptions, TranscodeOp } from '@/lib/engine/Transcoder';
import CanvasPreview from './CanvasPreview';
import ToolControls from './ToolControls';

interface Props {
  open: boolean;
  onClose: () => void;
  file: File | null;
  toolKey: string;
  toolName: string;
  mode: 'image' | 'video' | 'audio' | 'pdf' | 'all';
  defaultOp: TranscodeOp;
}

export default function AdvancedStudio({
  open, onClose, file, toolKey, toolName, mode, defaultOp,
}: Props) {
  const [options, setOptions] = useState<TranscodeOptions>({ quality: 85 });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Processing...');
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'controls'>('preview');

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      // Lazy-load Transcoder only when needed
      const { Transcoder, inferOp } = await import('@/lib/engine/Transcoder');

      const srcExt = file.name.split('.').pop()?.toLowerCase() ?? '';
      const tgtExt = options.targetFormat ?? srcExt;
      const op     = (defaultOp === 'image:convert' && defaultOp)
        ? inferOp(srcExt, tgtExt)
        : defaultOp;

      setProgressMsg(
        mode === 'video' || mode === 'audio'
          ? 'Loading FFmpeg WASM (first load ~30s)...'
          : 'Processing...',
      );

      const res = await Transcoder.run({
        files: [file],
        op,
        options,
        onProgress: (pct) => {
          setProgress(pct);
          if (pct > 30) setProgressMsg('Processing...');
          if (pct > 90) setProgressMsg('Almost done...');
        },
      });

      const url = URL.createObjectURL(res.blob);
      setResult({ url, filename: res.filename });
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [file, options, defaultOp, mode]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url; a.download = result.filename;
    a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(result.url); }, 200);
    setResult(null);
  }, [result]);

  if (!open) return null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:bg-black/20"
        onClick={onClose}
      />

      {/* ── Studio Panel ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed z-[110] flex flex-col bg-white shadow-2xl',
          // Mobile: bottom sheet → full screen
          'inset-x-0 bottom-0 h-[92svh] rounded-t-3xl',
          // Desktop: right drawer
          'lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:h-full lg:w-[440px] lg:rounded-none lg:rounded-l-2xl',
          'animate-in slide-in-from-bottom duration-300 lg:slide-in-from-right',
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 shrink-0">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-semibold text-slate-800">Advanced Studio</span>
            </div>
            <p className="text-xs text-slate-400 truncate">{toolName}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Mobile tab switcher ──────────────────────────────────────────── */}
        <div className="flex border-b border-slate-100 shrink-0 lg:hidden">
          {(['preview', 'controls'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
                activeTab === tab
                  ? 'text-cyan-600 border-b-2 border-cyan-500'
                  : 'text-slate-400',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas preview (left on desktop, tab on mobile) */}
          <div
            className={cn(
              'flex-1 overflow-hidden p-4',
              // Mobile: hide when controls tab active
              activeTab !== 'preview' ? 'hidden lg:flex' : 'flex',
            )}
          >
            <CanvasPreview file={file} mode={mode} options={options} />
          </div>

          {/* Controls panel (right on desktop, tab on mobile) */}
          <div
            className={cn(
              'w-full overflow-y-auto border-t border-slate-100 px-5 py-4',
              'lg:w-[200px] lg:border-t-0 lg:border-l lg:shrink-0',
              activeTab !== 'controls' ? 'hidden lg:block' : 'block',
            )}
          >
            <ToolControls
              toolKey={toolKey}
              mode={mode}
              options={options}
              onChange={setOptions}
            />
          </div>
        </div>

        {/* ── Footer: error / progress / action ──────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-3">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {processing && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">{progressMsg}</p>
            </div>
          )}

          {result ? (
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4" />
              Download {result.filename}
            </button>
          ) : (
            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-all active:scale-95',
                !file || processing
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90',
              )}
            >
              {processing
                ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                : !file
                  ? <><Upload className="h-4 w-4" />Upload a file to get started</>
                  : <><Sparkles className="h-4 w-4" />Process &amp; Download</>
              }
            </button>
          )}
        </div>
      </div>
    </>
  );
}
