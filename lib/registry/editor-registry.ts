/**
 * lib/registry/editor-registry.ts
 * Editor registry architecture for future editor implementations
 * This defines the structure without implementing actual editors
 */

import type { LucideIcon } from 'lucide-react';
import {
  Image,
  Film,
  Music,
  FileText,
  Layers,
  Palette,
} from 'lucide-react';
import type { ProcessingEngine, EditorCapability } from '../types/formats';

// ---------------------------------------------------------------------------
// EDITOR TYPES
// ---------------------------------------------------------------------------

export type EditorType =
  | 'image-editor'
  | 'video-editor'
  | 'audio-editor'
  | 'pdf-editor'
  | 'code-editor'
  | 'vector-editor';

export type EditorFeature =
  | 'crop'
  | 'resize'
  | 'rotate'
  | 'flip'
  | 'filter'
  | 'adjust-color'
  | 'watermark'
  | 'text'
  | 'draw'
  | 'layers'
  | 'effects'
  | 'trim'
  | 'cut'
  | 'merge'
  | 'split'
  | 'add-audio'
  | 'subtitle'
  | 'speed'
  | 'pitch'
  | 'normalize'
  | 'compress'
  | 'convert'
  | 'page-edit'
  | 'annotate'
  | 'redact'
  | 'highlight'
  | 'syntax'
  | 'autocomplete'
  | 'format'
  | 'find-replace';

// ---------------------------------------------------------------------------
// EDITOR CAPABILITY INTERFACE
// ---------------------------------------------------------------------------

export interface EditorDefinition {
  id: EditorType;
  name: string;
  description: string;
  icon: LucideIcon;
  engine: ProcessingEngine;
  minCapability: EditorCapability;
  supportedFeatures: EditorFeature[];
  inputFormats: string[];
  outputFormats: string[];
  component: string;
  premiumOnly?: boolean;
  requiresWebGL?: boolean;
  requiresWasm?: boolean;
}

// ---------------------------------------------------------------------------
// EDITOR DEFINITIONS (Architecture Only - Not Implemented)
// ---------------------------------------------------------------------------

export const EDITOR_DEFINITIONS: EditorDefinition[] = [
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Full image editing with crop, resize, filters, and adjustments',
    icon: Image,
    engine: 'canvas',
    minCapability: 'basic',
    supportedFeatures: [
      'crop', 'resize', 'rotate', 'flip', 'filter',
      'adjust-color', 'watermark', 'text', 'draw',
    ],
    inputFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'],
    outputFormats: ['png', 'jpg', 'webp', 'gif'],
    component: 'ImageEditor',
    premiumOnly: false,
  },
  {
    id: 'video-editor',
    name: 'Video Editor',
    description: 'Video editing with trim, merge, and effects',
    icon: Film,
    engine: 'ffmpeg',
    minCapability: 'basic',
    supportedFeatures: [
      'trim', 'cut', 'merge', 'crop', 'resize', 'rotate',
      'filter', 'effects', 'add-audio', 'subtitle', 'speed',
    ],
    inputFormats: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
    outputFormats: ['mp4', 'webm', 'gif'],
    component: 'VideoEditor',
    premiumOnly: false,
    requiresWasm: true,
  },
  {
    id: 'audio-editor',
    name: 'Audio Editor',
    description: 'Audio waveform editing with trim, effects, and normalization',
    icon: Music,
    engine: 'web-audio',
    minCapability: 'basic',
    supportedFeatures: [
      'trim', 'cut', 'merge', 'split', 'speed', 'pitch',
      'normalize', 'effects', 'compress',
    ],
    inputFormats: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    outputFormats: ['mp3', 'wav', 'ogg', 'flac'],
    component: 'AudioEditor',
    premiumOnly: false,
  },
  {
    id: 'pdf-editor',
    name: 'PDF Editor',
    description: 'PDF manipulation with page editing, merge, and annotate',
    icon: FileText,
    engine: 'pdf-lib',
    minCapability: 'basic',
    supportedFeatures: [
      'page-edit', 'merge', 'split', 'rotate', 'watermark',
      'annotate', 'redact', 'highlight', 'compress',
    ],
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    component: 'PdfEditor',
    premiumOnly: false,
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    description: 'Code and text editing with syntax highlighting',
    icon: Palette,
    engine: 'native',
    minCapability: 'full',
    supportedFeatures: [
      'syntax', 'autocomplete', 'format', 'find-replace',
    ],
    inputFormats: ['txt', 'html', 'css', 'js', 'ts', 'json', 'xml', 'md', 'sql', 'yaml'],
    outputFormats: ['txt', 'html', 'css', 'js', 'ts', 'json', 'xml', 'md', 'sql', 'yaml'],
    component: 'CodeEditor',
    premiumOnly: false,
  },
  {
    id: 'vector-editor',
    name: 'Vector Editor',
    description: 'SVG vector graphics editing',
    icon: Layers,
    engine: 'canvas',
    minCapability: 'full',
    supportedFeatures: [
      'draw', 'text', 'layers', 'resize', 'rotate', 'filter', 'convert',
    ],
    inputFormats: ['svg'],
    outputFormats: ['svg', 'png', 'jpg', 'pdf'],
    component: 'VectorEditor',
    premiumOnly: true,
    requiresWebGL: true,
  },
];

// ---------------------------------------------------------------------------
// EDITOR FEATURES METADATA
// ---------------------------------------------------------------------------

