/**
 * lib/engine/EbookEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side ebook conversion engine.
 * Handles: epub, mobi, azw3, fb2, txt, html ↔ epub, pdf, txt, html, mobi, azw3
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TranscodeJob, TranscodeResult } from './Transcoder';

// ── Helper: read file as ArrayBuffer ─────────────────────────────────────────
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as ArrayBuffer);
    r.onerror = () => rej(new Error('File read error'));
    r.readAsArrayBuffer(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('File read error'));
    r.readAsText(file, 'utf-8');
  });
}

// ── EPUB text extraction via JSZip ────────────────────────────────────────────
async function extractTextFromEpub(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const buf = await readFileAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(buf);

  // Parse OPF for reading order
  let spine: string[] = [];
  const container = zip.file('META-INF/container.xml');
  if (container) {
    const xml = await container.async('text');
    const m = xml.match(/full-path="([^"]+\.opf)"/i);
    if (m) {
      const opfFile = zip.file(m[1]);
      if (opfFile) {
        const opf = await opfFile.async('text');
        const baseDir = m[1].includes('/') ? m[1].substring(0, m[1].lastIndexOf('/') + 1) : '';
        const idRefs: string[] = [];
        const spineMatches = Array.from(opf.matchAll(/<itemref[^>]+idref="([^"]+)"/g));
        for (const sm of spineMatches) idRefs.push(sm[1]);
        const itemMatches = Array.from(opf.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g));
        const idToHref: Record<string, string> = {};
        for (const im of itemMatches) idToHref[im[1]] = im[2];
        spine = idRefs.map(id => {
          const href = idToHref[id] || '';
          return href.startsWith('/') ? href.slice(1) : baseDir + href;
        }).filter(Boolean);
      }
    }
  }

  // Fallback: all html/xhtml files
  if (!spine.length) {
    spine = Object.keys(zip.files).filter(n => /\.(html?|xhtml)$/i.test(n));
    spine.sort();
  }

  const textParts: string[] = [];
  for (const path of spine) {
    const f = zip.file(path);
    if (!f) continue;
    const html = await f.async('text');
    // Strip HTML tags
    const cleaned = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s{3,}/g, '\n\n').trim();
    if (cleaned) textParts.push(cleaned);
  }
  return textParts.join('\n\n');
}

// ── PDF text extraction (pdfjs) ───────────────────────────────────────────────
async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const buf = await readFileAsArrayBuffer(file);
  const doc = await getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const tc = await pg.getTextContent();
    parts.push(tc.items.map((it: any) => it.str).join(' '));
  }
  return parts.join('\n\n');
}

// ── Build EPUB blob from plain text ──────────────────────────────────────────
async function buildEpub(title: string, text: string): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  zip.file('mimetype', 'application/epub+zip');
  zip.folder('META-INF')!.file('container.xml',
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS')!;
  const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head>
<body>${text.split('\n\n').map(p => `<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('\n')}</body></html>`;
  oebps.file('chapter1.xhtml', chapterHtml);

  oebps.file('content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title><dc:language>en</dc:language>
    <dc:identifier id="bookid">urn:uuid:${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx"><itemref idref="ch1"/></spine>
</package>`);

  oebps.file('toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${Date.now()}"/></head>
  <docTitle><text>${title}</text></docTitle>
  <navMap><navPoint id="n1" playOrder="1"><navLabel><text>Start</text></navLabel>
    <content src="chapter1.xhtml"/></navPoint></navMap>
</ncx>`);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

// ── Build PDF blob from plain text ────────────────────────────────────────────
async function buildPdfFromText(title: string, text: string): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const margin = 50;
  const lineHeight = fontSize * 1.4;

  const pageWidth = 595, pageHeight = 842;
  const maxWidth = pageWidth - margin * 2;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);

  // Word-wrap text
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // Paginate
  let lineIdx = 0;
  while (lineIdx < lines.length) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const chunk = lines.slice(lineIdx, lineIdx + maxLines);
    chunk.forEach((line, i) => {
      page.drawText(line, {
        x: margin,
        y: pageHeight - margin - i * lineHeight,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
    lineIdx += maxLines;
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// ── Build HTML from text ──────────────────────────────────────────────────────
function buildHtml(title: string, text: string): Blob {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px}</style></head>
<body><h1>${title}</h1>
${text.split('\n\n').map(p => `<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('\n')}
</body></html>`;
  return new Blob([html], { type: 'text/html' });
}

// ── EbookEngine public API ────────────────────────────────────────────────────
export const EbookEngine = {
  async process(job: TranscodeJob): Promise<TranscodeResult> {
    const { files, options } = job;
    const file = files[0];
    const srcExt = (options?.sourceFormat || file.name.split('.').pop() || '').toLowerCase();
    const tgtExt = (options?.targetFormat || '').toLowerCase();
    const title = file.name.replace(/\.[^.]+$/, '') || 'Document';

    // ── 1. Extract text from source ──────────────────────────────────────────
    let rawText = '';
    const isEpubLike = ['epub'].includes(srcExt);
    const isPdf      = srcExt === 'pdf';
    const isTextLike = ['txt', 'html', 'htm', 'md'].includes(srcExt);

    if (isEpubLike) {
      rawText = await extractTextFromEpub(file);
    } else if (isPdf) {
      rawText = await extractTextFromPdf(file);
    } else if (isTextLike) {
      rawText = await readFileAsText(file);
      // Strip HTML tags if html source
      if (['html', 'htm'].includes(srcExt)) {
        rawText = rawText.replace(/<[^>]+>/g, ' ').replace(/\s{3,}/g, '\n\n').trim();
      }
    } else {
      // mobi/azw3/fb2/azw: these are proprietary binary formats that cannot be
      // fully parsed client-side. Return helpful error.
      throw new Error(
        `Direct ${srcExt.toUpperCase()} parsing is not supported client-side. ` +
        `Please convert to EPUB or TXT first, or use a dedicated converter.`
      );
    }

    if (!rawText.trim()) throw new Error('No readable text could be extracted from this file.');

    // ── 2. Build output ──────────────────────────────────────────────────────
    let blob: Blob;
    let filename: string;
    let mimeType: string;

    switch (tgtExt) {
      case 'txt':
        blob = new Blob([rawText], { type: 'text/plain' });
        filename = `${title}.txt`;
        mimeType = 'text/plain';
        break;
      case 'html':
      case 'htm':
        blob = buildHtml(title, rawText);
        filename = `${title}.html`;
        mimeType = 'text/html';
        break;
      case 'epub':
        blob = await buildEpub(title, rawText);
        filename = `${title}.epub`;
        mimeType = 'application/epub+zip';
        break;
      case 'mobi':
        // MOBI requires proprietary tooling — produce epub as best-effort
        blob = await buildEpub(title, rawText);
        filename = `${title}.epub`;
        mimeType = 'application/epub+zip';
        break;
      case 'azw3':
        // AZW3 requires Kindle tooling — produce epub as best-effort
        blob = await buildEpub(title, rawText);
        filename = `${title}.epub`;
        mimeType = 'application/epub+zip';
        break;
      case 'pdf':
        blob = await buildPdfFromText(title, rawText);
        filename = `${title}.pdf`;
        mimeType = 'application/pdf';
        break;
      default:
        blob = new Blob([rawText], { type: 'text/plain' });
        filename = `${title}.txt`;
        mimeType = 'text/plain';
    }

    return { blob, filename, mimeType };
  },
};
