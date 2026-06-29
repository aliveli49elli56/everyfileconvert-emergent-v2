"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Download, CircleCheck as CheckCircle2, X, ArrowRight, ChevronsUpDown, Check, CircleAlert as AlertCircle, Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { conversionRegistry } from "@/lib/registry/conversion-registry";

export interface FileInfo {
  file: File;
  name: string;
  size: string;
  ext: string;
  category: "video" | "audio" | "image" | "raw" | "vector" | "icon" | "cad" | "document";
}

interface UploadModalProps {
  isOpen: boolean;
  fileInfo: FileInfo | null;
  targetFormat: string;
  isConverting: boolean;
  progress: number;
  isComplete: boolean;
  onClose: () => void;
  onFormatSelect: (format: string) => void;
  onConvert: () => void;
  onDownload: () => void;
  onReset: () => void;
}

const categoryIcons: Record<"video" | "audio" | "image" | "raw" | "vector" | "icon" | "cad" | "document", string> = {
  video: "📹",
  audio: "🎵",
  image: "🖼️",
  raw: "📷",
  vector: "✨",
  icon: "⭐",
  cad: "📐",
  document: "📄",
};

const categoryColors: Record<"video" | "audio" | "image" | "raw" | "vector" | "icon" | "cad" | "document", { gradient: string; light: string }> = {
  image: { gradient: "from-emerald-500 to-teal-500", light: "bg-emerald-50" },
  raw: { gradient: "from-amber-500 to-orange-500", light: "bg-amber-50" },
  vector: { gradient: "from-purple-500 to-pink-500", light: "bg-purple-50" },
  icon: { gradient: "from-blue-500 to-cyan-500", light: "bg-blue-50" },
  cad: { gradient: "from-indigo-500 to-slate-500", light: "bg-indigo-50" },
  video: { gradient: "from-red-500 to-rose-500", light: "bg-red-50" },
  audio: { gradient: "from-rose-500 to-pink-500", light: "bg-rose-50" },
  document: { gradient: "from-amber-500 to-orange-500", light: "bg-amber-50" },
};

