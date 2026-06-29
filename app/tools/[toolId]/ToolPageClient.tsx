"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Upload, X, Cpu, Loader as Loader2, Clock, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type ToolDefinition,
  type ControlDef,
  ENGINE_LABELS,
  getToolById,
} from "@/lib/tools/registry";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

// ── TimeRange control ─────────────────────────────────────────────────────

function TimeRangeControl({
  accentClass,
}: {
  accentClass: string;
}) {
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:00");
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Trim Range
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Start Time</Label>
          <Input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="HH:MM:SS"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">End Time</Label>
          <Input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="HH:MM:SS"
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ── PageRange control ─────────────────────────────────────────────────────

function PageRangeControl({ label }: { label: string }) {
  const [value, setValue] = useState("1-3");
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 1-3, 5, 7-9"
        className="font-mono text-sm"
      />
      <p className="text-xs text-slate-400">Use commas and hyphens: 1-3, 5, 7-9</p>
    </div>
  );
}

// ── Dynamic Control Renderer ──────────────────────────────────────────────

function ControlRenderer({
  control,
  accentClass,
}: {
  control: ControlDef;
  accentClass: string;
}) {
  const [sliderValue, setSliderValue] = useState(
    control.type === "slider" ? [control.defaultValue] : [0]
  );
  const [selectValue, setSelectValue] = useState(
    control.type === "select" ? control.defaultValue : ""
  );
  const [toggleValue, setToggleValue] = useState(
    control.type === "toggle" ? control.defaultValue : false
  );
  const [anglesValue, setAnglesValue] = useState(
    control.type === "angles" ? control.defaultValue : ""
  );
  const [textValue, setTextValue] = useState("");

  if (control.type === "slider") {
    const display = control.formatValue
      ? control.formatValue(sliderValue[0])
      : `${sliderValue[0]}${control.unit ?? ""}`;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {control.label}
          </Label>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {display}
          </span>
        </div>
        <Slider
          min={control.min}
          max={control.max}
          step={control.step}
          value={sliderValue}
          onValueChange={setSliderValue}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{control.min}{control.unit ?? ""}</span>
          <span>{control.max}{control.unit ?? ""}</span>
        </div>
      </div>
    );
  }

  if (control.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {control.label}
        </Label>
        <Select value={selectValue} onValueChange={setSelectValue}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {control.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (control.type === "toggle") {
    return (
      <div className="flex items-center justify-between py-1">
        <Label className="text-sm font-medium text-slate-700">
          {control.label}
        </Label>
        <Switch checked={toggleValue} onCheckedChange={setToggleValue} />
      </div>
    );
  }

  if (control.type === "angles") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {control.label}
        </Label>
        <div className="flex gap-2 flex-wrap">
          {control.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAnglesValue(opt.value)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                anglesValue === opt.value
                  ? "border-transparent bg-gradient-to-br text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
              style={
                anglesValue === opt.value
                  ? { backgroundImage: "var(--tool-gradient)" }
                  : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (control.type === "time-range") {
    return <TimeRangeControl accentClass={accentClass} />;
  }

  if (control.type === "page-range") {
    return <PageRangeControl label={control.label} />;
  }

  if (control.type === "text") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {control.label}
        </Label>
        <Input
          type={control.inputType ?? "text"}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder={control.placeholder}
          className="text-sm"
        />
      </div>
    );
  }

  return null;
}

// ── Dropzone ──────────────────────────────────────────────────────────────

function Dropzone({
  tool,
  icon: ToolIcon,
  files,
  onFiles,
  isDragging,
  setIsDragging,
}: {
  tool: ToolDefinition;
  icon: React.ElementType;
  files: File[];
  onFiles: (files: File[]) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (!tool.multiFile && dropped.length > 1) {
        toast.error("This tool accepts one file at a time.");
        onFiles([dropped[0]]);
        return;
      }
      onFiles(dropped);
    },
    [tool.multiFile, onFiles, setIsDragging]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    onFiles(tool.multiFile ? selected : selected.slice(0, 1));
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-all duration-300",
        isDragging
          ? "border-transparent scale-[1.01] shadow-inner bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
      )}
      style={
        isDragging
          ? { background: "linear-gradient(135deg, var(--tw-gradient-stops))" }
          : undefined
      }
    >
      <div
        className={cn(
          "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-slate-200/50 transition-transform",
          isDragging && "scale-110",
          tool.gradient
        )}
      >
        <ToolIcon className="h-7 w-7 text-white" />
      </div>

      <p className="text-base font-semibold text-slate-800">
        {tool.multiFile ? "Drop files here" : `Drop your ${tool.category} file here`}
      </p>
      <p className="mt-1.5 text-sm text-slate-400">
        or{" "}
        <span className="underline underline-offset-2 decoration-slate-300">
          click to browse
        </span>
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
        <FileQuestion className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-500">{tool.acceptLabel}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={tool.accept}
        multiple={tool.multiFile}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

