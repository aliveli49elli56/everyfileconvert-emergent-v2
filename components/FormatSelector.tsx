"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, ArrowRight, Zap } from "lucide-react";
import { formatRegistry } from "@/lib/registry/format-registry";
import { conversionRegistry } from "@/lib/registry/conversion-registry";
import type { FormatCategory, FormatDefinition } from "@/lib/types/formats";

// ─── Category display config (purely presentational) ──
const CATEGORY_META: Record<FormatCategory, { label: string; color: string }> = {
  image:    { label: "Image",    color: "bg-emerald-100 text-emerald-700" },
  raw:      { label: "RAW",      color: "bg-amber-100 text-amber-700" },
  vector:   { label: "Vector",   color: "bg-violet-100 text-violet-700" },
  icon:     { label: "Icon",     color: "bg-sky-100 text-sky-700" },
  cad:      { label: "CAD & 3D", color: "bg-orange-100 text-orange-700" },
  video:    { label: "Video",    color: "bg-rose-100 text-rose-700" },
  audio:    { label: "Audio",    color: "bg-pink-100 text-pink-700" },
  document: { label: "Document", color: "bg-blue-100 text-blue-700" },
  archive:  { label: "Archive",  color: "bg-stone-100 text-stone-700" },
  font:     { label: "Font",     color: "bg-indigo-100 text-indigo-700" },
  gis:      { label: "GIS",      color: "bg-green-100 text-green-700" },
  email:    { label: "Email",    color: "bg-cyan-100 text-cyan-700" },
  code:     { label: "Code",     color: "bg-slate-100 text-slate-700" },
  ebook:    { label: "eBook",    color: "bg-amber-100 text-amber-700" },
};

// All source formats that have at least one conversion target
const SOURCE_FORMATS = formatRegistry.getAll().filter(
  (f) => conversionRegistry.getTargets(f.ext).length > 0
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormatDropdownProps {
  placeholder: string;
  value: string | null;
  formats: FormatDefinition[];
  disabled?: boolean;
  onChange: (ext: string) => void;
  "data-testid"?: string;
}

// ─── FormatDropdown ───────────────────────────────────────────────────────────
function FormatDropdown({
  placeholder,
  value,
  formats,
  disabled = false,
  onChange,
  "data-testid": testId,
}: FormatDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? formats.filter((f) => f.ext.includes(q) || f.name.toLowerCase().includes(q)) : formats;
  }, [formats, query]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<FormatCategory, FormatDefinition[]>();
    filtered.forEach((f) => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return map;
  }, [filtered]);

  const selected = formats.find((f) => f.ext === value);

  return (
    <div ref={ref} className="relative flex-1 min-w-0" data-testid={testId}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        data-testid={`${testId}-trigger`}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3.5
          rounded-xl border transition-all duration-200 text-left
          ${disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
            : open
            ? "bg-white border-blue-400 shadow-md ring-2 ring-blue-100"
            : "bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-sm cursor-pointer"
          }
        `}
      >
        <span className={`text-sm font-medium truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected ? (
            <span className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${CATEGORY_META[selected.category]?.color || "bg-slate-100 text-slate-700"}`}>
                .{selected.ext.toUpperCase()}
              </span>
              <span>{selected.name}</span>
            </span>
          ) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search formats…"
                data-testid={`${testId}-search`}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Groups */}
          <div className="overflow-y-auto max-h-72 py-1">
            {grouped.size === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No formats found</p>
            )}
            {Array.from(grouped.entries()).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/80 sticky top-0">
                  {CATEGORY_META[cat]?.label || cat}
                </div>
                {items.map((f) => (
                  <button
                    key={f.ext}
                    type="button"
                    data-testid={`${testId}-option-${f.ext}`}
                    onClick={() => { onChange(f.ext); setOpen(false); setQuery(""); }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                      hover:bg-blue-50 transition-colors duration-100
                      ${value === f.ext ? "bg-blue-50 text-blue-700" : "text-slate-700"}
                    `}
                  >
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${CATEGORY_META[f.category]?.color || "bg-slate-100 text-slate-700"}`}>
                      .{f.ext.toUpperCase()}
                    </span>
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main FormatSelector ─────────────────────────────────────────────────────
export default function FormatSelector({ locale }: { locale: string }) {
  const router = useRouter();
  const [fromExt, setFromExt] = useState<string | null>(null);
  const [toExt, setToExt] = useState<string | null>(null);

  // Target formats derived from conversion registry
  const targetFormats = useMemo(() => {
    if (!fromExt) return [];
    return conversionRegistry.getTargetFormats(fromExt);
  }, [fromExt]);

  const handleFromChange = (ext: string) => {
    setFromExt(ext);
    setToExt(null);
  };

  const handleConvert = () => {
    if (fromExt && toExt) {
      router.push(`/${locale}/${fromExt}-to-${toExt}`);
    }
  };

  const canConvert = !!(fromExt && toExt);

  return (
    <div
      data-testid="format-selector"
      className="w-full max-w-3xl mx-auto"
    >
      {/* Glassmorphism card */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* FROM */}
          <FormatDropdown
            placeholder="Choose source format…"
            value={fromExt}
            formats={SOURCE_FORMATS}
            onChange={handleFromChange}
            data-testid="format-from"
          />

          {/* Arrow */}
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-200">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* TO */}
          <FormatDropdown
            placeholder={fromExt ? "Choose target format…" : "Select source first"}
            value={toExt}
            formats={targetFormats}
            disabled={!fromExt}
            onChange={setToExt}
            data-testid="format-to"
          />
        </div>

        {/* Convert Now button */}
        <div
          className={`overflow-hidden transition-all duration-300 ${canConvert ? "max-h-20 mt-4 opacity-100" : "max-h-0 mt-0 opacity-0"}`}
        >
          <button
            type="button"
            onClick={handleConvert}
            data-testid="format-convert-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            <Zap className="h-4 w-4" />
            Convert {fromExt?.toUpperCase()} → {toExt?.toUpperCase()} Now
          </button>
        </div>
      </div>

      {/* Subtle hint */}
      {!fromExt && (
        <p className="text-center text-xs text-slate-400 mt-3">
          Select a source format to see all available conversion targets
        </p>
      )}
    </div>
  );
}
