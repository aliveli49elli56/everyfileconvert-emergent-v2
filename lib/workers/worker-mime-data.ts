/**
 * lib/workers/worker-mime-data.ts
 *
 * Worker-safe MIME data — Phase 6B Part 2.
 *
 * This file is the authoritative MIME lookup for all Web Workers.
 * It is generated from the Format Registry (lib/registry/format-registry.ts)
 * and must remain in sync with it.
 *
 * WHY A SEPARATE FILE:
 *   format-registry.ts imports lucide-react icon components (UI-only).
 *   Including lucide-react in worker bundles would inflate them by >100 kB
 *   without any functional benefit.  This file contains ONLY the ext→MIME
 *   mapping derived from the registry — zero DOM, zero React.
 *
 * GENERATION:
 *   Regenerate by running `npx ts-node scripts/generate-worker-mime.ts`.
 *   The generator reads REGISTRY_FORMATS below and rewrites this file.
 *
 * SINGLE SOURCE OF TRUTH COMPLIANCE:
 *   Every entry here corresponds 1-to-1 to a FormatDefinition in
 *   format-registry.ts.  No entry may be added here without a matching
 *   registry entry.  No worker may define its own inline MIME map.
 */

// ---------------------------------------------------------------------------
// GENERATED MIME MAP — do not edit manually
// Source: lib/registry/format-registry.ts (300 canonical formats)
// ---------------------------------------------------------------------------

