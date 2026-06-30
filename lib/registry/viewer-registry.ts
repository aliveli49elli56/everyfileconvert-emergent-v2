/**
 * lib/registry/viewer-registry.ts
 * Central viewer registry - single source of truth for all viewers
 * Integrated with Format Registry for unified format metadata
 */

import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Mail,
  Code,
  BookOpen,
  Map as MapIcon,
  Type,
  Layers,
  Cuboid,
} from 'lucide-react';
import type { ViewerEngine, FormatCategory } from '../types/formats';
import { formatRegistry } from './format-registry';

// ---------------------------------------------------------------------------
// VIEWER CATEGORY TYPES
// ---------------------------------------------------------------------------

export type ViewerCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'email'
  | 'design'
  | 'code'
  | 'cad'
  | 'ebook'
  | 'font'
  | 'gis'
  // ── Phase 6A new viewer categories ───────────────────────────────────────
  | '3d'
  | 'subtitle'
  | 'certificate'
  | 'medical'
  | 'scientific'
  | 'disk-image'
  | 'webpage';

// ---------------------------------------------------------------------------
// VIEWER CAPABILITY INTERFACE
// ---------------------------------------------------------------------------

export interface ViewerCapability {
  engine: ViewerEngine;
  category: ViewerCategory;
  component: string;
  icon: LucideIcon;
  label: string;
  supportedFeatures: string[];
  maxFileSize?: number;
  requiresWebGL?: boolean;
  premiumOnly?: boolean;
}

// ---------------------------------------------------------------------------
// VIEWER ENGINE DEFINITIONS
// ---------------------------------------------------------------------------

