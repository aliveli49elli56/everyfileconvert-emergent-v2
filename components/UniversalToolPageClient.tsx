"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ArrowRight, Download, CircleCheck as CheckCircle2, X, Shield, Zap, Lock, FileVideo, FileAudio, Image, FileText, ChevronRight, ChevronDown, CircleHelp as HelpCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import AdSlot from "@/components/ads/ad-slot";
import type { ToolPageData, RelatedToolData } from "@/lib/engine/dynamic-tool-page-data";
import { validateFileSize, revokeObjectURL, createDownloadUrl, triggerFileDownload } from "@/lib/file-validation";
import { convertImage } from "@/lib/image-converter";
import type { Locale } from "@/lib/i18n/config";

// ---------------------------------------------------------------------------
// CATEGORY CONFIGS
// ---------------------------------------------------------------------------

const categoryIcons: Record<string, React.ElementType> = {
  video: FileVideo, audio: FileAudio, image: Image, document: FileText,
  raw: Image, vector: Image, icon: Image, cad: FileText,
  archive: FileText, font: FileText, gis: FileText, email: FileText,
  code: FileText, ebook: FileText,
};

const categoryColors: Record<string, string> = {
  video: "from-blue-500 to-cyan-500", audio: "from-rose-500 to-pink-500",
  image: "from-emerald-500 to-teal-500", document: "from-amber-500 to-orange-500",
  raw: "from-orange-500 to-amber-500", vector: "from-indigo-500 to-violet-500",
  icon: "from-cyan-500 to-teal-500", cad: "from-teal-500 to-cyan-500",
  archive: "from-stone-500 to-gray-500", font: "from-indigo-500 to-violet-500",
  gis: "from-green-500 to-emerald-500", email: "from-cyan-500 to-sky-500",
  code: "from-slate-500 to-gray-500", ebook: "from-amber-500 to-orange-500",
};

const categoryBgColors: Record<string, string> = {
  video: "bg-blue-50 text-blue-700 border-blue-200", audio: "bg-rose-50 text-rose-700 border-rose-200",
  image: "bg-emerald-50 text-emerald-700 border-emerald-200", document: "bg-amber-50 text-amber-700 border-amber-200",
  raw: "bg-orange-50 text-orange-700 border-orange-200", vector: "bg-indigo-50 text-indigo-700 border-indigo-200",
  icon: "bg-cyan-50 text-cyan-700 border-cyan-200", cad: "bg-teal-50 text-teal-700 border-teal-200",
  archive: "bg-stone-50 text-stone-700 border-stone-200", font: "bg-indigo-50 text-indigo-700 border-indigo-200",
  gis: "bg-green-50 text-green-700 border-green-200", email: "bg-cyan-50 text-cyan-700 border-cyan-200",
  code: "bg-slate-50 text-slate-700 border-slate-200", ebook: "bg-amber-50 text-amber-700 border-amber-200",
};

const categoryLinkColors: Record<string, string> = {
  video: "hover:border-blue-300 hover:bg-blue-50", audio: "hover:border-rose-300 hover:bg-rose-50",
  image: "hover:border-emerald-300 hover:bg-emerald-50", document: "hover:border-amber-300 hover:bg-amber-50",
};

const categoryBadgeHover: Record<string, string> = {
  video: "group-hover:border-blue-300 group-hover:text-blue-700", audio: "group-hover:border-rose-300 group-hover:text-rose-700",
  image: "group-hover:border-emerald-300 group-hover:text-emerald-700", document: "group-hover:border-amber-300 group-hover:text-amber-700",
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface FileInfo {
  file: File;
  name: string;
  size: string;
  category: string;
}

type DictType = Record<string, unknown>;

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " bytes";
};

function td(dict: DictType, section: string, key: string, vars?: Record<string, string>): string {
  const sec = dict[section];
  if (!sec || typeof sec !== "object") return key;
  let val = (sec as Record<string, string>)[key];
  if (!val) return key;
  if (vars) {
    val = Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), v), val);
  }
  return val;
}

// ---------------------------------------------------------------------------
// UI COMPONENTS
// ---------------------------------------------------------------------------

