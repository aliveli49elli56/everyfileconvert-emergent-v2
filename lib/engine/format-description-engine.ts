/**
 * lib/engine/format-description-engine.ts
 * Format Description Engine — Phase 7.1
 *
 * Generates rich per-format metadata, copy, and structured content for every
 * landing page type: converter, viewer, tool, category.
 *
 * Sources:
 *   - format-registry (tier, searchVolume, browserNative, providers, description)
 *   - CATEGORY_DEFINITIONS (category labels, gradients)
 *   - Internal lookup tables (no hardcoded landing copy)
 *
 * Registry remains the single source of truth.
 * Adding a new registry entry automatically provides metadata through this engine.
 */

import { formatRegistry, CATEGORY_DEFINITIONS } from '../registry/format-registry';
import type { FormatCategory } from '../types/formats';

// ---------------------------------------------------------------------------
// PUBLIC TYPES
// ---------------------------------------------------------------------------

export interface FormatProfile {
  ext: string;
  name: string;
  mime: string;
  category: FormatCategory;
  description: string;
  browserSupport: 'full' | 'partial' | 'none';
  compressionType: 'lossy' | 'lossless' | 'none' | 'both';
  supportsTransparency: boolean;
  supportsAnimation: boolean;
  isVector: boolean;
  colorDepth: string;
  isEditable: boolean;
  isPrintable: boolean;
  supportsStreaming: boolean;
  compatibility: string;
  avgFileSize: string;
}

export interface FAQItem { q: string; a: string }

export interface DescriptionContext {
  variant: 'converter' | 'viewer' | 'tool' | 'category';
  inputExt?: string;
  outputExt?: string;
  category: FormatCategory;
  toolName?: string;
  toolMode?: string;
}

// ---------------------------------------------------------------------------
// LOOKUP TABLES (format-level, not registry-level)
// ---------------------------------------------------------------------------

const TRANSPARENCY_FORMATS = new Set([
  'png', 'webp', 'gif', 'svg', 'ico', 'icns', 'apng', 'avif', 'psd', 'tiff',
  'ai', 'eps', 'xcf', 'cur', 'jxl',
]);

const ANIMATION_FORMATS = new Set([
  'gif', 'webp', 'apng', 'avif', 'jxl',
  'mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'mpeg', 'mpg', 'm4v',
  '3gp', 'ogv', 'ts', 'f4v',
]);

const VECTOR_FORMATS = new Set([
  'svg', 'eps', 'ai', 'cdr', 'emf', 'wmf', 'dxf', 'dwg', 'indd',
  'fig', 'sketch', 'xd', 'afdesign',
]);

const COMPRESSION_MAP: Record<string, 'lossy' | 'lossless' | 'none' | 'both'> = {
  jpg: 'lossy', jpeg: 'lossy', heic: 'lossy', heif: 'lossy',
  avif: 'both', webp: 'both', jxl: 'both',
  png: 'lossless', gif: 'lossless', tiff: 'lossless',
  bmp: 'none', pnm: 'none',
  mp3: 'lossy', aac: 'lossy', ogg: 'lossy', wma: 'lossy',
  amr: 'lossy', ac3: 'lossy', opus: 'lossy', m4a: 'lossy',
  wav: 'none', aiff: 'none', caf: 'none',
  flac: 'lossless',
  mp4: 'lossy', webm: 'lossy', mov: 'lossy', wmv: 'lossy', flv: 'lossy',
  avi: 'both', mkv: 'both',
  zip: 'lossless', gz: 'lossless', '7z': 'lossless', rar: 'lossless', tar: 'none',
  pdf: 'both',
  svg: 'none',
};

const COLOR_DEPTH_MAP: Record<string, string> = {
  gif: '8-bit (256 colors)',
  jpg: '24-bit', jpeg: '24-bit',
  png: 'up to 48-bit',
  webp: '24-bit', avif: '12-bit per channel',
  bmp: 'up to 32-bit', tiff: 'up to 64-bit',
  heic: '10-bit',
  psd: 'up to 32-bit per channel',
  raw: '12–14 bit sensor data',
  svg: 'unlimited (vector)',
  hdr: 'floating-point HDR',
  exr: '16/32-bit float per channel',
};

const STREAMING_FORMATS = new Set([
  'mp4', 'webm', 'ogv', 'ts', 'm4v', '3gp',
  'mp3', 'aac', 'ogg', 'opus', 'm4a',
]);

const PRINTABLE_CATEGORIES = new Set<FormatCategory>([
  'pdf', 'document', 'spreadsheet', 'presentation', 'image', 'vector',
]);

const EDITABLE_FORMATS = new Set([
  'docx', 'doc', 'odt', 'rtf', 'txt', 'md', 'html',
  'xlsx', 'xls', 'ods', 'csv',
  'pptx', 'ppt', 'odp',
  'svg', 'json', 'xml', 'yaml', 'sql',
]);

