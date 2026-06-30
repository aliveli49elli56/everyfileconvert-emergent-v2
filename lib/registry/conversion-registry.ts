/**
 * lib/registry/conversion-registry.ts
 * Central conversion matrix - defines valid source → target conversions
 */

import type { FormatDefinition, ParsedConversionSlug, FormatCategory, ConverterType } from '../types/formats';
import type { ConversionOperation, ConversionDomain, RelatedConversion } from '../types/conversion';
import { formatRegistry } from './format-registry';

// ---------------------------------------------------------------------------
// CONVERSION MATRIX
// Defines which target formats each source format can be converted to
// ---------------------------------------------------------------------------

export const CONVERSION_MATRIX: Record<string, string[]> = {
  // ── Raster Image ────────────────────────────────────────────────────────────
  png:  ["jpg", "jpeg", "webp", "gif", "bmp", "tiff", "tif", "ico", "icns", "svg", "pdf", "avif", "jxl", "pnm"],
  jpg:  ["png", "jpeg", "webp", "gif", "bmp", "tiff", "tif", "ico", "icns", "pdf", "avif", "jxl", "svg"],
  jpeg: ["png", "jpg",  "webp", "gif", "bmp", "tiff", "tif", "ico", "icns", "pdf", "avif", "jxl"],
  webp: ["png", "jpg",  "jpeg", "gif", "bmp", "tiff", "tif", "pdf", "avif", "jxl", "ico"],
  gif:  ["png", "jpg",  "jpeg", "webp", "bmp", "tiff", "tif", "pdf", "apng"],
  bmp:  ["png", "jpg",  "jpeg", "webp", "gif", "tiff", "tif", "ico", "pdf"],
  tiff: ["png", "jpg",  "jpeg", "webp", "gif", "bmp", "pdf", "tif"],
  tif:  ["png", "jpg",  "jpeg", "webp", "gif", "bmp", "pdf", "tiff"],
  heic: ["png", "jpg",  "jpeg", "webp", "tiff", "pdf", "avif"],
  heif: ["png", "jpg",  "jpeg", "webp", "tiff", "pdf", "avif"],
  avif: ["png", "jpg",  "jpeg", "webp", "gif", "pdf", "heic"],
  jxl:  ["png", "jpg",  "jpeg", "webp", "gif", "avif", "pdf"],
  apng: ["gif", "png",  "webp", "mp4"],
  tga:  ["png", "jpg",  "jpeg", "bmp", "tiff", "dds"],
  hdr:  ["exr", "png",  "jpg", "tiff"],
  exr:  ["hdr", "png",  "jpg", "tiff"],
  dds:  ["png", "jpg",  "tga", "bmp"],
  pnm:  ["png", "jpg",  "bmp", "tiff"],
  pcx:  ["png", "jpg",  "bmp", "tiff"],
  jfif: ["jpg", "png",  "webp", "bmp"],
  jp2:  ["jpg", "png",  "tiff", "bmp"],
  j2k:  ["jp2", "jpg",  "png"],
  bpg:  ["png", "jpg",  "webp", "jpeg"],
  qoi:  ["png", "jpg",  "webp", "bmp"],
  xbm:  ["png", "bmp",  "ico"],

  // ── Camera RAW ──────────────────────────────────────────────────────────────
  raw:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  cr2:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  cr3:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  nef:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  arw:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  dng:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  raf:  ["png", "jpg", "jpeg", "webp", "tiff", "pdf"],
  rw2:  ["png", "jpg", "jpeg", "webp", "tiff"],
  orf:  ["png", "jpg", "jpeg", "webp", "tiff"],
  pef:  ["png", "jpg", "jpeg", "webp", "tiff"],
  srw:  ["png", "jpg", "jpeg", "webp", "tiff"],
  erf:  ["png", "jpg", "jpeg", "webp"],
  mrw:  ["png", "jpg", "jpeg", "webp"],
  x3f:  ["png", "jpg", "jpeg", "webp"],

  // ── Vector & Design ─────────────────────────────────────────────────────────
  svg:  ["png", "jpg", "jpeg", "webp", "bmp", "ico", "pdf", "eps"],
  ai:   ["png", "jpg", "jpeg", "webp", "svg", "eps", "pdf"],
  eps:  ["png", "jpg", "jpeg", "webp", "svg", "ai",  "pdf"],
  psd:  ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "pdf"],
  cdr:  ["png", "jpg", "jpeg", "webp", "svg", "eps", "pdf"],
  indd: ["png", "jpg", "jpeg", "eps", "pdf"],
  xcf:  ["png", "jpg", "svg", "pdf"],
  sketch: ["svg", "png", "pdf"],
  fig:  ["svg", "png", "pdf"],
  wmf:  ["png", "svg", "emf", "pdf"],
  emf:  ["png", "svg", "wmf", "pdf"],

  // ── Icons ───────────────────────────────────────────────────────────────────
  ico:  ["png", "jpg", "jpeg", "bmp", "icns", "svg"],
  icns: ["png", "jpg", "jpeg", "ico", "svg"],
  cur:  ["png", "ico"],

  // ── CAD ─────────────────────────────────────────────────────────────────────
  dwg:  ["dxf", "pdf", "svg", "step"],
  dxf:  ["dwg", "pdf", "svg", "step"],
  step: ["stl", "obj", "fbx", "iges", "dxf"],
  stp:  ["stl", "obj", "fbx", "step"],
  iges: ["step", "obj", "stl", "dxf"],
  igs:  ["iges", "step", "obj"],
  skp:  ["obj", "dae", "glb", "stl"],
  fcstd: ["step", "obj", "stl"],

  // ── 3D Models ───────────────────────────────────────────────────────────────
  stl:  ["obj", "glb", "fbx", "step", "3mf", "ply"],
  obj:  ["stl", "glb", "fbx", "step", "dae", "3mf"],
  fbx:  ["obj", "stl", "glb", "dae", "usd"],
  glb:  ["gltf", "fbx", "obj", "usdz"],
  gltf: ["glb", "fbx", "obj", "usdz"],
  dae:  ["glb", "fbx", "obj", "stl"],
  ply:  ["obj", "stl", "glb"],
  "3ds": ["obj", "fbx", "stl"],
  usd:  ["glb", "fbx", "usdz"],
  usdz: ["glb", "usd", "fbx"],
  wrl:  ["glb", "obj", "dae"],
  x3d:  ["glb", "dae"],
  "3mf": ["stl", "obj"],
  abc:  ["glb", "fbx"],
  blend: ["glb", "fbx", "obj", "dae"],
  ma:   ["fbx", "obj", "glb"],
  mb:   ["fbx", "obj"],
  c4d:  ["fbx", "obj", "glb"],
  lwo:  ["obj", "fbx"],

  // ── Video ───────────────────────────────────────────────────────────────────
  mp4:  ["webm", "avi", "mov", "mkv", "wmv", "flv", "m4v", "mpeg", "3gp", "ogv", "gif", "mp3", "wav", "ogg", "aac", "m4a", "hevc"],
  webm: ["mp4",  "avi", "mov", "mkv", "ogv", "gif", "mp3", "wav", "ogg", "aac"],
  avi:  ["mp4",  "webm", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav"],
  mov:  ["mp4",  "webm", "avi", "mkv", "m4v", "gif", "mp3", "wav", "aac"],
  mkv:  ["mp4",  "webm", "avi", "mov", "ogv", "gif", "mp3", "wav", "ogg", "flac"],
  wmv:  ["mp4",  "webm", "avi", "mov", "flv", "gif", "mp3", "wav"],
  flv:  ["mp4",  "webm", "avi", "mov", "gif", "mp3", "wav"],
  mpeg: ["mp4",  "webm", "avi", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav", "ogg", "aac"],
  mpg:  ["mp4",  "webm", "avi", "mov", "mkv", "wmv", "flv", "gif", "mp3", "wav", "ogg", "aac"],
  m4v:  ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "aac", "m4a"],
  "3gp":["mp4",  "webm", "avi", "mov", "gif", "mp3", "wav", "aac"],
  ogv:  ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "ogg"],
  ts:   ["mp4",  "webm", "avi", "mov", "mkv", "gif", "mp3", "wav", "aac"],
  f4v:  ["mp4",  "webm", "avi", "mov", "flv", "gif", "mp3", "wav"],
  hevc: ["mp4",  "mkv",  "webm", "avi"],
  m2ts: ["mp4",  "mkv",  "avi"],
  "264": ["mp4", "mkv",  "mov"],
  "265": ["mp4", "mkv",  "mov", "hevc"],
  rm:   ["mp4",  "webm", "avi", "mp3"],
  rmvb: ["mp4",  "avi",  "mkv"],
  vp9:  ["webm", "mp4"],
  av1:  ["mp4",  "webm"],
  divx: ["mp4",  "avi",  "mkv"],
  xvid: ["mp4",  "avi"],
  vob:  ["mp4",  "avi",  "mkv", "mov"],
  asf:  ["wmv",  "mp4",  "avi"],

  // ── Audio ───────────────────────────────────────────────────────────────────
  mp3:  ["wav",  "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus"],
  wav:  ["mp3",  "ogg", "flac", "aac", "m4a", "wma", "aiff", "opus"],
  ogg:  ["mp3",  "wav", "flac", "aac", "m4a", "opus"],
  flac: ["mp3",  "wav", "ogg", "aac", "m4a", "aiff"],
  aac:  ["mp3",  "wav", "ogg", "flac", "m4a", "opus"],
  m4a:  ["mp3",  "wav", "ogg", "flac", "aac", "aiff"],
  wma:  ["mp3",  "wav", "ogg", "aac", "flac"],
  aiff: ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  opus: ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  ac3:  ["mp3",  "wav", "ogg", "flac", "aac", "m4a"],
  amr:  ["mp3",  "wav", "aac", "ogg",  "m4a"],
  caf:  ["mp3",  "wav", "ogg", "flac", "aac", "m4a", "aiff"],
  alac: ["flac", "wav", "mp3", "aac",  "m4a"],
  ape:  ["flac", "wav", "mp3", "ogg"],
  wv:   ["flac", "wav", "mp3"],
  mid:  ["wav",  "mp3", "ogg"],
  midi: ["wav",  "mp3", "ogg"],
  dsd:  ["flac", "wav", "dts"],
  ra:   ["mp3",  "wav", "aac"],
  au:   ["wav",  "mp3", "aac"],
  tta:  ["flac", "wav", "mp3"],
  mpc:  ["mp3",  "ogg", "flac"],
  dts:  ["aac",  "mp3", "flac", "wav"],
  mka:  ["flac", "mp3", "wav"],
  spx:  ["ogg",  "mp3", "wav"],
  gsm:  ["mp3",  "wav"],
  mod:  ["wav",  "mp3"],
  xm:   ["wav",  "mp3"],

  // ── PDF ──────────────────────────────────────────────────────────────────────
  pdf:  ["jpg", "png", "webp", "svg", "txt", "docx", "xlsx", "pptx", "html", "epub"],

  // ── Document ────────────────────────────────────────────────────────────────
  doc:  ["docx", "pdf", "txt",  "rtf", "odt", "html", "epub"],
  docx: ["doc",  "pdf", "txt",  "rtf", "odt", "html", "epub", "md"],
  docm: ["docx", "pdf", "txt"],
  dotx: ["docx", "pdf"],
  txt:  ["pdf",  "docx", "html", "rtf", "md",  "epub"],
  rtf:  ["pdf",  "docx", "txt",  "html", "odt"],
  odt:  ["docx", "pdf", "txt",  "html", "epub"],
  html: ["pdf",  "txt", "docx", "md",   "epub"],
  xhtml: ["html", "pdf", "txt"],
  mhtml: ["html", "pdf"],
  url:   ["pdf",  "html"],
  md:   ["pdf",  "html", "txt", "docx", "epub"],
  rst:  ["html", "pdf", "md",  "txt"],
  adoc: ["html", "pdf", "md",  "txt"],
  tex:  ["pdf",  "html"],
  pages: ["docx", "pdf"],
  wps:  ["docx", "pdf"],
  abw:  ["docx", "pdf"],
  bib:  ["json", "csv",  "txt"],

  // ── Spreadsheet ─────────────────────────────────────────────────────────────
  xls:  ["xlsx", "pdf", "ods",  "csv", "tsv", "html"],
  xlsx: ["xls",  "pdf", "ods",  "csv", "tsv", "html", "json"],
  xlsm: ["xlsx", "pdf", "csv"],
  xlsb: ["xlsx", "pdf", "csv"],
  ods:  ["xlsx", "xls", "pdf", "csv", "tsv"],
  csv:  ["xlsx", "xls", "ods", "json", "tsv", "html", "pdf"],
  tsv:  ["csv",  "xlsx", "json", "html"],
  numbers: ["xlsx", "pdf", "csv"],

  // ── Presentation ─────────────────────────────────────────────────────────────
  ppt:  ["pptx", "pdf", "odp",  "jpg", "png"],
  pptx: ["ppt",  "pdf", "odp",  "jpg", "png", "html"],
  odp:  ["pptx", "ppt", "pdf",  "jpg"],
  key:  ["pptx", "pdf"],

  // ── eBook ────────────────────────────────────────────────────────────────────
  epub: ["pdf",  "txt", "html", "mobi", "azw3", "docx"],
  mobi: ["epub", "pdf", "txt",  "html", "azw3"],
  azw3: ["epub", "pdf", "txt",  "html", "mobi"],
  azw:  ["epub", "mobi", "pdf", "txt"],
  fb2:  ["epub", "mobi", "pdf", "txt"],
  djvu: ["pdf",  "epub", "txt"],
  cbz:  ["cbr",  "epub", "pdf"],
  cbr:  ["cbz",  "epub", "pdf"],
  lit:  ["epub", "mobi", "pdf"],
  pdb:  ["epub", "mobi"],
  lrf:  ["epub", "mobi"],

  // ── Archive ──────────────────────────────────────────────────────────────────
  zip:  ["7z",   "tar", "gz",   "rar", "bz2", "xz"],
  rar:  ["zip",  "7z",  "tar",  "gz"],
  "7z": ["zip",  "tar", "gz",   "rar", "bz2", "xz"],
  tar:  ["zip",  "gz",  "bz2",  "xz",  "7z"],
  gz:   ["zip",  "tar", "bz2",  "7z",  "xz"],
  tgz:  ["zip",  "tar", "7z"],
  bz2:  ["gz",   "zip", "tar",  "7z",  "xz"],
  xz:   ["gz",   "zip", "tar",  "7z"],
  lz4:  ["gz",   "zip"],
  zstd: ["gz",   "zip", "7z"],
  cab:  ["zip",  "7z"],
  lzma: ["xz",   "gz"],
  lha:  ["zip",  "7z"],
  tbz2: ["tar",  "zip"],
  txz:  ["tar",  "zip"],
  cpio: ["tar",  "zip"],
  ar:   ["tar"],
  ace:  ["zip",  "7z",  "tar"],

  // ── Font ─────────────────────────────────────────────────────────────────────
  ttf:  ["woff", "woff2", "otf", "eot", "svg"],
  otf:  ["woff", "woff2", "ttf", "eot", "svg"],
  woff: ["woff2","ttf",   "otf", "eot"],
  woff2:["woff", "ttf",   "otf"],
  eot:  ["woff2","ttf",   "otf"],
  fon:  ["ttf"],
  pfa:  ["ttf",  "otf"],
  pfb:  ["ttf",  "otf"],
  ttc:  ["ttf",  "woff2"],
  otc:  ["otf",  "woff2"],
  sfd:  ["ttf",  "otf", "woff2"],
  dfont: ["ttf", "otf"],

  // ── GIS ──────────────────────────────────────────────────────────────────────
  geojson: ["kml", "kmz", "shp", "topojson", "gpkg", "csv", "wkt"],
  kml:  ["geojson", "kmz", "shp", "topojson", "gpx"],
  kmz:  ["kml",  "geojson", "shp"],
  shp:  ["geojson", "kml", "topojson", "gpkg", "csv"],
  gpx:  ["kml",  "geojson", "csv"],
  topojson: ["geojson", "shp"],
  gpkg: ["geojson", "shp", "csv"],
  osm:  ["geojson", "kml"],
  wkt:  ["geojson"],
  geotiff: ["tiff", "geojson", "png"],
  fgb:  ["geojson", "shp"],

  // ── Email ─────────────────────────────────────────────────────────────────────
  eml:  ["msg", "mbox", "pdf", "html"],
  msg:  ["eml", "mbox", "pdf", "html"],
  mbox: ["eml", "pdf"],
  emlx: ["eml", "mbox", "pdf"],

  // ── Code / Data ──────────────────────────────────────────────────────────────
  json: ["csv",  "yaml", "xml",  "toml", "xlsx", "html"],
  xml:  ["json", "csv",  "yaml", "html", "txt"],
  yaml: ["json", "toml", "xml",  "csv"],
  yml:  ["yaml", "json", "toml", "xml"],
  toml: ["json", "yaml", "ini"],
  ini:  ["toml", "json", "yaml"],
  ics:  ["json", "csv",  "html"],
  vcf:  ["json", "csv",  "txt"],
  graphql: ["json", "ts"],
  proto: ["json"],
  parquet: ["csv", "json", "xlsx"],
  avro: ["json", "csv"],
  ndjson: ["json", "csv"],
  ipynb: ["html", "pdf", "py"],
  r:    ["py"],
  py:   ["js",  "html"],
  js:   ["ts",  "html"],

  // ── Webpage ──────────────────────────────────────────────────────────────────

  // ── Subtitle ──────────────────────────────────────────────────────────────────
  srt:  ["vtt", "ass", "ssa", "ttml", "sbv", "lrc"],
  vtt:  ["srt", "ass", "ssa", "ttml", "sbv"],
  ass:  ["srt", "vtt", "ssa", "ttml"],
  ssa:  ["srt", "vtt", "ass"],
  sub:  ["srt", "vtt"],
  sbv:  ["srt", "vtt", "ass"],
  lrc:  ["srt", "vtt"],
  ttml: ["srt", "vtt", "ass"],
  smi:  ["srt", "vtt"],
  dfxp: ["srt", "vtt", "ttml"],

  // ── Certificate ──────────────────────────────────────────────────────────────
  pem:  ["der", "p12", "pfx", "crt", "p7b"],
  crt:  ["pem", "der",  "p12"],
  cer:  ["pem", "der"],
  der:  ["pem", "crt",  "p12"],
  p12:  ["pem", "pfx",  "crt"],
  pfx:  ["pem", "p12",  "crt"],
  p7b:  ["pem", "crt"],
  csr:  ["pem"],
  p8:   ["pem"],
  jks:  ["p12", "pem"],
  p7c:  ["pem", "crt"],
  spc:  ["pem"],

  // ── Scientific ───────────────────────────────────────────────────────────────
  fits: ["png",  "tiff", "csv"],
  hdf5: ["csv",  "json", "nc"],
  h5:   ["csv",  "json"],
  mat:  ["csv",  "json"],
  nc:   ["csv",  "json", "hdf5"],
  npy:  ["csv",  "json"],
  npz:  ["npy",  "csv"],
  vtk:  ["csv",  "vtu"],
  vtu:  ["vtk",  "csv"],
  grib: ["nc",   "csv"],

  // ── Medical ──────────────────────────────────────────────────────────────────
  dcm:  ["png",  "jpg", "tiff", "nii"],
  dicom:["png",  "jpg", "tiff"],
  nii:  ["dcm",  "nrrd", "mha"],
  mgh:  ["nii"],
  nrrd: ["nii",  "dcm"],
  mha:  ["nrrd", "nii"],
  mnc:  ["nii",  "dcm"],

  // ── Disk Image ───────────────────────────────────────────────────────────────
  iso:  ["img",  "bin"],
  img:  ["iso",  "vhd"],
  bin:  ["iso"],
  vhd:  ["vmdk", "qcow2", "vdi"],
  vmdk: ["vhd",  "qcow2", "vdi"],
  vdi:  ["vmdk", "qcow2"],
  qcow2: ["vmdk","vhd",  "vdi"],
  dmg:  ["iso",  "img"],

  // ── Executable ───────────────────────────────────────────────────────────────
  exe:  ["msi"],
  apk:  ["zip"],
  ipa:  ["zip"],
  deb:  ["rpm",  "tar"],
  rpm:  ["deb",  "tar"],
  jar:  ["zip"],
  war:  ["jar",  "zip"],
};