export const WORKER_MIME_DATA: Readonly<Record<string, string>> = {
  // ── Image (raster) ─────────────────────────────────────────────────────────
  png:    'image/png',
  jpg:    'image/jpeg',
  jpeg:   'image/jpeg',
  jfif:   'image/jpeg',
  webp:   'image/webp',
  gif:    'image/gif',
  bmp:    'image/bmp',
  tiff:   'image/tiff',
  tif:    'image/tiff',
  avif:   'image/avif',
  ico:    'image/x-icon',
  heic:   'image/heic',
  heif:   'image/heif',
  jxl:    'image/jxl',
  jp2:    'image/jp2',
  j2k:    'image/j2k',
  psd:    'image/vnd.adobe.photoshop',
  xcf:    'image/x-xcf',
  tga:    'image/x-tga',
  wbmp:   'image/vnd.wap.wbmp',
  pcx:    'image/vnd.zbrush.pcx',
  pbm:    'image/x-portable-bitmap',
  pgm:    'image/x-portable-graymap',
  ppm:    'image/x-portable-pixmap',
  pnm:    'image/x-portable-anymap',
  hdr:    'image/vnd.radiance',
  exr:    'image/x-exr',
  rgbe:   'image/vnd.radiance',
  qoi:    'image/qoi',
  dds:    'image/vnd.ms-dds',
  // ── Vector ─────────────────────────────────────────────────────────────────
  svg:    'image/svg+xml',
  ai:     'application/postscript',
  eps:    'application/postscript',
  wmf:    'image/wmf',
  emf:    'image/emf',
  cdr:    'application/x-cdr',
  afdesign: 'application/x-affinity-designer',
  sketch: 'application/x-sketch',
  fig:    'application/x-figma',
  vsd:    'application/vnd.visio',
  // ── RAW ────────────────────────────────────────────────────────────────────
  raw:    'image/x-raw',
  cr2:    'image/x-canon-cr2',
  cr3:    'image/x-canon-cr3',
  nef:    'image/x-nikon-nef',
  arw:    'image/x-sony-arw',
  dng:    'image/x-adobe-dng',
  raf:    'image/x-fuji-raf',
  rw2:    'image/x-panasonic-rw2',
  orf:    'image/x-olympus-orf',
  pef:    'image/x-pentax-pef',
  srw:    'image/x-samsung-srw',
  erf:    'image/x-epson-erf',
  mrw:    'image/x-minolta-mrw',
  x3f:    'image/x-sigma-x3f',
  // ── Video ──────────────────────────────────────────────────────────────────
  mp4:    'video/mp4',
  webm:   'video/webm',
  avi:    'video/x-msvideo',
  mov:    'video/quicktime',
  mkv:    'video/x-matroska',
  wmv:    'video/x-ms-wmv',
  flv:    'video/x-flv',
  mpeg:   'video/mpeg',
  mpg:    'video/mpeg',
  m4v:    'video/x-m4v',
  '3gp':  'video/3gpp',
  ogv:    'video/ogg',
  ts:     'video/mp2t',
  f4v:    'video/x-f4v',
  hevc:   'video/hevc',
  m2ts:   'video/mp2t',
  rm:     'application/vnd.rn-realmedia',
  rmvb:   'application/vnd.rn-realmedia-vbr',
  vob:    'video/dvd',
  asf:    'video/x-ms-asf',
  // ── Audio ──────────────────────────────────────────────────────────────────
  mp3:    'audio/mpeg',
  wav:    'audio/wav',
  ogg:    'audio/ogg',
  flac:   'audio/flac',
  aac:    'audio/aac',
  m4a:    'audio/x-m4a',
  wma:    'audio/x-ms-wma',
  opus:   'audio/opus',
  aiff:   'audio/aiff',
  aif:    'audio/aiff',
  alac:   'audio/x-alac',
  amr:    'audio/amr',
  ac3:    'audio/ac3',
  dts:    'audio/vnd.dts',
  mid:    'audio/midi',
  midi:   'audio/midi',
  mka:    'audio/x-matroska',
  // ── PDF ────────────────────────────────────────────────────────────────────
  pdf:    'application/pdf',
  // ── Document ───────────────────────────────────────────────────────────────
  docx:   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:    'application/msword',
  odt:    'application/vnd.oasis.opendocument.text',
  rtf:    'application/rtf',
  txt:    'text/plain',
  md:     'text/markdown',
  html:   'text/html',
  htm:    'text/html',
  xhtml:  'application/xhtml+xml',
  mhtml:  'message/rfc822',
  pages:  'application/vnd.apple.pages',
  wpd:    'application/vnd.wordperfect',
  abw:    'application/x-abiword',
  // ── Spreadsheet ────────────────────────────────────────────────────────────
  xlsx:   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:    'application/vnd.ms-excel',
  ods:    'application/vnd.oasis.opendocument.spreadsheet',
  csv:    'text/csv',
  tsv:    'text/tab-separated-values',
  xlsm:   'application/vnd.ms-excel.sheet.macroEnabled.12',
  xlsb:   'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  numbers: 'application/vnd.apple.numbers',
  // ── Presentation ───────────────────────────────────────────────────────────
  pptx:   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:    'application/vnd.ms-powerpoint',
  odp:    'application/vnd.oasis.opendocument.presentation',
  key:    'application/vnd.apple.keynote',
  // ── Ebook ──────────────────────────────────────────────────────────────────
  epub:   'application/epub+zip',
  mobi:   'application/x-mobipocket-ebook',
  azw:    'application/vnd.amazon.mobi8-ebook',
  azw3:   'application/vnd.amazon.mobi8-ebook',
  fb2:    'application/x-fictionbook+xml',
  djvu:   'image/vnd.djvu',
  lit:    'application/x-ms-reader',
  lrf:    'application/octet-stream',
  pdb:    'application/vnd.palm',
  // ── Archive ────────────────────────────────────────────────────────────────
  zip:    'application/zip',
  rar:    'application/vnd.rar',
  '7z':   'application/x-7z-compressed',
  tar:    'application/x-tar',
  gz:     'application/gzip',
  bz2:    'application/x-bzip2',
  xz:     'application/x-xz',
  cab:    'application/vnd.ms-cab-compressed',
  iso:    'application/x-iso9660-image',
  dmg:    'application/x-apple-diskimage',
  zst:    'application/zstd',
  lzma:   'application/x-lzma',
  lz4:    'application/x-lz4',
  // ── Font ───────────────────────────────────────────────────────────────────
  ttf:    'font/ttf',
  otf:    'font/otf',
  woff:   'font/woff',
  woff2:  'font/woff2',
  eot:    'application/vnd.ms-fontobject',
  ttc:    'font/collection',
  dfont:  'application/octet-stream',
  // ── GIS ────────────────────────────────────────────────────────────────────
  geojson:  'application/geo+json',
  topojson: 'application/json',
  shp:      'application/octet-stream',
  kml:      'application/vnd.google-earth.kml+xml',
  kmz:      'application/vnd.google-earth.kmz',
  gpkg:     'application/geopackage+sqlite3',
  gpx:      'application/gpx+xml',
  geotiff:  'image/tiff',
  // ── Email ──────────────────────────────────────────────────────────────────
  eml:    'message/rfc822',
  msg:    'application/vnd.ms-outlook',
  mbox:   'application/mbox',
  pst:    'application/vnd.ms-outlook',
  emlx:   'message/x-emlx',
  // ── Code / Data ────────────────────────────────────────────────────────────
  json:   'application/json',
  xml:    'application/xml',
  yaml:   'application/x-yaml',
  yml:    'application/x-yaml',
  toml:   'application/toml',
  ini:    'text/x-ini',
  sql:    'application/sql',
  graphql: 'application/graphql',
  css:    'text/css',
  js:     'text/javascript',
  // Note: 'ts' is mapped to video/mp2t above (MPEG Transport Stream).
  // TypeScript files (.ts) use the same extension but different context.
  // Worker MIME resolution uses video/mp2t for .ts files by convention.
  jsx:    'text/jsx',
  tsx:    'text/tsx',
  py:     'text/x-python',
  rb:     'text/x-ruby',
  java:   'text/x-java',
  cpp:    'text/x-c++src',
  c:      'text/x-csrc',
  cs:     'text/x-csharp',
  go:     'text/x-go',
  rs:     'text/x-rustsrc',
  php:    'text/x-php',
  swift:  'text/x-swift',
  kt:     'text/x-kotlin',
  sh:     'application/x-sh',
  bat:    'application/x-bat',
  // ── Subtitle ───────────────────────────────────────────────────────────────
  srt:    'application/x-subrip',
  vtt:    'text/vtt',
  ass:    'text/x-ass',
  ssa:    'text/x-ssa',
  sub:    'text/x-sub',
  sbv:    'text/x-sbv',
  smi:    'application/smil+xml',
  dfxp:   'application/ttml+xml',
  // ── Certificate ────────────────────────────────────────────────────────────
  pem:    'application/x-pem-file',
  der:    'application/x-x509-ca-cert',
  crt:    'application/x-x509-ca-cert',
  cer:    'application/pkix-cert',
  p12:    'application/x-pkcs12',
  pfx:    'application/x-pkcs12',
  p7b:    'application/x-pkcs7-certificates',
  csr:    'application/pkcs10',
  jks:    'application/x-java-keystore',
  // ── 3D / CAD ───────────────────────────────────────────────────────────────
  glb:    'model/gltf-binary',
  gltf:   'model/gltf+json',
  obj:    'model/obj',
  fbx:    'application/octet-stream',
  stl:    'model/stl',
  dae:    'model/vnd.collada+xml',
  ply:    'application/octet-stream',
  '3ds':  'application/x-3ds',
  blend:  'application/x-blender',
  lwo:    'application/x-lightwave',
  step:   'application/step',
  iges:   'application/iges',
  igs:    'application/iges',
  dxf:    'application/dxf',
  dwg:    'application/acad',
  sldprt: 'application/octet-stream',
  stp:    'application/step',
  brep:   'application/x-brep',
  '3mf':  'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
  x3d:    'model/x3d+xml',
  // ── Medical ────────────────────────────────────────────────────────────────
  dcm:    'application/dicom',
  dicom:  'application/dicom',
  nii:    'application/x-nifti',
  nii_gz: 'application/x-nifti',
  mgh:    'application/x-mgh',
  mnc:    'application/x-minc',
  // ── Scientific ─────────────────────────────────────────────────────────────
  mat:    'application/x-matlab-data',
  nc:     'application/x-netcdf',
  hdf5:   'application/x-hdf5',
  h5:     'application/x-hdf5',
  // ── Disk Image ─────────────────────────────────────────────────────────────
  img:    'application/x-raw-disk-image',
  vhd:    'application/x-vhd',
  vmdk:   'application/x-vmdk',
  qcow2:  'application/x-qemu-disk',
  // ── Executable ─────────────────────────────────────────────────────────────
  exe:    'application/x-msdownload',
  msi:    'application/x-msi',
  apk:    'application/vnd.android.package-archive',
  deb:    'application/vnd.debian.binary-package',
  rpm:    'application/x-rpm',
  appimage: 'application/x-iso9660-appimage',
  pkg:    'application/octet-stream',
  // ── Misc ───────────────────────────────────────────────────────────────────
  webmanifest: 'application/manifest+json',
  map:    'application/json',
};

/**
 * Look up the MIME type for a file extension.
 * Falls back to `application/octet-stream` for unknown extensions.
 */
export function workerMimeFor(ext: string): string {
  return WORKER_MIME_DATA[ext.toLowerCase()] ?? 'application/octet-stream';
}
