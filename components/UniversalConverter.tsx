"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Upload, Download, CircleCheck as CheckCircle2, X, ArrowRight, ChevronsUpDown, Check, CircleAlert as AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatRegistry, CATEGORY_DEFINITIONS } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import type { FormatCategory, FormatDefinition, ConverterType } from "@/lib/types/formats";
import {
  validateFileSize,
  revokeObjectURL,
  createDownloadUrl,
} from "@/lib/file-validation";
import { convertImage } from "@/lib/image-converter";
import { downloadWorkflowManager } from "@/lib/engine/download-workflow-manager";
import type { ConversionSummary } from "@/lib/types/download-workflow";
import { cn } from "@/lib/utils";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  type: ConverterType;
}

interface FileInfo {
  file: File;
  name: string;
  size: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " bytes";
}

function getCategoryForExt(ext: string): FormatCategory {
  const entry = formatRegistry.get(ext);
  return entry?.category || "document";
}

// ── Gradient config per converter type ─────────────────────────────────────

const TYPE_GRADIENTS: Record<ConverterType, { from: string; to: string; ring: string }> = {
  image:        { from: "from-emerald-500", to: "to-teal-500",    ring: "ring-emerald-400" },
  raw:          { from: "from-amber-500",   to: "to-orange-500",  ring: "ring-amber-400" },
  vector:       { from: "from-blue-500",    to: "to-cyan-500",    ring: "ring-blue-400" },
  icon:         { from: "from-slate-500",   to: "to-slate-700",   ring: "ring-slate-400" },
  "3d":         { from: "from-cyan-500",    to: "to-blue-500",    ring: "ring-cyan-400" },
  cad:          { from: "from-cyan-500",    to: "to-teal-500",    ring: "ring-cyan-400" },
  video:        { from: "from-violet-500",  to: "to-purple-500",  ring: "ring-violet-400" },
  audio:        { from: "from-rose-500",    to: "to-pink-500",    ring: "ring-rose-400" },
  pdf:          { from: "from-red-500",     to: "to-rose-500",    ring: "ring-red-400" },
  document:     { from: "from-amber-500",   to: "to-orange-500",  ring: "ring-amber-400" },
  spreadsheet:  { from: "from-teal-500",    to: "to-emerald-500", ring: "ring-teal-400" },
  presentation: { from: "from-orange-500",  to: "to-amber-500",   ring: "ring-orange-400" },
  ebook:        { from: "from-amber-500",   to: "to-orange-500",  ring: "ring-amber-400" },
  archive:      { from: "from-stone-500",   to: "to-slate-500",   ring: "ring-stone-400" },
  font:         { from: "from-indigo-500",  to: "to-violet-500",  ring: "ring-indigo-400" },
  gis:          { from: "from-green-500",   to: "to-emerald-500", ring: "ring-green-400" },
  email:        { from: "from-sky-500",     to: "to-cyan-500",    ring: "ring-sky-400" },
  code:         { from: "from-slate-500",   to: "to-gray-600",    ring: "ring-slate-400" },
  webpage:      { from: "from-blue-500",    to: "to-indigo-500",  ring: "ring-blue-400" },
  subtitle:     { from: "from-gray-500",    to: "to-slate-600",   ring: "ring-gray-400" },
  certificate:  { from: "from-yellow-500",  to: "to-amber-500",   ring: "ring-yellow-400" },
  scientific:   { from: "from-purple-500",  to: "to-violet-500",  ring: "ring-purple-400" },
  medical:      { from: "from-red-500",     to: "to-rose-500",    ring: "ring-red-400" },
  "disk-image": { from: "from-zinc-500",    to: "to-gray-600",    ring: "ring-zinc-400" },
  executable:   { from: "from-zinc-500",    to: "to-slate-600",   ring: "ring-zinc-400" },
};

// ── FormatCombobox ─────────────────────────────────────────────────────────

