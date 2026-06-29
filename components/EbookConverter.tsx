"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, X, CircleCheck as CheckCircle2, BookOpen, TriangleAlert as AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  revokeObjectURL,
  createDownloadUrl,
  triggerFileDownload,
} from "@/lib/file-validation";
import { formatRegistry } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";

interface EbookConverterProps {
  defaultFrom?: string;
  defaultTo?: string;
}

const EBOOK_FORMATS = ["epub", "mobi", "azw3", "pdf", "txt", "html"] as const;
type EbookFormat = (typeof EBOOK_FORMATS)[number];

/** Return valid ebook→ebook conversion targets from the conversion registry. */
function getEbookTargets(from: EbookFormat): EbookFormat[] {
  return conversionRegistry.getTargets(from).filter(
    (ext): ext is EbookFormat => EBOOK_FORMATS.includes(ext as EbookFormat)
  );
}

const ACCEPTED_MIMES =
  ".epub,.mobi,.azw3,.azw,.pdf,.txt,.html,.htm";

function getDeviceLimits(): { maxBytes: number; maxLabel: string } {
  if (typeof navigator === "undefined") {
    return { maxBytes: 500 * 1024 * 1024, maxLabel: "500 MB" };
  }
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (navigator.maxTouchPoints > 1 && window.innerWidth < 768);
  return isMobile
    ? { maxBytes: 200 * 1024 * 1024, maxLabel: "200 MB" }
    : { maxBytes: 500 * 1024 * 1024, maxLabel: "500 MB" };
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " bytes";
}

function detectFormatFromFile(file: File): EbookFormat | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "azw" || ext === "azw3") return "azw3";
  if (ext === "htm") return "html";
  if (EBOOK_FORMATS.includes(ext as EbookFormat)) return ext as EbookFormat;
  return null;
}

async function convertEpubToText(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const texts: string[] = [];

  const opfEntry = Object.keys(zip.files).find(
    (name) => name.endsWith(".opf") || name === "content.opf"
  );

  if (opfEntry) {
    const opfContent = await zip.files[opfEntry].async("string");
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfContent, "application/xml");
    const idrefs = Array.from(opfDoc.querySelectorAll("spine itemref")).map(
      (el) => el.getAttribute("idref") || ""
    );
    const manifest: Record<string, string> = {};
    opfDoc.querySelectorAll("manifest item").forEach((el) => {
      manifest[el.getAttribute("id") || ""] = el.getAttribute("href") || "";
    });

    const basePath = opfEntry.includes("/")
      ? opfEntry.substring(0, opfEntry.lastIndexOf("/") + 1)
      : "";

    for (const idref of idrefs) {
      const href = manifest[idref];
      if (!href) continue;
      const fullPath = basePath + href;
      const entry = zip.files[fullPath] || zip.files[href];
      if (!entry) continue;
      const html = await entry.async("string");
      const doc = new DOMParser().parseFromString(html, "text/html");
      texts.push(doc.body.textContent || "");
    }
  } else {
    for (const [name, entry] of Object.entries(zip.files)) {
      if (
        (name.endsWith(".html") || name.endsWith(".xhtml")) &&
        !entry.dir
      ) {
        const html = await entry.async("string");
        const doc = new DOMParser().parseFromString(html, "text/html");
        texts.push(doc.body.textContent || "");
      }
    }
  }

  return texts.join("\n\n");
}