export const VIEWER_ENGINES: Record<ViewerEngine, ViewerCapability> = {
  'native-image': {
    engine: 'native-image',
    category: 'image',
    component: 'ImageViewer',
    icon: Image,
    label: 'Native Image Viewer',
    supportedFeatures: ['zoom', 'pan', 'rotate', 'download'],
    maxFileSize: 100 * 1024 * 1024,
  },
  svg: {
    engine: 'svg',
    category: 'image',
    component: 'SvgViewer',
    icon: Layers,
    label: 'SVG Viewer',
    supportedFeatures: ['zoom', 'pan', 'download', 'edit-source'],
    maxFileSize: 50 * 1024 * 1024,
  },
  pdf: {
    engine: 'pdf',
    category: 'document',
    component: 'PdfViewer',
    icon: FileText,
    label: 'PDF Viewer',
    supportedFeatures: ['zoom', 'pan', 'page-nav', 'search', 'download', 'print'],
    maxFileSize: 200 * 1024 * 1024,
  },
  docx: {
    engine: 'docx',
    category: 'document',
    component: 'DocxViewer',
    icon: FileText,
    label: 'Word Document Viewer',
    supportedFeatures: ['zoom', 'page-nav', 'download'],
    maxFileSize: 50 * 1024 * 1024,
  },
  spreadsheet: {
    engine: 'spreadsheet',
    category: 'spreadsheet',
    component: 'SpreadsheetViewer',
    icon: FileText,
    label: 'Spreadsheet Viewer',
    supportedFeatures: ['zoom', 'sheet-nav', 'download'],
    maxFileSize: 50 * 1024 * 1024,
  },
  text: {
    engine: 'text',
    category: 'code',
    component: 'TextViewer',
    icon: Code,
    label: 'Text / Code Viewer',
    supportedFeatures: ['zoom', 'line-numbers', 'syntax-highlight', 'copy', 'download', 'edit'],
    maxFileSize: 10 * 1024 * 1024,
  },
  archive: {
    engine: 'archive',
    category: 'archive',
    component: 'ArchiveViewer',
    icon: Archive,
    label: 'Archive Viewer',
    supportedFeatures: ['browse', 'extract', 'download'],
    maxFileSize: 500 * 1024 * 1024,
  },
  email: {
    engine: 'email',
    category: 'email',
    component: 'EmailViewer',
    icon: Mail,
    label: 'Email Viewer',
    supportedFeatures: ['view', 'download', 'attachments'],
    maxFileSize: 50 * 1024 * 1024,
  },
  video: {
    engine: 'video',
    category: 'video',
    component: 'MediaViewer',
    icon: Film,
    label: 'Video Player',
    supportedFeatures: ['play', 'pause', 'seek', 'volume', 'fullscreen', 'download'],
    maxFileSize: 1024 * 1024 * 1024,
  },
  audio: {
    engine: 'audio',
    category: 'audio',
    component: 'MediaViewer',
    icon: Music,
    label: 'Audio Player',
    supportedFeatures: ['play', 'pause', 'seek', 'volume', 'download'],
    maxFileSize: 500 * 1024 * 1024,
  },
  psd: {
    engine: 'psd',
    category: 'design',
    component: 'PsdViewer',
    icon: Layers,
    label: 'Photoshop Viewer',
    supportedFeatures: ['zoom', 'pan', 'layers', 'download'],
    maxFileSize: 200 * 1024 * 1024,
  },
  ebook: {
    engine: 'ebook',
    category: 'ebook',
    component: 'EbookViewer',
    icon: BookOpen,
    label: 'eBook Reader',
    supportedFeatures: ['zoom', 'page-nav', 'toc', 'search', 'download'],
    maxFileSize: 100 * 1024 * 1024,
  },
  pptx: {
    engine: 'pptx',
    category: 'presentation',
    component: 'PptxViewer',
    icon: FileText,
    label: 'PowerPoint Viewer',
    supportedFeatures: ['zoom', 'slide-nav', 'download'],
    maxFileSize: 100 * 1024 * 1024,
  },
  cad: {
    engine: 'cad',
    category: 'cad',
    component: 'CadViewer',
    icon: MapIcon,
    label: 'CAD Viewer',
    supportedFeatures: ['zoom', 'pan', 'rotate-3d', 'layers', 'measure', 'download'],
    maxFileSize: 200 * 1024 * 1024,
    requiresWebGL: true,
  },
  font: {
    engine: 'font',
    category: 'font',
    component: 'FontViewer',
    icon: Type,
    label: 'Font Viewer',
    supportedFeatures: ['preview', 'characters', 'download'],
    maxFileSize: 50 * 1024 * 1024,
  },
  gis: {
    engine: 'gis',
    category: 'gis',
    component: 'GisViewer',
    icon: MapIcon,
    label: 'GIS Viewer',
    supportedFeatures: ['zoom', 'pan', 'layers', 'coordinates', 'measure', 'download'],
    maxFileSize: 200 * 1024 * 1024,
    requiresWebGL: true,
  },
  none: {
    engine: 'none',
    category: 'document',
    component: 'UnsupportedViewer',
    icon: FileText,
    label: 'Unsupported Format',
    supportedFeatures: [],
  },
  '3d': {
    engine: '3d',
    category: '3d',
    component: 'ThreeDViewer',
    icon: Cuboid,
    label: '3D Model Viewer',
    supportedFeatures: ['zoom', 'pan', 'rotate-3d', 'wireframe', 'download'],
    maxFileSize: 200 * 1024 * 1024,
    requiresWebGL: true,
  },
  subtitle: {
    engine: 'subtitle',
    category: 'subtitle',
    component: 'SubtitleViewer',
    icon: FileText,
    label: 'Subtitle Viewer',
    supportedFeatures: ['view', 'edit', 'download'],
    maxFileSize: 10 * 1024 * 1024,
  },
  certificate: {
    engine: 'certificate',
    category: 'certificate',
    component: 'CertificateViewer',
    icon: FileText,
    label: 'Certificate Viewer',
    supportedFeatures: ['inspect', 'download'],
    maxFileSize: 5 * 1024 * 1024,
  },
  medical: {
    engine: 'medical',
    category: 'medical',
    component: 'MedicalViewer',
    icon: FileText,
    label: 'DICOM Viewer',
    supportedFeatures: ['zoom', 'pan', 'windowing', 'slice-nav', 'download'],
    maxFileSize: 500 * 1024 * 1024,
    requiresWebGL: true,
  },
  scientific: {
    engine: 'scientific',
    category: 'scientific',
    component: 'ScientificViewer',
    icon: FileText,
    label: 'Scientific Data Viewer',
    supportedFeatures: ['plot', 'export', 'download'],
    maxFileSize: 500 * 1024 * 1024,
  },
  'disk-image': {
    engine: 'disk-image',
    category: 'disk-image',
    component: 'DiskImageViewer',
    icon: Archive,
    label: 'Disk Image Browser',
    supportedFeatures: ['browse', 'extract', 'download'],
    maxFileSize: 10 * 1024 * 1024 * 1024,
  },
  webpage: {
    engine: 'webpage',
    category: 'webpage',
    component: 'WebpageViewer',
    icon: FileText,
    label: 'Webpage Viewer',
    supportedFeatures: ['render', 'scroll', 'download'],
    maxFileSize: 50 * 1024 * 1024,
  },
  // ── Alias/composite viewer engines ────────────────────────────────────────
  /** Generic image viewer (alias for native-image) */
  image: {
    engine: 'image',
    category: 'image',
    component: 'ImageViewer',
    icon: Image,
    label: 'Image Viewer',
    supportedFeatures: ['zoom', 'pan', 'rotate', 'download'],
    maxFileSize: 100 * 1024 * 1024,
  },
  /** Generic document viewer (alias for docx) */
  document: {
    engine: 'document',
    category: 'document',
    component: 'DocumentViewer',
    icon: FileText,
    label: 'Document Viewer',
    supportedFeatures: ['scroll', 'search', 'download'],
    maxFileSize: 200 * 1024 * 1024,
  },
  /** Code / data file viewer */
  code: {
    engine: 'code',
    category: 'code',
    component: 'CodeViewer',
    icon: Code,
    label: 'Code Viewer',
    supportedFeatures: ['syntax-highlight', 'copy', 'download'],
    maxFileSize: 10 * 1024 * 1024,
  },
  /** Vector/design file viewer */
  design: {
    engine: 'design',
    category: 'design',
    component: 'DesignViewer',
    icon: Layers,
    label: 'Design Viewer',
    supportedFeatures: ['zoom', 'pan', 'layer-toggle', 'download'],
    maxFileSize: 200 * 1024 * 1024,
  },
};

