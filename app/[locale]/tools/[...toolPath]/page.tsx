import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getHreflangLinks } from "@/lib/i18n/config";
import type { TranscodeOp } from "@/lib/engine/Transcoder";
import ToolPageClient from "@/components/Studio/ToolPageClient";

interface PageProps {
  params: Promise<{ locale: string; toolPath: string[] }>;
}

type ToolMode = "image" | "video" | "audio" | "pdf" | "all";

interface ToolConfig {
  name: string;
  desc: string;
  badge: string;
  badgeClass: string;
  accept: string;
  mode: ToolMode;
  parentPath: string;
  parentLabel: string;
  seoTitle: string;
  seoDesc: string;
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // ── Image Tools ────────────────────────────────────────────────────────────
  "image-cropper": {
    name: "Image Cropper",
    desc: "Crop images to custom dimensions or predefined aspect ratios (1:1, 16:9, 4:3, 9:16). Supports PNG, JPG, WebP, GIF, BMP, TIFF and more.",
    badge: "Image Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Cropper | EveryFileConvert",
    seoDesc: "Crop images online for free. Custom dimensions, aspect ratios, social media presets. 100% private, no uploads.",
  },
  "image-compressor": {
    name: "Image Compressor",
    desc: "Compress images to reduce file size while maintaining visual quality. Ideal for web optimization. Supports PNG, JPG, WebP.",
    badge: "Image Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Compressor | EveryFileConvert",
    seoDesc: "Compress PNG, JPG, WebP images online. Reduce file size without quality loss. 100% private, no uploads.",
  },
  "image-upscaler": {
    name: "Image Upscaler",
    desc: "Increase image resolution up to 4x using AI-based super-resolution. Great for enlarging photos, artwork, and screenshots.",
    badge: "Image Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Upscaler — Enhance Resolution | EveryFileConvert",
    seoDesc: "Upscale images 2x or 4x online for free with AI. Increase photo resolution without quality loss.",
  },
  "image-rotator": {
    name: "Image Rotator",
    desc: "Rotate images 90°, 180°, or 270° and flip horizontally or vertically. All changes applied directly in your browser.",
    badge: "Image Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Rotator & Flipper | EveryFileConvert",
    seoDesc: "Rotate and flip images online for free. Rotate 90°, 180°, 270° or flip horizontally/vertically. No uploads needed.",
  },
  "flip-image": {
    name: "Flip Image",
    desc: "Flip images horizontally or vertically with one click. Works with all common image formats including PNG, JPG, WebP.",
    badge: "Image Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Flipper | EveryFileConvert",
    seoDesc: "Flip images horizontally or vertically online for free. Fast, private, no registration needed.",
  },
  "color-adjustments": {
    name: "Color Adjustments",
    desc: "Fine-tune brightness, contrast, saturation, and hue of your images. Real-time preview in the browser.",
    badge: "Image Tools", badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Color Adjuster | EveryFileConvert",
    seoDesc: "Adjust image brightness, contrast, saturation and hue online for free. Real-time preview, no uploads needed.",
  },
  "color-picker": {
    name: "Color Picker",
    desc: "Pick and identify colors from any image. Get HEX, RGB, and HSL values instantly. Upload any image and click to sample colors.",
    badge: "Image Tools", badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Color Picker | EveryFileConvert",
    seoDesc: "Pick colors from any image online. Get HEX, RGB, HSL values instantly. No uploads to server needed.",
  },
  "background-remover": {
    name: "AI Background Remover",
    desc: "Remove image backgrounds instantly with AI. Perfect for product photos, portraits, and graphic design. Outputs transparent PNG.",
    badge: "Image Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free AI Background Remover Online | EveryFileConvert",
    seoDesc: "Remove image backgrounds instantly with AI. Free, no signup required. Creates transparent PNG output.",
  },
  "batch-image-processor": {
    name: "Batch Image Processor",
    desc: "Upload and process multiple images at once — convert, compress, or resize them in a single batch operation.",
    badge: "Image Tools", badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Batch Image Processor Online | EveryFileConvert",
    seoDesc: "Process multiple images at once online. Batch convert, compress or resize images for free. No uploads to server.",
  },
  "bulk-image-resizer": {
    name: "Bulk Image Resizer",
    desc: "Resize multiple images at once to any dimension. Upload a batch of images and apply the same dimensions to all of them.",
    badge: "Image Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "image/*", mode: "image",
    parentPath: "image-resizer", parentLabel: "Image Resizer",
    seoTitle: "Free Bulk Image Resizer Online | EveryFileConvert",
    seoDesc: "Resize multiple images at once online for free. Apply same dimensions to batch of images. 100% private.",
  },
  "image-enlarger": {
    name: "Image Enlarger",
    desc: "Enlarge small images without pixelation using smart upscaling algorithms. Great for printing and presentations.",
    badge: "Image Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Enlarger | EveryFileConvert",
    seoDesc: "Enlarge images without quality loss online for free. Smart upscaling algorithms. No uploads to server.",
  },
  "collage-maker": {
    name: "Collage Maker",
    desc: "Create beautiful photo collages from multiple images. Choose from templates or design a custom layout.",
    badge: "Image Tools", badgeClass: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Photo Collage Maker | EveryFileConvert",
    seoDesc: "Create photo collages online for free. Multiple layouts, templates, no watermark. No uploads to server.",
  },
  "meme-generator": {
    name: "Meme Generator",
    desc: "Create funny memes by adding text to images. Top and bottom captions with custom fonts and colors.",
    badge: "Image Tools", badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Meme Generator | EveryFileConvert",
    seoDesc: "Create memes online for free. Add text to images, choose fonts and colors. No account required.",
  },
  "add-watermark": {
    name: "Add Watermark",
    desc: "Add text or image watermarks to your photos. Customize position, opacity, and size. Protect your images.",
    badge: "Image Tools", badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Watermark Tool | EveryFileConvert",
    seoDesc: "Add watermarks to images online for free. Text and image watermarks, custom opacity and position. No uploads.",
  },
  "blur-image": {
    name: "Blur Image",
    desc: "Apply Gaussian blur or mosaic effect to images. Blur entire image or specific regions to protect privacy.",
    badge: "Image Tools", badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Online Image Blur Tool | EveryFileConvert",
    seoDesc: "Blur images online for free. Apply Gaussian blur, mosaic, or pixelate effect. All in your browser.",
  },
  "image-to-text": {
    name: "Image to Text OCR",
    desc: "Extract text from images using OCR (Optical Character Recognition). Supports printed and handwritten text.",
    badge: "Image Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: "image/*", mode: "image",
    parentPath: "image-converter", parentLabel: "Image Tools",
    seoTitle: "Free Image to Text OCR Online | EveryFileConvert",
    seoDesc: "Extract text from images online for free with OCR. Supports multiple languages and handwriting.",
  },
  "image-format-preset": {
    name: "Square / Landscape / Portrait Format",
    desc: "Convert images to square (1:1), landscape (16:9), or portrait (9:16) formats for social media and web.",
    badge: "Image Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "image/*", mode: "image",
    parentPath: "image-resizer", parentLabel: "Image Resizer",
    seoTitle: "Free Image Format Converter — Square, Landscape, Portrait | EveryFileConvert",
    seoDesc: "Convert images to square, landscape or portrait format online for free. Social media ready in seconds.",
  },
  // ── Image crop sub-tools ────────────────────────────────────────────────────
  "image-crop/custom": {
    name: "Custom Image Crop",
    desc: "Drag and select any custom region to crop from your image. Precise pixel-level control.",
    badge: "Image Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Custom Image Crop Online | EveryFileConvert",
    seoDesc: "Crop images to a custom region online for free. Drag to select exact area. 100% private, no uploads.",
  },
  "image-crop/square": {
    name: "Square Image Crop",
    desc: "Crop images to a perfect 1:1 square ratio. Ideal for Instagram posts and profile pictures.",
    badge: "Image Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Square Image Crop Online (1:1) | EveryFileConvert",
    seoDesc: "Crop images to square 1:1 ratio online for free. Perfect for Instagram and profile photos.",
  },
  "image-crop/landscape": {
    name: "Landscape Image Crop",
    desc: "Crop images to landscape 16:9 or 4:3 aspect ratios. Perfect for YouTube thumbnails and web banners.",
    badge: "Image Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Landscape Image Crop Online (16:9) | EveryFileConvert",
    seoDesc: "Crop images to landscape 16:9 or 4:3 ratio online. Perfect for YouTube thumbnails and web banners.",
  },
  "image-crop/portrait": {
    name: "Portrait Image Crop",
    desc: "Crop images to portrait 9:16 or 3:4 aspect ratios. Perfect for Instagram Stories, Reels and mobile content.",
    badge: "Image Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Portrait Image Crop Online (9:16) | EveryFileConvert",
    seoDesc: "Crop images to portrait 9:16 or 3:4 ratio online. Perfect for Instagram Stories and Reels.",
  },
  "image-crop/resize": {
    name: "Resize & Crop Image",
    desc: "Resize and crop your image in one step to exact dimensions. Enter width and height and apply instantly.",
    badge: "Image Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Resize and Crop Image Online | EveryFileConvert",
    seoDesc: "Resize and crop images to exact pixel dimensions online for free. One-step tool, no uploads.",
  },
  "image-crop/circle": {
    name: "Circular Image Crop",
    desc: "Crop images into perfect circles for avatars and profile pictures. Outputs transparent PNG.",
    badge: "Image Tools", badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
    accept: "image/*", mode: "image",
    parentPath: "image-crop", parentLabel: "Image Crop",
    seoTitle: "Free Circular Image Crop Online | EveryFileConvert",
    seoDesc: "Crop images to circle shape online for free. Perfect for avatars and profile pictures. Transparent PNG output.",
  },
  // ── Video Tools ────────────────────────────────────────────────────────────
  "video-trimmer": {
    name: "Video Trimmer",
    desc: "Cut and trim video clips to any length by setting start and end times. Supports MP4, MOV, AVI, MKV, WebM.",
    badge: "Video Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Video Trimmer | EveryFileConvert",
    seoDesc: "Trim videos online for free. Set start and end times to cut clips. MP4, MOV, AVI, MKV supported.",
  },
  "video-compressor": {
    name: "Video Compressor",
    desc: "Reduce video file size by adjusting bitrate, resolution, and codec settings. In-browser processing with FFmpeg.",
    badge: "Video Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Video Compressor | EveryFileConvert",
    seoDesc: "Compress videos online for free. Reduce file size without quality loss. MP4, MOV, AVI, MKV supported.",
  },
  "audio-extractor": {
    name: "Audio Extractor",
    desc: "Extract the audio track from any video file and save it as MP3, WAV, or AAC. Preserves original audio quality.",
    badge: "Video Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Audio Extractor from Video | EveryFileConvert",
    seoDesc: "Extract audio from video files online for free. Save as MP3, WAV, AAC. No uploads to server.",
  },
  "video-rotator": {
    name: "Video Rotator",
    desc: "Correct video orientation by rotating 90°, 180°, or 270°. Re-encodes with full quality preservation.",
    badge: "Video Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Video Rotator | EveryFileConvert",
    seoDesc: "Rotate videos online for free. Fix video orientation by rotating 90°, 180° or 270°. No uploads needed.",
  },
  "gif-creator": {
    name: "GIF Creator",
    desc: "Turn any video clip into a looping animated GIF. Control frame rate, size, and loop settings.",
    badge: "Video Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online GIF Creator from Video | EveryFileConvert",
    seoDesc: "Convert video to animated GIF online for free. Control frame rate and size. No registration needed.",
  },
  "batch-video": {
    name: "Batch Video Converter",
    desc: "Convert multiple video files simultaneously. Upload a batch and apply the same settings to all videos at once.",
    badge: "Video Tools", badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Batch Video Converter Online | EveryFileConvert",
    seoDesc: "Convert multiple videos at once online for free. Batch processing, no uploads to server.",
  },
  "video-cropper": {
    name: "Video Cropper",
    desc: "Crop the frame of a video to remove unwanted borders or focus on a specific area. Outputs the cropped video.",
    badge: "Video Tools", badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Video Cropper | EveryFileConvert",
    seoDesc: "Crop video frames online for free. Remove black bars, focus on specific area. MP4, MOV, AVI supported.",
  },
  "add-subtitle": {
    name: "Add Subtitle to Video",
    desc: "Add text subtitles or SRT subtitle files to your video. Burn in subtitles or create soft subtitle tracks.",
    badge: "Video Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Subtitle Adder to Video | EveryFileConvert",
    seoDesc: "Add subtitles to videos online for free. Support SRT files and custom text. No uploads to server.",
  },
  "reverse-video": {
    name: "Reverse Video",
    desc: "Play any video in reverse. Creates a mirrored playback of your clip — great for creative effects.",
    badge: "Video Tools", badgeClass: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    accept: "video/*", mode: "video",
    parentPath: "video-converter", parentLabel: "Video Tools",
    seoTitle: "Free Online Video Reverser | EveryFileConvert",
    seoDesc: "Reverse video playback online for free. Play any video backwards for creative effects. No registration.",
  },
  // ── Audio Tools ────────────────────────────────────────────────────────────
  "audio-trimmer": {
    name: "Audio Trimmer",
    desc: "Cut audio files to specific start and end times. Works with MP3, WAV, FLAC, AAC, OGG and more.",
    badge: "Audio Tools", badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Trimmer | EveryFileConvert",
    seoDesc: "Trim audio files online for free. Set start and end times to cut clips. MP3, WAV, FLAC, AAC supported.",
  },
  "audio-compressor": {
    name: "Audio Compressor",
    desc: "Compress audio files by lowering the bitrate. Choose between MP3, AAC, or OGG output for maximum compatibility.",
    badge: "Audio Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Compressor | EveryFileConvert",
    seoDesc: "Compress audio files online for free. Reduce MP3, WAV, FLAC size by adjusting bitrate. No uploads.",
  },
  "volume-normalizer": {
    name: "Volume Normalizer",
    desc: "Normalize audio volume to a standard loudness level (LUFS). Perfect for podcasts, music, and voice recordings.",
    badge: "Audio Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Volume Normalizer | EveryFileConvert",
    seoDesc: "Normalize audio volume online for free. Set target LUFS for streaming, podcasting, and broadcast.",
  },
  "audio-merger": {
    name: "Audio Merger",
    desc: "Concatenate or overlay multiple audio tracks into a single file. Supports all major audio formats.",
    badge: "Audio Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Merger | EveryFileConvert",
    seoDesc: "Merge multiple audio files online for free. Concatenate or overlay audio tracks. No uploads needed.",
  },
  "audio-recorder": {
    name: "Audio Recorder",
    desc: "Record audio directly in your browser using your microphone. Download as MP3, WAV, or OGG.",
    badge: "Audio Tools", badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Recorder | EveryFileConvert",
    seoDesc: "Record audio online for free using your microphone. Download as MP3, WAV or OGG. No account needed.",
  },
  "waveform": {
    name: "Waveform Visualizer",
    desc: "Visualize and edit audio with a waveform display. Trim, inspect, and export audio clips with precision.",
    badge: "Audio Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Waveform Visualizer & Audio Editor | EveryFileConvert",
    seoDesc: "Visualize audio waveforms online for free. Edit, trim, and export audio with pixel-perfect precision.",
  },
  "audio-speed-changer": {
    name: "Audio Speed Changer",
    desc: "Speed up or slow down audio from 0.5x to 2x without pitch change. Powered by the Web Audio API.",
    badge: "Audio Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Speed Changer | EveryFileConvert",
    seoDesc: "Change audio playback speed online for free. Speed up or slow down without pitch change. 0.5x to 2x.",
  },
  "audio-pitch-changer": {
    name: "Audio Pitch Changer",
    desc: "Raise or lower the pitch of audio without changing speed. Perfect for music producers and voice effects.",
    badge: "Audio Tools", badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
    accept: "audio/*", mode: "audio",
    parentPath: "audio-converter", parentLabel: "Audio Tools",
    seoTitle: "Free Online Audio Pitch Changer | EveryFileConvert",
    seoDesc: "Change audio pitch online for free. Raise or lower pitch without affecting speed. No uploads needed.",
  },
  // ── Audio compress sub-tools ────────────────────────────────────────────────
  "compress-audio/smart": {
    name: "Smart Audio Compress",
    desc: "Automatically select the best compression settings for your audio file. One-click smart compression.",
    badge: "Audio Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: "audio/*", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Smart Audio Compressor Online | EveryFileConvert",
    seoDesc: "Smart automatic audio compression online for free. Best settings chosen automatically. No uploads.",
  },
  "compress-audio/bitrate": {
    name: "Bitrate Reducer",
    desc: "Manually set target audio bitrate from 32 kbps to 320 kbps. Precise control over compression.",
    badge: "Audio Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: "audio/*", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Audio Bitrate Reducer Online | EveryFileConvert",
    seoDesc: "Reduce audio bitrate online for free. Manually set target kbps from 32 to 320. No uploads needed.",
  },
  "compress-audio/mp3": {
    name: "MP3 Compressor",
    desc: "Compress MP3 files while preserving audio quality. Choose quality level and download the optimized file.",
    badge: "Audio Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: "audio/mpeg,audio/mp3", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Online MP3 Compressor | EveryFileConvert",
    seoDesc: "Compress MP3 files online for free. Reduce MP3 size without significant quality loss. No uploads.",
  },
  "compress-audio/aac": {
    name: "AAC Compressor",
    desc: "Compress audio to AAC format for maximum efficiency at low bitrates. Excellent for mobile and streaming.",
    badge: "Audio Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: "audio/*", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Online AAC Audio Compressor | EveryFileConvert",
    seoDesc: "Compress audio to AAC format online for free. Best compression efficiency for streaming.",
  },
  "compress-audio/normalize": {
    name: "Volume Normalizer & Compress",
    desc: "Normalize audio loudness and compress file size in one step. Perfect for podcast and streaming platforms.",
    badge: "Audio Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: "audio/*", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Audio Normalize & Compress Online | EveryFileConvert",
    seoDesc: "Normalize audio volume and compress file size in one step online for free.",
  },
  "compress-audio/batch": {
    name: "Batch Audio Compress",
    desc: "Compress multiple audio files at once. Upload a batch and apply the same compression settings to all.",
    badge: "Audio Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: "audio/*", mode: "audio",
    parentPath: "compress-audio", parentLabel: "Audio Compressor",
    seoTitle: "Free Batch Audio Compressor Online | EveryFileConvert",
    seoDesc: "Compress multiple audio files at once online for free. Batch processing, no uploads to server.",
  },
  // ── PDF Tools ────────────────────────────────────────────────────────────
  "pdf-merger": {
    name: "PDF Merger",
    desc: "Combine multiple PDF files into a single document. Drag to reorder pages. All processing in your browser.",
    badge: "PDF Tools", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Merger | EveryFileConvert",
    seoDesc: "Merge multiple PDF files online for free. Combine PDFs in any order. 100% private, no uploads.",
  },
  "pdf-splitter": {
    name: "PDF Splitter",
    desc: "Split a PDF into individual pages or extract specific page ranges. Define pages like 1-3, 5, 7-9.",
    badge: "PDF Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Splitter | EveryFileConvert",
    seoDesc: "Split PDF files online for free. Extract specific pages or split into individual files. No uploads.",
  },
  "pdf-compressor": {
    name: "PDF Compressor",
    desc: "Reduce PDF file size while maintaining quality. Optimizes images and metadata to shrink the file.",
    badge: "PDF Tools", badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Compressor | EveryFileConvert",
    seoDesc: "Compress PDF files online for free. Reduce PDF size without quality loss. 100% private, no uploads.",
  },
  "pdf-protect": {
    name: "PDF Protect",
    desc: "Add password protection to PDF documents using AES-256 encryption. Set user and owner passwords.",
    badge: "PDF Tools", badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Password Protector | EveryFileConvert",
    seoDesc: "Add password protection to PDF files online for free. AES-256 encryption, no uploads to server.",
  },
  "pdf-unlock": {
    name: "PDF Unlock",
    desc: "Remove password protection from a PDF you own. Enter the current password to unlock and download.",
    badge: "PDF Tools", badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Unlocker & Password Remover | EveryFileConvert",
    seoDesc: "Remove password from PDF files online for free. Unlock protected PDFs instantly. No uploads.",
  },
  "pdf-rotator": {
    name: "PDF Rotator",
    desc: "Rotate all pages or specific pages of a PDF document by 90°, 180°, or 270°. Lossless rotation.",
    badge: "PDF Tools", badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Online PDF Rotator | EveryFileConvert",
    seoDesc: "Rotate PDF pages online for free. Rotate all or specific pages 90°, 180° or 270°. No uploads.",
  },
  "pdf-to-word": {
    name: "PDF to Word",
    desc: "Convert PDF files to editable Word (DOCX) documents. Preserves text, formatting, and layout.",
    badge: "PDF Tools", badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free PDF to Word Converter Online | EveryFileConvert",
    seoDesc: "Convert PDF to Word DOCX online for free. Preserve formatting and layout. No uploads to server.",
  },
  "word-to-pdf": {
    name: "Word to PDF",
    desc: "Convert Word (DOCX/DOC) documents to PDF format. Maintains all formatting, images, and styles.",
    badge: "PDF Tools", badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    accept: ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free Word to PDF Converter Online | EveryFileConvert",
    seoDesc: "Convert Word DOCX to PDF online for free. Maintain formatting and layout. No uploads to server.",
  },
  "pdf-page-numbers": {
    name: "Add Page Numbers to PDF",
    desc: "Add automatic page numbers to any PDF document. Customize position, font, and starting number.",
    badge: "PDF Tools", badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free PDF Page Number Adder Online | EveryFileConvert",
    seoDesc: "Add page numbers to PDF files online for free. Custom position, font and starting page. No uploads.",
  },
  "pdf-watermark": {
    name: "Watermark PDF",
    desc: "Add text or image watermarks to PDF documents. Customize opacity, position, size, and angle.",
    badge: "PDF Tools", badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    accept: ".pdf,application/pdf", mode: "pdf",
    parentPath: "pdf-tools", parentLabel: "PDF Tools",
    seoTitle: "Free PDF Watermark Tool Online | EveryFileConvert",
    seoDesc: "Add watermarks to PDF files online for free. Text and image watermarks, custom opacity. No uploads.",
  },
};

// ── Tool → TranscodeOp mapping ─────────────────────────────────────────────
const TOOL_OP_MAP: Record<string, TranscodeOp> = {
  'image-cropper': 'image:crop',
  'image-compressor': 'image:compress',
  'image-upscaler': 'image:resize',
  'image-rotator': 'image:rotate',
  'flip-image': 'image:flip',
  'color-adjustments': 'image:color-adjust',
  'color-picker': 'image:convert',
  'background-remover': 'image:convert',
  'batch-image-processor': 'image:convert',
  'bulk-image-resizer': 'image:resize',
  'image-enlarger': 'image:resize',
  'collage-maker': 'image:convert',
  'meme-generator': 'image:watermark',
  'add-watermark': 'image:watermark',
  'blur-image': 'image:blur',
  'image-to-text': 'image:ocr',
  'image-format-preset': 'image:resize',
  'image-crop/custom': 'image:crop',
  'image-crop/square': 'image:crop',
  'image-crop/landscape': 'image:crop',
  'image-crop/portrait': 'image:crop',
  'image-crop/resize': 'image:resize',
  'image-crop/circle': 'image:crop',
  'video-trimmer': 'video:trim',
  'video-compressor': 'video:compress',
  'audio-extractor': 'video:extract-audio',
  'video-rotator': 'video:rotate',
  'gif-creator': 'video:gif',
  'batch-video': 'video:convert',
  'video-cropper': 'video:crop',
  'add-subtitle': 'video:subtitle',
  'reverse-video': 'video:reverse',
  'audio-trimmer': 'audio:trim',
  'audio-compressor': 'audio:compress',
  'volume-normalizer': 'audio:normalize',
  'audio-merger': 'audio:merge',
  'audio-recorder': 'audio:convert',
  'waveform': 'audio:convert',
  'audio-speed-changer': 'audio:speed',
  'audio-pitch-changer': 'audio:pitch',
  'compress-audio/smart': 'audio:compress',
  'compress-audio/bitrate': 'audio:compress',
  'compress-audio/mp3': 'audio:compress',
  'compress-audio/aac': 'audio:compress',
  'compress-audio/normalize': 'audio:normalize',
  'compress-audio/batch': 'audio:compress',
  'pdf-merger': 'pdf:merge',
  'pdf-splitter': 'pdf:split',
  'pdf-compressor': 'pdf:compress',
  'pdf-protect': 'pdf:protect',
  'pdf-unlock': 'pdf:unlock',
  'pdf-rotator': 'pdf:rotate',
  'pdf-to-word': 'pdf:to-word',
  'word-to-pdf': 'doc:to-pdf',
  'pdf-page-numbers': 'pdf:page-numbers',
  'pdf-watermark': 'pdf:watermark',
};

function getToolOp(key: string, mode: ToolMode): TranscodeOp {
  return (
    TOOL_OP_MAP[key] ??
    (mode === 'video'
      ? 'video:convert'
      : mode === 'audio'
      ? 'audio:convert'
      : mode === 'pdf'
      ? 'pdf:compress'
      : 'image:convert')
  );
}

const accentColors: Record<string, string> = {
  "Image Tools": "emerald",
  "Video Tools": "violet",
  "Audio Tools": "rose",
  "PDF Tools": "amber",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, toolPath } = await params;
  const key = toolPath.join("/");
  const tool = TOOL_CONFIGS[key];

  if (!tool) {
    return { title: "Tool Not Found | EveryFileConvert" };
  }

  const hreflangs = getHreflangLinks(`/tools/${key}`);

  return {
    title: tool.seoTitle,
    description: tool.seoDesc,
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDesc,
      type: "website",
      url: `https://everyfileconvert.com/${locale}/tools/${key}`,
    },
    twitter: { card: "summary_large_image", title: tool.seoTitle, description: tool.seoDesc },
    alternates: {
      canonical: `https://everyfileconvert.com/${locale}/tools/${key}`,
      languages: Object.fromEntries(hreflangs.map(({ locale: l, href }) => [l, href])),
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { locale, toolPath } = await params;
  const key = toolPath.join("/");
  const tool = TOOL_CONFIGS[key];

  if (!tool) notFound();

  const accentColor = accentColors[tool.badge] || "emerald";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="max-w-3xl mx-auto mb-6">
            <Link
              href={`/${locale}/${tool.parentPath}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {tool.parentLabel}
            </Link>
          </div>

          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge
              variant="secondary"
              className={`mb-4 px-3 py-1 ${tool.badgeClass}`}
            >
              {tool.badge}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              {tool.name}
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              {tool.desc}
            </p>
          </div>

          {/* Dropzone + Studio (client component) */}
          <ToolPageClient
            mode={tool.mode}
            accept={tool.accept}
            toolKey={key}
            toolName={tool.name}
            defaultOp={getToolOp(key, tool.mode)}
          />
        </div>
      </section>

      {/* Back to parent CTA */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm mb-3">Looking for more {tool.badge.toLowerCase()}?</p>
          <Link
            href={`/${locale}/${tool.parentPath}`}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-${accentColor}-50 text-${accentColor}-700 font-medium text-sm hover:bg-${accentColor}-100 border border-${accentColor}-200 transition-all`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {tool.parentLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
