import { NextResponse } from 'next/server';

const BASE_URL = 'https://everyfileconvert.com';
const OG_IMAGE =
  'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1200';

const LOCALES = [
  'en','tr','de','fr','es','it','pt','ja',
  'zh','nl','pl','ko','sv','da','no','hu','fi',
] as const;

// Image-format conversions only (excludes video / audio / document)
const IMAGE_CONVERSIONS: Record<string, string[]> = {
  png:  ['jpg','jpeg','webp','gif','bmp','tiff','ico','svg','pdf'],
  jpg:  ['png','jpeg','webp','gif','bmp','tiff','ico','pdf'],
  jpeg: ['png','jpg','webp','gif','bmp','tiff','ico','pdf'],
  webp: ['png','jpg','jpeg','gif','bmp','tiff','pdf'],
  gif:  ['png','jpg','jpeg','webp','bmp','tiff','pdf'],
  bmp:  ['png','jpg','jpeg','webp','gif','tiff','ico','pdf'],
  tiff: ['png','jpg','jpeg','webp','gif','bmp','pdf'],
  heic: ['png','jpg','jpeg','webp','tiff','pdf'],
  heif: ['png','jpg','jpeg','webp','tiff','pdf'],
  raw:  ['png','jpg','jpeg','webp','tiff','pdf'],
  cr2:  ['png','jpg','jpeg','webp','tiff','pdf'],
  svg:  ['png','jpg','jpeg','webp','bmp','ico','pdf'],
  ai:   ['png','jpg','jpeg','webp','svg','eps','pdf'],
  eps:  ['png','jpg','jpeg','webp','svg','ai','pdf'],
  psd:  ['png','jpg','jpeg','webp','gif','bmp','tiff','svg','pdf'],
  ico:  ['png','jpg','jpeg','bmp'],
};

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(loc: string, title: string, caption: string): string {
  return [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    '    <image:image>',
    `      <image:loc>${esc(OG_IMAGE)}</image:loc>`,
    `      <image:title>${esc(title)}</image:title>`,
    `      <image:caption>${esc(caption)}</image:caption>`,
    '    </image:image>',
    '  </url>',
  ].join('\n');
}

export async function GET() {
  const entries: string[] = [];

  for (const [src, targets] of Object.entries(IMAGE_CONVERSIONS)) {
    const SRC = src.toUpperCase();
    const targetPreview = targets.slice(0, 4).map((t) => t.toUpperCase()).join(', ');

    // Single-format hub pages (e.g. /en/png)
    for (const locale of LOCALES) {
      entries.push(
        urlEntry(
          `${BASE_URL}/${locale}/${src}`,
          `Convert ${SRC} Files Online — Free ${SRC} Converter`,
          `Free online ${SRC} converter. Convert ${SRC} to ${targetPreview} and more image formats instantly in your browser — no upload required.`,
        ),
      );
    }

    // Conversion pages (e.g. /en/png-to-jpg)
    for (const tgt of targets) {
      const TGT = tgt.toUpperCase();
      const title = `Convert ${SRC} to ${TGT} Online — Free Converter`;
      const caption = `Convert ${SRC} to ${TGT} format instantly in your browser. No file upload, no account, 100% private and free.`;
      for (const locale of LOCALES) {
        entries.push(urlEntry(`${BASE_URL}/${locale}/${src}-to-${tgt}`, title, caption));
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