// ---------------------------------------------------------------------------
// VIEWER CATEGORY METADATA
// ---------------------------------------------------------------------------

export const VIEWER_CATEGORIES: Record<ViewerCategory, {
  label: string;
  color: string;
  gradient: string;
  icon: LucideIcon;
}> = {
  document: {
    label: 'Documents',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-500',
    icon: FileText,
  },
  spreadsheet: {
    label: 'Spreadsheets',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
    icon: FileText,
  },
  presentation: {
    label: 'Presentations',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-500',
    icon: FileText,
  },
  image: {
    label: 'Images',
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-500',
    icon: Image,
  },
  video: {
    label: 'Video',
    color: 'text-red-600',
    gradient: 'from-red-500 to-orange-500',
    icon: Film,
  },
  audio: {
    label: 'Audio',
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-500',
    icon: Music,
  },
  archive: {
    label: 'Archives',
    color: 'text-stone-600',
    gradient: 'from-stone-500 to-stone-700',
    icon: Archive,
  },
  email: {
    label: 'Email',
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-sky-500',
    icon: Mail,
  },
  design: {
    label: 'Design',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-blue-500',
    icon: Layers,
  },
  code: {
    label: 'Code & Data',
    color: 'text-slate-600',
    gradient: 'from-slate-500 to-gray-500',
    icon: Code,
  },
  cad: {
    label: 'CAD & 3D',
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-cyan-500',
    icon: MapIcon,
  },
  ebook: {
    label: 'eBooks',
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500',
    icon: BookOpen,
  },
  font: {
    label: 'Fonts',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-violet-500',
    icon: Type,
  },
  gis: {
    label: 'GIS & Maps',
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500',
    icon: MapIcon,
  },
  '3d': {
    label: '3D Models',
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-500',
    icon: Cuboid,
  },
  webpage: {
    label: 'Webpages',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-sky-500',
    icon: FileText,
  },
  subtitle: {
    label: 'Subtitles',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-slate-600',
    icon: FileText,
  },
  certificate: {
    label: 'Certificates',
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-amber-500',
    icon: FileText,
  },
  medical: {
    label: 'Medical',
    color: 'text-red-600',
    gradient: 'from-red-500 to-rose-500',
    icon: FileText,
  },
  scientific: {
    label: 'Scientific',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-violet-500',
    icon: FileText,
  },
  'disk-image': {
    label: 'Disk Images',
    color: 'text-zinc-600',
    gradient: 'from-zinc-500 to-gray-500',
    icon: Archive,
  },
};

// ---------------------------------------------------------------------------
// VIEWER REGISTRY CLASS
// ---------------------------------------------------------------------------

class ViewerRegistry {
  private engineMap: Map<ViewerEngine, ViewerCapability> = new Map();

  constructor() {
    for (const [k, v] of Object.entries(VIEWER_ENGINES)) {
      this.engineMap.set(k as ViewerEngine, v);
    }
  }

  /** Get viewer engine capability */
  getEngine(engine: ViewerEngine): ViewerCapability | undefined {
    return this.engineMap.get(engine);
  }

  /** Get all viewer engines */
  getAllEngines(): ViewerCapability[] {
    const result: ViewerCapability[] = [];
    this.engineMap.forEach(e => {
      if (e.engine !== 'none') result.push(e);
    });
    return result;
  }

  /** Get engines by category */
  getByCategory(category: ViewerCategory): ViewerCapability[] {
    const result: ViewerCapability[] = [];
    this.engineMap.forEach(e => {
      if (e.category === category) result.push(e);
    });
    return result;
  }