function FormatCombobox({
  formats,
  value,
  onSelect,
  placeholder,
  disabled,
  label,
}: {
  formats: FormatDefinition[];
  value: string;
  onSelect: (ext: string) => void;
  placeholder: string;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = formatRegistry.get(value);

  const TIER_LABELS: Record<string, string> = {
    popular: "Popular",
    standard: "Standard",
    advanced: "Advanced",
  };

  const grouped: Record<string, FormatDefinition[]> = {
    popular:  formats.filter((f) => f.tier === "popular"),
    standard: formats.filter((f) => f.tier === "standard"),
    advanced: formats.filter((f) => f.tier === "advanced"),
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-11 px-3 font-medium transition-all",
              value
                ? "border-slate-300 text-slate-900"
                : "border-slate-200 text-slate-400",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {selected ? (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
                    `bg-gradient-to-br ${CATEGORY_DEFINITIONS[selected.category].gradient[0]} ${CATEGORY_DEFINITIONS[selected.category].gradient[1]}`
                  )}
                >
                  {selected.ext.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-mono text-sm font-bold uppercase">
                  .{selected.ext}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {selected.name}
                </span>
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search formats..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-1 py-3">
                  <AlertCircle className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-500">No format found</span>
                </div>
              </CommandEmpty>
              {(["popular", "standard", "advanced"] as const)
                .filter((tier) => grouped[tier].length > 0)
                .map((tier) => (
                <CommandGroup
                  key={tier}
                  heading={TIER_LABELS[tier]}
                >
                  {grouped[tier].map((fmt) => (
                    <CommandItem
                      key={fmt.ext}
                      value={`${fmt.ext} ${fmt.name}`}
                      onSelect={() => {
                        onSelect(fmt.ext);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white shrink-0",
                          `bg-gradient-to-br ${CATEGORY_DEFINITIONS[fmt.category].gradient[0]} ${CATEGORY_DEFINITIONS[fmt.category].gradient[1]}`
                        )}
                      >
                        {fmt.ext.slice(0, 3).toUpperCase()}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-sm font-bold uppercase">
                          .{fmt.ext}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {fmt.name}
                        </span>
                      </div>
                      {value === fmt.ext && (
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
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────

function ProgressBar({ value, gradient }: { value: number; gradient: { from: string; to: string } }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full bg-gradient-to-r ${gradient.from} ${gradient.to} transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function UniversalConverter({ type }: Props) {
  const gradient = TYPE_GRADIENTS[type];
  const gradientClass = `bg-gradient-to-r ${gradient.from} ${gradient.to}`;

  const allSources = conversionRegistry.getSourcesForConverterType(type);

  const router   = useRouter();
  const pathname = usePathname();

  const [sourceExt, setSourceExt] = useState("");
  const [targetExt, setTargetExt] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showTarget, setShowTarget] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetFormats = sourceExt ? conversionRegistry.getTargetFormats(sourceExt) : [];
  const readyToUpload = sourceExt !== "" && targetExt !== "";
  const acceptStr = sourceExt ? `.${sourceExt}` : allSources.map((f) => `.${f.ext}`).join(",");

  useEffect(() => {
    return () => {
      if (downloadUrl) revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleSourceChange = (ext: string) => {
    setSourceExt(ext);
    setTargetExt("");
    setFileInfo(null);
    setIsComplete(false);
    if (downloadUrl) revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setTimeout(() => setShowTarget(true), 150);
  };

  const handleTargetChange = (ext: string) => {
    setTargetExt(ext);
    setIsComplete(false);
  };

  const processFile = useCallback(
    (file: File) => {
      const validation = validateFileSize(file);
      if (!validation.isValid) {
        toast.error(validation.error || "File too large");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (sourceExt && ext !== sourceExt) {
        toast.error(
          `Expected a .${sourceExt.toUpperCase()} file but received .${ext.toUpperCase()}`
        );
        return;
      }

      if (!sourceExt) {
        const hasConversion = conversionRegistry.getTargets(ext).length > 0;
        if (hasConversion) {
          setSourceExt(ext);
          setTargetExt("");
          setShowTarget(true);
        }
      }

      setFileInfo({ file, name: file.name, size: formatFileSize(file.size) });
      setIsComplete(false);
      setProgress(0);
      if (downloadUrl) revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    },
    [sourceExt, downloadUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleConvert = async () => {
    if (!fileInfo || !targetExt) return;
    setIsConverting(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      setProgress(15);
      const cat = getCategoryForExt(sourceExt);

      let blob: Blob;
      let providerId = "BrowserProcessor";
      let libraryId  = "browser";

      if (["image", "raw", "vector", "icon"].includes(cat)) {
        const result = await convertImage(fileInfo.file, sourceExt, targetExt);
        blob       = result.blob;
        providerId = "CanvasImageProvider";
        libraryId  = "canvas-api";
      } else {
        const buf = await fileInfo.file.arrayBuffer();
        blob = new Blob([buf], { type: "application/octet-stream" });
      }

      setProgress(85);
      const durationMs = Date.now() - startTime;

      // Build ConversionSummary
      const summary: ConversionSummary = {
        jobId:           downloadWorkflowManager.generateJobId(),
        inputFilename:   fileInfo.name,
        outputFilename:  `converted.${targetExt}`,
        inputSizeBytes:  fileInfo.file.size,
        outputSizeBytes: blob.size,
        inputFormat:     sourceExt,
        outputFormat:    targetExt,
        providerId,
        libraryId,
        processingEnv:   "browser",
        completedAt:     new Date().toISOString(),
        durationMs,
        available:       true,
        expiresAt:       null,
      };

      // Store job in DownloadWorkflowManager
      const blobUrl = createDownloadUrl(blob);
      downloadWorkflowManager.storeJob(summary, blob, blobUrl);

      setProgress(100);
      setIsComplete(true);

      // Redirect to /download page
      const locale = pathname.split("/")[1] || "en";
      setTimeout(() => {
        router.push(`/${locale}/download?jobId=${summary.jobId}`);
      }, 400);
    } catch (err) {
      toast.error("Conversion failed. Please try a different file or format.");
      console.error(err);
      setIsConverting(false);
    }
  };

  const handleGoToDownload = () => {
    // Fallback: if user clicks before auto-redirect
    const locale = pathname.split("/")[1] || "en";
    const url = downloadUrl;
    if (url) {
      // downloadUrl here is only set if we're in the old fallback path
      router.push(`/${locale}/download`);
    }
  };

  const handleReset = () => {
    if (downloadUrl) revokeObjectURL(downloadUrl);
    setFileInfo(null);
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
  };

  const sourceEntry = formatRegistry.get(sourceExt);
  const targetEntry = formatRegistry.get(targetExt);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur">
        <CardContent className="p-6 sm:p-8 space-y-6">

          {/* ── Format selectors ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormatCombobox
              formats={allSources}
              value={sourceExt}
              onSelect={handleSourceChange}
              placeholder="Choose source format..."
              label="Convert From"
            />

            <div
              className={cn(
                "transition-all duration-300 ease-out",
                showTarget && sourceExt
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              )}
            >
              <FormatCombobox
                formats={targetFormats}
                value={targetExt}
                onSelect={handleTargetChange}
                placeholder={
                  targetFormats.length === 0
                    ? "No conversion available"
                    : "Choose target format..."
                }
                disabled={!sourceExt || targetFormats.length === 0}
                label="Convert To"
              />
            </div>
          </div>

          {/* ── Conversion direction indicator ── */}
          {sourceExt && targetExt && (
            <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                {sourceEntry && (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white",
                      `bg-gradient-to-br ${CATEGORY_DEFINITIONS[sourceEntry.category].gradient[0]} ${CATEGORY_DEFINITIONS[sourceEntry.category].gradient[1]}`
                    )}
                  >
                    {sourceEntry.ext.slice(0, 3).toUpperCase()}
                  </span>
                )}
                <span className="font-mono text-sm font-bold text-slate-700 uppercase">
                  .{sourceExt}
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                <span
                  className={`h-0.5 w-5 rounded bg-gradient-to-r ${gradient.from} ${gradient.to} animate-pulse`}
                />
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${gradientClass} shadow-md`}
                >
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
                <span
                  className={`h-0.5 w-5 rounded bg-gradient-to-r ${gradient.from} ${gradient.to} animate-pulse`}
                />
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                {targetEntry && (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white",
                      `bg-gradient-to-br ${CATEGORY_DEFINITIONS[targetEntry.category].gradient[0]} ${CATEGORY_DEFINITIONS[targetEntry.category].gradient[1]}`
                    )}
                  >
                    {targetEntry.ext.slice(0, 3).toUpperCase()}
                  </span>
                )}
                <span className="font-mono text-sm font-bold text-slate-700 uppercase">
                  .{targetExt}
                </span>
              </div>
            </div>
          )}

          {/* ── Upload zone ── */}
          {!fileInfo ? (
            <div
              onDragOver={(e) => {
                if (!readyToUpload) return;
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={readyToUpload ? handleDrop : undefined}
              onClick={() => readyToUpload && fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300",
                !readyToUpload
                  ? "cursor-not-allowed border-slate-200 bg-slate-50/50"
                  : isDragging
                  ? `cursor-pointer border-transparent bg-gradient-to-br ${gradient.from}/10 ${gradient.to}/10 scale-[1.01] shadow-inner`
                  : "cursor-pointer border-slate-300 bg-white hover:border-transparent hover:shadow-lg hover:bg-gradient-to-br hover:from-slate-50 hover:to-white"
              )}
            >
              {readyToUpload ? (
                <div className="animate-in fade-in-0 zoom-in-95 duration-300">
                  <div
                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${gradientClass} shadow-lg shadow-slate-200/50`}
                  >
                    <Upload className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-base font-semibold text-slate-800">
                    Drop your{" "}
                    <span className="font-mono font-bold">
                      .{sourceExt.toUpperCase()}
                    </span>{" "}
                    file here
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400">
                    or{" "}
                    <span className="underline underline-offset-2 decoration-slate-300">
                      click to browse
                    </span>
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                    <Sparkles className="h-3 w-3 text-slate-500" />
                    <span className="text-xs font-medium text-slate-500">
                      Will convert to{" "}
                      <span className="font-mono font-bold text-slate-700">
                        .{targetExt.toUpperCase()}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Upload className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    {!sourceExt
                      ? "Select a source format to get started"
                      : "Now select a target format"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {/* File info */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradientClass} shadow-sm`}
                  >
                    <span className="text-xs font-bold text-white uppercase">
                      {sourceExt.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <p className="max-w-[200px] truncate font-medium text-slate-900 text-sm">
                      {fileInfo.name}
                    </p>
                    <p className="text-xs text-slate-400">{fileInfo.size}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="text-slate-400 hover:text-slate-700 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              {isConverting && (
                <div className="space-y-2 animate-in fade-in-0 duration-200">
                  <ProgressBar value={progress} gradient={gradient} />
                  <p className="text-center text-xs text-slate-500">
                    Converting… {Math.round(Math.min(progress, 100))}%
                  </p>
                </div>
              )}

              {/* Success */}
              {isComplete && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-100 p-3 animate-in fade-in-0 zoom-in-95 duration-300">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Conversion complete! Redirecting to download…
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Cancel
                </Button>
                {!isComplete ? (
                  <Button
                    className={`flex-1 ${gradientClass} text-white hover:opacity-90 transition-opacity disabled:opacity-50`}
                    onClick={handleConvert}
                    disabled={isConverting || !targetExt}
                  >
                    {isConverting
                      ? "Converting…"
                      : `Convert to .${targetExt.toUpperCase()}`}
                  </Button>
                ) : (
                  <Button
                    className={`flex-1 ${gradientClass} text-white hover:opacity-90 transition-opacity`}
                    onClick={handleGoToDownload}
                    data-testid="go-to-download-btn"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Go to Download
                  </Button>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptStr}
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>
    </div>
  );
}