const COMPATIBILITY_MAP: Record<string, string> = {
  jpg: 'Universal — all devices and browsers',
  jpeg: 'Universal — all devices and browsers',
  png: 'Universal — all devices and browsers',
  webp: 'All modern browsers (Chrome, Firefox, Safari 14+)',
  gif: 'Universal — supported since the early internet',
  mp4: 'Universal — all devices and platforms',
  mp3: 'Universal — all devices and media players',
  pdf: 'Universal — all devices with a PDF viewer',
  docx: 'Microsoft Office and compatible apps (Google Docs, LibreOffice)',
  xlsx: 'Microsoft Excel and compatible apps',
  pptx: 'Microsoft PowerPoint and compatible apps',
  heic: 'Apple devices natively; requires conversion for Windows',
  avif: 'Modern browsers (Chrome 85+, Firefox 93+, Safari 16+)',
  svg: 'All modern browsers and vector editors',
  flac: 'Most media players; limited mobile browser support',
  aac: 'All modern devices — Apple preferred format',
  opus: 'Modern browsers and apps',
  zip: 'Universal — native support on Windows, macOS, and Linux',
  epub: 'E-readers, Apple Books, Google Play Books',
  ttf: 'All operating systems and design tools',
  woff2: 'All modern web browsers',
};

const FORMAT_AVG_SIZE: Record<string, string> = {
  png: '50 KB – 2 MB', jpg: '50 KB – 1 MB', jpeg: '50 KB – 1 MB',
  webp: '20 KB – 500 KB', gif: '100 KB – 5 MB', bmp: '500 KB – 10 MB',
  tiff: '5 MB – 100 MB', raw: '15 – 50 MB', heic: '1 – 5 MB',
  avif: '30 KB – 800 KB', svg: '5 – 100 KB', psd: '10 – 500 MB',
  mp4: '10 MB – 2 GB', webm: '5 MB – 500 MB',
  mov: '50 MB – 2 GB', avi: '100 MB – 2 GB', mkv: '50 MB – 10 GB',
  mp3: '3 – 8 MB', wav: '10 – 50 MB', flac: '15 – 50 MB',
  aac: '3 – 8 MB', ogg: '3 – 7 MB', opus: '1 – 4 MB',
  pdf: '100 KB – 50 MB', docx: '20 KB – 5 MB',
  xlsx: '20 KB – 5 MB', pptx: '500 KB – 50 MB',
  epub: '200 KB – 10 MB',
  zip: '1 KB – several GB', '7z': '1 KB – several GB',
  ttf: '50 – 500 KB', woff: '20 – 100 KB', woff2: '10 – 80 KB',
};

const CATEGORY_AVG_SIZE: Record<string, string> = {
  image: '100 KB – 5 MB', raw: '15 – 50 MB', vector: '5 KB – 50 MB',
  video: '10 MB – 2 GB', audio: '3 – 50 MB',
  document: '50 KB – 5 MB', pdf: '100 KB – 50 MB',
  spreadsheet: '20 KB – 5 MB', presentation: '500 KB – 50 MB',
  archive: '1 KB – several GB', font: '10 – 500 KB', ebook: '200 KB – 10 MB',
  cad: '1 – 500 MB', '3d': '1 – 100 MB',
};

// ---------------------------------------------------------------------------
// ADVANTAGES & DISADVANTAGES
// ---------------------------------------------------------------------------

const FORMAT_ADVANTAGES: Record<string, string[]> = {
  png: ['Lossless compression preserves every pixel', 'Full transparency (alpha channel) support', 'Universal browser and OS support', 'Ideal for logos, screenshots, and line art'],
  jpg: ['Smallest file size for photographic content', 'Universal compatibility on all devices and browsers', 'Adjustable quality-to-size tradeoff', 'Perfect for sharing photos online'],
  webp: ['25–35% smaller than JPEG at the same quality', 'Supports both lossy and lossless modes', 'Full transparency support like PNG', 'Ideal for modern web image delivery'],
  gif: ['Supports simple looping animations', 'Lossless for graphics with flat colors', 'Universal browser support for decades', 'Compact for simple icons and badges'],
  svg: ['Infinitely scalable without any quality loss', 'Tiny file size for simple graphics and icons', 'Directly editable with a text editor or code', 'Perfect for logos and responsive UI elements'],
  mp4: ['Universal device and platform support', 'Excellent H.264 compression efficiency', 'Supports adaptive streaming and progressive download', 'Compatible with all major social platforms'],
  webm: ['Open royalty-free format designed for the web', 'Excellent compression with VP8/VP9 codecs', 'Supported natively in all modern browsers', 'Ideal for HTML5 video embedding'],
  mp3: ['Universal audio compatibility on every device', 'Good compression at 128–320 kbps', 'Supported in every media player and platform', 'Streaming-ready format'],
  flac: ['Perfect bit-for-bit audio reproduction', 'Open standard with no licensing fees', 'Smaller than WAV while remaining completely lossless', 'Supported in most quality media players'],
  wav: ['100% lossless uncompressed PCM audio', 'Industry standard for recording, editing, and mixing', 'Compatible with all DAWs and professional audio tools', 'No generation loss when re-encoding'],
  pdf: ['Fixed layout renders identically on all devices', 'Universal cross-platform compatibility', 'Supports digital signatures, forms, and annotations', 'Excellent for print and professional distribution'],
  docx: ['Full rich-text editing and collaboration support', 'Supports styles, headings, and complex formatting', 'Compatible with Microsoft Office, Google Docs, and LibreOffice', 'Easy to export to PDF when needed'],
  xlsx: ['Powerful formula and calculation engine', 'Supports charts, pivot tables, and data analysis', 'Compatible with all major spreadsheet applications', 'Rich conditional formatting and data validation'],
  epub: ['Reflowable text adapts to any screen size', 'Open standard supported by most e-readers', 'Supports embedded fonts and multimedia', 'Compact and portable format'],
  zip: ['Universal compression with no special software needed', 'Native support on Windows, macOS, and Linux', 'Bundles multiple files and directories into one', 'Lossless — all file types preserved perfectly'],
};