  /** Get category metadata */
  getCategoryMeta(category: ViewerCategory) {
    return VIEWER_CATEGORIES[category];
  }

  /** Check if engine supports feature */
  supportsFeature(engine: ViewerEngine, feature: string): boolean {
    const cap = this.engineMap.get(engine);
    return cap?.supportedFeatures.includes(feature) ?? false;
  }

  /** Check if engine requires WebGL */
  requiresWebGL(engine: ViewerEngine): boolean {
    return this.engineMap.get(engine)?.requiresWebGL ?? false;
  }

  /** Get component name for engine */
  getComponent(engine: ViewerEngine): string {
    return this.engineMap.get(engine)?.component ?? 'UnsupportedViewer';
  }

  /** Get all viewable categories */
  getViewableCategories(): ViewerCategory[] {
    return Object.keys(VIEWER_CATEGORIES) as ViewerCategory[];
  }

  /** Convert viewer category to format category */
  toFormatCategory(viewerCategory: ViewerCategory): FormatCategory {
    const mapping: Record<ViewerCategory, FormatCategory> = {
      document:     'document',
      spreadsheet:  'spreadsheet',
      presentation: 'presentation',
      image:        'image',
      video:        'video',
      audio:        'audio',
      archive:      'archive',
      email:        'email',
      design:       'vector',
      code:         'code',
      cad:          'cad',
      ebook:        'ebook',
      font:         'font',
      gis:          'gis',
      '3d':         '3d',
      webpage:      'webpage',
      subtitle:     'subtitle',
      certificate:  'certificate',
      medical:      'medical',
      scientific:   'scientific',
      'disk-image': 'disk-image',
    };
    return mapping[viewerCategory];
  }

  /** Convert format category to viewer category */
  fromFormatCategory(category: FormatCategory): ViewerCategory {
    const mapping: Record<FormatCategory, ViewerCategory> = {
      image:        'image',
      raw:          'image',
      vector:       'design',
      icon:         'image',
      "3d":         'cad',
      cad:          'cad',
      video:        'video',
      audio:        'audio',
      pdf:          'document',
      document:     'document',
      spreadsheet:  'spreadsheet',
      presentation: 'presentation',
      archive:      'archive',
      font:         'font',
      gis:          'gis',
      email:        'email',
      code:         'code',
      ebook:        'ebook',
      webpage:      'document',
      subtitle:     'document',
      certificate:  'document',
      scientific:   'document',
      medical:      'document',
      "disk-image": 'archive',
      executable:   'document',
      other:        'document',
    };
    return mapping[category] ?? 'document';
  }
}

export const viewerRegistry = new ViewerRegistry();

// ---------------------------------------------------------------------------
// FILE SIZE LIMITS
// ---------------------------------------------------------------------------

export const VIEWER_LIMITS = {
  desktop: 50 * 1024 * 1024, // 50 MB
  mobile:  20 * 1024 * 1024, // 20 MB
};

// ---------------------------------------------------------------------------
// LEGACY COMPATIBILITY HELPERS
// ---------------------------------------------------------------------------

/** Look up a viewer format by extension (for backward compatibility) */
export function getViewerByExt(ext: string): { ext: string; name: string; category: ViewerCategory; engine: ViewerEngine; mimeTypes: string[]; description: string } | undefined {
  const format = formatRegistry.get(ext.toLowerCase());
  if (!format) return undefined;

  const viewerCategory = viewerRegistry.fromFormatCategory(format.category);
  const engine = format.viewerEngine || 'none';

  return {
    ext: format.ext,
    name: format.name,
    category: viewerCategory,
    engine,
    mimeTypes: [format.mime, ...(format.altMimes || [])],
    description: format.description || format.name,
  };
}

/** Get all viewer formats grouped by category */
export function getViewerCategories(): Record<ViewerCategory, Array<{ ext: string; name: string; category: ViewerCategory; engine: ViewerEngine; mimeTypes: string[]; description: string }>> {
  const result: Record<ViewerCategory, Array<{ ext: string; name: string; category: ViewerCategory; engine: ViewerEngine; mimeTypes: string[]; description: string }>> = {} as any;

  for (const format of formatRegistry.getAll()) {
    const viewerCategory = viewerRegistry.fromFormatCategory(format.category);
    if (!result[viewerCategory]) result[viewerCategory] = [];

    const engine = format.viewerEngine || 'none';
    result[viewerCategory].push({
      ext: format.ext,
      name: format.name,
      category: viewerCategory,
      engine,
      mimeTypes: [format.mime, ...(format.altMimes || [])],
      description: format.description || format.name,
    });
  }

  return result;
}
