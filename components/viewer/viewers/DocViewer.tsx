"use client";
import { useEffect, useRef, useState } from "react";

export default function DocViewer({ file }: { file: File }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mammoth = await import("mammoth") as any;
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        if (ref.current) {
          ref.current.innerHTML = result.value || "<p><em>No content found.</em></p>";
        }
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "Could not render document");
      }
    })();
  }, [file]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading && !error && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      <div
        ref={ref}
        className="prose prose-slate max-w-none text-sm leading-relaxed"
        style={{ fontFamily: "Georgia, serif" }}
      />
    </div>
  );
}
