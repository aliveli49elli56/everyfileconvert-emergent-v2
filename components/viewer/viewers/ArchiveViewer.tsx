"use client";
import { useEffect, useState } from "react";
import { FileArchive, File as FileIcon, Archive, FolderOpen } from "lucide-react";

interface ArchiveEntry {
  name: string;
  size: number;
  packSize?: number;
  dir: boolean;
}

async function extractZip(file: File): Promise<ArchiveEntry[]> {
  const JSZip = (await import("jszip")).default;
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  return Object.values(zip.files)
    .map((f) => ({
      name: f.name,
      size: (f as any)._data?.uncompressedSize ?? 0,
      dir: f.dir,
    }))
    .sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
}

async function extractRar(file: File): Promise<ArchiveEntry[]> {
  // Load WASM binary from public folder
  const wasmBinary = await fetch("/unrar.wasm").then((r) => {
    if (!r.ok) throw new Error("Could not load unrar.wasm — try refreshing the page");
    return r.arrayBuffer();
  });
  const data = await file.arrayBuffer();

  // Dynamic import of the CJS entry (uses browser-compatible ESM internally)
  const unrar = await import("node-unrar-js");
  const createExtractorFromData =
    (unrar as any).createExtractorFromData ?? (unrar as any).default?.createExtractorFromData;
  if (!createExtractorFromData) throw new Error("node-unrar-js: createExtractorFromData not found");

  const extractor = await createExtractorFromData({ wasmBinary, data });
  const list = extractor.getFileList();
  const entries: ArchiveEntry[] = [];
  for (const header of list.fileHeaders) {
    entries.push({
      name: header.name,
      size: header.unpSize ?? 0,
      packSize: header.packSize,
      dir: header.flags?.directory ?? false,
    });
  }
  entries.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
  return entries;
}

function formatSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function ArchiveViewer({ file }: { file: File }) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isRar = ext === "rar";

  useEffect(() => {
    (async () => {
      try {
        const list = isRar ? await extractRar(file) : await extractZip(file);
        setEntries(list);
      } catch (e: any) {
        setError(e.message || "Could not read archive");
      } finally {
        setLoading(false);
      }
    })();
  }, [file, isRar]);

  const dirs = entries.filter((e) => e.dir);
  const files = entries.filter((e) => !e.dir);
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="p-4" data-testid="archive-viewer">
      {loading && !error && (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="text-center py-10 px-4">
          <p className="text-red-500 text-sm">{error}</p>
          {isRar && (
            <p className="text-slate-400 text-xs mt-2">
              RAR3 ve RAR5 arşivleri desteklenmektedir. Şifreli arşivler desteklenmemektedir.
            </p>
          )}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Header summary */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm flex-shrink-0">
              <Archive className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">
                {dirs.length > 0 && `${dirs.length} klasör · `}
                {files.length} dosya · {formatSize(totalSize)} toplam
                {isRar && " · RAR Arşivi"}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
              {dirs.length} klasör
            </span>
            <span className="flex items-center gap-1">
              <FileIcon className="h-3.5 w-3.5 text-slate-400" />
              {files.length} dosya
            </span>
            <span className="ml-auto font-medium text-slate-600">
              Sıkıştırılmamış: {formatSize(totalSize)}
            </span>
          </div>

          {/* File list */}
          <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 overflow-hidden text-xs max-h-[60vh] overflow-y-auto">
            {entries.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                {e.dir ? (
                  <FolderOpen className="h-4 w-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <FileIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="truncate text-slate-700 flex-1">{e.name}</span>
                {!e.dir && (
                  <span className="ml-auto flex-shrink-0 text-slate-400 tabular-nums">
                    {formatSize(e.size)}
                  </span>
                )}
              </div>
            ))}
            {entries.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                Arşiv boş görünüyor
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
