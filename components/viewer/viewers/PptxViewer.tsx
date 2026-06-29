"use client";
import { useEffect, useState, useRef } from "react";

// EMU → px: 1 EMU = 1/9525 inch-pixel at 96 DPI
const EMU2PX = 1 / 9525;

interface SlideShape {
  type: "text" | "image";
  x: number; y: number; cx: number; cy: number;
  text?: string;
  bold?: boolean; italic?: boolean;
  fontSize?: number; color?: string; align?: string;
  imgData?: string; // base64 dataURL
}

interface Slide {
  id: number;
  bg: string; // CSS background
  shapes: SlideShape[];
}

// ── XML helpers ────────────────────────────────────────────────────────────────
function attr(el: string, tag: string, attribute: string): string {
  const m = new RegExp(`<${tag}[^>]*\\s${attribute}="([^"]*)"`, "i").exec(el);
  return m ? m[1] : "";
}
function textOf(el: string, tag: string): string {
  const results: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m;
  while ((m = re.exec(el)) !== null) results.push(m[1].replace(/<[^>]+>/g, ""));
  return results.join(" ").trim();
}
function blocks(xml: string, tag: string): string[] {
  const res: string[] = [];
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
  let m;
  while ((m = re.exec(xml)) !== null) res.push(m[0]);
  return res;
}
function hexColor(srgbClr: string): string {
  const m = /srgbClr\s+val="([0-9A-Fa-f]{6})"/.exec(srgbClr);
  return m ? `#${m[1]}` : "";
}

// ── Core parser ────────────────────────────────────────────────────────────────
async function parsePptx(file: File): Promise<{ slides: Slide[]; w: number; h: number }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // Slide dimensions from presentation.xml
  let slideW = 9144000, slideH = 6858000;
  const presFile = zip.file("ppt/presentation.xml");
  if (presFile) {
    const presXml = await presFile.async("text");
    const sldSz = /p:sldSz[^/]+/.exec(presXml)?.[0] ?? "";
    slideW = parseInt(attr(sldSz, "p:sldSz", "cx") || String(slideW));
    slideH = parseInt(attr(sldSz, "p:sldSz", "cy") || String(slideH));
  }

  // Collect slide files in order
  const slideKeys = Object.keys(zip.files)
    .filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => {
      const na = parseInt(/\d+/.exec(a)![0]);
      const nb = parseInt(/\d+/.exec(b)![0]);
      return na - nb;
    });

  const slides: Slide[] = [];

  for (let idx = 0; idx < Math.min(slideKeys.length, 30); idx++) {
    const key = slideKeys[idx];
    const xml = await zip.file(key)!.async("text");

    // ── Background ──────────────────────────────────────────────────────────
    let bg = "#FFFFFF";
    const bgXml = /<p:bg[\s\S]*?<\/p:bg>/.exec(xml)?.[0] ?? "";
    if (bgXml) {
      const solidFill = /a:solidFill[\s\S]*?\/a:solidFill/.exec(bgXml)?.[0] ?? "";
      const hex = hexColor(solidFill);
      if (hex) bg = hex;
      const schemeClr = /a:schemeClr\s+val="(\w+)"/.exec(solidFill)?.[1];
      if (!hex && schemeClr === "lt1") bg = "#FFFFFF";
      if (!hex && schemeClr === "dk1") bg = "#000000";
      // Gradient → use first stop
      const gradStop = /a:gs[^>]*>[\s\S]*?a:srgbClr\s+val="([0-9A-Fa-f]{6})"/.exec(bgXml);
      if (!hex && gradStop) bg = `#${gradStop[1]}`;
    }

    // ── Shapes ─────────────────────────────────────────────────────────────
    const shapes: SlideShape[] = [];
    const spBlocks = blocks(xml, "p:sp");

    for (const sp of spBlocks) {
      // Position
      const xfrm = /a:xfrm[\s\S]*?\/a:xfrm/.exec(sp)?.[0] ?? "";
      const off = /a:off[^/]+/.exec(xfrm)?.[0] ?? "";
      const ext = /a:ext[^/]+/.exec(xfrm)?.[0] ?? "";
      const slideWpx = slideW * EMU2PX;
      const slideHpx = slideH * EMU2PX;
      const hasBounds = xfrm.includes("a:off") && xfrm.includes("a:ext");
      // Fallback: shapes without explicit bounds fill the slide
      const x  = hasBounds ? parseInt(attr(off, "a:off", "x") || "0") * EMU2PX : slideWpx * 0.05;
      const y  = hasBounds ? parseInt(attr(off, "a:off", "y") || "0") * EMU2PX : shapes.length * slideHpx * 0.18;
      const cx = hasBounds ? (parseInt(attr(ext, "a:ext", "cx") || "0") * EMU2PX) || slideWpx * 0.9 : slideWpx * 0.9;
      const cy = hasBounds ? (parseInt(attr(ext, "a:ext", "cy") || "0") * EMU2PX) || slideHpx * 0.18 : slideHpx * 0.18;

      // Text paragraphs
      const txBody = /p:txBody[\s\S]*?\/p:txBody/.exec(sp)?.[0] ?? "";
      if (!txBody) continue;

      const paras = blocks(txBody, "a:p");
      const lines: string[] = [];
      let bold = false, italic = false, fontSize = 18, color = "#1e293b", align = "left";

      for (const para of paras) {
        // Paragraph align
        const pPr = /a:pPr[^>]*/.exec(para)?.[0] ?? "";
        const algn = attr(pPr, "a:pPr", "algn");
        if (algn === "ctr") align = "center";
        else if (algn === "r") align = "right";

        const runs = blocks(para, "a:r");
        const runTexts: string[] = [];
        for (const r of runs) {
          const rPr = /a:rPr[^>]*/.exec(r)?.[0] ?? "";
          bold   = attr(rPr, "a:rPr", "b") === "1";
          italic = attr(rPr, "a:rPr", "i") === "1";
          const sz = attr(rPr, "a:rPr", "sz");
          if (sz) fontSize = parseInt(sz) / 100;
          const solidFill = /a:solidFill[\s\S]*?\/a:solidFill/.exec(r)?.[0] ?? "";
          const hex = hexColor(solidFill);
          if (hex) color = hex;

          const tMatch = /<a:t>([^<]*)<\/a:t>/g;
          let tm;
          while ((tm = tMatch.exec(r)) !== null) {
            if (tm[1]) runTexts.push(tm[1]);
          }
        }
        if (runTexts.length) lines.push(runTexts.join(""));
      }

      const text = lines.join("\n").trim();
      if (text) shapes.push({ type: "text", x, y, cx, cy, text, bold, italic, fontSize, color, align });
    }

    slides.push({ id: idx + 1, bg, shapes });
  }

  return { slides, w: slideW * EMU2PX, h: slideH * EMU2PX };
}