const categoryQuickFormats: Record<"video" | "audio" | "image" | "raw" | "vector" | "icon" | "cad" | "document", string[]> = {
  image: ["jpg", "png", "webp", "gif"],
  raw: ["jpg", "jpeg", "png", "tiff"],
  vector: ["png", "jpg", "svg", "pdf"],
  icon: ["png", "ico", "icns", "jpg"],
  cad: ["pdf", "svg", "dxf", "dwg"],
  video: ["mp4", "mkv", "webm", "mov"],
  audio: ["mp3", "wav", "aac", "flac"],
  document: ["pdf", "docx", "txt", "html"],
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-500 ease-out shadow-lg shadow-cyan-500/20"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function FormatSelector({
  formats,
  selectedFormat,
  onSelect,
  disabled,
  categoryColor,
}: {
  formats: string[];
  selectedFormat: string;
  onSelect: (format: string) => void;
  disabled: boolean;
  categoryColor: string;
}) {
  const [open, setOpen] = useState(false);

  const grouped = formats.reduce<Record<string, string[]>>((acc, fmt) => {
    const cat = "Formats";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fmt);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11 px-3 font-medium transition-all duration-200",
            selectedFormat
              ? "border-slate-300 text-slate-900 bg-white"
              : "border-slate-200 text-slate-400 bg-slate-50",
            disabled && "opacity-40 cursor-not-allowed bg-slate-50"
          )}
        >
          <span className="flex items-center gap-2">
            {selectedFormat && (
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white bg-gradient-to-br ${categoryColor} shadow-sm`}>
                {selectedFormat.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-mono text-sm font-bold uppercase">
              {selectedFormat ? `.${selectedFormat}` : "Choose format..."}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search formats..." className="text-sm" />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-1 py-6">
                <AlertCircle className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-500">No format found</span>
              </div>
            </CommandEmpty>
            {Object.entries(grouped).map(([cat, entries]) => (
              <CommandGroup key={cat} heading={cat}>
                {entries.map((fmt) => (
                  <CommandItem
                    key={fmt}
                    value={fmt}
                    onSelect={() => {
                      onSelect(fmt);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 py-2.5 cursor-pointer"
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white bg-gradient-to-br ${categoryColor} shrink-0`}>
                      {fmt.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="font-mono text-sm font-bold uppercase">
                      .{fmt}
                    </span>
                    {selectedFormat === fmt && (
                      <Check className="ml-auto h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function UploadModal({
  isOpen,
  fileInfo,
  targetFormat,
  isConverting,
  progress,
  isComplete,
  onClose,
  onFormatSelect,
  onConvert,
  onDownload,
  onReset,
}: UploadModalProps) {
  if (!isOpen || !fileInfo) return null;

  const availableFormats = conversionRegistry.getTargets(fileInfo.ext);
  const quickFormats = (categoryQuickFormats[fileInfo.category] || [])
    .filter((fmt) => availableFormats.includes(fmt) && fmt !== fileInfo.ext);
  const moreFormats = availableFormats.filter(
    (fmt) => fmt !== fileInfo.ext && !quickFormats.includes(fmt)
  );

  const categoryColor = categoryColors[fileInfo.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30 animate-in fade-in-0 duration-200">
      <Card className={`max-w-2xl w-full shadow-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>
        <CardContent className="p-8 space-y-6">
          {/* Header with file info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${categoryColor.gradient} shadow-lg flex-shrink-0`}
              >
                <span className="text-3xl">{categoryIcons[fileInfo.category]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900 truncate">
                  {fileInfo.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {fileInfo.size} • {fileInfo.ext.toUpperCase()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="text-slate-400 hover:text-slate-600 h-8 w-8 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-3">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              100% Secure Online Conversion
            </span>
          </div>

          {/* Format selection */}
          {!isConverting && !isComplete && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Convert To
                </label>

                {/* Quick select pills */}
                {quickFormats.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {quickFormats.map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => onFormatSelect(fmt)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border-2 font-semibold text-sm uppercase tracking-wide transition-all duration-150 flex-1 min-w-[80px]",
                          targetFormat === fmt
                            ? `border-transparent bg-gradient-to-r ${categoryColor.gradient} text-white shadow-lg shadow-slate-300/30`
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md hover:bg-slate-50 active:scale-95"
                        )}
                      >
                        .{fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Format dropdown */}
                <FormatSelector
                  formats={availableFormats.filter((fmt) => fmt !== fileInfo.ext)}
                  selectedFormat={targetFormat}
                  onSelect={onFormatSelect}
                  disabled={false}
                  categoryColor={categoryColor.gradient}
                />
              </div>

              {/* Conversion direction preview */}
              {targetFormat && (
                <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white bg-gradient-to-br ${categoryColor.gradient}`}
                    >
                      {fileInfo.ext.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                      .{fileInfo.ext}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`h-0.5 w-4 rounded bg-gradient-to-r ${categoryColor.gradient} animate-pulse`}
                    />
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${categoryColor.gradient} shadow-md`}
                    >
                      <ArrowRight className="h-3 w-3 text-white" />
                    </div>
                    <span
                      className={`h-0.5 w-4 rounded bg-gradient-to-r ${categoryColor.gradient} animate-pulse`}
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white bg-gradient-to-br ${categoryColor.gradient}`}
                    >
                      {targetFormat.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                      .{targetFormat}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          {isConverting && (
            <div className="space-y-3 animate-in fade-in-0 duration-300">
              <ProgressBar value={progress} />
              <p className="text-center text-sm font-medium text-slate-600">
                Converting… {Math.round(Math.min(progress, 100))}%
              </p>
            </div>
          )}

          {/* Success message */}
          {isComplete && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-emerald-700">
                Conversion complete! Ready to download.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 font-semibold text-sm"
              onClick={onReset}
            >
              Cancel
            </Button>
            {!isComplete ? (
              <Button
                className={cn(
                  "flex-1 h-11 font-semibold text-sm text-white bg-gradient-to-r shadow-lg hover:shadow-xl transition-all duration-200",
                  targetFormat
                    ? `${categoryColor.gradient} hover:opacity-90 active:scale-95`
                    : "from-slate-300 to-slate-400 cursor-not-allowed opacity-50"
                )}
                onClick={onConvert}
                disabled={isConverting || !targetFormat}
              >
                {isConverting
                  ? "Converting…"
                  : targetFormat
                    ? `Convert to .${targetFormat.toUpperCase()}`
                    : "Select a format"}
              </Button>
            ) : (
              <Button
                className={cn(
                  "flex-1 h-11 font-semibold text-sm text-white bg-gradient-to-r shadow-lg hover:shadow-xl transition-all duration-200",
                  `${categoryColor.gradient} hover:opacity-90 active:scale-95`
                )}
                onClick={onDownload}
                disabled={!targetFormat}
              >
                <Download className="mr-2 h-4 w-4" />
                Download .{targetFormat.toUpperCase()}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