// ---------------------------------------------------------------------------
// DOMAIN MAPPINGS
// ---------------------------------------------------------------------------

const DOMAIN_MAP: Record<string, ConversionDomain> = {
  image: 'image',
  raw: 'image',
  vector: 'image',
  icon: 'image',
  cad: 'image',
  video: 'video',
  audio: 'audio',
  document: 'pdf',
};

const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'opus', 'ac3', 'amr', 'caf']);

// ---------------------------------------------------------------------------
// REGISTRY CLASS
// ---------------------------------------------------------------------------

class ConversionRegistry {
  private matrix: Map<string, string[]>;

  constructor() {
    this.matrix = new Map();
    for (const [src, targets] of Object.entries(CONVERSION_MATRIX)) {
      this.matrix.set(src.toLowerCase(), [...targets]);
    }
  }

  /** Check if conversion is valid */
  isValid(source: string, target: string): boolean {
    const targets = this.matrix.get(source.toLowerCase());
    return targets?.includes(target.toLowerCase()) ?? false;
  }

  /** Get valid targets for source */
  getTargets(source: string): string[] {
    return [...(this.matrix.get(source.toLowerCase()) || [])];
  }

  /** Get target format definitions */
  getTargetFormats(source: string): FormatDefinition[] {
    const targets = this.getTargets(source);
    return targets
      .map(ext => formatRegistry.get(ext))
      .filter((f): f is FormatDefinition => f !== undefined);
  }

