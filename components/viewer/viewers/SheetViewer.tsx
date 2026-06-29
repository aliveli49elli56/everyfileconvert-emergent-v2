"use client";
import { useEffect, useState } from "react";

export default function SheetViewer({ file }: { file: File }) {
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const result = wb.SheetNames.map((name) => ({
          name,
          html: XLSX.utils.sheet_to_html(wb.Sheets[name]),
        }));
        setSheets(result);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "Could not parse spreadsheet");
      }
    })();
  }, [file]);

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {loading && !error && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      {sheets.length > 1 && (
        <div className="flex gap-1 border-b border-slate-100 px-4 pt-3 overflow-x-auto">
          {sheets.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${i === active ? "bg-white border-slate-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700"}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      {sheets[active] && (
        <div className="overflow-auto p-4 text-xs">
          <style>{`table{border-collapse:collapse;width:100%}td,th{border:1px solid #e2e8f0;padding:4px 8px;white-space:nowrap}th{background:#f8fafc;font-weight:600}`}</style>
          <div dangerouslySetInnerHTML={{ __html: sheets[active].html }} />
        </div>
      )}
    </div>
  );
}
