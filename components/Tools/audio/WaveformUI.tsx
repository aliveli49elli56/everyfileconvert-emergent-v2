'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FileAudio, Download } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }

export default function WaveformUI({ onFileSelected }: Props) {
  const [file, setFile]     = useState<File | null>(null);
  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [duration, setDur]  = useState(0);
  const [start, setStart]   = useState(0);
  const [end, setEnd]       = useState(0);
  const [decoded, setDecoded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const waveRef   = useRef<Float32Array | null>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('audio/')) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    setFile(f); setObjUrl(URL.createObjectURL(f));
    setDecoded(false); setStart(0);
    onFileSelected?.(f);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const ctx = new AudioContext();
        const buf = await ctx.decodeAudioData(e.target!.result as ArrayBuffer);
        const data = buf.getChannelData(0);
        waveRef.current = data;
        setDur(buf.duration);
        setEnd(buf.duration);
        setDecoded(true);
        ctx.close();
      } catch { /* could not decode */ }
    };
    reader.readAsArrayBuffer(f);
  };

  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveRef.current) return;
    const data = waveRef.current;
    const { width: W, height: H } = canvas;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Draw waveform
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, W, H);

    const step = Math.max(1, Math.floor(data.length / W));
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const i = x * step;
      const v = Math.abs(data[i] || 0) * (H / 2);
      ctx.moveTo(x, H / 2 - v);
      ctx.lineTo(x, H / 2 + v);
    }
    ctx.stroke();

    // Highlight selected region
    const sx = (start / duration) * W;
    const ex = (end / duration) * W;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.fillRect(sx, 0, ex - sx, H);

    // Draw handles
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex, H); ctx.stroke();
  }, [start, end, duration]);

  useEffect(() => { if (decoded) drawWave(); }, [decoded, drawWave, start, end]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (!file) return (
    <div
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      onClick={() => fileInput.current?.click()}
      data-testid="waveform-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/60 transition-all"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <FileAudio className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an audio file to visualize</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-indigo-500">click to browse</span> — MP3, WAV, FLAC, AAC, OGG</p>
      </div>
      <input ref={fileInput} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="waveform-editor">
      <canvas ref={canvasRef} width={600} height={100}
        className="w-full rounded-xl border border-slate-200" style={{ background: '#f1f5f9' }} />

      {decoded ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Start: <span className="font-bold text-indigo-600">{fmt(start)}</span></span>
              <span>Selected: <span className="font-bold text-slate-700">{fmt(end - start)}</span></span>
              <span>End: <span className="font-bold text-indigo-600">{fmt(end)}</span></span>
            </div>
            <div className="relative h-8 flex items-center">
              <div className="absolute h-2 w-full rounded-full bg-slate-200" />
              <div className="absolute h-2 rounded-full bg-indigo-300"
                style={{ left: `${(start / duration) * 100}%`, right: `${100 - (end / duration) * 100}%` }} />
              <input type="range" min={0} max={duration} step={0.1} value={start}
                onChange={e => setStart(Math.min(+e.target.value, end - 0.5))}
                className="absolute w-full h-2 cursor-pointer appearance-none bg-transparent" style={{ zIndex: 1 }} />
              <input type="range" min={0} max={duration} step={0.1} value={end}
                onChange={e => setEnd(Math.max(+e.target.value, start + 0.5))}
                className="absolute w-full h-2 cursor-pointer appearance-none bg-transparent" style={{ zIndex: 2 }} />
            </div>
          </div>
          <audio ref={audioRef} src={objUrl!} controls className="w-full rounded-xl" />
        </>
      ) : (
        <p className="text-center text-xs text-slate-400 py-4">Analyzing waveform…</p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setFile(null); if (objUrl) URL.revokeObjectURL(objUrl); setObjUrl(null); setDecoded(false); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change file</button>
        {objUrl && (
          <a href={objUrl} download={file?.name} data-testid="waveform-download"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
            <Download className="h-4 w-4" />Download Original
          </a>
        )}
      </div>
    </div>
  );
}
