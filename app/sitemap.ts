import type { MetadataRoute } from "next";

const BASE_URL = "https://www.everyfileconvert.com";

const LOCALES = [
  "en", "tr", "de", "fr", "es", "it", "pt", "ja",
  "zh", "nl", "pl", "ko", "sv", "da", "no", "hu", "fi",
] as const;

const CHUNK_SIZE = 1000;

const CORE_TOOLS = [
  "/",
  "/image-converter",
  "/audio-converter",
  "/video-converter",
  "/document",
  "/pdf-tools",
  "/ebook-converter",
  "/background-remover",
  "/image-crop",
  "/image-resizer",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

const CONVERSIONS: Record<string, string[]> = {
  png:  ["jpg", "jpeg", "webp", "gif", "bmp", "tiff", "ico", "svg", "pdf"],
  jpg:  ["png", "jpeg", "webp", "gif", "bmp", "tiff", "ico", "pdf"],
  jpeg: ["png", "jpg", "webp", "gif", "bmp", "tiff", "ico", "pdf"],
  webp: ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "pdf"],
  gif:  ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "pdf"],
  bmp:  ["png", "jpg", "jpeg", "webp", "gif", "tiff", "ico", "pdf"],
  tiff: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "pdf"],
  heic: ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  heif: ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  raw:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  cr2:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  svg:  ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf"],
  ai:   ["png", "jpg", "jpeg", "webp", "svg", "eps", "pdf"],
  eps:  ["png", "jpg", "jpeg", "webp", "svg", "ai", "pdf"],
  psd:  ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "pdf"],
  ico:  ["png", "jpg", "jpeg", "bmp"],
  dwg:  ["dxf", "pdf", "svg"],
  dxf:  ["dwg", "pdf", "svg"],
  step: ["stl", "obj", "fbx"],
  stl:  ["obj", "fbx", "step"],
  obj:  ["stl", "fbx", "step"],
  fbx:  ["obj", "stl"],
  mp3:  ["wav", "ogg", "aac", "m4a"],
  wav:  ["mp3", "ogg", "aac", "m4a"],
  ogg:  ["mp3", "wav", "aac", "m4a"],
  aac:  ["mp3", "wav", "ogg", "m4a"],
  m4a:  ["mp3", "wav", "ogg", "aac"],
  mp4:  ["webm", "avi", "mov", "mkv", "mp3", "wav", "ogg", "aac", "m4a"],
  webm: ["mp4", "avi", "mov", "mkv", "mp3", "wav", "ogg", "aac"],
  avi:  ["mp4", "webm", "mov", "mkv", "mp3", "wav"],
  mov:  ["mp4", "webm", "avi", "mkv", "mp3", "wav", "aac"],
  mkv:  ["mp4", "webm", "avi", "mov", "mp3", "wav", "ogg"],
  pdf:  ["jpg", "png", "webp", "svg", "docx", "dwg", "dxf"],
  docx: ["pdf"],
  xlsx: ["pdf"],
  epub: ["pdf", "mobi"],
  mobi: ["epub", "pdf"],
};

const VIEWER_EXTS = [
  "pdf","docx","doc","docm","rtf","odt","txt","html","htm","md","xml","json",
  "xlsx","xls","ods","csv","tsv","pptx","ppt",
  "jpg","jpeg","png","gif","webp","bmp","ico","tiff","avif","svg","heic",
  "psd","mp4","webm","mov","avi","mkv","ogv",
  "mp3","wav","ogg","flac","aac","m4a",
  "zip","eml","js","ts","py","css","yaml","sql","dxf","epub",
] as const;

function generateAllUrls(): MetadataRoute.Sitemap {
  const now = new Date();
  const allSitemapEntries: MetadataRoute.Sitemap = [];

  const dynamicSlugs: string[] = [];
  Object.keys(CONVERSIONS).forEach((source) => {
    dynamicSlugs.push(source);
    CONVERSIONS[source].forEach((target) => {
      dynamicSlugs.push(`${source}-to-${target}`);
    });
  });

  const uniqueSlugs = Array.from(new Set(dynamicSlugs));

  LOCALES.forEach((locale) => {
    // Core Sayfalar
    CORE_TOOLS.forEach((path) => {
      const fullPath = path === "/" ? `/${locale}` : `/${locale}${path}`;
      allSitemapEntries.push({
        url: `${BASE_URL}${fullPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "/" ? 1.0 : 0.9,
      });
    });

    // pSEO Sayfaları
    uniqueSlugs.forEach((slug) => {
      allSitemapEntries.push({
        url: `${BASE_URL}/${locale}/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // Viewer Hub
    allSitemapEntries.push({
      url: `${BASE_URL}/${locale}/view`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });

    // Viewer format pages
    VIEWER_EXTS.forEach((ext) => {
      allSitemapEntries.push({
        url: `${BASE_URL}/${locale}/view/${ext}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.65,
      });
    });
  });

  return allSitemapEntries;
}

let cachedUrls: MetadataRoute.Sitemap | null = null;
function getAllUrls(): MetadataRoute.Sitemap {
  if (!cachedUrls) cachedUrls = generateAllUrls();
  return cachedUrls;
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  const totalUrls = getAllUrls().length;
  const count = Math.ceil(totalUrls / CHUNK_SIZE);
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const allUrls = getAllUrls();
  const start = id * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, allUrls.length);
  return allUrls.slice(start, end);
}