  /** Get all conversion slugs */
  getAllSlugs(): string[] {
    const slugs: string[] = [];
    for (const [source, targets] of Object.entries(CONVERSION_MATRIX)) {
      for (const target of targets) {
        slugs.push(`${source}-to-${target}`);
      }
    }
    return slugs;
  }

  /** Parse conversion slug */
  parseSlug(slug: string): ParsedConversionSlug | null {
    if (!slug || typeof slug !== "string") return null;

    const lower = slug.toLowerCase();
    const parts = lower.split("-to-");

    if (parts.length === 2 && parts[0] && parts[1]) {
      const inputFormat = parts[0];
      const outputFormat = parts[1];
      const inputEntry = formatRegistry.get(inputFormat);
      const outputEntry = formatRegistry.get(outputFormat);

      if (!inputEntry || !outputEntry) return null;
      if (!this.isValid(inputFormat, outputFormat)) return null;

      return {
        inputFormat,
        outputFormat,
        inputName: inputEntry.name,
        outputName: outputEntry.name,
        inputCategory: inputEntry.category,
        outputCategory: outputEntry.category,
        inputMime: inputEntry.mime,
        outputMime: outputEntry.mime,
        isValid: true,
        isSingleFormat: false,
      };
    }

    // Single-format slug
    const entry = formatRegistry.get(lower);
    if (!entry || !this.matrix.has(lower)) return null;

    return {
      inputFormat: lower,
      outputFormat: null,
      inputName: entry.name,
      outputName: null,
      inputCategory: entry.category,
      outputCategory: null,
      inputMime: entry.mime,
      outputMime: null,
      isValid: true,
      isSingleFormat: true,
    };
  }