const FORMAT_DISADVANTAGES: Record<string, string[]> = {
  png: ['Larger than JPEG for photographic content', 'No native support for video or complex animations', 'Not suitable for high-motion or sequential imagery'],
  jpg: ['Lossy compression degrades quality with each save', 'No transparency or alpha channel support', 'Visible artifacts at high compression settings', 'Poor quality for text, logos, and line art'],
  webp: ['Older tools and browsers may not support it (pre-2020)', 'Less tooling support than JPEG/PNG in some workflows', 'Not all image editors support WebP natively'],
  gif: ['Limited 256-color palette (unsuitable for photography)', 'No audio support in animations', 'Replaced by WebP and APNG for quality animation use'],
  svg: ['Not suitable for photographic content', 'Complex SVGs can be difficult to create manually', 'Some applications do not support SVG rendering'],
  mp4: ['Re-encoding causes quality loss', 'H.264 may require licensing fees in some commercial contexts', 'Large file sizes for high-resolution or long content'],
  mp3: ['Lossy — original audio data is permanently discarded', 'Audible artifacts at very low bitrates', 'Not suitable for professional audio mastering'],
  flac: ['File sizes 5–8x larger than equivalent MP3', 'Not all mobile devices support native playback', 'Overkill for casual listening scenarios'],
  wav: ['Extremely large file sizes (uncompressed)', 'Limited metadata tagging support', 'Not suitable for web streaming or mobile distribution'],
  pdf: ['Editing requires specialized software', 'Complex layouts may not convert cleanly to editable formats', 'Embedded fonts and assets increase file size'],
  docx: ['Formatting can shift between different Office versions', 'Proprietary format with potential compatibility issues', 'Not ideal for final distribution (use PDF instead)'],
  zip: ['No encryption in basic ZIP (use 7-Zip AES for security)', 'Compression ineffective for already-compressed files', 'Less efficient compression than 7-Zip or RAR for large archives'],
};

const CATEGORY_ADVANTAGES: Record<string, string[]> = {
  image: ['Optimized for visual content storage and sharing', 'Supported across all operating systems and browsers', 'Multiple format options to match quality-vs-size needs'],
  raw: ['Captures maximum sensor data from camera', 'Non-destructive — original data always preserved', 'Allows full color grading and post-processing control'],
  video: ['Self-contained with synchronized audio and video track', 'Supported on virtually all modern devices and platforms', 'Multiple codec options for quality/compatibility tradeoffs'],
  audio: ['Portable format for music, podcasts, and voice recordings', 'Supported in all modern devices and media players', 'Suitable for streaming, download, and broadcast distribution'],
  document: ['Cross-platform text sharing with preserved formatting', 'Supported by all major office productivity suites', 'Editable and collaborative in real time'],
  pdf: ['Fixed layout renders consistently everywhere', 'Compact and portable across all platforms', 'Supports metadata, bookmarks, and interactive elements'],
  archive: ['Reduces multiple files to a single transferable package', 'Reduces total storage and transfer footprint', 'Preserves original directory structure and file attributes'],
  font: ['Scalable at any resolution without quality loss', 'Supported in web, mobile, and desktop environments', 'Includes typographic metadata and hinting information'],
  ebook: ['Readable on dedicated e-reader devices and apps', 'Supports adjustable text size and font preferences', 'Efficient for long-form text distribution'],
  cad: ['Precise engineering drawings with millimeter accuracy', 'Compatible with CAD/CAM workflows and 3D printers', 'Supports parametric modeling and revision history'],
  spreadsheet: ['Powerful formula and data analysis capabilities', 'Supports charts, pivots, and conditional formatting', 'Universal compatibility with office suites'],
  presentation: ['Supports slides, animations, and multimedia content', 'Optimized for projector and screen presentation', 'Compatible with all major presentation tools'],
};

