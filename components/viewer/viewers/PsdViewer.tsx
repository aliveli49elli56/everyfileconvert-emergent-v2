"use client";
import { useEffect, useRef, useState } from "react";

export default function PsdViewer({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    (async () => {
      try {
        const { readPsd } = await import("ag-psd");
        const buf = await file.arrayBuffer();
        const psd = readPsd(buf, { skipLayerImageData: true, skipThumbnail: false });

        const canvas = canvasRef.current!;
        canvas.width = psd.width;
        canvas.height = psd.height;
        const ctx = canvas.getContext("2d")!;

        // ag-psd gives us a canvas element in browser mode
        if (psd.canvas) {
          ctx.drawImage(psd.canvas as unknown as CanvasImageSource, 0, 0);
        } else if (psd.imageData) {
          const imgData = new ImageData(
            new Uint8ClampedArray((psd.imageData as any).data),
            psd.width,
            psd.height
          );
          ctx.putImageData(imgData, 0, 0);
        } else {
          throw new Error("No renderable image data found in PSD");
        }
        setDims({ w: psd.width, h: psd.height });
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "Could not render PSD");
      }
    })();
  }, [file]);

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
      {loading && !error && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      {dims.w > 0 && <p className="text-xs text-slate-400 mb-2">{dims.w} × {dims.h}px</p>}
      <canvas
        ref={canvasRef}
        className={`max-w-full rounded-xl shadow ${loading ? "hidden" : "block"}`}
        style={{ maxHeight: "65vh", width: "auto" }}
      />
    </div>
  );
}