  /** Infer conversion operation */
  inferOperation(sourceExt: string, targetExt: string): ConversionOperation {
    const src = sourceExt.toLowerCase();
    const tgt = targetExt.toLowerCase();
    const srcDomain = formatRegistry.get(src)?.category;

    if (srcDomain === 'image' || srcDomain === 'raw' || srcDomain === 'vector' || srcDomain === 'icon') {
      return 'image:convert';
    }
    if (srcDomain === 'video') {
      if (AUDIO_EXTS.has(tgt)) return 'video:extract-audio';
      if (tgt === 'gif') return 'video:gif';
      return 'video:convert';
    }
    if (srcDomain === 'audio') {
      return 'audio:convert';
    }
    if (srcDomain === 'document' || srcDomain === 'cad') {
      if (tgt === 'pdf') return 'pdf:compress';
      if (tgt === 'docx') return 'doc:convert';
      return 'doc:convert';
    }

    return 'image:convert';
  }

  /** Get related conversions */
  getRelated(inputFormat: string, outputFormat: string | null, limit = 6): RelatedConversion[] {
    if (!outputFormat) return [];

    const related: RelatedConversion[] = [];
    const seen = new Set<string>();
    const currentSlug = `${inputFormat}-to-${outputFormat}`;

    const push = (from: string, to: string, label: string) => {
      const slug = `${from}-to-${to}`;
      if (slug === currentSlug || seen.has(slug)) return;
      if (!this.isValid(from, to)) return;
      const fromEntry = formatRegistry.get(from);
      const toEntry = formatRegistry.get(to);
      if (!fromEntry || !toEntry) return;
      seen.add(slug);
      related.push({
        slug,
        inputFormat: from,
        outputFormat: to,
        inputName: fromEntry.name,
        outputName: toEntry.name,
        category: fromEntry.category,
        relationLabel: label,
      });
    };

    for (const out of this.getTargets(inputFormat)) {
      if (related.length >= limit) break;
      if (out !== outputFormat) push(inputFormat, out, "Same input");
    }

    push(outputFormat, inputFormat, "Reverse");

    for (const out of this.getTargets(outputFormat)) {
      if (related.length >= limit) break;
      if (out !== inputFormat) push(outputFormat, out, "From output");
    }

    return related.slice(0, limit);
  }