const CATEGORY_DISADVANTAGES: Record<string, string[]> = {
  image: ['Binary format not human-readable or version-controllable', 'Quality depends on compression settings', 'Large files slow down page load times'],
  raw: ['Very large file sizes compared to processed formats', 'Requires RAW-compatible software to open', 'Camera-specific formats may have limited tool support'],
  video: ['Large file sizes require significant storage', 'Re-encoding always causes quality loss', 'Codec compatibility varies across devices and platforms'],
  audio: ['Lossy formats permanently discard audio data', 'Uncompressed formats produce impractically large files', 'DRM restrictions may limit playback in some players'],
  document: ['Formatting can shift across different applications', 'Binary formats are not directly version-controllable', 'May require proprietary software to edit perfectly'],
  pdf: ['Editing requires specialized tools', 'Complex PDFs may not convert cleanly to editable formats', 'Embedded content increases file size significantly'],
  archive: ['Cannot be accessed without extraction first', 'Some archive formats require third-party software', 'Corrupted archives may result in loss of all contents'],
  font: ['Limited editing options without specialized font tools', 'Web fonts (woff/woff2) are not suitable for print use', 'Not all formats support the full Unicode character range'],
  ebook: ['Formatting can vary between different reader apps', 'DRM-protected ebooks may limit portability', 'Complex layouts may not reflow correctly on all devices'],
};

// ---------------------------------------------------------------------------
// USE CASES
// ---------------------------------------------------------------------------

const FORMAT_USE_CASES: Record<string, string[]> = {
  png: ['Web graphics, icons, and UI assets', 'Screenshots and screen captures', 'Logos and designs requiring transparency', 'Lossless image archiving and backups'],
  jpg: ['Photography and photorealistic images', 'Web pages and email photo attachments', 'Social media photo sharing', 'Digital camera output storage'],
  webp: ['Web performance optimization for faster page loads', 'Reducing image bandwidth without quality loss', 'Modern browser image delivery pipelines', 'Core Web Vitals and Lighthouse score improvement'],
  gif: ['Simple web animations and reaction images', 'Short looping banners and attention graphics', 'Social media memes and reactions', 'Compact icon animations'],
  svg: ['Company logos and brand identity assets', 'Website icons and illustrations at any size', 'Responsive web graphics that scale on any screen', 'Print-quality vector artwork for design workflows'],
  mp4: ['Online video hosting and social media uploads', 'Video editing projects and source files', 'Streaming and progressive web video delivery', 'Long-term video archiving'],
  mp3: ['Music distribution and streaming services', 'Podcast episodes and voice recordings', 'Video background music and soundtrack delivery', 'Ringtones and mobile notification sounds'],
  flac: ['High-fidelity audiophile music collections', 'Studio recording backups and masters', 'CD ripping for lossless personal archives', 'Audio post-production source files'],
  wav: ['Professional recording, editing, and mixing workflows', 'Game and application sound asset libraries', 'Video post-production audio tracks', 'Broadcast and studio-grade audio production'],
  pdf: ['Document sharing and professional distribution', 'Print preparation and prepress publishing', 'Legal, compliance, and contract documentation', 'eBook and formal report distribution'],
  docx: ['Office productivity, reports, and proposals', 'Resume and cover letter creation', 'Collaborative document review and editing', 'Cross-platform document sharing'],
  xlsx: ['Business data analysis and financial reporting', 'Inventory management and scheduling', 'Database export/import and data migration', 'Scientific and statistical data storage'],
  epub: ['Digital book publishing for e-reader devices', 'Long-form reading on Kindle, Kobo, Apple Books', 'Academic paper and research distribution', 'Technical documentation publishing'],
  zip: ['Sharing multiple files as a single download', 'Website deployment and software release packages', 'File backup and offline archives', 'Cross-platform file bundle transfer'],
};

const CATEGORY_USE_CASES: Record<string, string[]> = {
  image: ['Web publishing and social media sharing', 'Email attachments and cloud storage', 'Print production and graphic design workflows', 'App development and UI asset creation'],
  raw: ['Professional photography post-processing', 'Color grading and HDR photo development', 'Archiving original unprocessed sensor data', 'Studio and editorial photography workflows'],
  video: ['Social media video uploads and streaming', 'Video editing and post-production workflows', 'Web embedding and HTML5 video playback', 'Long-term video archiving and distribution'],
  audio: ['Music streaming and podcast distribution', 'Ringtones, alerts, and notification sounds', 'Video soundtrack and background music delivery', 'High-quality archiving and master backups'],
  document: ['Office productivity and team collaboration', 'Cross-platform document sharing', 'Version-controlled content management', 'Publishing and print preparation'],
  pdf: ['Document sharing and professional distribution', 'Print preparation and prepress publishing', 'Legal and compliance documentation', 'eBook and formal report distribution'],
  archive: ['Backup and compression of file collections', 'Software distribution and deployment packages', 'Bundling multiple files for sharing', 'Storage footprint reduction'],
  font: ['Web font embedding using @font-face CSS', 'App and UI typographic design', 'Print and graphic design projects', 'Brand typography kit distribution'],
  cad: ['Engineering and manufacturing design workflows', '3D printing and rapid prototyping', 'Cross-platform CAD collaboration and review', 'Archiving technical drawing files'],
  ebook: ['E-reader device reading (Kindle, Kobo, etc.)', 'Digital book publishing and distribution', 'Personal reading library management', 'Academic and professional reference materials'],
  spreadsheet: ['Business reporting and data analysis', 'Financial modeling and budgeting', 'Data import/export pipelines', 'Project scheduling and tracking'],
  presentation: ['Business and academic presentations', 'Conference talks and keynotes', 'Training materials and slide decks', 'Sales and marketing pitches'],
};