async function convertEpubToHtml(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const parts: string[] = [];

  const opfEntry = Object.keys(zip.files).find(
    (name) => name.endsWith(".opf") || name === "content.opf"
  );

  if (opfEntry) {
    const opfContent = await zip.files[opfEntry].async("string");
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfContent, "application/xml");
    const idrefs = Array.from(opfDoc.querySelectorAll("spine itemref")).map(
      (el) => el.getAttribute("idref") || ""
    );
    const manifest: Record<string, string> = {};
    opfDoc.querySelectorAll("manifest item").forEach((el) => {
      manifest[el.getAttribute("id") || ""] = el.getAttribute("href") || "";
    });
    const basePath = opfEntry.includes("/")
      ? opfEntry.substring(0, opfEntry.lastIndexOf("/") + 1)
      : "";

    for (const idref of idrefs) {
      const href = manifest[idref];
      if (!href) continue;
      const fullPath = basePath + href;
      const entry = zip.files[fullPath] || zip.files[href];
      if (!entry) continue;
      parts.push(await entry.async("string"));
    }
  } else {
    for (const [name, entry] of Object.entries(zip.files)) {
      if (
        (name.endsWith(".html") || name.endsWith(".xhtml")) &&
        !entry.dir
      ) {
        parts.push(await entry.async("string"));
      }
    }
  }

  const combined = parts.join("\n");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted eBook</title></head><body>${combined}</body></html>`;
}

async function textToPdfBlob(text: string): Promise<Blob> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const usableWidth = pageWidth - 2 * margin;
  const linesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);

  const words = text.replace(/\r\n/g, "\n").split("\n");
  const allLines: string[] = [];

  for (const paragraph of words) {
    if (!paragraph.trim()) {
      allLines.push("");
      continue;
    }
    const wordTokens = paragraph.split(" ");
    let currentLine = "";
    for (const word of wordTokens) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > usableWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) allLines.push(currentLine);
  }

  let lineIndex = 0;
  while (lineIndex < allLines.length) {
    const page = doc.addPage([pageWidth, pageHeight]);
    const chunk = allLines.slice(lineIndex, lineIndex + linesPerPage);
    chunk.forEach((line, i) => {
      page.drawText(line, {
        x: margin,
        y: pageHeight - margin - i * lineHeight,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
    lineIndex += linesPerPage;
  }

  const bytes = await doc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

async function performConversion(
  file: File,
  fromFormat: EbookFormat,
  toFormat: EbookFormat
): Promise<Blob> {
  if (toFormat === "txt") {
    if (fromFormat === "epub") {
      const text = await convertEpubToText(file);
      return new Blob([text], { type: "text/plain" });
    }
    if (fromFormat === "html") {
      const html = await file.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      return new Blob([doc.body.textContent || ""], { type: "text/plain" });
    }
    const text = await file.text();
    return new Blob([text], { type: "text/plain" });
  }

  if (toFormat === "html") {
    if (fromFormat === "epub") {
      const html = await convertEpubToHtml(file);
      return new Blob([html], { type: "text/html" });
    }
    if (fromFormat === "txt") {
      const text = await file.text();
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>\n");
      return new Blob(
        [
          `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted</title></head><body>${escaped}</body></html>`,
        ],
        { type: "text/html" }
      );
    }
    const raw = await file.text();
    return new Blob([raw], { type: "text/html" });
  }

  if (toFormat === "pdf") {
    if (fromFormat === "epub") {
      const text = await convertEpubToText(file);
      return textToPdfBlob(text);
    }
    if (fromFormat === "txt") {
      const text = await file.text();
      return textToPdfBlob(text);
    }
    if (fromFormat === "html") {
      const html = await file.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const text = doc.body.textContent || "";
      return textToPdfBlob(text);
    }
    const buf = await file.arrayBuffer();
    return new Blob([buf], { type: formatRegistry.get("pdf")?.mime ?? "application/pdf" });
  }

  if (toFormat === "epub") {
    if (fromFormat === "txt") {
      const text = await file.text();
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file("mimetype", "application/epub+zip");
      zip.file(
        "META-INF/container.xml",
        `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
      );
      const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><pre>${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre></body></html>`;
      zip.file("OEBPS/chapter1.xhtml", chapterHtml);
      zip.file(
        "OEBPS/content.opf",
        `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Converted eBook</dc:title><dc:language>en</dc:language></metadata><manifest><item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter1"/></spine></package>`
      );
      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/epub+zip",
      });
      return blob;
    }
  }

  // Fallback: copy as-is
  const buf = await file.arrayBuffer();
  return new Blob([buf], { type: formatRegistry.get(toFormat)?.mime ?? "application/octet-stream" });
}

