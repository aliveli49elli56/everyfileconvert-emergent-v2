"use client";
import { useEffect, useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

export default function CadViewer({ file }: { file: File }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const text = await file.text();
        // Dynamic import: avoids SSR issues, loads only when needed
        const dxfModule = await import("dxf");
        const Helper = (dxfModule as any).Helper ?? (dxfModule as any).default?.Helper;
        if (!Helper) throw new Error("DXF Helper not found in package");
        const helper = new Helper(text);
        const rawSvg: string = helper.toSVG();
        // The dxf library defaults to black strokes (rgb(0,0,0) / #000000).
        // Our canvas is dark (slate-950), so we remap pure-black to a bright teal
        // to maintain the classic dark-background CAD aesthetic.
        // Also boost stroke-width for better visibility.
        const visibleSvg = rawSvg
          .replace(/stroke="rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)"/gi, 'stroke="#4ade80"')
          .replace(/stroke="#000000"/gi, 'stroke="#4ade80"')
          .replace(/stroke="#000(?!")"/gi, 'stroke="#4ade80"')
          .replace(/fill="rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)"/gi, 'fill="none"')
          .replace(/fill="#000000"/gi, 'fill="none"')
          .replace(/fill="#000(?!")"/gi, 'fill="none"')
          .replace(/stroke-width="0\.1%"/gi, 'stroke-width="0.3%"');
        setSvg(visibleSvg);
      } catch (e: any) {
        setError(e.message || "Could not render this DXF/CAD file");
      } finally {
        setLoading(false);
      }
    })();
  }, [file]);

  const resetZoom = () => setZoom(1);
  const fitToContainer = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const cw = containerRef.current.clientWidth - 32;
    const ch = containerRef.current.clientHeight - 32;
    const vb = svgEl.viewBox.baseVal;
    if (vb && vb.width > 0 && vb.height > 0) {
      setZoom(Math.min(cw / vb.width, ch / vb.height, 1));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]" data-testid="cad-viewer">
      {loading && !error && (
        <div className="flex justify-center py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center py-16 gap-3 px-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <p className="text-slate-400 text-xs">
            ASCII DXF (R12 / R2000 / R2004+) formatları desteklenmektedir. Binary DXF
            veya DWG dosyaları desteklenmemektedir.
          </p>
        </div>
      )}

      {!loading && svg && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-teal-700 mr-auto tracking-wide uppercase">
              DXF Preview
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.25, 5))}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Zoom In"
              data-testid="cad-zoom-in"
            >
              <ZoomIn className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.1))}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Zoom Out"
              data-testid="cad-zoom-out"
            >
              <ZoomOut className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={fitToContainer}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Fit to Screen"
              data-testid="cad-fit"
            >
              <Maximize2 className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Reset Zoom"
              data-testid="cad-reset"
            >
              <RotateCcw className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-xs text-slate-400 w-12 text-right tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* SVG canvas */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto bg-slate-950 p-4"
            style={{ cursor: "crosshair", minHeight: 380 }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                display: "inline-block",
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>

          <p className="text-center text-[10px] text-slate-400 py-1.5 bg-slate-50 border-t border-slate-100">
            Scroll to pan · Use zoom buttons above · DXF geometry only (no raster images)
          </p>
        </>
      )}
    </div>
  );
}