// ---------------------------------------------------------------------------
// PROFESSIONAL TIPS
// ---------------------------------------------------------------------------

const FORMAT_TIPS: Record<string, string[]> = {
  png: [
    'Use PNG-8 for images with fewer than 256 colors to cut file size by 60%',
    'Convert PNG to WebP for web delivery — 30% smaller at equal quality',
    'Always use PNG for text overlays or sharp-edge graphics to avoid JPEG blur',
    'Strip metadata from PNGs with tools like oxipng before publishing',
  ],
  jpg: [
    'Quality 75–85% is the sweet spot for web use — good visual quality at small sizes',
    'Never re-save JPEGs repeatedly — each save multiplies compression artifacts',
    'Use progressive JPEG encoding for better perceived load time on web pages',
    'Convert text or logo images to PNG — JPEG degrades edges and fine details',
  ],
  webp: [
    'Set quality to 80 for lossy WebP to match JPEG at ~65% of the file size',
    'Use lossless WebP instead of PNG for web graphics with flat colors',
    'Always provide a JPEG or PNG fallback for browsers older than 2020',
    'WebP supports animation — consider it as a modern GIF replacement',
  ],
  gif: [
    'Keep GIF animations under 5 seconds to avoid impractical file sizes',
    'Reduce the color palette to 64 or 128 colors to significantly shrink file size',
    'Convert animated GIFs to WebP for up to 70% smaller files with better quality',
    'Dithering increases apparent colors at the cost of larger file sizes',
  ],
  svg: [
    'Run SVG files through SVGO before publishing — can reduce size by 40–60%',
    'Prefer SVG over raster formats for any icon or logo used at multiple sizes',
    'Test SVG rendering across major browsers — gradients and filters vary',
    'Avoid embedded raster images inside SVG — defeats the purpose of vector',
  ],
  mp4: [
    'Use H.264 with CRF 18–23 for an excellent quality-to-size ratio',
    'Set audio to AAC 128 kbps for most content; 192 kbps for music',
    'Add the -movflags faststart flag to enable web streaming from the start',
    'H.265 achieves 40–50% better compression but has broader compatibility issues',
  ],
  mp3: [
    'Use 192–320 kbps for music; 64–128 kbps is sufficient for voice content',
    'VBR (variable bitrate) encoding gives better quality per byte than CBR',
    'Never convert from one lossy format to another — use a lossless source',
    'Joint stereo mode is more efficient than true stereo at the same bitrate',
  ],
  flac: [
    'FLAC level 5 is the best tradeoff between compression ratio and encoding speed',
    'Verify FLAC checksums after encoding to ensure data integrity',
    'Use FLAC for archiving; convert to AAC or MP3 for portable distribution',
    'Embedded cover art can increase FLAC file size by several megabytes',
  ],
  wav: [
    'Use 44.1 kHz 16-bit for CD-quality audio — matches major streaming services',
    'Use 24-bit for recording to preserve headroom during mixing and mastering',
    'Convert WAV to FLAC for lossless archiving — same quality, 40% smaller',
    'WAV does not support ID3 tags — use FLAC or MP3 for metadata-rich archives',
  ],
  pdf: [
    'Use PDF/A standard for documents requiring long-term archival reliability',
    'Downsample embedded images to 150 DPI for screen or 300 DPI for print',
    'Embed fonts to guarantee consistent rendering across all viewing systems',
    'Use PDF bookmarks and a table of contents for documents over 20 pages',
  ],
  docx: [
    'Use Styles (Heading 1, 2, 3) for consistent formatting and automatic TOC generation',
    'Compress images embedded in DOCX to reduce file size dramatically',
    'Save as PDF for distribution and keep DOCX only for active editing',
    'Use Track Changes for collaborative review workflows and version tracking',
  ],
};

