'use client';
/**
 * components/ProgressOverlay.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen processing overlay shown during WASM operations.
 * Appears on top of the page; never leaves user wondering if the site froze.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  visible: boolean;
  progress?: number; // 0–100
  message?: string;
}

export default function ProgressOverlay({ visible, progress = 0, message = 'Processing...' }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center space-y-5 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"
              style={{ animationDuration: '800ms' }}
            />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-cyan-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400">{Math.round(progress)}%</span>
          </div>
        )}

        {/* Message */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">{message}</p>
          <p className="text-xs text-slate-400">Processing in your browser — no server upload</p>
        </div>
      </div>
    </div>
  );
}
