'use client';
/**
 * ImageToTextUI — OCR tool using Tesseract.js (lazy loaded)
 * Extracts text from images, copy/download result
 */
import { useState, useRef } from 'react';
import { Image, Download, Copy, Check, ScanText, Loader2 } from 'lucide-react';

interface Props { toolName?: string; onFileSelected?: (f: File) => void }
type Stage = 'idle' | 'loading' | 'done' | 'error';

export default function ImageToTextUI({ onFileSelected }: Props) {
  const [imgSrc, setImgSrc]   = useState<string | null>(null);
  const [stage, setStage]     = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [text, setText]       = useState('');
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [lang, setLang]       = useState('eng');
  const fileInput = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<File | null>(null);

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    fileRef.current = f;
    setImgSrc(URL.createObjectURL(f));
    setText(''); setStage('idle'); setError(null);
    onFileSelected?.(f);
  };

  const runOCR = async () => {
    if (!imgSrc) return;
    setStage('loading'); setProgress(0); setError(null); setText('');
    try {
      const Tesseract = (await import('tesseract.js')) as unknown as {
        recognize: (img: string, lang: string, opts?: unknown) => Promise<{ data: { text: string } }>;
      };
      const result = await Tesseract.recognize(imgSrc, lang, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      setText(result.data.text);
      setStage('done');
    } catch {
      setError('OCR failed. Try a clearer image with readable text.');
      setStage('error');
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted_text.txt';
    a.click();
  };

  if (!imgSrc) return (
    <div onClick={() => fileInput.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      onDragOver={e => e.preventDefault()}
      data-testid="ocr-drop"
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-8 py-14 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:shadow-md">
        <ScanText className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Drop an image to extract text</p>
        <p className="text-xs text-slate-400 mt-1">or <span className="text-emerald-500">click to browse</span> — PNG, JPG, WebP, TIFF</p>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="ocr-editor">
      <div className="flex gap-3">
        <img src={imgSrc} className="w-40 shrink-0 rounded-xl border border-slate-200 object-cover" alt="OCR input" />
        <div className="flex-1 space-y-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)} data-testid="ocr-lang"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none">
              <option value="eng">English</option>
              <option value="tur">Turkish</option>
              <option value="deu">German</option>
              <option value="fra">French</option>
              <option value="spa">Spanish</option>
              <option value="por">Portuguese</option>
              <option value="rus">Russian</option>
              <option value="chi_sim">Chinese (Simplified)</option>
              <option value="jpn">Japanese</option>
              <option value="ara">Arabic</option>
            </select>
          </div>
          {stage === 'loading' && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400">Recognizing text… {progress}%</p>
            </div>
          )}
          <button onClick={runOCR} disabled={stage === 'loading'} data-testid="ocr-run"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
            {stage === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" />Scanning…</> : <><ScanText className="h-4 w-4" />Extract Text</>}
          </button>
        </div>
      </div>

      {text && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500">Extracted Text</label>
            <span className="text-xs text-slate-400">{text.trim().split(/\s+/).length} words</span>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
            data-testid="ocr-result"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-400 focus:outline-none resize-y" />
        </div>
      )}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button onClick={() => { setImgSrc(null); setText(''); setStage('idle'); }}
          className="text-xs text-slate-400 hover:text-slate-600">← Change image</button>
        {text && (
          <div className="flex gap-2">
            <button onClick={copyText} data-testid="ocr-copy"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
            <button onClick={downloadText} data-testid="ocr-download"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors">
              <Download className="h-3.5 w-3.5" />Download TXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