const CATEGORY_TIPS: Record<string, string[]> = {
  image: [
    'Always keep original files before converting — some conversions are irreversible',
    'Use WebP for web delivery — 25–35% smaller than JPEG at equal visual quality',
    'Batch convert multiple files at once to save time using our bulk tools',
    'Match format to use case: JPEG for photos, PNG for graphics, SVG for logos',
  ],
  raw: [
    'Always convert from RAW rather than processed JPEG for maximum editing latitude',
    'Store RAW originals before exporting to JPEG or TIFF for final delivery',
    'Use TIFF for lossless output when maximum quality post-processing is required',
    'DNG provides a universal open alternative to proprietary RAW formats',
  ],
  video: [
    'Always convert from the highest-quality source available to minimize generational loss',
    'H.264 in an MP4 container has the widest compatibility across devices and platforms',
    'Use two-pass encoding for precise bitrate control in long archiving workflows',
    'Check audio sync after conversion — delay issues can emerge between formats',
  ],
  audio: [
    'Always start from the highest-quality source: lossless to lossy, never lossy to lossy',
    'For streaming, target -14 LUFS (Spotify) or -16 LUFS (podcasts) for consistent loudness',
    'Sample rate and bit depth matter more than codec choice at equivalent bitrates',
    'Preview converted audio before distribution to catch artifacts early',
  ],
  document: [
    'Use PDF for final distribution to lock layout and prevent unintended edits',
    'Keep source files in editable format (DOCX/XLSX) for future revisions',
    'Compress embedded images before sharing large document files',
    'Test rendering across different operating systems and office suite versions',
  ],
  pdf: [
    'Use PDF/A-1b for documents requiring long-term archival compliance',
    'Reduce size by downsampling images to 150 DPI for screen, 300 DPI for print',
    'Apply AES-256 password encryption for sensitive PDF documents',
    'Use named bookmarks and structured headings for documents over 20 pages',
  ],
  archive: [
    'Use 7-Zip with .7z format for the highest compression ratio',
    'Use ZIP for maximum cross-platform compatibility without extra software',
    'Include a README.txt inside archives to explain the contents to recipients',
    'Test archives by extracting a test copy before deleting originals',
  ],
  font: [
    'Use WOFF2 for all web font delivery — 30% smaller than WOFF with equal quality',
    'Subset fonts to include only the characters needed for the target language',
    'Include OTF/TTF as a fallback alongside WOFF2 for broader compatibility',
    'Check font licensing carefully before redistributing or converting fonts',
  ],
  ebook: [
    'Test rendering on Kindle, Kobo, and Apple Books for cross-reader compatibility',
    'Use 72 DPI for cover images to keep file size small and fast to download',
    'Validate EPUB files with EPUBcheck before uploading to publishing platforms',
    'Include a fallback font specification in case the device font is unavailable',
  ],
  cad: [
    'Use STEP or IGES for universal 3D model interchange across CAD platforms',
    'Export to DXF for 2D drawings when sharing with non-AutoCAD users',
    'Check unit and scale settings before converting to avoid dimensional errors',
    'Use STL for 3D printing workflows — most slicers accept it natively',
  ],
};

// ---------------------------------------------------------------------------
// ENGINE CLASS
// ---------------------------------------------------------------------------

class FormatDescriptionEngine {
  private profileCache = new Map<string, FormatProfile | null>();

  getFormatProfile(ext: string): FormatProfile | null {
    const key = ext.toLowerCase();
    if (this.profileCache.has(key)) return this.profileCache.get(key)!;

    const fmt = formatRegistry.get(key);
    if (!fmt) {
      this.profileCache.set(key, null);
      return null;
    }

    const profile: FormatProfile = {
      ext: key,
      name: fmt.name,
      mime: fmt.mime ?? '',
      category: fmt.category,
      description: fmt.description ?? `A ${fmt.category} file format.`,
      browserSupport: fmt.browserNative
        ? 'full'
        : (fmt.providers?.clientSide ? 'partial' : 'none'),
      compressionType: COMPRESSION_MAP[key] ?? (
        (fmt.category === 'video' || fmt.category === 'audio') ? 'lossy' : 'none'
      ),
      supportsTransparency: TRANSPARENCY_FORMATS.has(key),
      supportsAnimation: ANIMATION_FORMATS.has(key),
      isVector: VECTOR_FORMATS.has(key),
      colorDepth: COLOR_DEPTH_MAP[key] ?? (fmt.category === 'image' ? '24-bit' : 'N/A'),
      isEditable: EDITABLE_FORMATS.has(key) || (fmt.editorCapability !== 'none' && fmt.editorCapability !== undefined),
      isPrintable: PRINTABLE_CATEGORIES.has(fmt.category),
      supportsStreaming: STREAMING_FORMATS.has(key),
      compatibility: COMPATIBILITY_MAP[key] ?? `Compatible with major ${fmt.category} applications`,
      avgFileSize: FORMAT_AVG_SIZE[key] ?? CATEGORY_AVG_SIZE[fmt.category] ?? 'varies',
    };

    this.profileCache.set(key, profile);
    return profile;
  }

  getFormatHighlights(ext: string): string[] {
    const fmt = formatRegistry.get(ext.toLowerCase());
    if (!fmt) return [];
    const h: string[] = [];
    if (fmt.browserNative) h.push('Works natively in all modern browsers');
    if (fmt.providers?.clientSide) h.push('100% browser-based — files never leave your device');
    if (fmt.tier === 'popular') h.push('Industry-standard format used worldwide');
    if (fmt.hasViewer) h.push('Can be previewed directly in the browser');
    if (fmt.supportsBatch) h.push('Supports batch processing');
    if (fmt.description) h.push(fmt.description);
    return h.slice(0, 4);
  }

  getAdvantages(ext: string, fallbackCategory?: FormatCategory): string[] {
    const key = ext.toLowerCase();
    const fmt = formatRegistry.get(key);
    return (
      FORMAT_ADVANTAGES[key] ??
      CATEGORY_ADVANTAGES[fmt?.category ?? fallbackCategory ?? ''] ?? [
        'Widely supported across applications and platforms',
        'Optimized for its file type and intended use case',
        'Compatible with all major operating systems',
      ]
    );
  }

