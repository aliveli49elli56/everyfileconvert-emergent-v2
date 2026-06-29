"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, TriangleAlert as AlertTriangle, ArrowRight, X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import {
  VIEWER_LIMITS, getViewerByExt, type ViewerCategory,
} from "@/lib/registry/viewer-registry";
import type { ViewerEngine } from "@/lib/types/formats";

type ViewerFormat = { ext: string; name: string; category: ViewerCategory; engine: ViewerEngine; mimeTypes: string[]; description: string };
import { addToViewHistory } from "./ViewHistory";

// ── Sub-viewer imports (lazy) ──────────────────────────────────────────────
const PdfViewer  = dynamic(() => import("./viewers/PdfViewer"),  { loading: Spinner });
const DocViewer  = dynamic(() => import("./viewers/DocViewer"),  { loading: Spinner });
const SheetViewer = dynamic(() => import("./viewers/SheetViewer"), { loading: Spinner });
const TextViewer = dynamic(() => import("./viewers/TextViewer"), { loading: Spinner });
const ImageViewer = dynamic(() => import("./viewers/ImageViewer"), { loading: Spinner });
const ArchiveViewer = dynamic(() => import("./viewers/ArchiveViewer"), { loading: Spinner });
const EmailViewer = dynamic(() => import("./viewers/EmailViewer"), { loading: Spinner });
const MediaViewer = dynamic(() => import("./viewers/MediaViewer"), { loading: Spinner });
const EbookViewer = dynamic(() => import("./viewers/EbookViewer"), { loading: Spinner });
const PptxViewer  = dynamic(() => import("./viewers/PptxViewer"), { loading: Spinner });
const PsdViewer   = dynamic(() => import("./viewers/PsdViewer"),  { loading: Spinner });
const CadViewer   = dynamic(() => import("./viewers/CadViewer"),  { loading: Spinner });

import dynamic from "next/dynamic";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

interface Props {
  locale: string;
  presetFormat?: string;
}

export default function FileViewer({ locale, presetFormat }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ViewerFormat | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const fmt = getViewerByExt(ext);
    const limit = isMobileDevice() ? VIEWER_LIMITS.mobile : VIEWER_LIMITS.desktop;

    if (f.size > limit) {
      setSizeError(true);
      setFile(f);
      setFormat(fmt ?? null);
      return;
    }
    setSizeError(false);
    setFile(f);
    setFormat(fmt ?? null);
    // Record in view history
    addToViewHistory({ name: f.name, ext, size: f.size, locale });
  }, [locale]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  const clearFile = () => {
    setFile(null);
    setFormat(null);
    setSizeError(false);
  };

  const mobileLimit = `${VIEWER_LIMITS.mobile / 1024 / 1024}MB`;
  const desktopLimit = `${VIEWER_LIMITS.desktop / 1024 / 1024}MB`;

  // ── Drop zone ──────────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div className="w-full">
        <div
          data-testid="viewer-dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed
            cursor-pointer transition-all duration-200 py-16 px-6 text-center
            ${isDragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 bg-white/60"}
          `}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-400/30">
            <Upload className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {isDragging ? "Release to view" : "Drop your file to view it instantly"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              or <span className="text-blue-500 font-medium">click to browse</span> from your device
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Desktop: up to {desktopLimit} &nbsp;·&nbsp; Mobile: up to {mobileLimit}
          </p>
          {presetFormat && (
            <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Optimized for .{presetFormat.toUpperCase()} files
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onInputChange}
          accept={presetFormat ? `.${presetFormat}` : "*"}
        />
      </div>
    );
  }

  // ── File too large ─────────────────────────────────────────────────────────
  if (sizeError) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isMobile = isMobileDevice();
    return (
      <div className="my-12 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          This file is too large for an instant online view.
        </h3>
        <p className="text-sm text-slate-600 mb-2">
          File size: <strong>{(file.size / 1024 / 1024).toFixed(1)} MB</strong>
          &nbsp;·&nbsp; Limit: <strong>{isMobile ? mobileLimit : desktopLimit}</strong> on this device
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Large files may exceed browser memory. Try converting or compressing first.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/${locale}/${ext}`}
            data-testid="convert-instead-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            Convert/Process this file instead
            <ArrowRight className="h-4 w-4" />
          </a>
          <button
            onClick={clearFile}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try a different file
          </button>
        </div>
      </div>
    );
  }

  // ── Viewer canvas ──────────────────────────────────────────────────────────
  const engine: ViewerEngine = format?.engine ?? "text";

  return (
    <div className="w-full">
      {/* File info bar */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            .{(file.name.split(".").pop() ?? "?").toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
          <span className="flex-shrink-0 text-xs text-slate-400">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={URL.createObjectURL(file)}
            download={file.name}
            data-testid="viewer-download-btn"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <button
            onClick={clearFile}
            data-testid="viewer-close-btn"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Viewer canvas — 40px margin from any ad */}
      <div className="my-12 min-h-[400px] rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {engine === "pdf"          && <PdfViewer file={file} />}
        {engine === "docx"         && <DocViewer file={file} />}
        {engine === "spreadsheet"  && <SheetViewer file={file} />}
        {engine === "text"         && <TextViewer file={file} />}
        {engine === "native-image" && <ImageViewer file={file} />}
        {engine === "svg"          && <ImageViewer file={file} />}
        {engine === "archive"      && <ArchiveViewer file={file} />}
        {engine === "email"        && <EmailViewer file={file} />}
        {(engine === "video" || engine === "audio") && <MediaViewer file={file} engine={engine} />}
        {engine === "ebook"        && <EbookViewer file={file} />}
        {engine === "pptx"         && <PptxViewer file={file} />}
        {engine === "psd"          && <PsdViewer file={file} />}
        {engine === "cad"          && <CadViewer file={file} />}
      </div>
    </div>
  );
}
