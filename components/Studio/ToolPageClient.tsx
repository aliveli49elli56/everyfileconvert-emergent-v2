'use client';
/**
 * components/Studio/ToolPageClient.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Slug → specific interactive tool UI mapping.
 * Each tool loads its own component lazily (code-split per tool).
 * Falls back to generic UniversalDropzone only for unmapped tools.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { lazy, Suspense, useState, useCallback } from 'react';
import { Sparkles, Shield, Zap, Lock, Loader2 } from 'lucide-react';
import UniversalDropzone from '@/components/UniversalDropzone';
import AdvancedStudio from './AdvancedStudio';
import type { TranscodeOp } from '@/lib/engine/Transcoder';

// ── Lazy-loaded specialized tool UIs (code-split per tool) ───────────────────
const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<{ toolName?: string; onFileSelected?: (f: File) => void }>>> = {
  // Image tools
  'image-cropper':          lazy(() => import('@/components/Tools/image/ImageCropperUI')),
  'image-compressor':       lazy(() => import('@/components/Tools/image/ImageCompressorUI')),
  'image-upscaler':         lazy(() => import('@/components/Tools/image/ImageUpscalerUI')),
  'image-rotator':          lazy(() => import('@/components/Tools/image/ImageRotatorUI')),
  'flip-image':             lazy(() => import('@/components/Tools/image/FlipImageUI')),
  'color-adjustments':      lazy(() => import('@/components/Tools/image/ColorAdjustmentsUI')),
  'color-picker':           lazy(() => import('@/components/Tools/image/ColorPickerUI')),
  'background-remover':     lazy(() => import('@/components/Tools/image/BackgroundRemoverUI')),
  'batch-image-processor':  lazy(() => import('@/components/Tools/image/BatchImageProcessorUI')),
  'bulk-image-resizer':     lazy(() => import('@/components/Tools/image/BulkImageResizerUI')),
  'image-enlarger':         lazy(() => import('@/components/Tools/image/ImageEnlargerUI')),
  // New image tools
  'meme-generator':         lazy(() => import('@/components/Tools/image/MemeGeneratorUI')),
  'blur-image':             lazy(() => import('@/components/Tools/image/BlurImageUI')),
  'add-watermark':          lazy(() => import('@/components/Tools/image/AddWatermarkUI')),
  'collage-maker':          lazy(() => import('@/components/Tools/image/CollageMakerUI')),
  'image-to-text':          lazy(() => import('@/components/Tools/image/ImageToTextUI')),
  'square-format':          lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  'landscape-format':       lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  'portrait-format':        lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  // Image crop sub-tools → all use ImageCropperUI
  'image-crop/custom':      lazy(() => import('@/components/Tools/image/ImageCropperUI')),
  'image-crop/square':      lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  'image-crop/landscape':   lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  'image-crop/portrait':    lazy(() => import('@/components/Tools/image/FormatConverterUI')),
  'image-crop/resize':      lazy(() => import('@/components/Tools/image/ImageCropperUI')),
  'image-crop/circle':      lazy(() => import('@/components/Tools/image/ImageCropperUI')),
  // Video tools
  'video-trimmer':          lazy(() => import('@/components/Tools/video/VideoTrimmerUI')),
  'video-compressor':       lazy(() => import('@/components/Tools/video/VideoCompressorUI')),
  'audio-extractor':        lazy(() => import('@/components/Tools/video/AudioExtractorUI')),
  'video-rotator':          lazy(() => import('@/components/Tools/video/VideoRotatorUI')),
  'gif-creator':            lazy(() => import('@/components/Tools/video/GifCreatorUI')),
  'batch-video':            lazy(() => import('@/components/Tools/video/BatchVideoConverterUI')),
  'video-cropper':          lazy(() => import('@/components/Tools/video/VideoCropperUI')),
  'reverse-video':          lazy(() => import('@/components/Tools/video/ReverseVideoUI')),
  'add-subtitle':           lazy(() => import('@/components/Tools/video/AddSubtitleUI')),
  // Audio tools
  'audio-trimmer':          lazy(() => import('@/components/Tools/audio/AudioTrimmerUI')),
  'audio-compressor':       lazy(() => import('@/components/Tools/audio/AudioCompressorUI')),
  'volume-normalizer':      lazy(() => import('@/components/Tools/audio/VolumeNormalizerUI')),
  'audio-merger':           lazy(() => import('@/components/Tools/audio/AudioMergerUI')),
  'audio-recorder':         lazy(() => import('@/components/Tools/audio/AudioRecorderUI')),
  'waveform':               lazy(() => import('@/components/Tools/audio/WaveformUI')),
  'audio-speed-changer':    lazy(() => import('@/components/Tools/audio/AudioSpeedChangerUI')),
  'audio-pitch-changer':    lazy(() => import('@/components/Tools/audio/AudioPitchChangerUI')),
  // Audio compress sub-tools → all use AudioCompressorUI
  'compress-audio/smart':   lazy(() => import('@/components/Tools/audio/AudioCompressorUI')),
  'compress-audio/bitrate': lazy(() => import('@/components/Tools/audio/AudioCompressorUI')),
  'compress-audio/mp3':     lazy(() => import('@/components/Tools/audio/AudioCompressorUI')),
  'compress-audio/aac':     lazy(() => import('@/components/Tools/audio/AudioCompressorUI')),
  'compress-audio/normalize':lazy(() => import('@/components/Tools/audio/VolumeNormalizerUI')),
  'compress-audio/batch':   lazy(() => import('@/components/Tools/audio/AudioMergerUI')),
  // PDF tools
  'pdf-merger':             lazy(() => import('@/components/Tools/pdf/PDFMergerUI')),
  'pdf-splitter':           lazy(() => import('@/components/Tools/pdf/PDFSplitterUI')),
  'pdf-compressor':         lazy(() => import('@/components/Tools/pdf/PDFCompressorUI')),
  'pdf-protect':            lazy(() => import('@/components/Tools/pdf/PDFProtectUI')),
  'pdf-unlock':             lazy(() => import('@/components/Tools/pdf/PDFUnlockUI')),
  'pdf-rotator':            lazy(() => import('@/components/Tools/pdf/PDFRotatorUI')),
  'pdf-to-word':            lazy(() => import('@/components/Tools/pdf/PDFToWordUI')),
  'word-to-pdf':            lazy(() => import('@/components/Tools/pdf/WordToPDFUI')),
  'pdf-page-numbers':       lazy(() => import('@/components/Tools/pdf/PDFPageNumbersUI')),
  'pdf-watermark':          lazy(() => import('@/components/Tools/pdf/PDFWatermarkUI')),
};

// ── Trust signal badges ───────────────────────────────────────────────────────
const TRUST_FEATURES = [
  { icon: Shield, label: '100% Private', desc: 'Files never leave your device' },
  { icon: Zap,    label: 'Instant',      desc: 'In-browser processing'         },
  { icon: Lock,   label: 'No Account',   desc: 'No sign-up required'           },
];

// ── Loading skeleton ─────────────────────────────────────────────────────────
function ToolSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 rounded-2xl bg-slate-100" />
      <div className="h-10 rounded-xl bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-slate-100" />
        <div className="h-10 flex-1 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  mode: 'image' | 'video' | 'audio' | 'pdf' | 'all';
  accept: string;
  toolKey: string;
  toolName: string;
  defaultOp: TranscodeOp;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ToolPageClient({ mode, accept, toolKey, toolName, defaultOp }: Props) {
  const [studioOpen, setStudioOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    setActiveFile(file);
  }, []);

  const SpecificTool = TOOL_COMPONENTS[toolKey];

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Specific tool UI or generic fallback ───────────────────────────── */}
      {SpecificTool ? (
        <Suspense fallback={<ToolSkeleton />}>
          <SpecificTool toolName={toolName} onFileSelected={handleFileSelected} />
        </Suspense>
      ) : (
        <UniversalDropzone
          mode={mode}
          allowedTypes={[accept]}
          onFileSelected={handleFileSelected}
        />
      )}

      {/* ── Trust signals ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
        {TRUST_FEATURES.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-sm text-slate-500">
            <f.icon className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-slate-700">{f.label}</span>
            <span className="hidden sm:inline text-slate-400">— {f.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Advanced Studio trigger — always visible ─────────────────────── */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setStudioOpen(true)}
          data-testid="advanced-studio-btn"
          className="flex items-center gap-2 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-3 text-sm font-semibold text-cyan-700 shadow-sm hover:shadow-md hover:from-cyan-100 hover:to-blue-100 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Advanced Studio
          <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white ml-1">
            NEW
          </span>
        </button>
      </div>

      {/* ── Studio Panel ─────────────────────────────────────────────────── */}
      <AdvancedStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        file={activeFile}
        toolKey={toolKey}
        toolName={toolName}
        mode={mode}
        defaultOp={defaultOp}
      />
    </div>
  );
}
