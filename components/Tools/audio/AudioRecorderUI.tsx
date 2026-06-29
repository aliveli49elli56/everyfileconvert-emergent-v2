'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Download, Play, Pause } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'recording' | 'paused' | 'done';

export default function AudioRecorderUI({ onFileSelected }: Props) {
  const [stage, setStage]       = useState<Stage>('idle');
  const [time, setTime]         = useState(0);
  const [resultUrl, setResult]  = useState<string | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [format, setFormat]     = useState<'audio/webm' | 'audio/ogg'>('audio/webm');

  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const rafRef       = useRef<number>(0);
  const audioRef     = useRef<HTMLAudioElement>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d')!;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    buf.forEach((v, i) => {
      const x = (i / buf.length) * canvas.width;
      const y = (v / 128) * (canvas.height / 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      setFormat(mimeType as 'audio/webm' | 'audio/ogg');
      const rec = new MediaRecorder(stream, { mimeType });
      mediaRecRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setResult(url);
        const file = new File([blob], `recording.${mimeType.includes('webm') ? 'webm' : 'ogg'}`, { type: mimeType });
        onFileSelected?.(file);
        setStage('done');
        cancelAnimationFrame(rafRef.current);
        stream.getTracks().forEach(t => t.stop());
      };

      rec.start(100);
      setStage('recording');
      setTime(0);
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
      rafRef.current = requestAnimationFrame(drawWaveform);
    } catch {
      setError('Microphone access denied. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-5" data-testid="audio-recorder-ui">
      {/* Waveform canvas */}
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
        <canvas ref={canvasRef} width={600} height={96} className="h-full w-full" />
        {stage === 'idle' && (
          <span className="absolute text-xs text-slate-500">Waveform will appear here</span>
        )}
        {(stage === 'recording') && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white">{fmt(time)}</span>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {stage === 'done' && resultUrl && (
        <audio ref={audioRef} src={resultUrl} controls className="w-full rounded-xl"
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {stage === 'idle' && (
          <button onClick={startRecording} data-testid="record-start"
            className="flex items-center gap-2 rounded-2xl bg-rose-500 px-8 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors shadow-sm">
            <Mic className="h-5 w-5" />Start Recording
          </button>
        )}
        {stage === 'recording' && (
          <button onClick={stopRecording} data-testid="record-stop"
            className="flex items-center gap-2 rounded-2xl bg-slate-800 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
            <Square className="h-5 w-5" />Stop Recording
          </button>
        )}
        {stage === 'done' && (
          <>
            <button onClick={() => { setStage('idle'); setResult(null); setTime(0); }} 
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Record Again
            </button>
            {resultUrl && (
              <a href={resultUrl} download={`recording.${format.includes('webm') ? 'webm' : 'ogg'}`}
                data-testid="recorder-download"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
                <Download className="h-4 w-4" />Download
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
