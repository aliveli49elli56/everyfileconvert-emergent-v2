"use client";
import { useEffect, useState } from "react";

export default function EbookViewer({ file }: { file: File }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const JSZip = (await import("jszip")).default;
        const buf = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buf);

        // Get spine from OPF
        let spine: string[] = [];
        const containerFile = zip.file("META-INF/container.xml");
        if (containerFile) {
          const xml = await containerFile.async("text");
          const m = xml.match(/full-path="([^"]+\.opf)"/i);
          if (m) {
            const opf = await zip.file(m[1])?.async("text") ?? "";
            const base = m[1].includes("/") ? m[1].slice(0, m[1].lastIndexOf("/") + 1) : "";
            const ids: string[] = [];
            for (const sm of Array.from(opf.matchAll(/<itemref[^>]+idref="([^"]+)"/g))) ids.push(sm[1]);
            const idToHref: Record<string, string> = {};
            for (const im of Array.from(opf.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g))) idToHref[im[1]] = im[2];
            spine = ids.map(id => base + (idToHref[id] ?? "")).filter(Boolean);
          }
        }
        if (!spine.length) spine = Object.keys(zip.files).filter(n => /\.(html?|xhtml)$/i.test(n)).sort();

        const parts: string[] = [];
        for (const path of spine.slice(0, 10)) {
          const f = zip.file(path);
          if (f) parts.push(await f.async("text"));
        }
        setHtml(parts.join("<hr/>"));
        setLoading(false);
      } catch (e: any) { setError(e.message || "Could not open ebook"); }
    })();
  }, [file]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {loading && !error && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}
      {error && <p className="text-center text-red-500 py-10">{error}</p>}
      {html && (
        <div
          className="prose prose-slate max-w-none text-sm leading-relaxed overflow-y-auto"
          style={{ maxHeight: "70vh" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