  /** Get available outputs for single format page */
  getAvailableOutputs(inputExt: string): { ext: string; name: string; mime: string; category: string }[] {
    return this.getTargets(inputExt).map(ext => {
      const f = formatRegistry.get(ext);
      return f ? { ext: f.ext, name: f.name, mime: f.mime, category: f.category } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }

  /** Get all conversion pairs as flat array */
  getAllConversions(): { source: string; target: string }[] {
    const conversions: { source: string; target: string }[] = [];
    this.matrix.forEach((targets, source) => {
      for (const target of targets) {
        conversions.push({ source, target });
      }
    });
    return conversions;
  }

  /** Get source formats for a converter type */
  getSourcesForConverterType(type: ConverterType): FormatDefinition[] {
    const categoryMap: Record<ConverterType, FormatCategory[]> = {
      image:        ['image', 'raw', 'vector', 'icon', 'cad'],
      raw:          ['raw'],
      vector:       ['vector'],
      icon:         ['icon'],
      "3d":         ['3d'],
      cad:          ['cad'],
      video:        ['video'],
      audio:        ['audio'],
      pdf:          ['pdf'],
      document:     ['document'],
      spreadsheet:  ['spreadsheet'],
      presentation: ['presentation'],
      ebook:        ['ebook'],
      archive:      ['archive'],
      font:         ['font'],
      gis:          ['gis'],
      email:        ['email'],
      code:         ['code'],
      webpage:      ['webpage'],
      subtitle:     ['subtitle'],
      certificate:  ['certificate'],
      scientific:   ['scientific'],
      medical:      ['medical'],
      "disk-image": ['disk-image'],
      executable:   ['executable'],
    };

    const ebookExts = new Set(['epub', 'mobi', 'azw3', 'pdf', 'doc', 'docx', 'txt', 'html', 'rtf', 'odt']);
    const categories = categoryMap[type] || [];

    return formatRegistry.getAll().filter((f) => {
      if (!categories.includes(f.category)) return false;
      if (!this.matrix.has(f.ext)) return false;
      if (type === 'ebook') return ebookExts.has(f.ext);
      return true;
    });
  }
}

export const conversionRegistry = new ConversionRegistry();
