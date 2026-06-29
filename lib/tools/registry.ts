import type { LucideIcon } from "lucide-react";
import {
  Crop,
  Minimize2,
  Maximize2,
  RotateCcw,
  Palette,
  Sparkles,
  Layers,
  Scissors,
  Film,
  Volume2,
  Merge,
  Mic2,
  AudioWaveform,
  Music,
  FileType,
  Lock,
  Unlock,
  RotateCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type ToolCategory = "image" | "video" | "audio" | "pdf";
export type EngineType = "canvas" | "ffmpeg" | "web-audio" | "pdf-lib";

export interface SliderControl {
  type: "slider";
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  formatValue?: (v: number) => string;
}

export interface SelectControl {
  type: "select";
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

export interface ToggleControl {
  type: "toggle";
  id: string;
  label: string;
  defaultValue: boolean;
}

export interface AnglesControl {
  type: "angles";
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

export interface TimeRangeControl {
  type: "time-range";
  id: string;
}

export interface TextControl {
  type: "text";
  id: string;
  label: string;
  placeholder: string;
  inputType?: string;
}

export interface PageRangeControl {
  type: "page-range";
  id: string;
  label: string;
}

export type ControlDef =
  | SliderControl
  | SelectControl
  | ToggleControl
  | AnglesControl
  | TimeRangeControl
  | TextControl
  | PageRangeControl;

export interface ToolDefinition {
  id: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: ToolCategory;
  parentPath: string;
  parentLabel: string;
  accept: string;
  acceptLabel: string;
  engine: EngineType;
  gradient: string;
  accentColor: string;
  icon: LucideIcon;
  controls: ControlDef[];
  multiFile?: boolean;
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const TOOL_REGISTRY: ToolDefinition[] = [
  // ── Image Tools ───────────────────────────────────────────────────────────

  {
    id: "image-cropper",
    name: "Image Cropper",
    shortDesc: "Crop images to custom dimensions or aspect ratios",
    longDesc: "Crop any image to a precise size or choose from common aspect ratios like 1:1, 16:9, 4:3. Supports PNG, JPG, WebP, GIF, BMP, TIFF and more.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, GIF, BMP, TIFF",
    engine: "canvas",
    gradient: "from-cyan-500 to-blue-500",
    accentColor: "text-cyan-600",
    icon: Crop,
    controls: [
      {
        type: "select",
        id: "aspect-ratio",
        label: "Aspect Ratio",
        options: [
          { value: "free", label: "Free (Custom)" },
          { value: "1:1", label: "1:1 — Square" },
          { value: "16:9", label: "16:9 — Widescreen" },
          { value: "4:3", label: "4:3 — Standard" },
          { value: "3:2", label: "3:2 — Photo" },
          { value: "9:16", label: "9:16 — Portrait / Reel" },
        ],
        defaultValue: "free",
      },
      {
        type: "slider",
        id: "width",
        label: "Width (px)",
        min: 100,
        max: 4096,
        step: 10,
        defaultValue: 800,
        unit: "px",
      },
      {
        type: "slider",
        id: "height",
        label: "Height (px)",
        min: 100,
        max: 4096,
        step: 10,
        defaultValue: 600,
        unit: "px",
      },
    ],
  },

  {
    id: "image-compressor",
    name: "Image Compressor",
    shortDesc: "Reduce file size while maintaining visual quality",
    longDesc: "Compress images using adjustable quality settings. Ideal for web optimization and reducing storage. Supports PNG, JPG, WebP and more.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, GIF, BMP, TIFF",
    engine: "canvas",
    gradient: "from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
    icon: Minimize2,
    controls: [
      {
        type: "slider",
        id: "quality",
        label: "Quality",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 80,
        unit: "%",
        formatValue: (v) => `${v}% quality`,
      },
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "same", label: "Same as input" },
          { value: "jpg", label: "JPEG (best compression)" },
          { value: "webp", label: "WebP (modern, small)" },
          { value: "png", label: "PNG (lossless)" },
        ],
        defaultValue: "same",
      },
      {
        type: "slider",
        id: "max-width",
        label: "Max Width",
        min: 200,
        max: 4096,
        step: 100,
        defaultValue: 4096,
        unit: "px",
        formatValue: (v) => (v === 4096 ? "No limit" : `${v}px`),
      },
    ],
  },

  {
    id: "image-upscaler",
    name: "Image Upscaler",
    shortDesc: "Increase image resolution using AI enhancement",
    longDesc: "Upscale low-resolution images up to 4x using AI-based super-resolution. Great for enlarging photos, artwork, and screenshots.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, BMP",
    engine: "canvas",
    gradient: "from-rose-500 to-pink-500",
    accentColor: "text-rose-600",
    icon: Maximize2,
    controls: [
      {
        type: "select",
        id: "scale",
        label: "Upscale Factor",
        options: [
          { value: "2", label: "2x — Double resolution" },
          { value: "4", label: "4x — Quadruple resolution" },
        ],
        defaultValue: "2",
      },
      {
        type: "select",
        id: "model",
        label: "Enhancement Model",
        options: [
          { value: "standard", label: "Standard (fast)" },
          { value: "photo", label: "Photo Enhance (detailed)" },
          { value: "art", label: "Illustration / Art" },
        ],
        defaultValue: "standard",
      },
    ],
  },

  {
    id: "image-rotator",
    name: "Image Rotator",
    shortDesc: "Rotate and flip images to any angle",
    longDesc: "Rotate images 90°, 180°, or 270° and flip horizontally or vertically. Changes are applied non-destructively in the browser.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, GIF, BMP, TIFF",
    engine: "canvas",
    gradient: "from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    icon: RotateCcw,
    controls: [
      {
        type: "angles",
        id: "rotation",
        label: "Rotation",
        options: [
          { value: "90", label: "90° CW" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° CW" },
        ],
        defaultValue: "90",
      },
      {
        type: "toggle",
        id: "flip-h",
        label: "Flip Horizontal",
        defaultValue: false,
      },
      {
        type: "toggle",
        id: "flip-v",
        label: "Flip Vertical",
        defaultValue: false,
      },
    ],
  },

  {
    id: "color-adjustments",
    name: "Color Adjustments",
    shortDesc: "Adjust brightness, contrast, saturation, and hue",
    longDesc: "Fine-tune your image with professional-grade color controls. All adjustments are previewed in real time directly in the browser.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, BMP, TIFF",
    engine: "canvas",
    gradient: "from-indigo-500 to-slate-500",
    accentColor: "text-indigo-600",
    icon: Palette,
    controls: [
      {
        type: "slider",
        id: "brightness",
        label: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        formatValue: (v) => (v > 0 ? `+${v}` : `${v}`),
      },
      {
        type: "slider",
        id: "contrast",
        label: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        formatValue: (v) => (v > 0 ? `+${v}` : `${v}`),
      },
      {
        type: "slider",
        id: "saturation",
        label: "Saturation",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        formatValue: (v) => (v > 0 ? `+${v}` : `${v}`),
      },
      {
        type: "slider",
        id: "sharpness",
        label: "Sharpness",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
      },
    ],
  },

  {
    id: "batch-image-processor",
    name: "Batch Image Processor",
    shortDesc: "Process multiple images at once",
    longDesc: "Upload multiple images and apply the same conversion, compression, or resize settings to all at once. Saves hours of manual work.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, GIF, BMP, TIFF",
    engine: "canvas",
    gradient: "from-teal-500 to-emerald-500",
    accentColor: "text-teal-600",
    icon: Layers,
    multiFile: true,
    controls: [
      {
        type: "select",
        id: "operation",
        label: "Operation",
        options: [
          { value: "convert", label: "Convert format" },
          { value: "compress", label: "Compress" },
          { value: "resize", label: "Resize" },
        ],
        defaultValue: "convert",
      },
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "jpg", label: "JPEG" },
          { value: "png", label: "PNG" },
          { value: "webp", label: "WebP" },
        ],
        defaultValue: "jpg",
      },
      {
        type: "slider",
        id: "quality",
        label: "Quality",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 80,
        unit: "%",
      },
    ],
  },

  // ── Video Tools ───────────────────────────────────────────────────────────

  {
    id: "video-trimmer",
    name: "Video Trimmer",
    shortDesc: "Cut and trim video clips to any length",
    longDesc: "Trim videos by setting start and end times. Supports MP4, MOV, AVI, MKV, WebM, WMV and more. Processing runs entirely in your browser.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM, WMV",
    engine: "ffmpeg",
    gradient: "from-blue-500 to-cyan-500",
    accentColor: "text-blue-600",
    icon: Scissors,
    controls: [{ type: "time-range", id: "trim-range" }],
  },

  {
    id: "video-compressor",
    name: "Video Compressor",
    shortDesc: "Reduce video file size without quality loss",
    longDesc: "Compress videos by adjusting bitrate, resolution, and codec settings. Powered by FFmpeg.wasm for full in-browser processing.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM, WMV",
    engine: "ffmpeg",
    gradient: "from-rose-500 to-pink-500",
    accentColor: "text-rose-600",
    icon: Minimize2,
    controls: [
      {
        type: "select",
        id: "resolution",
        label: "Max Resolution",
        options: [
          { value: "original", label: "Original" },
          { value: "1080p", label: "1080p Full HD" },
          { value: "720p", label: "720p HD" },
          { value: "480p", label: "480p SD" },
        ],
        defaultValue: "original",
      },
      {
        type: "select",
        id: "quality",
        label: "Compression Level",
        options: [
          { value: "high", label: "High quality (larger file)" },
          { value: "medium", label: "Balanced" },
          { value: "low", label: "Small file (lower quality)" },
        ],
        defaultValue: "medium",
      },
    ],
  },

  {
    id: "audio-extractor",
    name: "Audio Extractor",
    shortDesc: "Extract audio track from any video file",
    longDesc: "Pull the audio from any video file and save it as MP3, WAV, or AAC. Preserves original audio quality. Powered by FFmpeg.wasm.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM, WMV",
    engine: "ffmpeg",
    gradient: "from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    icon: Volume2,
    controls: [
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "mp3", label: "MP3 (universal)" },
          { value: "wav", label: "WAV (lossless)" },
          { value: "aac", label: "AAC (high quality)" },
          { value: "ogg", label: "OGG (open source)" },
        ],
        defaultValue: "mp3",
      },
      {
        type: "select",
        id: "bitrate",
        label: "Audio Bitrate",
        options: [
          { value: "128k", label: "128 kbps — Standard" },
          { value: "192k", label: "192 kbps — High" },
          { value: "320k", label: "320 kbps — Maximum" },
        ],
        defaultValue: "192k",
      },
    ],
  },

  {
    id: "video-rotator",
    name: "Video Rotator",
    shortDesc: "Rotate videos 90, 180, or 270 degrees",
    longDesc: "Correct video orientation by rotating 90°, 180°, or 270°. Re-encodes with preserved quality using FFmpeg.wasm.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM",
    engine: "ffmpeg",
    gradient: "from-cyan-500 to-teal-500",
    accentColor: "text-cyan-600",
    icon: RotateCw,
    controls: [
      {
        type: "angles",
        id: "rotation",
        label: "Rotation",
        options: [
          { value: "90", label: "90° CW" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° CW" },
        ],
        defaultValue: "90",
      },
    ],
  },

  {
    id: "gif-maker",
    name: "GIF Maker",
    shortDesc: "Convert video clips to animated GIFs",
    longDesc: "Turn any video clip into a looping animated GIF. Control frame rate, size, and loop count. Powered by FFmpeg.wasm.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM",
    engine: "ffmpeg",
    gradient: "from-emerald-500 to-green-500",
    accentColor: "text-emerald-600",
    icon: Sparkles,
    controls: [
      {
        type: "slider",
        id: "fps",
        label: "Frame Rate",
        min: 5,
        max: 30,
        step: 1,
        defaultValue: 15,
        unit: "fps",
      },
      {
        type: "slider",
        id: "width",
        label: "Width",
        min: 100,
        max: 800,
        step: 50,
        defaultValue: 480,
        unit: "px",
      },
    ],
  },

  {
    id: "video-merger",
    name: "Video Merger",
    shortDesc: "Combine multiple video clips into one",
    longDesc: "Concatenate multiple video files into a single clip in the order you choose. Powered by FFmpeg.wasm.",
    category: "video",
    parentPath: "/video-converter",
    parentLabel: "Video Tools",
    accept: "video/*",
    acceptLabel: "MP4, MOV, AVI, MKV, WebM",
    engine: "ffmpeg",
    gradient: "from-indigo-500 to-slate-500",
    accentColor: "text-indigo-600",
    icon: Merge,
    multiFile: true,
    controls: [
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "mp4", label: "MP4" },
          { value: "webm", label: "WebM" },
          { value: "mkv", label: "MKV" },
        ],
        defaultValue: "mp4",
      },
    ],
  },

  // ── Audio Tools ───────────────────────────────────────────────────────────

  {
    id: "audio-trimmer",
    name: "Audio Trimmer",
    shortDesc: "Cut audio to specific start and end times",
    longDesc: "Trim audio files by setting precise start and end points. Works with MP3, WAV, FLAC, AAC, OGG and more.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG, M4A",
    engine: "ffmpeg",
    gradient: "from-orange-500 to-red-500",
    accentColor: "text-orange-600",
    icon: Scissors,
    controls: [{ type: "time-range", id: "trim-range" }],
  },

  {
    id: "audio-compressor",
    name: "Audio Compressor",
    shortDesc: "Reduce audio file size by adjusting bitrate",
    longDesc: "Compress audio files by lowering the bitrate. Choose between MP3, AAC, or OGG output for maximum compatibility.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG, M4A",
    engine: "ffmpeg",
    gradient: "from-amber-500 to-yellow-500",
    accentColor: "text-amber-600",
    icon: Minimize2,
    controls: [
      {
        type: "select",
        id: "bitrate",
        label: "Target Bitrate",
        options: [
          { value: "64k", label: "64 kbps — Podcast / Voice" },
          { value: "128k", label: "128 kbps — Standard music" },
          { value: "192k", label: "192 kbps — High quality" },
          { value: "320k", label: "320 kbps — Maximum" },
        ],
        defaultValue: "128k",
      },
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "mp3", label: "MP3" },
          { value: "aac", label: "AAC" },
          { value: "ogg", label: "OGG" },
        ],
        defaultValue: "mp3",
      },
    ],
  },

  {
    id: "volume-normalizer",
    name: "Volume Normalizer",
    shortDesc: "Normalize audio volume to standard levels",
    longDesc: "Automatically normalize audio volume to a target loudness level. Ideal for podcast production, music, and voice recordings.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG, M4A",
    engine: "web-audio",
    gradient: "from-emerald-500 to-green-500",
    accentColor: "text-emerald-600",
    icon: Volume2,
    controls: [
      {
        type: "select",
        id: "target-level",
        label: "Target Loudness",
        options: [
          { value: "-14", label: "-14 LUFS — Streaming (Spotify)" },
          { value: "-16", label: "-16 LUFS — Podcast standard" },
          { value: "-23", label: "-23 LUFS — Broadcast (EBU R128)" },
        ],
        defaultValue: "-14",
      },
    ],
  },

  {
    id: "audio-merger",
    name: "Audio Merger",
    shortDesc: "Combine multiple audio files into one",
    longDesc: "Concatenate or overlay multiple audio tracks into a single file. Supports all major audio formats.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG, M4A",
    engine: "ffmpeg",
    gradient: "from-cyan-500 to-teal-500",
    accentColor: "text-cyan-600",
    icon: Merge,
    multiFile: true,
    controls: [
      {
        type: "select",
        id: "mode",
        label: "Merge Mode",
        options: [
          { value: "concat", label: "Concatenate (one after another)" },
          { value: "overlay", label: "Overlay (mix together)" },
        ],
        defaultValue: "concat",
      },
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "mp3", label: "MP3" },
          { value: "wav", label: "WAV" },
          { value: "ogg", label: "OGG" },
        ],
        defaultValue: "mp3",
      },
    ],
  },

  {
    id: "audio-speed-changer",
    name: "Audio Speed Changer",
    shortDesc: "Speed up or slow down audio without pitch change",
    longDesc: "Change playback speed from 0.5x to 2x while maintaining the original pitch. Powered by the Web Audio API.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG, M4A",
    engine: "web-audio",
    gradient: "from-blue-500 to-indigo-500",
    accentColor: "text-blue-600",
    icon: Mic2,
    controls: [
      {
        type: "slider",
        id: "speed",
        label: "Playback Speed",
        min: 0.5,
        max: 2.0,
        step: 0.25,
        defaultValue: 1.0,
        unit: "x",
        formatValue: (v) => `${v}x`,
      },
      {
        type: "toggle",
        id: "preserve-pitch",
        label: "Preserve Pitch",
        defaultValue: true,
      },
    ],
  },

  {
    id: "waveform-editor",
    name: "Waveform Editor",
    shortDesc: "Visual audio editing with waveform display",
    longDesc: "Visualize and edit audio with a waveform view. Trim, split, and export audio clips with pixel-perfect precision.",
    category: "audio",
    parentPath: "/audio-converter",
    parentLabel: "Audio Tools",
    accept: "audio/*",
    acceptLabel: "MP3, WAV, FLAC, AAC, OGG",
    engine: "web-audio",
    gradient: "from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
    icon: AudioWaveform,
    controls: [
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "mp3", label: "MP3" },
          { value: "wav", label: "WAV (lossless)" },
          { value: "ogg", label: "OGG" },
        ],
        defaultValue: "wav",
      },
    ],
  },

  // ── PDF Tools ─────────────────────────────────────────────────────────────

  {
    id: "pdf-merger",
    name: "PDF Merger",
    shortDesc: "Combine multiple PDF files into a single document",
    longDesc: "Upload multiple PDF files and merge them into one in any order you choose. All processing happens locally in your browser using pdf-lib.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-emerald-500 to-green-500",
    accentColor: "text-emerald-600",
    icon: Merge,
    multiFile: true,
    controls: [],
  },

  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    shortDesc: "Split PDF into individual pages or sections",
    longDesc: "Extract specific pages or split a PDF into individual files. Define page ranges like 1-3, 5, 7-9 for precise splitting.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-blue-500 to-cyan-500",
    accentColor: "text-blue-600",
    icon: Scissors,
    controls: [
      {
        type: "page-range",
        id: "page-range",
        label: "Page Range",
      },
      {
        type: "select",
        id: "output-mode",
        label: "Output Mode",
        options: [
          { value: "range", label: "Extract range as single PDF" },
          { value: "individual", label: "Each page as separate PDF" },
        ],
        defaultValue: "range",
      },
    ],
  },

  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    shortDesc: "Reduce PDF file size while maintaining quality",
    longDesc: "Compress PDF files by optimizing embedded images and removing unnecessary metadata. No upload required.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-rose-500 to-pink-500",
    accentColor: "text-rose-600",
    icon: Minimize2,
    controls: [
      {
        type: "select",
        id: "quality",
        label: "Compression Level",
        options: [
          { value: "light", label: "Light — Minimal quality loss" },
          { value: "medium", label: "Medium — Balanced" },
          { value: "strong", label: "Strong — Smallest file size" },
        ],
        defaultValue: "medium",
      },
    ],
  },

  {
    id: "pdf-protect",
    name: "PDF Protect",
    shortDesc: "Add password protection to PDF documents",
    longDesc: "Encrypt your PDF with a password using AES-256. Set separate owner and user passwords for granular access control.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-violet-500 to-purple-500",
    accentColor: "text-violet-600",
    icon: Lock,
    controls: [
      {
        type: "text",
        id: "password",
        label: "Password",
        placeholder: "Enter password...",
        inputType: "password",
      },
      {
        type: "text",
        id: "confirm-password",
        label: "Confirm Password",
        placeholder: "Repeat password...",
        inputType: "password",
      },
    ],
  },

  {
    id: "pdf-unlock",
    name: "PDF Unlock",
    shortDesc: "Remove password from protected PDF files",
    longDesc: "Remove password protection from a PDF you own. Enter the current password and download an unlocked copy.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-cyan-500 to-teal-500",
    accentColor: "text-cyan-600",
    icon: Unlock,
    controls: [
      {
        type: "text",
        id: "password",
        label: "Current Password",
        placeholder: "Enter current password...",
        inputType: "password",
      },
    ],
  },

  {
    id: "pdf-rotator",
    name: "PDF Rotator",
    shortDesc: "Rotate PDF pages 90, 180, or 270 degrees",
    longDesc: "Rotate all pages or specific pages of a PDF document. Uses pdf-lib for lossless page rotation.",
    category: "pdf",
    parentPath: "/pdf-tools",
    parentLabel: "PDF Tools",
    accept: ".pdf,application/pdf",
    acceptLabel: "PDF files",
    engine: "pdf-lib",
    gradient: "from-indigo-500 to-blue-500",
    accentColor: "text-indigo-600",
    icon: RotateCcw,
    controls: [
      {
        type: "angles",
        id: "rotation",
        label: "Rotation",
        options: [
          { value: "90", label: "90° CW" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° CW" },
        ],
        defaultValue: "90",
      },
      {
        type: "select",
        id: "pages",
        label: "Apply To",
        options: [
          { value: "all", label: "All pages" },
          { value: "even", label: "Even pages only" },
          { value: "odd", label: "Odd pages only" },
        ],
        defaultValue: "all",
      },
    ],
  },

  // ── Extra image tool used from background-remover page ────────────────────
  {
    id: "background-remover",
    name: "AI Background Remover",
    shortDesc: "Remove image backgrounds instantly with AI",
    longDesc: "Automatically remove the background from any photo using AI. Perfect for product photos, portraits, and icons.",
    category: "image",
    parentPath: "/image-converter",
    parentLabel: "Image Tools",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP",
    engine: "canvas",
    gradient: "from-blue-500 to-cyan-500",
    accentColor: "text-blue-600",
    icon: Sparkles,
    controls: [
      {
        type: "select",
        id: "output-format",
        label: "Output Format",
        options: [
          { value: "png", label: "PNG (transparent background)" },
          { value: "jpg", label: "JPG (white background)" },
          { value: "webp", label: "WebP (transparent)" },
        ],
        defaultValue: "png",
      },
    ],
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

const toolMap = new Map(TOOL_REGISTRY.map((t) => [t.id, t]));

export function getToolById(id: string): ToolDefinition | undefined {
  return toolMap.get(id);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getAllToolIds(): string[] {
  return TOOL_REGISTRY.map((t) => t.id);
}

// ── Engine display labels ──────────────────────────────────────────────────

export const ENGINE_LABELS: Record<EngineType, string> = {
  canvas: "Canvas API",
  ffmpeg: "FFmpeg.wasm",
  "web-audio": "Web Audio API",
  "pdf-lib": "pdf-lib",
};