export const EDITOR_FEATURES: Record<EditorFeature, {
  label: string;
  description: string;
  category: 'transform' | 'enhance' | 'content' | 'export';
}> = {
  crop: { label: 'Crop', description: 'Crop to selection', category: 'transform' },
  resize: { label: 'Resize', description: 'Resize dimensions', category: 'transform' },
  rotate: { label: 'Rotate', description: 'Rotate image', category: 'transform' },
  flip: { label: 'Flip', description: 'Flip horizontal/vertical', category: 'transform' },
  filter: { label: 'Filters', description: 'Apply visual filters', category: 'enhance' },
  'adjust-color': { label: 'Color Adjust', description: 'Adjust colors', category: 'enhance' },
  watermark: { label: 'Watermark', description: 'Add watermark', category: 'content' },
  text: { label: 'Text', description: 'Add text overlay', category: 'content' },
  draw: { label: 'Draw', description: 'Draw on canvas', category: 'content' },
  layers: { label: 'Layers', description: 'Manage layers', category: 'content' },
  effects: { label: 'Effects', description: 'Apply effects', category: 'enhance' },
  trim: { label: 'Trim', description: 'Trim media', category: 'transform' },
  cut: { label: 'Cut', description: 'Cut segments', category: 'transform' },
  merge: { label: 'Merge', description: 'Merge files', category: 'export' },
  split: { label: 'Split', description: 'Split into parts', category: 'export' },
  'add-audio': { label: 'Add Audio', description: 'Add audio track', category: 'content' },
  subtitle: { label: 'Subtitles', description: 'Add subtitles', category: 'content' },
  speed: { label: 'Speed', description: 'Adjust speed', category: 'transform' },
  pitch: { label: 'Pitch', description: 'Adjust pitch', category: 'enhance' },
  normalize: { label: 'Normalize', description: 'Normalize audio', category: 'enhance' },
  compress: { label: 'Compress', description: 'Compress file size', category: 'export' },
  convert: { label: 'Convert', description: 'Convert format', category: 'export' },
  'page-edit': { label: 'Page Edit', description: 'Edit pages', category: 'transform' },
  annotate: { label: 'Annotate', description: 'Add annotations', category: 'content' },
  redact: { label: 'Redact', description: 'Redact content', category: 'content' },
  highlight: { label: 'Highlight', description: 'Highlight text', category: 'content' },
  syntax: { label: 'Syntax', description: 'Syntax highlighting', category: 'enhance' },
  autocomplete: { label: 'Autocomplete', description: 'Code completion', category: 'enhance' },
  format: { label: 'Format', description: 'Auto format code', category: 'transform' },
  'find-replace': { label: 'Find & Replace', description: 'Find and replace', category: 'transform' },
};

// ---------------------------------------------------------------------------
// EDITOR REGISTRY CLASS
// ---------------------------------------------------------------------------

class EditorRegistry {
  private editorMap: Map<EditorType, EditorDefinition>;

  constructor() {
    this.editorMap = new Map(
      EDITOR_DEFINITIONS.map(e => [e.id, e])
    );
  }

  /** Get editor by type */
  get(type: EditorType): EditorDefinition | undefined {
    return this.editorMap.get(type);
  }

  /** Get all editors */
  getAll(): EditorDefinition[] {
    return [...EDITOR_DEFINITIONS];
  }

  /** Get editors by capability level */
  getByCapability(capability: EditorCapability): EditorDefinition[] {
    const levels: EditorCapability[] = ['full', 'basic', 'none'];
    const minIndex = levels.indexOf(capability);
    return EDITOR_DEFINITIONS.filter(e => levels.indexOf(e.minCapability) <= minIndex);
  }

  /** Get editor for format */
  getEditorForFormat(ext: string): EditorDefinition | undefined {
    const lowerExt = ext.toLowerCase();
    return EDITOR_DEFINITIONS.find(e =>
      e.inputFormats.includes(lowerExt)
    );
  }

  /** Check if format is editable */
  isEditable(ext: string): boolean {
    const lowerExt = ext.toLowerCase();
    return EDITOR_DEFINITIONS.some(e => e.inputFormats.includes(lowerExt));
  }

  /** Get editor by feature */
  getByFeature(feature: EditorFeature): EditorDefinition[] {
    return EDITOR_DEFINITIONS.filter(e => e.supportedFeatures.includes(feature));
  }

  /** Get feature metadata */
  getFeature(feature: EditorFeature) {
    return EDITOR_FEATURES[feature];
  }

  /** Get all features by category */
  getFeaturesByCategory(category: 'transform' | 'enhance' | 'content' | 'export'): EditorFeature[] {
    return Object.entries(EDITOR_FEATURES)
      .filter(([_, meta]) => meta.category === category)
      .map(([feature]) => feature as EditorFeature);
  }

  /** Check if editor supports feature */
  supportsFeature(editorType: EditorType, feature: EditorFeature): boolean {
    const editor = this.editorMap.get(editorType);
    return editor?.supportedFeatures.includes(feature) ?? false;
  }

  /** Get component name for editor */
  getComponent(type: EditorType): string {
    return this.editorMap.get(type)?.component ?? 'UnsupportedEditor';
  }

  /** Get premium editors */
  getPremiumEditors(): EditorDefinition[] {
    return EDITOR_DEFINITIONS.filter(e => e.premiumOnly);
  }

  /** Get editors requiring WebGL */
  getWebGLEditors(): EditorDefinition[] {
    return EDITOR_DEFINITIONS.filter(e => e.requiresWebGL);
  }

  /** Get editors requiring WebAssembly */
  getWasmEditors(): EditorDefinition[] {
    return EDITOR_DEFINITIONS.filter(e => e.requiresWasm);
  }
}

export const editorRegistry = new EditorRegistry();
