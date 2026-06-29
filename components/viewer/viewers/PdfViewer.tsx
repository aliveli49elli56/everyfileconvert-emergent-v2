"use client";
import { useEffect, useRef, useState } from "react";

export default function PdfViewer({ file }: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const buf = await file.arrayBuffer();
        const pdf = await getDocument({ data: buf, disableFontFace: true }).promise;
        if (cancelled) return;
        setPages(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto w-full max-w-3xl border border-slate-100 shadow-sm block mb-4";
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (cancelled) return;
        }
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "PDF render failed");
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  return (
    <div className="p-4">
      {loading && !error && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      {!loading && pages > 20 && <p className="text-center text-xs text-slate-400 mb-2">Showing first 20 of {pages} pages</p>}
      <div ref={containerRef} />
    </div>
  );
}