  getDisadvantages(ext: string, fallbackCategory?: FormatCategory): string[] {
    const key = ext.toLowerCase();
    const fmt = formatRegistry.get(key);
    return (
      FORMAT_DISADVANTAGES[key] ??
      CATEGORY_DISADVANTAGES[fmt?.category ?? fallbackCategory ?? ''] ?? [
        'May require specific software to open or edit',
        'Not universally compatible with all applications',
        'Alternative formats may offer better compression or quality',
      ]
    );
  }

  getUseCases(inputExt: string, outputExt?: string): string[] {
    const inp = inputExt.toLowerCase();
    const out = outputExt?.toLowerCase();

    // Specific pair overrides
    if (inp === 'png' && out === 'jpg') return ['Reducing file size for web and email', 'Social media photo sharing', 'Photography workflows', 'Web image optimization'];
    if (inp === 'jpg' && out === 'png') return ['Preserving transparency for design assets', 'High-quality web graphics creation', 'Icon and logo design workflows', 'Lossless editing and archiving'];
    if (out === 'webp') return ['Web performance optimization', 'Reducing image bandwidth on web pages', 'Modern browser image delivery', 'Core Web Vitals and SEO improvement'];
    if (inp === 'mp4' && out === 'mp3') return ['Extracting audio from video files', 'Creating podcasts and voice memos', 'Music and ringtone extraction', 'Audio archiving'];
    if (inp === 'pdf' && out === 'docx') return ['Editing scanned documents in Word', 'Repurposing report content for editing', 'Form data extraction workflows', 'Content migration and reformatting'];
    if (out === 'pdf') return ['Professional document distribution', 'Print preparation and publishing', 'Long-term document archiving', 'Legal and compliance documentation'];

    return (
      FORMAT_USE_CASES[inp] ??
      CATEGORY_USE_CASES[inp] ??
      CATEGORY_USE_CASES[formatRegistry.get(inp)?.category ?? ''] ?? [
        'File format conversion for cross-platform compatibility',
        'Reducing file size for storage and sharing',
        'Cross-application and cross-platform workflows',
        'Batch processing and automation pipelines',
      ]
    );
  }

  getConversionAdvantages(inputExt: string, outputExt?: string): string[] {
    const inp = inputExt.toLowerCase();
    const out = outputExt?.toLowerCase();
    const outFmt = out ? formatRegistry.get(out) : null;
    const inFmt  = formatRegistry.get(inp);
    const advantages: string[] = [];

    if (outFmt?.browserNative && !inFmt?.browserNative)
      advantages.push(`${out!.toUpperCase()} is natively supported in all modern browsers`);
    if (outFmt?.tier === 'popular')
      advantages.push(`${out!.toUpperCase()} is an industry-standard format with universal support`);
    if (out && COMPRESSION_MAP[out] === 'lossless' && COMPRESSION_MAP[inp] !== 'lossless')
      advantages.push(`${out.toUpperCase()} preserves every detail without any compression loss`);
    if (out && COMPRESSION_MAP[out] === 'lossy' && COMPRESSION_MAP[inp] === 'none')
      advantages.push(`${out.toUpperCase()} achieves much smaller file sizes through intelligent compression`);
    if (inFmt?.description) advantages.push(`Source: ${inFmt.description}`);
    if (outFmt?.description) advantages.push(`Output: ${outFmt.description}`);
    advantages.push('100% browser-based processing — files never leave your device');
    advantages.push('Free with no file limits, watermarks, or registration required');
    return advantages.slice(0, 4);
  }

  getToolFeatures(toolKey: string, mode: string): string[] {
    const features: string[] = [
      '100% browser-based — no server uploads, no cloud processing',
      'Free forever — no account, credit card, or subscription required',
      'Works on any device — desktop, tablet, and mobile',
    ];
    if (mode === 'image') features.push('Supports PNG, JPG, WebP, HEIC, AVIF and 50+ image formats');
    else if (mode === 'video') features.push('Supports MP4, MOV, AVI, MKV, WebM and more');
    else if (mode === 'audio') features.push('Supports MP3, WAV, FLAC, AAC, OGG, Opus and more');
    else if (mode === 'pdf')   features.push('Supports PDF, DOCX, DOC, and all major document formats');
    features.push('Results available in seconds — no server queue or wait time');
    features.push('Files cleared immediately after processing — maximum privacy');
    return features.slice(0, 6);
  }

  getViewerFeatures(ext: string): string[] {
    const fmt = formatRegistry.get(ext.toLowerCase());
    return [
      'Works entirely in your browser — no software installation required',
      '100% private — files never leave your device or touch any server',
      'Completely free with no account or registration required',
      'Mobile-friendly — works on phones, tablets, and desktops',
      fmt?.browserNative
        ? `${ext.toUpperCase()} is natively supported in modern browsers`
        : `Accurately renders ${ext.toUpperCase()} files entirely in your browser`,
      'Instant file loading — no server upload or processing delay',
    ];
  }

  getProfessionalTips(ext: string, category: FormatCategory): string[] {
    const key = ext.toLowerCase();
    return (
      FORMAT_TIPS[key] ??
      CATEGORY_TIPS[category] ?? [
        'Keep original files before converting for maximum flexibility',
        'Test converted output before using in production workflows',
        'Use batch processing for multiple files to save time',
        'Match the output format to your delivery platform for best results',
      ]
    );
  }