// ── File List ─────────────────────────────────────────────────────────────

function FileList({
  files,
  tool,
  onRemove,
}: {
  files: File[];
  tool: ToolDefinition;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white",
                tool.gradient
              )}
            >
              {file.name.split(".").pop()?.toUpperCase().slice(0, 3)}
            </div>
            <div className="min-w-0">
              <p className="max-w-[200px] truncate text-sm font-medium text-slate-800">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            onClick={() => onRemove(i)}
            className="ml-2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {tool.multiFile && (
        <p className="text-center text-xs text-slate-400 pt-1">
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function ToolPageClient({ toolId }: { toolId: string }) {
  // All data comes from the registry — no serialization across server/client boundary
  const tool = getToolById(toolId);
  const Icon = tool?.icon ?? Upload;

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => (tool?.multiFile ? [...prev, ...incoming] : incoming));
  }, [tool?.multiFile]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    // Engine will be wired here in next phase
    setTimeout(() => {
      setIsProcessing(false);
      toast.info("Engine initializing — processing will be wired in the next phase.");
    }, 1800);
  };

  const hasFiles = files.length > 0;

  if (!tool) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <Link
            href={tool.parentPath}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {tool.parentLabel}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* ── Tool Header ── */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-slate-200/50",
                tool.gradient
              )}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 font-mono border-slate-200 text-slate-500"
                >
                  <Cpu className="h-3 w-3 mr-1" />
                  {ENGINE_LABELS[tool.engine]}
                </Badge>
              </div>
              <p className="mt-1.5 text-slate-500 text-sm sm:text-base max-w-2xl">
                {tool.longDesc}
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Controls panel ── */}
          {tool.controls.length > 0 && (
            <Card className="lg:col-span-2 border-slate-200 h-fit shadow-sm">
              <CardContent className="p-5 space-y-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Settings
                </p>
                {tool.controls.map((ctrl) => (
                  <ControlRenderer
                    key={ctrl.id}
                    control={ctrl}
                    accentClass={tool.accentColor}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Drop + file area ── */}
          <div
            id="tool-dropzone"
            className={cn(
              "space-y-4",
              tool.controls.length > 0 ? "lg:col-span-3" : "lg:col-span-5"
            )}
          >
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Drop zone */}
                <Dropzone
                  tool={tool}
                  icon={Icon}
                  files={files}
                  onFiles={handleFiles}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                />

                {/* File list */}
                {hasFiles && (
                  <FileList files={files} tool={tool} onRemove={removeFile} />
                )}

                {/* Action */}
                <div className="flex gap-3">
                  {hasFiles && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setFiles([])}
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    className={cn(
                      "flex-1 text-white transition-opacity",
                      `bg-gradient-to-r ${tool.gradient}`,
                      !hasFiles && "opacity-40 cursor-not-allowed"
                    )}
                    disabled={!hasFiles || isProcessing}
                    onClick={handleProcess}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      `Run ${tool.name}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Engine status notice */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
              <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-700">
                  Engine: {ENGINE_LABELS[tool.engine]}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {tool.engine === "ffmpeg"
                    ? "FFmpeg.wasm will be loaded on first use. The processing engine is being wired up in the next phase."
                    : tool.engine === "canvas"
                    ? "Canvas API processing will be connected in the next phase."
                    : tool.engine === "web-audio"
                    ? "Web Audio API processing will be connected in the next phase."
                    : "pdf-lib processing will be connected in the next phase."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