// ── Slide renderer ────────────────────────────────────────────────────────────
function SlideCanvas({ slide, w, h, scale }: { slide: Slide; w: number; h: number; scale: number }) {
  return (
    <div
      style={{
        width: w * scale, height: h * scale,
        background: slide.bg,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        flexShrink: 0,
      }}
    >
      {slide.shapes.map((shape, i) => (
        shape.type === "text" ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: shape.x * scale,
              top: shape.y * scale,
              width: shape.cx * scale,
              height: shape.cy * scale,
              fontSize: Math.max((shape.fontSize ?? 18) * scale, 8),
              fontWeight: shape.bold ? "bold" : "normal",
              fontStyle: shape.italic ? "italic" : "normal",
              color: shape.color ?? "#1e293b",
              textAlign: (shape.align ?? "left") as any,
              overflow: "hidden",
              lineHeight: 1.3,
              wordBreak: "break-word",
              display: "flex", alignItems: "center",
              padding: 2 * scale,
            }}
          >
            <span style={{ whiteSpace: "pre-line" }}>{shape.text}</span>
          </div>
        ) : null
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PptxViewer({ file }: { file: File }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [dims, setDims] = useState({ w: 960, h: 720 });
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    parsePptx(file)
      .then(({ slides: s, w, h }) => {
        setSlides(s);
        setDims({ w, h });
        setLoading(false);
      })
      .catch((e) => setError(e.message ?? "Could not parse presentation"));
  }, [file]);

  // Responsive scale
  useEffect(() => {
    const resize = () => {
      const cw = containerRef.current?.clientWidth ?? 800;
      setScale(Math.min((cw - 32) / dims.w, 0.9));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [dims.w]);

  const total = slides.length;

  return (
    <div className="flex flex-col h-full min-h-[500px]" ref={containerRef}>
      {loading && !error && (
        <div className="flex justify-center py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      {error && <p className="text-center text-red-500 py-10 text-sm">{error}</p>}

      {!loading && slides.length > 0 && (
        <>
          {/* Slide stage */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-6 min-h-[400px]">
            <SlideCanvas
              slide={slides[current]}
              w={dims.w} h={dims.h}
              scale={scale}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-white">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >‹ Prev</button>

            {/* Thumbnail strip */}
            <div className="flex-1 flex gap-1.5 overflow-x-auto px-2 py-1 justify-center">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{ background: s.bg, width: 48, height: 36, flexShrink: 0 }}
                  className={`rounded border-2 transition-all ${i === current ? "border-blue-500 shadow-md" : "border-slate-200 hover:border-blue-300"}`}
                  title={`Slide ${i + 1}`}
                >
                  <span className="text-[8px] font-bold text-slate-500 select-none">{i + 1}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >Next ›</button>
          </div>

          <p className="text-center text-xs text-slate-400 py-1.5">
            Slide {current + 1} of {total}
          </p>
        </>
      )}
    </div>
  );
}
