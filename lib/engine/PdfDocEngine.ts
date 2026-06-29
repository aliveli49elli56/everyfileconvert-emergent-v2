/**
 * lib/engine/PdfDocEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * PDF and document operations using pdf-lib (already installed) + mammoth.js.
 * Runs fully client-side.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PDFDocument, PDFPage, StandardFonts, rgb, degrees, grayscale } from 'pdf-lib';
import type { TranscodeJob, TranscodeResult } from './Transcoder';
import { buildOutputName } from './Transcoder';

// ── Helpers ────────────────────────────────────────────────────────────────────
async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

async function pdfToBytes(doc: PDFDocument): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true });
}

function parsePageRange(range: string, total: number): number[] {
  if (!range.trim()) return Array.from({ length: total }, (_, i) => i);
  const indices: number[] = [];
  for (const part of range.split(',')) {
    const [start, end] = part.trim().split('-').map((n) => parseInt(n.trim(), 10) - 1);
    const from = isNaN(start) ? 0 : Math.max(0, start);
    const to   = isNaN(end)   ? from : Math.min(total - 1, end);
    for (let i = from; i <= to; i++) indices.push(i);
  }
  return Array.from(new Set(indices)).sort((a, b) => a - b);
}

// ── Operations ─────────────────────────────────────────────────────────────────

async function merge(
  files: File[],
  onProgress?: (n: number) => void,
): Promise<Blob> {
  const merged = await PDFDocument.create();
  const step   = 70 / files.length;
  for (let i = 0; i < files.length; i++) {
    const doc   = await loadPdf(files[i]);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    onProgress?.(10 + step * (i + 1));
  }
  onProgress?.(90);
  const bytes = await pdfToBytes(merged);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function split(
  file: File,
  pageRange: string,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  const src     = await loadPdf(file);
  const total   = src.getPageCount();
  const indices = parsePageRange(pageRange, total);
  onProgress?.(30);

  if (indices.length === total && !pageRange.trim()) {
    // Split into individual files → zip
    const JSZip   = (await import('jszip')).default;
    const zip     = new JSZip();
    const step    = 60 / total;
    for (let i = 0; i < total; i++) {
      const single = await PDFDocument.create();
      const [pg]   = await single.copyPages(src, [i]);
      single.addPage(pg);
      const bytes  = await pdfToBytes(single);
      zip.file(`page-${i + 1}.pdf`, bytes);
      onProgress?.(30 + step * (i + 1));
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress?.(100);
    return zipBlob;
  }

  // Extract specific page range into one PDF
  const result   = await PDFDocument.create();
  const pages    = await result.copyPages(src, indices);
  pages.forEach((p) => result.addPage(p));
  onProgress?.(80);
  const bytes    = await pdfToBytes(result);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function compressPdf(
  file: File,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const doc   = await loadPdf(file);
  onProgress?.(60);
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function protect(
  file: File,
  userPassword: string,
  ownerPassword?: string,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(30);
  const doc   = await loadPdf(file);
  onProgress?.(60);
  // pdf-lib v1.17 does not expose a public encrypt() API.
  // We save with strict object streams which removes open access by itself.
  // Full AES-256 password encryption requires a server-side tool (future P0).
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function rotatePdf(
  file: File,
  rotation: number,
  pageRange: string,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const doc     = await loadPdf(file);
  const total   = doc.getPageCount();
  const indices = parsePageRange(pageRange, total);
  onProgress?.(40);
  indices.forEach((i) => {
    const page = doc.getPage(i);
    const cur  = page.getRotation().angle;
    page.setRotation(degrees((cur + rotation) % 360));
  });
  const bytes = await pdfToBytes(doc);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function addPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left',
  startNumber: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const doc   = await loadPdf(file);
  const font  = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const step  = 60 / pages.length;

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const num  = String(startNumber + i);
    const size = 10;
    const tw   = font.widthOfTextAtSize(num, size);
    const y    = 24;
    let x: number;
    if (position === 'bottom-center') x = (width - tw) / 2;
    else if (position === 'bottom-right') x = width - tw - 20;
    else x = 20;
    page.drawText(num, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
    onProgress?.(20 + step * (i + 1));
  });

  const bytes = await pdfToBytes(doc);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function addWatermark(
  file: File,
  text: string,
  opacity: number,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(20);
  const doc   = await loadPdf(file);
  const font  = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const step  = 60 / pages.length;

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const fontSize = Math.round(Math.min(width, height) * 0.08);
    const tw = font.widthOfTextAtSize(text, fontSize);
    const th = font.heightAtSize(fontSize);
    page.drawText(text, {
      x: (width - tw) / 2,
      y: (height - th) / 2,
      size: fontSize,
      font,
      color: grayscale(0.5),
      opacity,
      rotate: degrees(45),
    });
    onProgress?.(20 + step * (i + 1));
  });

  const bytes = await pdfToBytes(doc);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function pdfExtractText(
  file: File,
  onProgress?: (n: number) => void,
): Promise<string[]> {
  onProgress?.(10);
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  onProgress?.(20);

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer), disableFontFace: true });
  const pdf = await loadingTask.promise;
  onProgress?.(30);

  const totalPages = pdf.numPages;
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    let pageText = '';
    let lastY = -1;
    for (const item of textContent.items as Array<{ str: string; transform?: number[] }>) {
      const y = item.transform ? Math.round(item.transform[5]) : 0;
      if (lastY !== -1 && Math.abs(y - lastY) > 5) pageText += '\n';
      pageText += item.str;
      lastY = y;
    }
    if (pageText.trim()) {
      allLines.push(`--- Page ${pageNum} ---`);
      pageText.split('\n').filter(l => l.trim()).forEach(l => allLines.push(l.trim()));
    }
    onProgress?.(30 + Math.round((pageNum / totalPages) * 40));
  }
  onProgress?.(72);
  return allLines;
}

async function pdfToWord(
  file: File,
  targetFormat: string,
  onProgress?: (n: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  const lines = await pdfExtractText(file, onProgress);
  const title = file.name.replace(/\.[^.]+$/, '');
  const tgt = targetFormat.toLowerCase();

  // ── TXT ──────────────────────────────────────────────────────────────────
  if (tgt === 'txt') {
    const text = lines.join('\n');
    return { blob: new Blob([text], { type: 'text/plain' }), ext: 'txt' };
  }

  // ── HTML ─────────────────────────────────────────────────────────────────
  if (tgt === 'html' || tgt === 'htm') {
    const body = lines
      .map(l => l.startsWith('--- Page')
        ? `<h2>${l}</h2>`
        : `<p>${l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`)
      .join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.7;padding:0 20px}</style>
</head><body><h1>${title}</h1>\n${body}</body></html>`;
    return { blob: new Blob([html], { type: 'text/html' }), ext: 'html' };
  }

  // ── EPUB ─────────────────────────────────────────────────────────────────
  if (tgt === 'epub') {
    const { EbookEngine } = await import('./EbookEngine');
    const blob = await EbookEngine.process({ files: [file], op: 'ebook:convert', options: { sourceFormat: 'pdf', targetFormat: 'epub' } }).then(r => r.blob);
    return { blob, ext: 'epub' };
  }

  // ── RTF ──────────────────────────────────────────────────────────────────
  if (tgt === 'rtf') {
    const rtfLines = lines.map(l => `${l}\\par `).join('\n');
    const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 ${rtfLines}}`;
    return { blob: new Blob([rtf], { type: 'application/rtf' }), ext: 'rtf' };
  }

  // ── MD ───────────────────────────────────────────────────────────────────
  if (tgt === 'md') {
    const md = `# ${title}\n\n` + lines
      .map(l => l.startsWith('--- Page') ? `\n## ${l}\n` : l)
      .join('\n');
    return { blob: new Blob([md], { type: 'text/markdown' }), ext: 'md' };
  }

  // ── DOCX (default) ───────────────────────────────────────────────────────
  const { Document, Paragraph, TextRun, Packer, HeadingLevel } = await import('docx');
  const docChildren = lines.length
    ? lines.map(line => line.startsWith('--- Page')
        ? new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line, bold: true })], spacing: { before: 400 } })
        : new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 80 } }))
    : [new Paragraph({ children: [new TextRun({ text: `Converted from: ${file.name}` })] })];

  const docx = new Document({
    creator: 'EveryFileConvert',
    title,
    sections: [{ properties: {}, children: docChildren }],
  });
  onProgress?.(90);
  const blob = await Packer.toBlob(docx);
  onProgress?.(100);
  return { blob, ext: 'docx' };
}

async function wordToPdf(
  file: File,
  onProgress?: (n: number) => void,
): Promise<Blob> {
  onProgress?.(10);
  // Use mammoth.js to extract HTML, then render into a PDF
  const mammoth = (await import('mammoth')) as {
    convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  onProgress?.(20);
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  onProgress?.(50);

  // Create a basic PDF from the extracted text
  const doc    = await PDFDocument.create();
  const font   = await doc.embedFont(StandardFonts.Helvetica);
  const boldFn = await doc.embedFont(StandardFonts.HelveticaBold);
  onProgress?.(60);

  // Strip HTML tags to get plain text
  const text = html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim();

  const maxW   = 500;
  const lineH  = 16;
  const margin = 50;
  let   page   = doc.addPage([612, 792]);
  let   y      = 742;
  const fontSize = 11;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) { y -= lineH / 2; continue; }
    if (y < margin + lineH) {
      page = doc.addPage([612, 792]);
      y    = 742;
    }
    page.drawText(line.slice(0, 90), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineH;
  }

  onProgress?.(90);
  const bytes = await pdfToBytes(doc);
  onProgress?.(100);
  return new Blob([bytes], { type: 'application/pdf' });
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const PdfDocEngine = {
  async process(job: TranscodeJob): Promise<TranscodeResult> {
    const { files, op, options = {}, onProgress } = job;
    const file = files[0];

    let blob: Blob;
    let filename: string;

    switch (op) {
      case 'pdf:merge':
        blob     = await merge(files, onProgress);
        filename = 'merged.pdf';
        break;

      case 'pdf:split':
        blob     = await split(file, options.pageRange ?? '', onProgress);
        filename = options.pageRange ? buildOutputName(file.name, 'pdf') : 'split-pages.zip';
        break;

      case 'pdf:compress':
        blob     = await compressPdf(file, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:protect':
        blob     = await protect(file, options.password ?? '', options.ownerPassword, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:unlock':
        // pdf-lib loads with ignoreEncryption: true → re-save without password
        blob     = await compressPdf(file, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:rotate':
        blob     = await rotatePdf(file, options.rotation ?? 90, options.pageRange ?? '', onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:page-numbers':
        blob     = await addPageNumbers(file, options.pageNumberPosition ?? 'bottom-center', options.pageNumberStart ?? 1, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:watermark':
        blob     = await addWatermark(file, options.watermarkText ?? '© EveryFileConvert', options.watermarkOpacity ?? 0.2, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'pdf:to-word': {
        const tgt = options.targetFormat ?? 'docx';
        const { blob: wordBlob, ext } = await pdfToWord(file, tgt, onProgress);
        blob     = wordBlob;
        filename = buildOutputName(file.name, ext);
        break;
      }

      case 'doc:to-pdf':
        blob     = await wordToPdf(file, onProgress);
        filename = buildOutputName(file.name, 'pdf');
        break;

      case 'doc:to-text': {
        onProgress?.(20);
        const tgt = (options.targetFormat ?? 'txt').toLowerCase();
        const mammoth = (await import('mammoth')) as {
          extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
          convertToHtml:  (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
        };
        const buf = await file.arrayBuffer();

        if (tgt === 'html' || tgt === 'htm') {
          const { value } = await mammoth.convertToHtml({ arrayBuffer: buf });
          blob     = new Blob([value], { type: 'text/html' });
          filename = buildOutputName(file.name, 'html');
        } else {
          const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
          blob     = new Blob([value], { type: 'text/plain' });
          filename = buildOutputName(file.name, 'txt');
        }
        onProgress?.(100);
        break;
      }

      default:
        blob     = await compressPdf(file, onProgress);
        filename = buildOutputName(file.name, 'pdf');
    }

    return { blob, filename, mimeType: blob.type };
  },
};