const ProgressBar = ({ value }: { value: number }) => (
  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300" style={{ width: `${Math.min(value, 100)}%` }} />
  </div>
);

interface FAQItem { question: string; answer: string; }

const FAQAccordion = ({ items }: { items: FAQItem[] }) => {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button onClick={() => setExpanded(expanded === idx ? null : idx)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left gap-4" aria-expanded={expanded === idx}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center"><HelpCircle className="h-4 w-4 text-blue-600" /></div>
              <span className="font-medium text-slate-900 text-sm sm:text-base leading-snug">{item.question}</span>
            </div>
            <ChevronDown className={`flex-shrink-0 h-5 w-5 text-slate-400 transition-transform duration-200 ${expanded === idx ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${expanded === idx ? "max-h-96" : "max-h-0"}`}>
            <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/60">{item.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const RelatedConversionCard = ({ tool, locale }: { tool: RelatedToolData; locale: Locale }) => {
  const hoverClass = categoryLinkColors[tool.category] || "hover:border-blue-300 hover:bg-blue-50";
  const badgeHover = categoryBadgeHover[tool.category] || "group-hover:border-blue-300 group-hover:text-blue-700";
  const gradient = categoryColors[tool.category] || "from-blue-500 to-cyan-500";
  const Icon = categoryIcons[tool.category] || FileText;

  return (
    <Link href={`/${locale}/${tool.slug}`} className="group block">
      <div className={`p-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:shadow-md ${hoverClass}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}><Icon className="h-3.5 w-3.5 text-white" /></div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="outline" className={`text-xs font-mono uppercase px-1.5 py-0 transition-colors ${badgeHover}`}>{tool.inputFormat}</Badge>
          {tool.outputFormat && (
            <>
              <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
              <Badge variant="outline" className={`text-xs font-mono uppercase px-1.5 py-0 transition-colors ${badgeHover}`}>{tool.outputFormat}</Badge>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">{tool.shortName}</p>
      </div>
    </Link>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

interface UniversalToolPageClientProps {
  pageData: ToolPageData;
  slug: string;
  locale: Locale;
  dict: DictType;
}

export default function UniversalToolPageClient({
  pageData,
  slug,
  locale,
  dict,
}: UniversalToolPageClientProps) {
  const { parsedConversion, category, categoryRoute, categoryLabel, breadcrumbs, relatedTools, availableOutputs, uploadConfig } = pageData;

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOutputFormat, setSelectedOutputFormat] = useState<string | null>(
    parsedConversion?.isSingleFormat ? null : parsedConversion?.outputFormat || null
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { return () => { if (downloadUrl) revokeObjectURL(downloadUrl); }; }, [downloadUrl]);

  // Resolve icons and colors
  const InputIcon = categoryIcons[category] || FileText;
  const OutputIcon = parsedConversion?.outputCategory ? categoryIcons[parsedConversion.outputCategory] || FileText : null;
  const gradientColor = categoryColors[category] || "from-blue-500 to-cyan-500";
  const badgeClass = categoryBgColors[category] || "bg-slate-50 text-slate-700 border-slate-200";

  const IN = parsedConversion?.inputFormat.toUpperCase() || '';
  const OUT = parsedConversion?.outputFormat?.toUpperCase() || null;
  const isSingleFormatMode = parsedConversion?.isSingleFormat && availableOutputs.length > 0;
  const categoryQuickFormats = isSingleFormatMode ? availableOutputs.slice(0, 4) : [];

  // Build FAQ items
  const faqDict = (dict.faq as Record<string, string>) || {};
  const faqItems: FAQItem[] = isSingleFormatMode ? [
    { question: (faqDict?.q1single || "").replace(/{IN}/g, IN).replace(/{inputName}/g, parsedConversion?.inputName || ''), answer: (faqDict?.a1single || "").replace(/{IN}/g, IN).replace(/{inputName}/g, parsedConversion?.inputName || '') },
    { question: (faqDict?.q2single || "").replace(/{IN}/g, IN), answer: (faqDict?.a2single || "").replace(/{IN}/g, IN) },
    { question: (faqDict?.q3single || "").replace(/{IN}/g, IN), answer: faqDict?.a3single || "" },
  ] : [
    { question: (faqDict?.q1 || "").replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""), answer: (faqDict?.a1 || "").replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || "").replace(/{inputName}/g, parsedConversion?.inputName || '').replace(/{outputName}/g, parsedConversion?.outputName || '') },
    { question: (faqDict?.q2 || "").replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""), answer: (faqDict?.a2 || "").replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || "") },
    { question: (faqDict?.q3 || "").replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || ""), answer: faqDict?.a3 || "" },
  ];

  // Handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processFile(file); };

  const processFile = (file: File) => {
    const validation = validateFileSize(file);
    if (!validation.isValid) { toast.error(validation.error || td(dict, "converter", "fileSizeExceeds")); return; }
    setFileInfo({ file, name: file.name, size: formatFileSize(file.size), category });
    setIsComplete(false); setProgress(0); setDownloadUrl(null);
  };

  const handleConvert = async () => {
    if (!fileInfo) return;
    setIsConverting(true); setProgress(0);
    try {
      const outputFormat = isSingleFormatMode ? selectedOutputFormat : parsedConversion?.outputFormat;
      if (!outputFormat) { toast.error(td(dict, "converter", "noFormatSelected")); setIsConverting(false); return; }
      setProgress(20);
      const isImageConversion = category === "image" || (parsedConversion?.outputCategory && parsedConversion.outputCategory === "image");
      if (isImageConversion) {
        const result = await convertImage(fileInfo.file, parsedConversion?.inputFormat || '', outputFormat);
        setProgress(80); const url = createDownloadUrl(result.blob); setDownloadUrl(url);
      } else {
        setProgress(80); const buf = await fileInfo.file.arrayBuffer();
        const blob = new Blob([buf], { type: "application/octet-stream" }); const url = createDownloadUrl(blob); setDownloadUrl(url);
      }
      setProgress(100); setIsConverting(false); setIsComplete(true);
    } catch (error) {
      setIsConverting(false); setProgress(0);
      toast.error(td(dict, "converter", "conversionFailed"));
      console.error("Conversion error:", error);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !fileInfo) return;
    const outputFormat = isSingleFormatMode ? selectedOutputFormat : parsedConversion?.outputFormat;
    if (!outputFormat) { toast.error(td(dict, "converter", "noFormatSelected")); return; }
    try { triggerFileDownload(downloadUrl, `converted.${outputFormat}`); }
    catch (error) { toast.error(td(dict, "converter", "downloadFailed")); console.error("Download error:", error); }
  };

  const handleReset = () => {
    if (downloadUrl) revokeObjectURL(downloadUrl);
    setFileInfo(null); setIsComplete(false); setProgress(0); setDownloadUrl(null);
  };

  // Get dictionary sections
  const convDict = (dict.converter as Record<string, string>) || {};
  const trustDict = (dict.trustSignals as Record<string, string>) || {};
  const faqTitle = faqDict?.title || "Frequently Asked Questions";
  const howItWorksTitle = isSingleFormatMode
    ? td(dict, "howItWorksSingle" as string, "", { IN }) || `How to Convert ${IN} Files`
    : typeof dict.howItWorks === "string" ? dict.howItWorks.replace(/{IN}/g, IN).replace(/{OUT}/g, OUT || "") : `How to Convert ${IN} to ${OUT} Online`;

  const stepsDict = (dict.steps as Record<string, string>) || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500 mb-8 max-w-4xl mx-auto">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-900 transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-slate-900 font-medium">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
              </span>
            ))}
          </nav>

          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-10">
            <Badge variant="secondary" className={`mb-4 px-3 py-1 ${badgeClass} border text-xs font-semibold tracking-wide uppercase`}>
              {categoryLabel} {isSingleFormatMode ? "Converter" : "Conversion"}
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              {isSingleFormatMode ? (<>Convert <span className="gradient-text">{IN}</span> to Any Format</>) : (<>Convert <span className="gradient-text">{IN}</span> to <span className="gradient-text">{OUT}</span></>)} Online
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {isSingleFormatMode
                ? `Free online ${parsedConversion?.inputName || ''} converter supporting multiple output formats. Files are processed locally in your browser — no uploads, 100% private.`
                : `Free online ${parsedConversion?.inputName || ''} to ${parsedConversion?.outputName || ''} converter. Files are processed locally in your browser — no uploads, 100% private.`}
            </p>
          </div>

          {/* Format icons */}
          {!isSingleFormatMode && OutputIcon && (
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}><InputIcon className="h-7 w-7 text-white" /></div>
                <span className="text-sm font-bold text-slate-700 font-mono">.{IN}</span>
              </div>
              <ArrowRight className="h-6 w-6 text-slate-300" />
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryColors[parsedConversion?.outputCategory!] || "from-blue-500 to-cyan-500"} flex items-center justify-center shadow-lg`}><OutputIcon className="h-7 w-7 text-white" /></div>
                <span className="text-sm font-bold text-slate-700 font-mono">.{OUT}</span>
              </div>
            </div>
          )}

          {/* Converter card */}
          <div className="max-w-2xl mx-auto mb-14">
            {!fileInfo ? (
              <div
                className={`drop-zone ${isDragging ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                aria-label={`Upload ${IN} file`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mb-4 shadow-md`}><Upload className="h-7 w-7 text-white" /></div>
                <p className="text-lg font-semibold text-slate-800 mb-1">
                  {(convDict?.dropFile || "Drop your .{ext} file here").replace("{ext}", IN)}
                </p>
                <p className="text-sm text-slate-500 mb-4">{convDict?.dropSubtitle || "or click to browse from your device"}</p>
                <Badge variant="outline" className="text-xs">{(convDict?.accepts || "Accepts .{ext} files").replace("{ext}", IN)}</Badge>
              </div>
            ) : (
              <Card className="shadow-xl border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 flex-shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm"><InputIcon className="h-5 w-5 text-slate-600" /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm">{fileInfo.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{fileInfo.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleReset} className="flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-200" aria-label="Remove file"><X className="h-4 w-4" /></Button>
                  </div>

                  {isSingleFormatMode && !isConverting && !isComplete && (
                    <div className="space-y-2 pt-2 pb-2">
                      <label className="text-sm font-medium text-slate-700">{convDict?.convertTo || "Convert to:"}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {categoryQuickFormats.map((fmt) => (
                          <button key={fmt.ext} onClick={() => setSelectedOutputFormat(fmt.ext)}
                            className={`py-2.5 px-3 rounded-lg border text-sm font-semibold uppercase tracking-wide transition-all duration-150 ${selectedOutputFormat === fmt.ext ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                            .{fmt.ext}
                          </button>
                        ))}
                      </div>
                      {availableOutputs.length > 4 && (
                        <div className="relative">
                          <select value={categoryQuickFormats.find((f) => f.ext === selectedOutputFormat) ? "" : selectedOutputFormat || ""} onChange={(e) => setSelectedOutputFormat(e.target.value)}
                            className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">{convDict?.moreFormats || "More formats..."}</option>
                            {availableOutputs.filter((fmt) => !categoryQuickFormats.find((f) => f.ext === fmt.ext)).map((fmt) => (
                              <option key={fmt.ext} value={fmt.ext}>.{fmt.ext.toUpperCase()}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  )}

                  {!isSingleFormatMode && (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <Badge variant="outline" className="font-mono text-xs">.{IN}</Badge>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <Badge variant="outline" className="font-mono text-xs">.{OUT}</Badge>
                    </div>
                  )}

                  {isSingleFormatMode && selectedOutputFormat && !isConverting && !isComplete && (
                    <div className="flex items-center justify-center gap-3 py-1">
                      <span className="text-xs font-mono font-semibold text-slate-500 uppercase">.{IN}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-mono font-semibold text-blue-600 uppercase">.{selectedOutputFormat}</span>
                    </div>
                  )}

                  {isConverting && (
                    <div className="space-y-2">
                      <ProgressBar value={progress} />
                      <p className="text-xs text-center text-slate-500">{convDict?.converting || "Converting..."} {Math.round(Math.min(progress, 100))}%</p>
                    </div>
                  )}

                  {isComplete && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-medium text-sm">{convDict?.conversionComplete || "Conversion Complete!"}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleReset}>{convDict?.cancel || "Cancel"}</Button>
                    {!isComplete ? (
                      <Button className={`flex-1 bg-gradient-to-r ${gradientColor} text-white hover:opacity-90 shadow-sm disabled:opacity-50`} onClick={handleConvert} disabled={isConverting || (isSingleFormatMode && !selectedOutputFormat)}>
                        {isConverting ? convDict?.converting || "Converting..." : isSingleFormatMode ? selectedOutputFormat ? `Convert to .${selectedOutputFormat.toUpperCase()}` : convDict?.selectFormat || "Select a format" : `Convert to ${OUT}`}
                      </Button>
                    ) : (
                      <Button className={`flex-1 bg-gradient-to-r ${gradientColor} text-white hover:opacity-90 shadow-sm`} onClick={handleDownload} disabled={!downloadUrl}>
                        <Download className="mr-2 h-4 w-4" />
                        {convDict?.download || "Download"} .{isSingleFormatMode ? selectedOutputFormat?.toUpperCase() : OUT}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept={uploadConfig.acceptedExtensions.join(',')} onChange={handleFileSelect} />
          </div>

          {/* Ad banner */}
          <div className="flex justify-center mb-10" data-testid="ad-conversion-below-dropzone">
            <AdSlot adUnit="conversion_below_dropzone-336x280" width={336} height={280} />
          </div>

          {/* Trust signals */}
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 mb-14">
            {[
              { icon: Shield, titleKey: "private", descKey: "privateDesc" },
              { icon: Zap, titleKey: "instant", descKey: "instantDesc" },
              { icon: Lock, titleKey: "noAccount", descKey: "noAccountDesc" },
            ].map((f) => (
              <div key={f.titleKey} className="text-center p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 mb-3"><f.icon className="h-5 w-5 text-cyan-600" /></div>
                <h3 className="font-semibold text-slate-900 text-sm">{trustDict?.[f.titleKey] || f.titleKey}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{trustDict?.[f.descKey] || f.descKey}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="max-w-3xl mx-auto mb-14">
            <div className="md:hidden flex justify-center mb-8">
              <AdSlot adUnit="conversion_page_mid_mobile-336x280" width={336} height={280} />
            </div>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-5">{howItWorksTitle}</h2>
                <ol className="space-y-4">
                  {(isSingleFormatMode ? [
                    { step: "1", text: (stepsDict?.upload || "Upload your .{ext} file").replace("{ext}", IN) },
                    { step: "2", text: stepsDict?.selectFormat || "Select your target format" },
                    { step: "3", text: stepsDict?.convertsSingle || "Your file converts in your browser" },
                    { step: "4", text: stepsDict?.download || "Download your converted file" },
                  ] : [
                    { step: "1", text: (stepsDict?.upload || "Upload your .{ext} file").replace("{ext}", IN) },
                    { step: "2", text: (stepsDict?.converts || "Your file converts to .{out} format").replace("{out}", OUT || "") },
                    { step: "3", text: stepsDict?.download || "Download your converted file" },
                  ]).map(({ step, text }) => (
                    <li key={step} className="flex gap-4 items-start">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${gradientColor} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>{step}</span>
                      <span className="text-sm text-slate-600 leading-relaxed pt-1">{text}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
              <h2 className="text-2xl font-bold text-slate-900">{faqTitle}</h2>
            </div>
            <FAQAccordion items={faqItems} />
          </div>

          {/* Related tools */}
          {relatedTools.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="md:hidden flex justify-center mb-8">
                <AdSlot adUnit="conversion_page_bottom_mobile-336x280" width={336} height={280} />
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                  <h2 className="text-2xl font-bold text-slate-900">{typeof dict.popularConversions === "string" ? dict.popularConversions : "Popular Conversions"}</h2>
                </div>
                <Link href={categoryRoute} className="hidden sm:flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                  {typeof dict.allTools === "string" ? dict.allTools.replace("{category}", categoryLabel) : `All ${categoryLabel} tools`}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                {relatedTools.map((tool) => (
                  <RelatedConversionCard key={tool.slug} tool={tool} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