export default function EbookConverter({
  defaultFrom = "epub",
  defaultTo = "pdf",
}: EbookConverterProps) {
  const [fromFormat, setFromFormat] = useState<EbookFormat>(
    (defaultFrom as EbookFormat) || "epub"
  );
  const [toFormat, setToFormat] = useState<EbookFormat>(
    (defaultTo as EbookFormat) || "pdf"
  );
  const [fileInfo, setFileInfo] = useState<{
    file: File;
    name: string;
    size: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTargets = getEbookTargets(fromFormat);

  useEffect(() => {
    if (!availableTargets.includes(toFormat)) {
      setToFormat(availableTargets[0] || "pdf");
    }
  }, [fromFormat]);

  useEffect(() => {
    return () => {
      if (downloadUrl) revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const processFile = useCallback((file: File) => {
    setLimitWarning(null);
    const { maxBytes, maxLabel } = getDeviceLimits();
    if (file.size > maxBytes) {
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      setLimitWarning(
        `Your file is ${fileMB} MB. The limit for your device is ${maxLabel}. Please upload a smaller file.`
      );
      return;
    }

    const detected = detectFormatFromFile(file);
    if (detected) {
      setFromFormat(detected);
      const targets = getEbookTargets(detected);
      if (!targets.includes(toFormat)) {
        setToFormat(targets[0] || "pdf");
      }
    }

    setFileInfo({ file, name: file.name, size: formatFileSize(file.size) });
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
  }, [toFormat]);

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
  };

  const handleConvert = async () => {
    if (!fileInfo) return;
    setIsConverting(true);
    setProgress(10);

    try {
      setProgress(30);
      const blob = await performConversion(fileInfo.file, fromFormat, toFormat);
      setProgress(90);
      const url = createDownloadUrl(blob);
      setDownloadUrl(url);
      setProgress(100);
      setIsComplete(true);
      toast.success("Conversion complete!");
    } catch (err) {
      toast.error("Conversion failed. Please try a different file or format.");
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !fileInfo) return;
    const baseName = fileInfo.name.replace(/\.[^.]+$/, "");
    triggerFileDownload(downloadUrl, `${baseName}.${toFormat}`);
  };

  const handleReset = () => {
    if (downloadUrl) revokeObjectURL(downloadUrl);
    setFileInfo(null);
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
    setLimitWarning(null);
  };

  return (
    <div className="relative z-10">
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <CardContent className="p-6 space-y-5">
          {/* Format selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                From
              </label>
              <div className="flex flex-wrap gap-2">
                {(["epub", "mobi", "azw3", "pdf", "txt", "html"] as EbookFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      onClick={() => {
                        setFromFormat(fmt);
                        const targets = getEbookTargets(fmt);
                        if (!targets.includes(toFormat))
                          setToFormat(targets[0] || "pdf");
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase transition-all ${
                        fromFormat === fmt
                          ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                To
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTargets.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setToFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase transition-all ${
                      toFormat === fmt
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion arrow indicator */}
          <div className="flex items-center justify-center gap-3 py-0.5">
            <Badge
              variant="outline"
              className="font-mono text-xs border-amber-200 text-amber-700 bg-amber-50"
            >
              .{fromFormat.toUpperCase()}
            </Badge>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <Badge
              variant="outline"
              className="font-mono text-xs border-amber-200 text-amber-700 bg-amber-50"
            >
              .{toFormat.toUpperCase()}
            </Badge>
          </div>

          {/* Limit warning */}
          {limitWarning && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{limitWarning}</p>
            </div>
          )}

          {/* Drop zone */}
          {!fileInfo ? (
            <div
              className={`relative z-10 flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
                isDragging
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/40"
              }`}
              style={{ minHeight: 180 }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">
                Drop your eBook here
              </p>
              <p className="text-sm text-slate-500 mb-2">
                or click to browse files
              </p>
              <p className="text-xs text-slate-400">
                EPUB, MOBI, AZW3, PDF, TXT, HTML
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 truncate max-w-[220px] text-sm">
                      {fileInfo.name}
                    </p>
                    <p className="text-xs text-slate-500">{fileInfo.size}</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isConverting && (
                <div className="space-y-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-slate-500">
                    Converting... {Math.round(Math.min(progress, 100))}%
                  </p>
                </div>
              )}

              {isComplete && (
                <div className="flex items-center justify-center gap-2 p-3.5 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium text-sm">
                    Conversion Complete!
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                {!isComplete ? (
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 text-sm"
                    onClick={handleConvert}
                    disabled={isConverting}
                  >
                    {isConverting
                      ? "Converting..."
                      : `Convert to ${toFormat.toUpperCase()}`}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 text-sm"
                    onClick={handleDownload}
                    disabled={!downloadUrl}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download .{toFormat.toUpperCase()}
                  </Button>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_MIMES}
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* AdSense safe zone */}
      {isComplete && (
        <div className="mt-12 mb-12 min-h-[250px] relative z-[1]">
          <div className="flex justify-center">
            <div
              id="ebook-converter-ad-slot"
              className="w-full max-w-[728px] min-h-[90px] flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl"
            >
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Advertisement
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