  getFAQs(ctx: DescriptionContext): FAQItem[] {
    const { variant, inputExt, outputExt, category, toolName, toolMode } = ctx;
    const IN   = inputExt?.toUpperCase()  ?? '';
    const OUT  = outputExt?.toUpperCase() ?? '';
    const name = toolName ?? `${IN} Converter`;
    const catDef = CATEGORY_DEFINITIONS[category];
    const catLabel = catDef?.seoLabel ?? category;

    if (variant === 'converter' && outputExt) {
      return [
        { q: `How do I convert ${IN} to ${OUT} online for free?`, a: `Upload your ${IN} file using the drop zone above. Your file is instantly converted to ${OUT} format right in your browser — no server upload, no waiting.` },
        { q: `Is converting ${IN} to ${OUT} safe?`, a: `Completely. Our converter processes your ${IN} file 100% in your browser using client-side code. It never leaves your device or touches any external server.` },
        { q: `What is the maximum file size for ${IN} to ${OUT} conversion?`, a: `Up to 500 MB on desktop and 200 MB on mobile. All processing is local — your files are never uploaded to any server.` },
        { q: `Is there quality loss when converting ${IN} to ${OUT}?`, a: `It depends on the formats. Converting from lossless to lossy (e.g. PNG to JPEG) may reduce quality. Converting lossless-to-lossless (e.g. PNG to WebP lossless) preserves all quality.` },
      ];
    }

    if (variant === 'converter') {
      return [
        { q: `How do I convert ${IN} files online?`, a: `Upload your ${IN} file using the drop zone above. Select your target output format and the conversion happens instantly in your browser.` },
        { q: `Is converting ${IN} files safe?`, a: `Completely safe. Our converter runs 100% in your browser — your ${IN} file never leaves your device or touches any server.` },
        { q: `What formats can I convert ${IN} to?`, a: `Select your file to see all supported output formats for ${IN}. Most popular formats in the same category are available.` },
        { q: `What is the maximum ${IN} file size?`, a: `Up to 500 MB on desktop and 200 MB on mobile. All processing is local in your browser.` },
      ];
    }

    if (variant === 'viewer') {
      return [
        { q: `Is this ${IN} viewer free?`, a: `Yes, completely free. View any ${IN} file with no limits, no sign-up, and no software installation required.` },
        { q: `Is it safe to open ${IN} files here?`, a: `Your ${IN} file is processed entirely in your browser using client-side JavaScript. It never leaves your device, is never uploaded to any server, and is cleared when you close the tab.` },
        { q: `What is the file size limit for the ${IN} viewer?`, a: `Up to 200 MB on desktop and 100 MB on mobile. For larger files, consider compressing or splitting the file first.` },
        { q: `Can I convert ${IN} files after viewing?`, a: `Yes. After viewing, you can convert your ${IN} file to another format using our free ${IN} converter linked below.` },
      ];
    }

    if (variant === 'tool') {
      const fmtLabel = toolMode === 'image' ? 'image' : toolMode === 'video' ? 'video' : toolMode === 'audio' ? 'audio' : 'file';
      const fmtList  = toolMode === 'image' ? 'PNG, JPG, WebP, HEIC, AVIF, GIF, BMP, TIFF and more.'
        : toolMode === 'video' ? 'MP4, MOV, AVI, MKV, WebM, FLV, WMV and more.'
        : toolMode === 'audio' ? 'MP3, WAV, FLAC, AAC, OGG, Opus, M4A and more.'
        : toolMode === 'pdf'   ? 'PDF, DOCX, DOC, and most document formats.'
        : 'Most common formats are supported.';
      return [
        { q: `Is ${name} free to use?`, a: `Yes, completely free. No usage limits, no watermarks, no account required.` },
        { q: `Is it safe to use ${name}?`, a: `Your files are processed entirely in your browser using client-side code. They never leave your device and are never uploaded to any server.` },
        { q: `What ${fmtLabel} formats does ${name} support?`, a: `${name} works with all major ${fmtLabel} formats: ${fmtList}` },
        { q: `What is the maximum file size for ${name}?`, a: `Up to 500 MB on desktop and 200 MB on mobile. All processing is local in your browser.` },
      ];
    }

    // Category
    return [
      { q: `Is it free to convert ${catLabel} files?`, a: `Yes — all conversions are 100% free with no limits, no watermarks, and no sign-up required.` },
      { q: `Are my ${catLabel} files private?`, a: `Completely private. Conversions happen entirely in your browser. Files are never uploaded to any server.` },
      { q: `What is the maximum file size?`, a: `Files up to 500 MB work on desktop and 200 MB on mobile. Performance depends on your device memory.` },
      { q: `What ${catLabel} formats are supported?`, a: `All major ${catLabel} formats are supported. Select your file to see the available conversion options.` },
    ];
  }

  clearCache(): void {
    this.profileCache.clear();
  }
}

export const formatDescriptionEngine = new FormatDescriptionEngine();
